import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackPayload = {
  idea_title: string;
  feedback: "thumbs_up" | "thumbs_down";
};

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment configuration" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as Partial<FeedbackPayload>;
  const ideaTitle = (body.idea_title ?? "").trim();
  const feedback = body.feedback;

  if (!ideaTitle || (feedback !== "thumbs_up" && feedback !== "thumbs_down")) {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
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

  const { error: upsertError } = await supabase
    .from("idea_feedback")
    .upsert(
      {
        user_id: user.id,
        idea_title: ideaTitle,
        feedback,
      },
      { onConflict: "user_id,idea_title" },
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
