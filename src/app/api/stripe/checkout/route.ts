import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getStripe,
  PLANS,
  PlanId,
  ensureCoupon,
  COUPON_FILLEUL,
  COUPON_PARRAIN,
} from "@/lib/stripe";

// Crée une session Stripe Checkout (abonnement mensuel) pour un plan.
// Sans STRIPE_SECRET_KEY : { demo: true } → l'UI affiche un message d'aide.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: PlanId };
  if (plan !== "createur" && plan !== "studio") {
    return NextResponse.json({ error: "Plan inconnu." }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ demo: true });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  try {
    // Réductions de parrainage : mois offert (parrain récompensé) prioritaire,
    // sinon réduction de bienvenue (filleul non encore utilisée).
    const discounts: { coupon: string }[] = [];
    if (user.pendingReferralReward) {
      await ensureCoupon(stripe, COUPON_PARRAIN, 100, "Parrainage — 1 mois offert");
      discounts.push({ coupon: COUPON_PARRAIN });
    } else if (user.referredById && !user.refereeDiscountUsed) {
      await ensureCoupon(stripe, COUPON_FILLEUL, 20, "Parrainage — bienvenue -20%");
      discounts.push({ coupon: COUPON_FILLEUL });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.stripeCustomerId ? undefined : user.email,
      customer: user.stripeCustomerId ?? undefined,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            product_data: { name: PLANS[plan].name },
            unit_amount: PLANS[plan].amount,
            recurring: { interval: "month" },
          },
        },
      ],
      ...(discounts.length ? { discounts } : { allow_promotion_codes: true }),
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
      success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing?canceled=1`,
    });

    // On marque les récompenses consommées (au plus tard confirmé au webhook).
    if (user.pendingReferralReward) {
      await prisma.user.update({
        where: { id: user.id },
        data: { pendingReferralReward: false },
      });
    } else if (user.referredById && !user.refereeDiscountUsed) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refereeDiscountUsed: true },
      });
    }

    return NextResponse.json({ url: checkout.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erreur Stripe.", detail: String(e?.message ?? e).slice(0, 200) },
      { status: 502 }
    );
  }
}
