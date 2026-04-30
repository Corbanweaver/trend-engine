import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackRow = {
  trend: string;
  rating: "up" | "down";
};

function inferNiche(trend: string): string {
  const t = trend.toLowerCase();
  if (/(fitness|workout|gym|protein|fat|muscle|diet|cardio)/.test(t)) return "fitness";
  if (/(beauty|skincare|makeup|hair|cosmetic)/.test(t)) return "beauty";
  if (/(finance|money|invest|crypto|stock|budget)/.test(t)) return "finance";
  if (/(ai|tech|software|coding|app|startup)/.test(t)) return "tech";
  if (/(food|recipe|cooking|meal|nutrition)/.test(t)) return "food";
  return "general";
}

export async function GET() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment configuration" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // no-op
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("idea_feedback")
    .select("trend, rating")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data as FeedbackRow[] | null) ?? []).filter((r) => r.rating === "up");
  const bucket = new Map<string, { likes: number; topTrends: Map<string, number> }>();

  for (const row of rows) {
    const niche = inferNiche(row.trend);
    const current = bucket.get(niche) ?? { likes: 0, topTrends: new Map<string, number>() };
    current.likes += 1;
    current.topTrends.set(row.trend, (current.topTrends.get(row.trend) ?? 0) + 1);
    bucket.set(niche, current);
  }

  const summary = Array.from(bucket.entries())
    .map(([niche, value]) => ({
      niche,
      likes: value.likes,
      top_trends: Array.from(value.topTrends.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([trend, count]) => ({ trend, count })),
    }))
    .sort((a, b) => b.likes - a.likes);

  return NextResponse.json({ summary });
}
