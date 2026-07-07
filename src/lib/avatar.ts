import { prisma } from "./db";
import {
  replicateTTS, replicateLatestVersion, replicateCreateVersion, MODELS,
} from "./replicate";

// Rendu d'avatar parlant via Replicate (voix minimax → SadTalker image+audio).
// Partagé par le Studio de Production et le module Avatar de Montageiv IA.

// Visage réaliste par défaut si aucune photo fournie (SadTalker anime un visage).
const DEFAULT_FACE =
  "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg";

/**
 * Prépare un rendu d'avatar via Replicate : génère la voix du script puis crée
 * la prédiction SadTalker. Stocke `didTalkId = "rpl:<id>"` — le rendu (long) est
 * ensuite sondé côté serveur via GET /api/avatar (liste) ou /api/avatar/[id].
 * À appeler en `await` (fiabilité serverless : la mise en place doit aboutir
 * avant la réponse HTTP).
 */
export async function setupReplicateAvatarJob(jobId: string, voice = "charlotte") {
  const job = await prisma.avatarJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  await prisma.avatarJob.update({ where: { id: jobId }, data: { status: "processing" } });

  try {
    // 1) Voix off du script (minimax speech)
    const tts = await replicateTTS(job.scriptText.slice(0, 1500), voice);
    if (!tts.url) throw new Error("Génération de la voix échouée.");

    // 2) SadTalker : anime l'image avec la voix (modèle communautaire → version)
    const version = await replicateLatestVersion(MODELS.lipsync());
    if (!version) throw new Error("Modèle lip-sync indisponible.");

    const av = job.avatarUrl || "";
    const source = av.startsWith("http") || av.startsWith("data:") ? av : DEFAULT_FACE;

    const pred = await replicateCreateVersion(version, {
      source_image: source,
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
