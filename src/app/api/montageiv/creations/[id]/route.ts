import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Actions sur une création : renommer, favori, corbeille/restaurer, MAJ du
// résultat (flux asynchrones), suppression définitive, duplication.

export const dynamic = "force-dynamic";

async function owned(id: string, userId: string) {
  const c = await prisma.creation.findFirst({ where: { id, userId } });
  return c;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const existing = await owned(params.id, session.userId);
  if (!existing) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  const body = await req.json();

  if (body.action === "duplicate") {
    const copy = await prisma.creation.create({
      data: {
        userId: session.userId,
        module: existing.module,
        name: `${existing.name} (copie)`,
        prompt: existing.prompt,
        params: existing.params,
        status: existing.status,
        resultUrl: existing.resultUrl,
        resultText: existing.resultText,
      },
    });
    return NextResponse.json({ creation: copy });
  }

  const data: any = {};
  if (typeof body.name === "string") data.name = body.name.slice(0, 60);
  if (typeof body.favorite === "boolean") data.favorite = body.favorite;
  if (typeof body.deleted === "boolean") data.deleted = body.deleted;
  if (typeof body.resultUrl === "string") data.resultUrl = body.resultUrl;
  if (typeof body.status === "string") data.status = body.status;

  const creation = await prisma.creation.update({ where: { id: params.id }, data });
  return NextResponse.json({ creation });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const existing = await owned(params.id, session.userId);
  if (!existing) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  await prisma.creation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
