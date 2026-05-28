import { NextResponse } from "next/server";

import {
  hasTrustedOrigin,
  invalidOriginResponse,
  parseLimitedJsonBody,
} from "@/lib/api-request-guards";
import { CREDIT_COSTS } from "@/lib/credits";
import { recordOperationalEvent } from "@/lib/server-events";
import {
  checkRateLimits,
  getClientIp,
  rateLimitResponse,
  type RateLimitRule,
} from "@/lib/server-rate-limit";
import { getOpenAICreditBudget } from "@/lib/credits";

import {
  isInsufficientCreditsError,
  loadUsage,
  refundCredits,
  spendCredits,
} from "../trend-ideas/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages?: unknown;
};

const ASSISTANT_BODY_LIMIT_BYTES = 16 * 1024;
const MAX_ASSISTANT_HISTORY_MESSAGES = 12;
const MAX_ASSISTANT_MESSAGE_CHARS = 1200;

const ASSISTANT_SYSTEM_PROMPT =
  "You are TrendBoard's AI coach. Sound like a friendly creator friend texting back. Keep it casual, specific, and practical. No markdown, no headers, no bullet points, no numbered lists. Keep replies under 3 short sentences unless the user explicitly asks for more detail. Focus on helping with niche selection, trend explanation, content brainstorming, and app navigation.";

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

function normalizeMessages(
  messages: unknown,
): { ok: true; messages: ChatMessage[] } | { ok: false; response: NextResponse } {
  if (!Array.isArray(messages)) {
    return { ok: true, messages: [] };
  }

  const normalized: ChatMessage[] = [];
  for (const message of messages) {
    if (!message || typeof message !== "object") continue;
    const candidate = message as { role?: unknown; content?: unknown };
    if (candidate.role !== "user" && candidate.role !== "assistant") continue;
    if (typeof candidate.content !== "string") continue;
    const content = candidate.content.trim();
    if (!content) continue;
    if (content.length > MAX_ASSISTANT_MESSAGE_CHARS) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: `Assistant messages must stay under ${MAX_ASSISTANT_MESSAGE_CHARS} characters.`,
          },
          { status: 400 },
        ),
      };
    }
    normalized.push({ role: candidate.role, content });
  }

  return {
    ok: true,
    messages: normalized.slice(-MAX_ASSISTANT_HISTORY_MESSAGES),
  };
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
  if (!hasTrustedOrigin(request)) {
    return invalidOriginResponse();
  }

  const usage = await loadUsage();
  if (!usage.ok) {
    return NextResponse.json({ error: usage.error }, { status: usage.status });
  }

  try {
    const parsedBody = await parseLimitedJsonBody<ChatBody>(request, {
      maxBytes: ASSISTANT_BODY_LIMIT_BYTES,
      invalidMessage: "Invalid request body.",
      tooLargeMessage: "Assistant requests must stay under 16 KB.",
    });
    if (!parsedBody.ok) return parsedBody.response;

    const normalized = normalizeMessages(parsedBody.body.messages);
    if (!normalized.ok) return normalized.response;
    const messages = normalized.messages;
    if (!messages.length) {
      return NextResponse.json(
        { error: "Please send at least one message." },
        { status: 400 },
      );
    }
    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Please send a user message." },
        { status: 400 },
      );
    }

    const cost = CREDIT_COSTS.assistantMessage;
    if (!usage.isAdmin && usage.snapshot.creditsRemaining < cost) {
      return NextResponse.json(
        {
          error: `You need ${cost} credit to message the AI assistant.`,
          credits: usage.snapshot,
          requiredCredits: cost,
        },
        { status: 402 },
      );
    }

    if (!usage.isAdmin) {
      const globalCostGuard = getOpenAICreditBudget();
      const clientIp = getClientIp(request);
      const rules: RateLimitRule[] = [
        {
          key: `user:${usage.user.id}`,
          action: "assistant_message",
          limit: 30,
          windowSeconds: 10 * 60,
        },
        {
          key: `user:${usage.user.id}`,
          action: "assistant_message",
          limit: 300,
          windowSeconds: 24 * 60 * 60,
        },
        {
          key: `ip:${clientIp}`,
          action: "assistant_message_ip",
          limit: 120,
          windowSeconds: 10 * 60,
        },
      ];

      if (globalCostGuard.limit > 0) {
        rules.push({
          key: "global:trend-ai-cost",
          action: "trend_ai_cost",
          cost,
          limit: globalCostGuard.limit,
          windowSeconds: globalCostGuard.windowSeconds,
        });
      }

      const rateLimit = await checkRateLimits(usage.admin, rules);
      if (!rateLimit.ok) return rateLimitResponse(rateLimit);
    }

    let charged = false;
    try {
      const credits = usage.isAdmin
        ? usage.snapshot
        : await spendCredits(usage.admin, usage.user.id, cost);
      charged = !usage.isAdmin;
      const reply = await callGpt4(messages);
      return NextResponse.json({ reply, credits });
    } catch (error) {
      if (charged) {
        await refundCredits(usage.admin, usage.user.id, cost).catch(
          (refundError) =>
            console.error("Failed to refund assistant credits:", refundError),
        );
      }
      await recordOperationalEvent(usage.admin, {
        level: "error",
        source: "assistant_chat",
        message:
          error instanceof Error ? error.message : "Assistant request failed",
        userId: usage.user.id,
        metadata: { messageCount: messages.length },
      });
      if (isInsufficientCreditsError(error)) {
        return NextResponse.json(
          {
            error: `You need ${cost} credit to message the AI assistant.`,
            credits: usage.snapshot,
            requiredCredits: cost,
          },
          { status: 402 },
        );
      }
      throw error;
    }
  } catch (error) {
    await recordOperationalEvent(usage.admin, {
      level: "error",
      source: "assistant_chat",
      message:
        error instanceof Error ? error.message : "Assistant request failed",
      userId: usage.user.id,
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Assistant request failed.",
      },
      { status: 500 },
    );
  }
}
