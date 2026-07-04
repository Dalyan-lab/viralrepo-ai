import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paystackConfigured, paystackInitialize, PLANS, PlanId } from "@/lib/paystack";

// Initialise un paiement Paystack (accès premium 30 jours) et renvoie l'URL de
// paiement hébergée (cartes + Mobile Money). Sans clé : { demo: true }.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { plan } = (await req.json()) as { plan: PlanId };
  if (plan !== "createur" && plan !== "studio") {
    return NextResponse.json({ error: "Plan inconnu." }, { status: 400 });
  }
  if (!paystackConfigured()) return NextResponse.json({ demo: true });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  // Réduction de bienvenue filleul : -20% sur le premier paiement.
  const eligibleDiscount = !!user.referredById && !user.refereeDiscountUsed;
  const amountXOF = eligibleDiscount
    ? Math.round(PLANS[plan].amountXOF * 0.8)
    : PLANS[plan].amountXOF;

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const reference = `vr_${user.id.slice(-6)}_${Date.now()}`;

  const init = await paystackInitialize({
    email: user.email,
    amountXOF,
    reference,
    callbackUrl: `${appUrl}/billing`,
    metadata: { userId: user.id, plan, discount: eligibleDiscount },
  });

  if (!init) {
    return NextResponse.json({ error: "Échec de l'initialisation Paystack." }, { status: 502 });
  }
  return NextResponse.json({ url: init.authorization_url });
}
