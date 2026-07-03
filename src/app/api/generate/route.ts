import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { streamScript, Platform } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json();
  const { repo, platform } = body as {
    repo: {
      fullName: string;
      description: string;
      stars: number;
      velocity: number;
      url: string;
      language?: string | null;
    };
    platform: Platform;
  };

  if (!repo?.fullName || !platform) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  const stream = await streamScript(repo, platform);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
