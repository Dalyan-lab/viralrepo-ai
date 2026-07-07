import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const job = await prisma.avatarJob.findFirst({
    where: { id: params.id, userId: session.userId },
  });
  if (!job) return NextResponse.json({ error: "Job introuvable." }, { status: 404 });

  // Si D-ID est configuré et que le webhook n'est pas joignable (dev local),
  // on interroge aussi l'API en direct comme filet de sécurité.
  if (
    job.status === "processing" &&
    job.didTalkId &&
    process.env.DID_API_KEY
  ) {
    try {
      const res = await fetch(`https://api.d-id.com/talks/${job.didTalkId}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.DID_API_KEY + ":"
          ).toString("base64")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "done" && data.result_url) {
          const updated = await prisma.avatarJob.update({
            where: { id: job.id },
            data: { status: "done", resultUrl: data.result_url },
          });
          return NextResponse.json({ job: updated });
        }
        if (data.status === "error") {
          const updated = await prisma.avatarJob.update({
            where: { id: job.id },
            data: { status: "error", error: "Erreur de rendu D-ID." },
          });
          return NextResponse.json({ job: updated });
        }
      }
    } catch {
      // réseau indisponible — on renvoie l'état courant
    }
  }

  return NextResponse.json({ job });
}

// Supprime un rendu d'avatar (raté / à refaire).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const job = await prisma.avatarJob.findFirst({
    where: { id: params.id, userId: session.userId },
  });
  if (!job) return NextResponse.json({ error: "Job introuvable." }, { status: 404 });

  await prisma.avatarJob.delete({ where: { id: job.id } });
  return NextResponse.json({ ok: true });
}
