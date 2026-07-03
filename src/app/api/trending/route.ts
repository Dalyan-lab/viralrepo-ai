import { NextRequest, NextResponse } from "next/server";
import { fetchTrendingAIRepos, Category, Period } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const category = (req.nextUrl.searchParams.get("cat") ?? "all") as Category;
  const period = (req.nextUrl.searchParams.get("period") ?? "hot") as Period;
  const { repos, source } = await fetchTrendingAIRepos(category, period);
  return NextResponse.json({ repos, source, updatedAt: new Date().toISOString() });
}
