import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Animation d'une image de scène en plan vidéo (image-to-video) via Runway Gen-3.
// Flux asynchrone compatible Vercel : cette route SOUMET la tâche et renvoie un
// taskId ; le client interroge ensuite /api/video/[id] jusqu'à obtention de la
// vidéo. Sans RUNWAY_API_KEY : { demo: true } → le montage garde l'effet Ken Burns.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RUNWAY_VERSION = "2024-11-06";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { image, prompt, vertical } = (await req.json()) as {
    image: string; // data URI ou URL publique
    prompt?: string;
    vertical?: boolean;
  };
  if (!image) {
    return NextResponse.json({ error: "Image de scène manquante." }, { status: 400 });
  }

  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ demo: true });
  }

  try {
    const res = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": RUNWAY_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gen3a_turbo",
        promptImage: image,
        promptText: (prompt || "cinematic subtle motion, smooth camera movement").slice(0, 500),
        duration: 5,
        ratio: vertical ? "768:1280" : "1280:768",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Runway ${res.status}`, detail: detail.slice(0, 200) },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ taskId: data.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Runway injoignable.", detail: String(e?.message ?? e) },
      { status: 502 }
    );
  }
}
