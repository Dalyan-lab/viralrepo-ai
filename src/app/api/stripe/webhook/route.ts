import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Webhook Stripe : source de vérité des abonnements. Met à jour le plan de
// l'utilisateur à chaque événement (paiement, changement, annulation).
// Nécessite STRIPE_WEBHOOK_SECRET (créé dans le dashboard Stripe).

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe non configuré." }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text(); // corps brut requis pour la signature

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", secret);
  } catch (e: any) {
    return NextResponse.json(
      { error: `Signature invalide: ${e?.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s: any = event.data.object;
        const userId = s.metadata?.userId || s.client_reference_id;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: s.metadata?.plan ?? "createur",
              stripeCustomerId: s.customer ?? undefined,
              stripeSubscriptionId: s.subscription ?? undefined,
              subscriptionStatus: "active",
            },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub: any = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: sub.status,
              plan: sub.status === "active" ? sub.metadata?.plan ?? undefined : undefined,
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub: any = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { plan: "decouverte", subscriptionStatus: "canceled" },
          });
        }
        break;
      }
    }
  } catch {
    // On répond 200 malgré tout pour éviter les relances en boucle de Stripe
  }

  return NextResponse.json({ received: true });
}
