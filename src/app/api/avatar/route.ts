import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// File d'attente de rendu avatar D-ID : le job est créé en "queued",
// traité de façon asynchrone, et D-ID nous notifie via webhook —
// l'utilisateur n'est jamais bloqué pendant l'animation.

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const jobs = await prisma.avatarJob.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ jobs, demoMode: !process.env.DID_API_KEY });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { scriptText, avatarUrl } = await req.json();
  if (!scriptText) {
    return NextResponse.json({ error: "Le texte du script est requis." }, { status: 400 });
  }

  const job = await prisma.avatarJob.create({
    data: {
      userId: session.userId,
      scriptText: scriptText.slice(0, 4000),
      avatarUrl:
        avatarUrl ||
        "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg",
      status: "queued",
    },
  });

  // Lancement asynchrone — on répond immédiatement, le rendu continue en tâche de fond.
  processJob(job.id).catch(() => {});

  return NextResponse.json({ job });
}

async function processJob(jobId: string) {
  const job = await prisma.avatarJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  await prisma.avatarJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });

  const apiKey = process.env.DID_API_KEY;

  if (!apiKey) {
    // MODE DÉMO : simule le temps de rendu puis livre une vidéo d'exemple.
    await new Promise((r) => setTimeout(r, 8000));
    await prisma.avatarJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        resultUrl:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      },
    });
    return;
  }

  try {
    const res = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: job.avatarUrl,
        script: {
          type: "text",
          input: job.scriptText,
          provider: { type: "microsoft", voice_id: "fr-FR-HenriNeural" },
        },
        // Webhook : D-ID nous notifie quand le rendu est terminé
        webhook: `${process.env.APP_URL || "http://localhost:3000"}/api/webhooks/did?jobId=${jobId}`,
      }),
    });

    if (!res.ok) throw new Error(`D-ID ${res.status}: ${await res.text()}`);
    const data = await res.json();

    await prisma.avatarJob.update({
      where: { id: jobId },
      data: { didTalkId: data.id },
    });
  } catch (e: any) {
    await prisma.avatarJob.update({
      where: { id: jobId },
      data: { status: "error", error: String(e?.message ?? e).slice(0, 500) },
    });
  }
}
