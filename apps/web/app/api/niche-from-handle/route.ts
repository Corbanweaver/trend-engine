import { NextResponse } from "next/server";

import { getBackendHeaders, getBackendUrl } from "@/lib/server-api";
import { buildCreatorManagerPlan } from "@/lib/creator-manager";
import { recordOperationalEvent } from "@/lib/server-events";
import {
  checkRateLimits,
  rateLimitResponse,
  type RateLimitRule,
} from "@/lib/server-rate-limit";

import { loadUsage } from "../trend-ideas/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RequestBody = {
  handle?: unknown;
};

type PublicSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

type SearchPayload = {
  results?: PublicSearchResult[];
};

type ParsedProfile = {
  input: string;
  username: string;
  platform: string | null;
  displayHandle: string;
};

type NicheCandidate = {
  niche: string;
  label: string;
  keywords: string[];
};

const NICHE_CANDIDATES: NicheCandidate[] = [
  {
    niche: "fitness",
    label: "Fitness",
    keywords: [
      "fitness",
      "gym",
      "workout",
      "training",
      "strength",
      "muscle",
      "fat loss",
      "weight loss",
      "macro",
      "nutrition",
      "bodybuilding",
      "pilates",
      "yoga",
    ],
  },
  {
    niche: "beauty & makeup",
    label: "Beauty & Makeup",
    keywords: [
      "beauty",
      "makeup",
      "skincare",
      "skin care",
      "hair",
      "nails",
      "lashes",
      "cosmetic",
      "glow",
      "routine",
    ],
  },
  {
    niche: "food & cooking",
    label: "Food & Cooking",
    keywords: [
      "food",
      "cooking",
      "recipe",
      "meal prep",
      "chef",
      "baking",
      "kitchen",
      "restaurant",
      "protein",
      "dinner",
    ],
  },
  {
    niche: "fashion",
    label: "Fashion",
    keywords: [
      "fashion",
      "style",
      "outfit",
      "wardrobe",
      "clothes",
      "thrift",
      "streetwear",
      "apparel",
      "wear",
    ],
  },
  {
    niche: "business & entrepreneurship",
    label: "Business & Entrepreneurship",
    keywords: [
      "business",
      "entrepreneur",
      "startup",
      "founder",
      "sales",
      "marketing",
      "agency",
      "side hustle",
      "ecommerce",
      "shopify",
      "saas",
    ],
  },
  {
    niche: "finance & investing",
    label: "Finance & Investing",
    keywords: [
      "finance",
      "investing",
      "money",
      "budget",
      "stocks",
      "retirement",
      "credit",
      "wealth",
      "dividend",
    ],
  },
  {
    niche: "real estate",
    label: "Real Estate",
    keywords: [
      "real estate",
      "realtor",
      "homes",
      "mortgage",
      "listing",
      "property",
      "housing",
      "airbnb",
      "investor",
    ],
  },
  {
    niche: "tech & ai",
    label: "Tech & AI",
    keywords: [
      "tech",
      "ai",
      "artificial intelligence",
      "software",
      "coding",
      "developer",
      "automation",
      "apps",
      "gadgets",
      "chatgpt",
    ],
  },
  {
    niche: "travel",
    label: "Travel",
    keywords: [
      "travel",
      "trip",
      "hotel",
      "flight",
      "destination",
      "nomad",
      "rv",
      "vanlife",
      "resort",
    ],
  },
  {
    niche: "gaming",
    label: "Gaming",
    keywords: [
      "gaming",
      "gameplay",
      "streamer",
      "twitch",
      "fortnite",
      "minecraft",
      "roblox",
      "esports",
      "console",
    ],
  },
  {
    niche: "sports",
    label: "Sports",
    keywords: [
      "sports",
      "football",
      "basketball",
      "baseball",
      "soccer",
      "golf",
      "athlete",
      "training camp",
    ],
  },
  {
    niche: "music",
    label: "Music",
    keywords: [
      "music",
      "song",
      "artist",
      "producer",
      "guitar",
      "beats",
      "dj",
      "rapper",
      "singer",
    ],
  },
  {
    niche: "comedy",
    label: "Comedy",
    keywords: ["comedy", "comedian", "funny", "skit", "parody", "humor"],
  },
  {
    niche: "diy & crafts",
    label: "DIY & Crafts",
    keywords: [
      "diy",
      "craft",
      "handmade",
      "woodworking",
      "decor",
      "project",
      "tutorial",
    ],
  },
  {
    niche: "parenting",
    label: "Parenting",
    keywords: ["parent", "mom", "dad", "kids", "baby", "family", "toddler"],
  },
  {
    niche: "relationships",
    label: "Relationships",
    keywords: [
      "relationship",
      "dating",
      "marriage",
      "couples",
      "love",
      "breakup",
    ],
  },
  {
    niche: "mental health",
    label: "Mental Health",
    keywords: [
      "mental health",
      "therapy",
      "anxiety",
      "mindset",
      "self care",
      "healing",
      "wellness",
    ],
  },
  {
    niche: "motivation",
    label: "Motivation",
    keywords: [
      "motivation",
      "motivational",
      "discipline",
      "mindset",
      "success",
      "self improvement",
    ],
  },
  {
    niche: "crypto",
    label: "Crypto",
    keywords: [
      "crypto",
      "bitcoin",
      "ethereum",
      "web3",
      "nft",
      "blockchain",
      "defi",
    ],
  },
  {
    niche: "pop culture",
    label: "Pop Culture",
    keywords: [
      "pop culture",
      "celebrity",
      "movie",
      "tv",
      "reaction",
      "drama",
      "entertainment",
    ],
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_\-./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPlatformFromUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  if (host.includes("tiktok")) return "TikTok";
  if (host.includes("instagram")) return "Instagram";
  if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
  if (host.includes("x.com") || host.includes("twitter")) return "X";
  if (host.includes("threads")) return "Threads";
  return null;
}

function getUsernameFromPath(pathname: string) {
  return pathname
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .find((part) => part.startsWith("@"))
    ?.replace(/^@+/, "");
}

function parseProfile(raw: string): ParsedProfile {
  const input = raw.trim().slice(0, 160);
  let username = input.replace(/^@+/, "");
  let platform: string | null = null;

  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    platform = getPlatformFromUrl(url);
    username =
      getUsernameFromPath(url.pathname) ??
      url.pathname
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
        .find((part) => !["channel", "c", "user"].includes(part.toLowerCase())) ??
      username;
  } catch {
    const lowered = input.toLowerCase();
    if (lowered.includes("tiktok")) platform = "TikTok";
    else if (lowered.includes("instagram") || lowered.includes("insta"))
      platform = "Instagram";
    else if (lowered.includes("youtube")) platform = "YouTube";
    else if (lowered.includes("twitter") || lowered.includes("x.com"))
      platform = "X";
  }

  username = username
    .replace(/^@+/, "")
    .replace(/https?:\/\//i, "")
    .split(/[/?#]/)[0]
    .trim()
    .slice(0, 80);

  return {
    input,
    username,
    platform,
    displayHandle: username ? `@${username}` : input,
  };
}

function keywordScore(text: string, keyword: string) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return 0;
  if (text.includes(normalizedKeyword)) {
    return normalizedKeyword.includes(" ") ? 3 : 1;
  }
  return 0;
}

function inferNiche(
  profile: ParsedProfile,
  searchResults: PublicSearchResult[],
) {
  const searchText = searchResults
    .map((result) => `${result.title} ${result.snippet} ${result.url}`)
    .join(" ");
  const text = normalizeText(`${profile.input} ${profile.username} ${searchText}`);

  const ranked = NICHE_CANDIDATES.map((candidate) => {
    const signals = candidate.keywords.filter(
      (keyword) => keywordScore(text, keyword) > 0,
    );
    const score = candidate.keywords.reduce(
      (sum, keyword) => sum + keywordScore(text, keyword),
      0,
    );
    return { ...candidate, score, signals };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score === 0) {
    return {
      niche: "personal brand",
      label: "Personal Brand",
      confidence: "low" as const,
      signals: [],
      reasoning:
        "I could not find a strong niche signal, so this is a broad starting point.",
    };
  }

  const confidence =
    best.score >= 6 && searchResults.length > 0
      ? "high"
      : best.score >= 3
        ? "medium"
        : "low";

  return {
    niche: best.niche,
    label: best.label,
    confidence,
    signals: best.signals.slice(0, 4),
    reasoning:
      searchResults.length > 0
        ? "Matched public search snippets and handle text to the strongest creator niche."
        : "Matched the public handle text to the strongest creator niche.",
  };
}

async function searchPublicProfile(profile: ParsedProfile) {
  const platformPart = profile.platform ?? "TikTok Instagram YouTube X";
  const handlePart = profile.username || profile.input;
  const query = `"${handlePart}" ${platformPart} creator profile bio niche`;
  const response = await fetch(getBackendUrl("/web-search/search"), {
    method: "POST",
    headers: getBackendHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query: query.slice(0, 200), max_results: 8 }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Public profile search failed (${response.status}).`);
  }

  const payload = (await response.json()) as SearchPayload;
  return (payload.results ?? [])
    .filter(
      (result) =>
        typeof result.title === "string" &&
        typeof result.url === "string" &&
        typeof result.snippet === "string",
    )
    .slice(0, 8);
}

export async function POST(request: Request) {
  const usage = await loadUsage();
  if (!usage.ok) {
    return NextResponse.json({ error: usage.error }, { status: usage.status });
  }

  if (!usage.isAdmin && usage.snapshot.plan === "free") {
    return NextResponse.json(
      {
        error: "Handle niche finder is included with Creator and Pro.",
        upgradeUrl: "/pricing",
      },
      { status: 402 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const handle = typeof body.handle === "string" ? body.handle.trim() : "";
  if (!handle) {
    return NextResponse.json(
      { error: "Paste a public handle or profile URL first." },
      { status: 400 },
    );
  }

  if (handle.length > 160) {
    return NextResponse.json(
      { error: "Keep the handle or profile URL under 160 characters." },
      { status: 400 },
    );
  }

  if (!usage.isAdmin) {
    const rules: RateLimitRule[] = [
      {
        key: `user:${usage.user.id}`,
        action: "handle_niche_lookup",
        limit: 20,
        windowSeconds: 15 * 60,
      },
      {
        key: `user:${usage.user.id}`,
        action: "handle_niche_lookup",
        limit: 120,
        windowSeconds: 24 * 60 * 60,
      },
    ];
    const rateLimit = await checkRateLimits(usage.admin, rules);
    if (!rateLimit.ok) return rateLimitResponse(rateLimit);
  }

  const profile = parseProfile(handle);
  let searchResults: PublicSearchResult[] = [];

  try {
    searchResults = await searchPublicProfile(profile);
  } catch (error) {
    await recordOperationalEvent(usage.admin, {
      level: "warn",
      source: "handle_niche_lookup",
      message:
        error instanceof Error ? error.message : "Public profile search failed",
      userId: usage.user.id,
      metadata: {
        handle: profile.displayHandle,
        platform: profile.platform,
      },
    }).catch((eventError) =>
      console.error("Failed to record handle lookup warning:", eventError),
    );
  }

  const suggestion = inferNiche(profile, searchResults);
  const confidence =
    suggestion.confidence === "high" ||
    suggestion.confidence === "medium" ||
    suggestion.confidence === "low"
      ? suggestion.confidence
      : undefined;
  const managerPlan = buildCreatorManagerPlan({
    handle: profile.displayHandle,
    platform: profile.platform,
    niche: suggestion.niche,
    nicheLabel: suggestion.label,
    confidence,
  });

  return NextResponse.json({
    handle: profile.displayHandle,
    platform: profile.platform,
    niche: suggestion.niche,
    nicheLabel: suggestion.label,
    confidence,
    signals: suggestion.signals,
    reasoning: suggestion.reasoning,
    sourceCount: searchResults.length,
    managerPlan,
  });
}
