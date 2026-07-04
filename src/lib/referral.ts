import { prisma } from "./db";
import { getStripe } from "./stripe";

const REWARD_AMOUNT = 1900; // 19€ de crédit ≈ 1 mois Créateur offert

// Code de parrainage court et lisible (ex : "techno8471"), inspiré du modèle
// fourni. Unicité garantie par la contrainte @unique + quelques essais.
function makeCode(name: string): string {
  const slug =
    (name || "user")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 6) || "vr";
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${slug}${digits}`;
}

/** Renvoie le code de parrainage de l'utilisateur, en le créant si absent. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, name: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");
  if (user.referralCode) return user.referralCode;

  for (let i = 0; i < 5; i++) {
    const code = makeCode(user.name);
    try {
      await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
      return code;
    } catch {
      // collision rare sur @unique → nouvel essai
    }
  }
  // repli : code basé sur l'id (toujours unique)
  const fallback = `vr${userId.slice(-8)}`;
  await prisma.user.update({ where: { id: userId }, data: { referralCode: fallback } });
  return fallback;
}

/** Lie un nouveau filleul à son parrain (via le code) + crée le suivi. */
export async function linkReferral(refereeId: string, code?: string | null) {
  if (!code) return;
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });
  // On ignore l'auto-parrainage et les codes invalides
  if (!referrer || referrer.id === refereeId) return;

  try {
    await prisma.user.update({
      where: { id: refereeId },
      data: { referredById: referrer.id },
    });
    await prisma.referral.create({
      data: { referrerId: referrer.id, refereeId, status: "pending" },
    });
  } catch {
    // déjà lié / contrainte — sans gravité
  }
}

/** Le filleul vient de s'abonner : convertit le parrainage et récompense le
 *  parrain (crédit Stripe s'il est client, sinon mois offert au prochain abonnement).
 *  Idempotent : ne récompense qu'une fois par parrainage. */
export async function grantReferralReward(refereeId: string) {
  const referral = await prisma.referral.findUnique({ where: { refereeId } });
  if (!referral || referral.rewardGranted) return;

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: "converted", rewardGranted: true, convertedAt: new Date() },
  });

  const referrer = await prisma.user.findUnique({
    where: { id: referral.referrerId },
    select: { id: true, stripeCustomerId: true, referralRewards: true },
  });
  if (!referrer) return;

  const stripe = getStripe();
  if (stripe && referrer.stripeCustomerId) {
    // Parrain déjà client : crédit appliqué à sa prochaine facture.
    try {
      await stripe.customers.createBalanceTransaction(referrer.stripeCustomerId, {
        amount: -REWARD_AMOUNT,
        currency: "eur",
        description: "Récompense parrainage ViralRepo.AI",
      });
      await prisma.user.update({
        where: { id: referrer.id },
        data: { referralRewards: { increment: 1 } },
      });
      return;
    } catch {
      // repli sur le mois offert au prochain abonnement
    }
  }

  // Parrain non-client : mois offert appliqué à son prochain abonnement.
  await prisma.user.update({
    where: { id: referrer.id },
    data: { referralRewards: { increment: 1 }, pendingReferralReward: true },
  });
}
