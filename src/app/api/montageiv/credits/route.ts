import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCredits } from "@/lib/montageiv";
import { prisma } from "@/lib/db";

// Crédits IA + statistiques du tableau de bord Montageiv.

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const [credits, total, favorites, byModule] = await Promise.all([
    getCredits(session.userId),
    prisma.creation.count({ where: { userId: session.userId, deleted: false } }),
    prisma.creation.count({ where: { userId: session.userId, favorite: true, deleted: false } }),
    prisma.creation.groupBy({
      by: ["module"],
      where: { userId: session.userId, deleted: false },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    credits,
    stats: {
      total,
      favorites,
      byModule: Object.fromEntries(byModule.map((m) => [m.module, m._count])),
      // ~12 min économisées par création (estimation affichée au dashboard)
      timeSavedMin: total * 12,
    },
  });
}
