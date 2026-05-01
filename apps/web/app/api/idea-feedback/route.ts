import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const feedbackAdminEmail = process.env.FEEDBACK_ADMIN_EMAIL || "corbanweaver5@gmail.com";
const feedbackSenderEmail = process.env.FEEDBACK_SENDER_EMAIL || "onboarding@resend.dev";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackPayload = {
  idea_title: string;
  feedback: "thumbs_up" | "thumbs_down" | "written";
  feedback_text?: string;
};

function getFeedbackLabel(feedback: FeedbackPayload["feedback"]): string {
  if (feedback === "thumbs_up") return "Thumbs up";
  if (feedback === "thumbs_down") return "Thumbs down";
  return "Written feedback";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendFeedbackEmail({
  userEmail,
  ideaTitle,
  feedback,
  feedbackText,
}: {
  userEmail: string;
  ideaTitle: string;
  feedback: FeedbackPayload["feedback"];
  feedbackText: string;
}) {
  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  const prettyFeedback = getFeedbackLabel(feedback);
  const safeMessage = feedbackText || "(none)";
  const safeUserEmail = escapeHtml(userEmail);
  const safeIdeaTitle = escapeHtml(ideaTitle);
  const html = `
    <h2>New idea feedback submitted</h2>
    <p><strong>User email:</strong> ${safeUserEmail}</p>
    <p><strong>Feedback type:</strong> ${prettyFeedback}</p>
    <p><strong>Idea:</strong> ${safeIdeaTitle}</p>
    <p><strong>Written message:</strong></p>
    <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${escapeHtml(safeMessage)}</pre>
  `;

  const text = [
    "New idea feedback submitted",
    `User email: ${userEmail}`,
    `Feedback type: ${prettyFeedback}`,
    `Idea: ${ideaTitle}`,
    `Written message: ${safeMessage}`,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: feedbackSenderEmail,
      to: [feedbackAdminEmail],
      subject: `Trend Engine feedback: ${prettyFeedback}`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      if (body.message || body.error) {
        detail = body.message || body.error || detail;
      }
    } catch {
      // ignore parse failure
    }
    throw new Error(`Failed to send feedback email: ${detail}`);
  }
}

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
  const feedbackText = (body.feedback_text ?? "").trim();

  const feedbackIsValid =
    feedback === "thumbs_up" || feedback === "thumbs_down" || feedback === "written";

  if (!ideaTitle || !feedbackIsValid) {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }
  if (feedback === "written" && !feedbackText) {
    return NextResponse.json(
      { error: "Written feedback requires a feedback_text value" },
      { status: 400 },
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

  const { error: upsertError } = await supabase
    .from("idea_feedback")
    .upsert(
      {
        user_id: user.id,
        idea_title: ideaTitle,
        feedback,
        feedback_text: feedbackText || null,
      },
      { onConflict: "user_id,idea_title" },
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  try {
    await sendFeedbackEmail({
      userEmail: user.email ?? "(unknown)",
      ideaTitle,
      feedback,
      feedbackText,
    });
  } catch (emailError) {
    return NextResponse.json(
      {
        error: emailError instanceof Error ? emailError.message : "Failed to send feedback email",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
