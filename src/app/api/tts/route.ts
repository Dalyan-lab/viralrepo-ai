import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Voix off IA ultra-réaliste via ElevenLabs (modèle multilingue).
// Renvoie un MP3 prêt à être muxé dans la vidéo exportée.
// Sans ELEVENLABS_API_KEY : { demo: true } → le client utilise la voix TTS
// du navigateur en repli.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Voix préréglées ElevenLabs (compatibles multilingue v2)
const VOICES: Record<string, string> = {
  charlotte: "XB0fDUnXU5powFXDhCwa", // féminine, chaleureuse
  antoni: "ErXwobaYiN019PkySvjV", // masculine, posée
  rachel: "21m00Tcm4TlvDq8ikWAM", // féminine, claire
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { text, voice } = (await req.json()) as { text: string; voice?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: "Texte requis." }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ demo: true });
  }

  const voiceId =
    VOICES[voice ?? ""] || process.env.ELEVENLABS_VOICE_ID || VOICES.charlotte;

  // Limite raisonnable pour préserver les crédits / respecter les quotas
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 2500);

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: clean,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15 },
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `ElevenLabs ${res.status}`, detail: detail.slice(0, 200) },
        { status: 502 }
      );
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "ElevenLabs injoignable.", detail: String(e?.message ?? e) },
      { status: 502 }
    );
  }
}
