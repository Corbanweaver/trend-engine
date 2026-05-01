import { NextResponse } from "next/server";

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
  "You are the Trend Engine AI assistant. Help creators find their niche, explain trends, brainstorm content ideas, and navigate the app clearly and concisely. Keep responses practical and actionable.";

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((message) => {
      if (message.role !== "user" && message.role !== "assistant") return false;
      return typeof message.content === "string" && message.content.trim().length > 0;
    })
    .slice(-20);
}

async function callClaude(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY for Claude chat.");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 700,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    }),
  });

  const body = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Claude request failed.");
  }

  const text = body.content
    ?.filter((entry) => entry.type === "text" && typeof entry.text === "string")
    .map((entry) => entry.text ?? "")
    .join("\n")
    .trim();
  if (!text) {
    throw new Error("Claude returned an empty response.");
  }

  return text;
}

async function callGpt4(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
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
      max_tokens: 700,
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
  return text;
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
