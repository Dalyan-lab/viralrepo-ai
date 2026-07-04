import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Portail de facturation Stripe : l'utilisateur gère / annule son abonnement.

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ demo: true });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement actif." }, { status: 400 });
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erreur Stripe.", detail: String(e?.message ?? e).slice(0, 200) },
      { status: 502 }
    );
  }
}
