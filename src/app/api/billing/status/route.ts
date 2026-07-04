import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { paystackConfigured } from "@/lib/paystack";

// État d'abonnement de l'utilisateur connecté (plan courant + expiration).
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ plan: null });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, subscriptionStatus: true, planExpiresAt: true },
  });

  // Accès premium expiré ? → on considère le plan comme découverte.
  const expired =
    !!user?.planExpiresAt && user.planExpiresAt < new Date();
  const activePlan = expired ? "decouverte" : user?.plan ?? "decouverte";

  return NextResponse.json({
    plan: activePlan,
    status: expired ? "expired" : user?.subscriptionStatus ?? null,
    expiresAt: user?.planExpiresAt ?? null,
    paystackConfigured: paystackConfigured(),
  });
}
