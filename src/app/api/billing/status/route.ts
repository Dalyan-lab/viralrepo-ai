import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// État d'abonnement de l'utilisateur connecté (plan courant + statut).
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ plan: null });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, subscriptionStatus: true, stripeCustomerId: true },
  });

  return NextResponse.json({
    plan: user?.plan ?? "decouverte",
    status: user?.subscriptionStatus ?? null,
    hasCustomer: !!user?.stripeCustomerId,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
  });
}
