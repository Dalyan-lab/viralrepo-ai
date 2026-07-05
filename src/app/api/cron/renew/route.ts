import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { paystackChargeAuthorization, PLANS, PlanId } from "@/lib/paystack";

// Renouvellement automatique des abonnements (appelé quotidiennement par Vercel
// Cron). Prélève les abonnements qui expirent bientôt via leur autorisation
// Paystack. Protégé par CRON_SECRET.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  // Vercel Cron envoie "Authorization: Bearer <CRON_SECRET>".
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000); // expire sous 24 h
  const due = await prisma.user.findMany({
    where: {
      subscriptionStatus: "active",
      paystackAuthCode: { not: null },
      planExpiresAt: { lte: soon },
      plan: { in: ["createur", "studio"] },
    },
    select: { id: true, email: true, plan: true, paystackAuthCode: true, planExpiresAt: true },
    take: 100,
  });

  let renewed = 0;
  let failed = 0;
  for (const u of due) {
    const ok = await paystackChargeAuthorization({
      email: u.email,
      amountXOF: PLANS[u.plan as PlanId].amountXOF,
      authorizationCode: u.paystackAuthCode!,
      reference: `vrr_${u.id.slice(-6)}_${Date.now()}`,
      metadata: { userId: u.id, plan: u.plan, renewal: true },
    });
    if (ok) {
      const base =
        u.planExpiresAt && u.planExpiresAt > new Date() ? u.planExpiresAt : new Date();
      await prisma.user.update({
        where: { id: u.id },
        data: { planExpiresAt: new Date(base.getTime() + 30 * 86_400_000) },
      });
      renewed++;
    } else {
      // Échec (ex. Mobile Money non rechargeable) → marqué expiré, renouvellement manuel.
      await prisma.user.update({
        where: { id: u.id },
        data: { subscriptionStatus: "expired" },
      });
      failed++;
    }
  }

  return NextResponse.json({ checked: due.length, renewed, failed });
}
