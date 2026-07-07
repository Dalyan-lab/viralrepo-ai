import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  replicateConfigured, replicateTTS, replicateLatestVersion,
  replicateCreateVersion, replicateStatus, MODELS,
} from "@/lib/replicate";

// Avatar parlant (lip-sync). Priorité à REPLICATE_API_TOKEN (voix minimax +
// SadTalker image→tête parlante) — une seule clé — sinon D-ID si sa clé est
// présente, sinon mode démo. Le rendu Replicate est sondé côté serveur via la
// liste (les jobs "rpl:" en cours sont rafraîchis à chaque GET).

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let jobs = await prisma.avatarJob.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Rafraîchit les rendus Replicate en cours (préfixe "rpl:" dans didTalkId).
  if (replicateConfigured()) {
    const pending = jobs.filter(
      (j) => j.status === "processing" && j.didTalkId?.startsWith("rpl:")
    );
    if (pending.length) {
      await Promise.all(
        pending.map(async (j) => {
          try {
            const st = await replicateStatus(j.didTalkId!.slice(4));
            if (st.status === "succeeded" && st.url) {
              await prisma.avatarJob.update({
                where: { id: j.id },
                data: { status: "done", resultUrl: st.url },
              });
            } else if (st.status === "failed" || st.status === "canceled") {
              await prisma.avatarJob.update({
                where: { id: j.id },
                data: { status: "error", error: "Rendu Replicate échoué." },
              });
            }
          } catch {
            /* on réessaiera au prochain GET */
          }
        })
      );
      jobs = await prisma.avatarJob.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    }
  }

  return NextResponse.json({
    jobs,
    demoMode: !process.env.DID_API_KEY && !replicateConfigured(),
  });
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

  // Replicate : on prépare (voix + création du rendu) de façon synchrone pour
  // fiabiliser sur serverless, puis le client sonde la complétion via GET.
  if (replicateConfigured()) {
    await setupReplicateAvatar(job.id);
  } else {
    // D-ID / démo : rendu asynchrone (webhook D-ID ou simulation).
    processJobDID(job.id).catch(() => {});
  }

  const fresh = await prisma.avatarJob.findUnique({ where: { id: job.id } });
  return NextResponse.json({ job: fresh });
}

// ---- Rendu via Replicate : voix minimax → SadTalker (image + audio) ----
async function setupReplicateAvatar(jobId: string) {
  const job = await prisma.avatarJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  await prisma.avatarJob.update({ where: { id: jobId }, data: { status: "processing" } });

  try {
    // 1) Voix off du script
    const tts = await replicateTTS(job.scriptText.slice(0, 1500), "charlotte");
    if (!tts.url) throw new Error("Génération de la voix échouée.");

    // 2) SadTalker : anime l'image avec la voix (modèle communautaire → version)
    const version = await replicateLatestVersion(MODELS.lipsync());
    if (!version) throw new Error("Modèle lip-sync indisponible.");
    const pred = await replicateCreateVersion(version, {
      source_image: job.avatarUrl,
      driven_audio: tts.url,
      preprocess: "full",
      still_mode: true,
      use_enhancer: true,
      use_eyeblink: true,
    });

    await prisma.avatarJob.update({
      where: { id: jobId },
      data: { status: "processing", didTalkId: `rpl:${pred.id}` },
    });
  } catch (e: any) {
    await prisma.avatarJob.update({
      where: { id: jobId },
      data: { status: "error", error: String(e?.message ?? e).slice(0, 500) },
    });
  }
}

// ---- Rendu via D-ID (optionnel) ou mode démo ----
async function processJobDID(jobId: string) {
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
