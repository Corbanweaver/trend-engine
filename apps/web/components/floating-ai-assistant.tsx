"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import type { User } from "@supabase/supabase-js";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabase";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const QUICK_PROMPTS = [
  "Help me find my niche",
  "Explain this trend in simple terms",
  "Brainstorm 5 content ideas",
  "How do I use this app better?",
];

const ASSISTANT_MESSAGES_STORAGE_KEY = "trend_engine:assistant_messages";
const ASSISTANT_POSITION_STORAGE_KEY = "trend_engine:assistant_position";

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help with niche discovery, trend explanations, content brainstorming, and navigating Content Buddy.",
};

type AssistantPosition = {
  x: number;
  y: number;
};

function getDefaultAssistantPosition(): AssistantPosition {
  if (typeof window === "undefined") return { x: 16, y: 16 };
  const isMobile = window.innerWidth < 768;
  const estimatedWidth = isMobile ? 142 : 164;
  const estimatedHeight = 52;
  return {
    x: Math.max(12, window.innerWidth - estimatedWidth - 20),
    y: Math.max(
      12,
      window.innerHeight - estimatedHeight - (isMobile ? 88 : 20),
    ),
  };
}

function clampAssistantPosition(
  position: AssistantPosition,
  width = 164,
  height = 52,
): AssistantPosition {
  if (typeof window === "undefined") return position;
  const margin = 12;
  return {
    x: Math.min(
      Math.max(position.x, margin),
      window.innerWidth - width - margin,
    ),
    y: Math.min(
      Math.max(position.y, margin),
      window.innerHeight - height - margin,
    ),
  };
}

export function FloatingAiAssistant() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantPosition, setAssistantPosition] =
    useState<AssistantPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{
    offsetX: number;
    offsetY: number;
    moved: boolean;
    startX: number;
    startY: number;
    lastPosition?: AssistantPosition;
  } | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();

    const syncUser = (next: User | null) => {
      setUser(next);
      if (!next) {
        setOpen(false);
        setMessages([INITIAL_ASSISTANT_MESSAGE]);
        setInput("");
        setError(null);
      }
    };

    void supabase.auth.getUser().then(({ data }) => {
      syncUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      const savedMessages = window.localStorage.getItem(
        ASSISTANT_MESSAGES_STORAGE_KEY,
      );
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .filter((message) => {
              if (
                !message ||
                (message.role !== "user" && message.role !== "assistant")
              ) {
                return false;
              }
              return (
                typeof message.content === "string" &&
                message.content.trim().length > 0
              );
            })
            .slice(-20);
          if (normalized.length > 0) {
            setMessages(normalized);
          }
        }
      }
    } catch {
      // Ignore malformed local cache
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        ASSISTANT_MESSAGES_STORAGE_KEY,
        JSON.stringify(messages.slice(-20)),
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [messages]);

  useEffect(() => {
    const getButtonSize = () => ({
      width: buttonRef.current?.offsetWidth ?? 164,
      height: buttonRef.current?.offsetHeight ?? 52,
    });

    try {
      const raw = window.localStorage.getItem(ASSISTANT_POSITION_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as AssistantPosition) : null;
      const initial =
        parsed && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)
          ? parsed
          : getDefaultAssistantPosition();
      const { width, height } = getButtonSize();
      setAssistantPosition(clampAssistantPosition(initial, width, height));
    } catch {
      setAssistantPosition(getDefaultAssistantPosition());
    }

    const onResize = () => {
      const { width, height } = getButtonSize();
      setAssistantPosition((prev) =>
        clampAssistantPosition(
          prev ?? getDefaultAssistantPosition(),
          width,
          height,
        ),
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const canSend = input.trim().length > 0 && !loading;

  if (pathname === "/" || user === undefined || user === null) {
    return null;
  }

  const renderedAssistantPosition =
    assistantPosition ?? getDefaultAssistantPosition();

  const persistAssistantPosition = (position: AssistantPosition) => {
    try {
      window.localStorage.setItem(
        ASSISTANT_POSITION_STORAGE_KEY,
        JSON.stringify(position),
      );
    } catch {
      // Ignore localStorage errors
    }
  };

  const onAssistantPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const position = assistantPosition ?? getDefaultAssistantPosition();
    dragRef.current = {
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onAssistantPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (
      Math.abs(e.clientX - drag.startX) > 4 ||
      Math.abs(e.clientY - drag.startY) > 4
    ) {
      drag.moved = true;
    }
    const next = clampAssistantPosition(
      {
        x: e.clientX - drag.offsetX,
        y: e.clientY - drag.offsetY,
      },
      buttonRef.current?.offsetWidth,
      buttonRef.current?.offsetHeight,
    );
    drag.lastPosition = next;
    setAssistantPosition(next);
  };

  const onAssistantPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Pointer may already be released
    }
    const next = clampAssistantPosition(
      drag.lastPosition ?? assistantPosition ?? getDefaultAssistantPosition(),
      buttonRef.current?.offsetWidth,
      buttonRef.current?.offsetHeight,
    );
    setAssistantPosition(next);
    persistAssistantPosition(next);
    if (!drag.moved) setOpen((prev) => !prev);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const nextUserMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, nextUserMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const body = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !body.reply) {
        throw new Error(body.error ?? "Failed to get AI response.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: body.reply ?? "" },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get AI response.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-pressed={open}
        onPointerDown={onAssistantPointerDown}
        onPointerMove={onAssistantPointerMove}
        onPointerUp={onAssistantPointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
          setDragging(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        style={{
          left: renderedAssistantPosition.x,
          top: renderedAssistantPosition.y,
        }}
        className={`fixed z-[80] inline-flex touch-none select-none items-center gap-2 rounded-full border border-primary/25 bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgba(54,95,125,0.22)] transition hover:bg-primary/90 dark:border-cyan-300/40 dark:bg-slate-900 dark:text-cyan-100 dark:shadow-[0_0_24px_rgba(34,211,238,0.28)] dark:hover:bg-slate-800 sm:px-4 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
        AI Assistant
      </button>

      {open ? (
        <section className="fixed bottom-24 right-5 z-[80] flex h-[540px] w-[min(95vw,380px)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl dark:border-white/15 dark:bg-slate-950 dark:text-slate-100">
          <header className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary dark:text-cyan-300" />
              <div>
                <p className="text-sm font-semibold">Trend Assistant</p>
                <p className="text-[11px] text-muted-foreground dark:text-slate-400">
                  Model: GPT-4
                </p>
              </div>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-xl bg-primary/10 px-3 py-2 text-sm dark:bg-cyan-500/20"
                    : "mr-8 rounded-xl bg-muted px-3 py-2 text-sm dark:bg-slate-800"
                }
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="mr-8 inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground dark:bg-slate-800 dark:text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="border-t border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <div className="border-t border-border px-3 py-2 dark:border-white/10">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => void onSubmit(e)}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about niches, trends, ideas..."
                className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
