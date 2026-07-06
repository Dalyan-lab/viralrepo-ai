import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { replicateStatus } from "@/lib/replicate";

// Suivi d'une prédiction Replicate (jobs longs : vidéo). Le client sonde ici.
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json(await replicateStatus(params.id));
}
