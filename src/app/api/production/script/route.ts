import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { streamProductionScript, VideoFormat } from "@/lib/production";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { idea, format, tone } = (await req.json()) as {
    idea: string;
    format: VideoFormat;
    tone?: string;
  };
  if (!idea?.trim()) {
    return NextResponse.json({ error: "Décrivez votre idée." }, { status: 400 });
  }

  const stream = await streamProductionScript(
    idea.trim().slice(0, 2000),
    format === "short" ? "short" : "youtube",
    (tone ?? "").slice(0, 200)
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
