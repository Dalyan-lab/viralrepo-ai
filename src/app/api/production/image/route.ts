import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Génère l'image d'une scène à partir de son prompt VISUEL (Gemini image).
// Sans clé : { demo: true } → le client fabrique un visuel procédural local.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { prompt, vertical } = (await req.json()) as {
    prompt: string;
    vertical?: boolean;
  };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt visuel manquant." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ demo: true });

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a single ${vertical ? "vertical 9:16" : "landscape 16:9"} cinematic image, no text or letters in the image. ${prompt}`,
              },
            ],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = await res.json();
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p: any) => p.inlineData?.data);
    if (!img) throw new Error("Pas d'image");

    return NextResponse.json({
      image: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`,
    });
  } catch {
    return NextResponse.json({ demo: true });
  }
}
