import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getApiBaseUrl } from "@/lib/api";
import { createGmailTransporter } from "@/lib/gmail-transporter";
import { NICHE_OPTIONS } from "@/lib/niches";
import type { TrendDigestTopicsResponse } from "@/lib/trend-ideas-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const gmailUser = process.env.GMAIL_USER;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nicheDisplayName(niche: string): string {
  const found = NICHE_OPTIONS.find((o) => o.value === niche);
  return found?.label ?? niche;
}

function getSiteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://contentideamaker.com";
  return raw.replace(/\/$/, "");
}

async function fetchDigestTopics(niche: string): Promise<string[]> {
  const base = getApiBaseUrl();
  const digestKey = process.env.TREND_DIGEST_KEY?.trim();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (digestKey) headers["X-Trend-Digest-Key"] = digestKey;
  const res = await fetch(`${base}/trend-ideas/digest-topics`, {
    method: "POST",
    headers,
    body: JSON.stringify({ niche }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`digest-topics failed (${res.status}): ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as TrendDigestTopicsResponse;
  return data.topics ?? [];
}

function buildDigestEmailHtml(payload: {
  sections: { niche: string; topics: string[]; error?: string }[];
  siteUrl: string;
}): string {
  const { sections, siteUrl } = payload;
  const blocks = sections.map((s) => {
    const title = escapeHtml(nicheDisplayName(s.niche));
    if (s.error) {
      return `<h2 style="font-size:18px;margin:24px 0 8px;">${title}</h2><p style="color:#666;">${escapeHtml(s.error)}</p>`;
    }
    const list = s.topics
      .map((t) => `<li style="margin:6px 0;">${escapeHtml(t)}</li>`)
      .join("");
    return `<h2 style="font-size:18px;margin:24px 0 8px;">${title}</h2><ul style="padding-left:20px;margin:0;">${list}</ul>`;
  });
  return `
    <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;line-height:1.5;color:#111;">
      <h1 style="font-size:22px;margin:0 0 12px;">Your weekly trend digest</h1>
      <p style="color:#444;margin:0 0 20px;">Top topics across the niches you follow. Open the dashboard to generate full video ideas.</p>
      ${blocks.join("")}
      <p style="margin-top:28px;">
        <a href="${escapeHtml(siteUrl + "/dashboard")}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">Open Trend Engine</a>
      </p>
      <p style="font-size:12px;color:#888;margin-top:32px;">You receive this because you subscribed on Trend Alerts. <a href="${escapeHtml(siteUrl + "/alerts")}" style="color:#2563eb;">Manage niches</a>.</p>
    </div>
  `.trim();
}

function buildDigestEmailText(payload: {
  sections: { niche: string; topics: string[]; error?: string }[];
  siteUrl: string;
}): string {
  const lines: string[] = ["Your weekly trend digest", ""];
  for (const s of payload.sections) {
    lines.push(nicheDisplayName(s.niche));
    if (s.error) {
      lines.push(s.error);
    } else {
      for (const t of s.topics) lines.push(`  • ${t}`);
    }
    lines.push("");
  }
  lines.push(`Open dashboard: ${payload.siteUrl}/dashboard`);
  lines.push(`Manage niches: ${payload.siteUrl}/alerts`);
  return lines.join("\n");
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Missing Supabase service role configuration" },
      { status: 500 },
    );
  }

  if (!gmailUser) {
    return NextResponse.json(
      { error: "Missing GMAIL_USER for outbound mail" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: rows, error: subError } = await admin
    .from("trend_alert_subscriptions")
    .select("user_id, niche");

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ ok: true, message: "No subscriptions", sent: 0 });
  }

  const byUser = new Map<string, string[]>();
  for (const row of rows as { user_id: string; niche: string }[]) {
    const uid = row.user_id;
    const niche = (row.niche ?? "").trim();
    if (!niche) continue;
    const list = byUser.get(uid) ?? [];
    if (!list.includes(niche)) list.push(niche);
    byUser.set(uid, list);
  }

  const siteUrl = getSiteBaseUrl();
  const transporter = createGmailTransporter();

  let sent = 0;
  const errors: string[] = [];

  for (const [userId, niches] of byUser) {
    let email: string | undefined;
    try {
      const { data: userResult, error: userErr } = await admin.auth.admin.getUserById(userId);
      if (userErr || !userResult.user?.email) {
        errors.push(`user ${userId}: no email (${userErr?.message ?? "missing"})`);
        continue;
      }
      email = userResult.user.email;
    } catch (e) {
      errors.push(`user ${userId}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const sections: { niche: string; topics: string[]; error?: string }[] = [];
    for (const niche of niches) {
      try {
        const topics = await fetchDigestTopics(niche);
        sections.push({ niche, topics });
      } catch (e) {
        sections.push({
          niche,
          topics: [],
          error: e instanceof Error ? e.message : "Could not load trends this week.",
        });
      }
    }

    try {
      await transporter.sendMail({
        from: gmailUser,
        to: email,
        subject: "Your weekly trend digest — Trend Engine",
        text: buildDigestEmailText({ sections, siteUrl }),
        html: buildDigestEmailHtml({ sections, siteUrl }),
      });
      sent += 1;
    } catch (e) {
      errors.push(`send to ${email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: true,
    recipientCount: byUser.size,
    emailsSent: sent,
    errors,
  });
}
