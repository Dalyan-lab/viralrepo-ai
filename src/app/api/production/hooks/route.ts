import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateHooks } from "@/lib/production";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { script, sceneCount } = (await req.json()) as {
    script: string;
    sceneCount: number;
  };
  if (!script?.trim()) {
    return NextResponse.json({ error: "Script manquant." }, { status: 400 });
  }

  const result = await generateHooks(script, Math.max(1, sceneCount || 1));
  return NextResponse.json(result);
}
