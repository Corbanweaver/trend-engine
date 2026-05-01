import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages?: ChatMessage[];
};

const ASSISTANT_SYSTEM_PROMPT =
  "You are Trend Engine's AI coach. Sound like a friendly creator friend texting back. Keep it casual, specific, and practical. No markdown, no headers, no bullet points, no numbered lists. Keep replies under 3 short sentences unless the user explicitly asks for more detail. Focus on helping with niche selection, trend explanation, content brainstorming, and app navigation.";

function enforceBriefReply(text: string): string {
  const cleaned = text
    .replace(/\r?\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[*#`>-]/g, "")
    .trim();

  const sentenceMatches = cleaned.match(/[^.!?]+[.!?]?/g) ?? [];
  const concise = sentenceMatches
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .trim();

  const limited = (concise || cleaned).slice(0, 220).trim();
  return limited || "Got it - tell me your niche and goal.";
}

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((message) => {
      if (message.role !== "user" && message.role !== "assistant") return false;
      return typeof message.content === "string" && message.content.trim().length > 0;
    })
    .slice(-20);
}

async function callGpt4(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for GPT-4 chat.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o",
      temperature: 0.7,
      max_tokens: 220,
      messages: [
        { role: "system", content: ASSISTANT_SYSTEM_PROMPT },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
  });

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "OpenAI request failed.");
  }

  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("GPT-4 returned an empty response.");
  }
  return enforceBriefReply(text);
}

export async function POST(request: Request) {
  try {
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
          // no-op for API routes
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

    const body = (await request.json()) as ChatBody;
    const messages = normalizeMessages(body.messages ?? []);
    if (!messages.length) {
      return NextResponse.json({ error: "Please send at least one message." }, { status: 400 });
    }

    const reply = await callGpt4(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Assistant request failed." },
      { status: 500 },
    );
  }
}
