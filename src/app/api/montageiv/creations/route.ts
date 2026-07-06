import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Historique partagé Montageiv : liste (recherche/filtres) + enregistrement
// manuel (utilisé par les flux asynchrones vidéo/avatar côté client).

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const p = req.nextUrl.searchParams;
  const where: any = { userId: session.userId };
  where.deleted = p.get("deleted") === "1";
  if (p.get("module")) where.module = p.get("module");
  if (p.get("favorite") === "1") where.favorite = true;
  const q = p.get("q")?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { prompt: { contains: q, mode: "insensitive" } },
    ];
  }

  const creations = await prisma.creation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return NextResponse.json({ creations });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { module: mod, name, prompt, resultUrl, resultText, params } = await req.json();
  if (!mod || !prompt) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }
  const creation = await prisma.creation.create({
    data: {
      userId: session.userId,
      module: mod,
      name: (name || prompt).slice(0, 60),
      prompt: String(prompt).slice(0, 2000),
      params: params ? JSON.stringify(params).slice(0, 4000) : null,
      resultUrl: resultUrl ?? null,
      resultText: resultText ?? null,
    },
  });
  return NextResponse.json({ creation });
}
