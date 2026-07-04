import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paystackConfigured, paystackVerify } from "@/lib/paystack";
import { grantReferralReward } from "@/lib/referral";

// Vérifie un paiement Paystack au retour du checkout et active l'accès premium.
// Filet fiable même sans webhook configuré.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!paystackConfigured()) return NextResponse.json({ demo: true });

  const { reference } = await req.json();
  if (!reference) return NextResponse.json({ error: "Référence manquante." }, { status: 400 });

  const result = await paystackVerify(reference);
  if (!result) return NextResponse.json({ error: "Vérification impossible." }, { status: 502 });
  if (!result.success) return NextResponse.json({ ok: false });

  // Sécurité : la transaction doit appartenir à l'utilisateur connecté.
  if (result.metadata?.userId && result.metadata.userId !== session.userId) {
    return NextResponse.json({ error: "Transaction non autorisée." }, { status: 403 });
  }

  const plan = (result.metadata?.plan as string) ?? "createur";
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      plan,
      subscriptionStatus: "active",
      planExpiresAt: expires,
      refereeDiscountUsed: result.metadata?.discount ? true : undefined,
      paystackAuthCode: result.authorizationCode ?? undefined,
      paystackCustomer: result.customerCode ?? undefined,
    },
  });

  // Récompense de parrainage (idempotent) : le filleul vient de payer.
  await grantReferralReward(session.userId);

  return NextResponse.json({ ok: true, plan });
}
