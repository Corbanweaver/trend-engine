import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistantModel = "claude" | "gpt4";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  model?: AssistantModel;
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

async function callClaude(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY for Claude chat.");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    max_tokens: 220,
    temperature: 0.7,
    system: ASSISTANT_SYSTEM_PROMPT,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });
  const text = response.content
    .map((entry) => (entry.type === "text" ? entry.text : ""))
    .join("\n")
    .trim();
  if (!text) {
    throw new Error("Claude returned an empty response.");
  }

  return enforceBriefReply(text);
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
    const body = (await request.json()) as ChatBody;
    const selectedModel: AssistantModel = body.model === "gpt4" ? "gpt4" : "claude";
    const messages = normalizeMessages(body.messages ?? []);
    if (!messages.length) {
      return NextResponse.json({ error: "Please send at least one message." }, { status: 400 });
    }

    const reply = selectedModel === "gpt4" ? await callGpt4(messages) : await callClaude(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Assistant request failed." },
      { status: 500 },
    );
  }
}
