import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const feedbackAdminEmail = "corbanweaver5@gmail.com";
const feedbackSenderEmail = "onboarding@resend.dev";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FeedbackPayload = {
  idea_title: string;
  feedback_type: "thumbs_up" | "thumbs_down" | "written";
  message?: string;
  // Backward compatibility for older clients
  feedback?: "thumbs_up" | "thumbs_down" | "written";
  feedback_text?: string;
};

function getFeedbackLabel(feedbackType: FeedbackPayload["feedback_type"]): string {
  if (feedbackType === "thumbs_up") return "Thumbs up";
  if (feedbackType === "thumbs_down") return "Thumbs down";
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
  feedbackType,
  message,
}: {
  userEmail: string;
  ideaTitle: string;
  feedbackType: FeedbackPayload["feedback_type"];
  message: string;
}) {
  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }
  const resend = new Resend(resendApiKey);

  const prettyFeedback = getFeedbackLabel(feedbackType);
  const safeMessage = message || "(none)";
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

  const { error } = await resend.emails.send({
    from: feedbackSenderEmail,
    to: feedbackAdminEmail,
    subject: `Trend Engine feedback: ${prettyFeedback}`,
    html,
    text,
  });

  if (error) {
    console.error("[idea-feedback] Resend send error:", {
      message: error.message,
      name: error.name,
      // Log common SDK/server payload details when available.
      response: (error as { response?: unknown }).response ?? null,
      body: (error as { body?: unknown }).body ?? null,
      fullError: error,
    });
    throw new Error(`Failed to send feedback email: ${error.message}`);
  }
}

export async function POST(request: Request) {
  const resendKeyPreview = resendApiKey ? `${resendApiKey.slice(0, 5)}...` : "(missing)";
  console.log("[idea-feedback] RESEND_API_KEY preview:", resendKeyPreview);

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Missing Supabase environment configuration" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as Partial<FeedbackPayload>;
  const ideaTitle = (body.idea_title ?? "").trim();
  // Accept both new and legacy payload keys during rollout.
  const feedbackType = body.feedback_type ?? body.feedback;
  const message = (body.message ?? body.feedback_text ?? "").trim();

  const feedbackIsValid =
    feedbackType === "thumbs_up" || feedbackType === "thumbs_down" || feedbackType === "written";

  if (!ideaTitle || !feedbackIsValid) {
    return NextResponse.json({ error: "Invalid feedback payload" }, { status: 400 });
  }
  if (feedbackType === "written" && !message) {
    return NextResponse.json(
      { error: "Written feedback requires a message value" },
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
        feedback_type: feedbackType,
        message: message || null,
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
      feedbackType,
      message,
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
