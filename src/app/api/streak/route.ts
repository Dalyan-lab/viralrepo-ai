import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStreakState, pingStreak } from "@/lib/streak";

// GET : état de la série. POST : enregistre l'activité du jour (appelé au
// chargement du dashboard) et renvoie la série mise à jour.

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ streak: null });
  return NextResponse.json(await getStreakState(session.userId));
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ streak: null });
  return NextResponse.json(await pingStreak(session.userId));
}
