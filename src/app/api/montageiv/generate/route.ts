import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ModuleId, MODULE_COSTS, consumeCredits,
  generateImage, generateText, generateVoice, generateMusic,
} from "@/lib/montageiv";

// Génération Montageiv IA — un endpoint unique, comportement par module.
// Consomme les crédits, enregistre la création dans l'historique partagé.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RUNWAY_VERSION = "2024-11-06";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { module: mod, prompt, params = {} } = (await req.json()) as {
    module: ModuleId;
    prompt: string;
    params?: Record<string, any>;
  };

  if (!MODULE_COSTS[mod]) {
    return NextResponse.json({ error: "Module inconnu." }, { status: 400 });
  }
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Décrivez votre création." }, { status: 400 });
  }

  // Coût : les images se facturent à l'unité générée
  const count = mod === "image" ? Math.min(4, Math.max(1, Number(params.count) || 1)) : 1;
  const cost = MODULE_COSTS[mod] * count;
  const creditError = await consumeCredits(session.userId, cost);
  if (creditError) return NextResponse.json({ error: creditError }, { status: 402 });

  const baseName = prompt.trim().slice(0, 48);
  const save = (data: {
    resultUrl?: string | null;
    resultText?: string | null;
    status?: string;
    name?: string;
  }) =>
    prisma.creation.create({
      data: {
        userId: session.userId,
        module: mod,
        name: data.name ?? baseName,
        prompt: prompt.trim().slice(0, 2000),
        params: JSON.stringify(params).slice(0, 4000),
        status: data.status ?? "done",
        resultUrl: data.resultUrl ?? null,
        resultText: data.resultText ?? null,
      },
    });

  try {
    switch (mod) {
      case "image": {
        const creations = [];
        let demo = false;
        for (let i = 0; i < count; i++) {
          const r = await generateImage(
            `${prompt}${count > 1 ? ` (variation ${i + 1})` : ""}`,
            params
          );
          demo = demo || r.demo;
          creations.push(await save({ resultUrl: r.url, name: count > 1 ? `${baseName} ${i + 1}` : baseName }));
        }
        return NextResponse.json({ creations, demo, cost });
      }

      case "redacteur": {
        const r = await generateText(prompt, params);
        const c = await save({ resultText: r.text });
        return NextResponse.json({ creations: [c], demo: r.demo, cost });
      }

      case "voix": {
        const r = await generateVoice(prompt, params.voice ?? "charlotte");
        if (!r.url) {
          // Démo sans clé : pas d'audio stockable (voix navigateur côté client)
          const c = await save({ status: "done", resultUrl: null });
          return NextResponse.json({ creations: [c], demo: true, cost });
        }
        const c = await save({ resultUrl: r.url });
        return NextResponse.json({ creations: [c], demo: false, cost });
      }

      case "musique": {
        const r = generateMusic(prompt, params);
        const c = await save({ resultUrl: r.url });
        return NextResponse.json({ creations: [c], demo: r.demo, cost });
      }

      case "video": {
        const apiKey = process.env.RUNWAY_API_KEY;
        // Réel : image → vidéo via Runway (asynchrone, le client sondera)
        if (apiKey && params.image) {
          const res = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Runway-Version": RUNWAY_VERSION,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gen3a_turbo",
              promptImage: params.image,
              promptText: prompt.slice(0, 500),
              duration: 5,
              ratio: params.ratio === "9:16" ? "768:1280" : "1280:768",
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const c = await save({ status: "processing" });
            return NextResponse.json({ creations: [c], taskId: data.id, demo: false, cost });
          }
        }
        // Démo : clip d'exemple
        const c = await save({
          resultUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        });
        return NextResponse.json({ creations: [c], demo: true, cost });
      }

      case "avatar": {
        // Réutilise la file D-ID existante : job créé, le client sonde /api/avatar/[id]
        const job = await prisma.avatarJob.create({
          data: {
            userId: session.userId,
            scriptText: prompt.slice(0, 4000),
            avatarUrl: params.avatarUrl || "preset",
            status: "queued",
          },
        });
        const c = await save({ status: "processing" });
        // Déclenchement asynchrone du rendu via la route avatar existante
        processAvatarJob(job.id).catch(() => {});
        return NextResponse.json({ creations: [c], jobId: job.id, demo: !process.env.DID_API_KEY, cost });
      }
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "Échec de la génération.", detail: String(e?.message ?? e).slice(0, 200) },
      { status: 502 }
    );
  }
}

// Rendu avatar (copie du traitement de /api/avatar — démo ou D-ID réel)
async function processAvatarJob(jobId: string) {
  const job = await prisma.avatarJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  await prisma.avatarJob.update({ where: { id: jobId }, data: { status: "processing" } });

  const apiKey = process.env.DID_API_KEY;
  if (!apiKey) {
    await new Promise((r) => setTimeout(r, 8000));
    await prisma.avatarJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        resultUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
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
    if (!res.ok) throw new Error(`D-ID ${res.status}`);
    const data = await res.json();
    await prisma.avatarJob.update({ where: { id: jobId }, data: { didTalkId: data.id } });
  } catch (e: any) {
    await prisma.avatarJob.update({
      where: { id: jobId },
      data: { status: "error", error: String(e?.message ?? e).slice(0, 500) },
    });
  }
}
