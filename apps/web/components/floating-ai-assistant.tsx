"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";

type AssistantModel = "claude" | "gpt4";

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

const ASSISTANT_MODEL_STORAGE_KEY = "trend_engine:assistant_model";
const ASSISTANT_MESSAGES_STORAGE_KEY = "trend_engine:assistant_messages";

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help with niche discovery, trend explanations, content brainstorming, and navigating Trend Engine.",
};

export function FloatingAiAssistant() {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState<AssistantModel>("claude");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedModel = window.localStorage.getItem(ASSISTANT_MODEL_STORAGE_KEY);
      if (savedModel === "claude" || savedModel === "gpt4") {
        setModel(savedModel);
      }
      const savedMessages = window.localStorage.getItem(ASSISTANT_MESSAGES_STORAGE_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .filter((message) => {
              if (!message || (message.role !== "user" && message.role !== "assistant")) {
                return false;
              }
              return typeof message.content === "string" && message.content.trim().length > 0;
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
      window.localStorage.setItem(ASSISTANT_MODEL_STORAGE_KEY, model);
    } catch {
      // Ignore localStorage errors
    }
  }, [model]);

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

  const canSend = input.trim().length > 0 && !loading;
  const buttonLabel = useMemo(
    () => (model === "claude" ? "Claude (Primary)" : "GPT-4"),
    [model],
  );

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
          model,
          messages: nextMessages,
        }),
      });

      const body = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !body.reply) {
        throw new Error(body.error ?? "Failed to get AI response.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: body.reply ?? "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI response.");
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
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-slate-900 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.28)] transition hover:bg-slate-800"
      >
        {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
        AI Assistant
      </button>

      {open ? (
        <section className="fixed bottom-24 right-5 z-[80] flex h-[540px] w-[min(95vw,380px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 text-slate-100 shadow-2xl">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-cyan-300" />
              <div>
                <p className="text-sm font-semibold">Trend Assistant</p>
                <p className="text-[11px] text-slate-400">Model: {buttonLabel}</p>
              </div>
            </div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as AssistantModel)}
              className="rounded-md border border-white/15 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              <option value="claude">Claude (Primary)</option>
              <option value="gpt4">GPT-4</option>
            </select>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-xl bg-cyan-500/20 px-3 py-2 text-sm"
                    : "mr-8 rounded-xl bg-slate-800 px-3 py-2 text-sm"
                }
              >
                {message.content}
              </div>
            ))}
            {loading ? (
              <div className="mr-8 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="border-t border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>
          ) : null}

          <div className="border-t border-white/10 px-3 py-2">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-white/10 disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => void onSubmit(e)} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about niches, trends, ideas..."
                className="h-10 flex-1 rounded-xl border border-white/15 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="inline-flex size-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 disabled:opacity-60"
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
