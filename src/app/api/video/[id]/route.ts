import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// Interrogation de l'état d'une tâche vidéo Runway (polling piloté par le client).
// Renvoie { status, videoUrl? } — le client boucle jusqu'à "done".

export const dynamic = "force-dynamic";

const RUNWAY_VERSION = "2024-11-06";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: "demo" });
  }

  try {
    const res = await fetch(`https://api.dev.runwayml.com/v1/tasks/${params.id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": RUNWAY_VERSION,
      },
    });
    if (!res.ok) {
      return NextResponse.json(
        { status: "error", detail: `Runway ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    // Runway : PENDING | RUNNING | SUCCEEDED | FAILED
    if (data.status === "SUCCEEDED") {
      return NextResponse.json({
        status: "done",
        videoUrl: Array.isArray(data.output) ? data.output[0] : data.output,
      });
    }
    if (data.status === "FAILED") {
      return NextResponse.json({ status: "error", detail: data.failure ?? "échec" });
    }
    return NextResponse.json({ status: "processing" });
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", detail: String(e?.message ?? e) },
      { status: 502 }
    );
  }
}
