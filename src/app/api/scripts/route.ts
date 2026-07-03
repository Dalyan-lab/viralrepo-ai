import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const scripts = await prisma.script.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ scripts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { repoName, repoUrl, platform, content } = await req.json();
  if (!repoName || !platform || !content) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const script = await prisma.script.create({
    data: {
      userId: session.userId,
      repoName,
      repoUrl: repoUrl ?? "",
      platform,
      content,
    },
  });
  return NextResponse.json({ script });
}
