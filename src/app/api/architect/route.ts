import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { streamArchitectBlueprint, BudgetLevel } from "@/lib/architect";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { idea, niche, budget } = (await req.json()) as {
    idea: string;
    niche?: string;
    budget?: BudgetLevel;
  };

  if (!idea?.trim()) {
    return NextResponse.json(
      { error: "Décrivez votre idée de studio / projet." },
      { status: 400 }
    );
  }

  const stream = await streamArchitectBlueprint(
    idea.trim().slice(0, 2000),
    (niche ?? "").trim().slice(0, 200),
    budget ?? "balanced"
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
