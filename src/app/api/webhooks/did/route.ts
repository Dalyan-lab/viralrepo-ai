import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Webhook D-ID : notifié automatiquement à la fin du rendu de l'avatar.
// La file d'attente passe le job en "done" sans jamais bloquer l'utilisateur.
export async function POST(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId manquant" }, { status: 400 });

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "payload invalide" }, { status: 400 });

  const job = await prisma.avatarJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "job inconnu" }, { status: 404 });

  if (payload.status === "done" && payload.result_url) {
    await prisma.avatarJob.update({
      where: { id: jobId },
      data: { status: "done", resultUrl: payload.result_url },
    });
  } else if (payload.status === "error") {
    await prisma.avatarJob.update({
      where: { id: jobId },
      data: { status: "error", error: payload.error?.description ?? "Erreur D-ID" },
    });
  }

  return NextResponse.json({ ok: true });
}
