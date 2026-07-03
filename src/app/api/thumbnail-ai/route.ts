import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Génération du fond de miniature par IA (Gemini image).
// Sans GEMINI_API_KEY : { demo: true } → le client génère un fond
// procédural néon localement.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { prompt } = await req.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Décrivez la miniature souhaitée." }, { status: 400 });
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
                text: `Génère une image d'arrière-plan de miniature YouTube (format paysage 16:9), style tech futuriste, néons, très contrastée et accrocheuse, SANS texte ni lettres dans l'image. Sujet : ${prompt}`,
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
    if (!img) throw new Error("Pas d'image dans la réponse");

    return NextResponse.json({
      image: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`,
    });
  } catch {
    // Erreur API → le client bascule en génération procédurale locale
    return NextResponse.json({ demo: true });
  }
}
