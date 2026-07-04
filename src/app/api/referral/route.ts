import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureReferralCode } from "@/lib/referral";

// Données du tableau de bord de parrainage de l'utilisateur connecté.
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const code = await ensureReferralCode(session.userId);

  const [user, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { referralRewards: true, pendingReferralReward: true },
    }),
    prisma.referral.findMany({
      where: { referrerId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        status: true,
        createdAt: true,
        referee: { select: { name: true, email: true } },
      },
    }),
  ]);

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const converted = referrals.filter((r) => r.status === "converted").length;

  return NextResponse.json({
    code,
    link: `${appUrl}/register?ref=${code}`,
    stats: {
      total: referrals.length,
      converted,
      pending: referrals.length - converted,
      rewards: user?.referralRewards ?? 0,
    },
    pendingReward: user?.pendingReferralReward ?? false,
    // Email masqué pour la confidentialité (ex : al***@gmail.com)
    referrals: referrals.map((r) => ({
      name: r.referee.name,
      email: maskEmail(r.referee.email),
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const shown = local.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}
