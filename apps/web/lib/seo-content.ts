export const SEO_BASE_URL = "https://www.contentideamaker.com";

export type SeoFaq = {
  q: string;
  a: string;
};

export type SeoExample = {
  title: string;
  body: string;
};

export type SeoPage = {
  slug: string;
  path: string;
  group: "keyword" | "niche" | "resource";
  metaTitle: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  primaryKeyword: string;
  audience: string;
  outcomes: string[];
  workflow: string[];
  examples: SeoExample[];
  faqs: SeoFaq[];
  related: string[];
  resourceKind?:
    | "hooks"
    | "calendar"
    | "trend-checklist"
    | "comparison"
    | "fitness-ideas";
};

type KeywordEntry = {
  slug: string;
  metaTitle: string;
  title: string;
  description: string;
  keyword: string;
  focus: string;
  audience: string;
  sources: string;
  examples: SeoExample[];
};

const keywordEntries: KeywordEntry[] = [
  {
    slug: "tiktok-content-ideas",
    metaTitle: "TikTok Content Ideas From Live Trends",
    title: "TikTok Content Ideas",
    description:
      "Find TikTok content ideas from live social signals, organic thumbnails, hooks, hashtags, and creator-ready briefs.",
    keyword: "TikTok content ideas",
    focus: "short-form videos that can move while a topic is still fresh",
    audience:
      "TikTok creators, social media managers, coaches, and small brands",
    sources:
      "TikTok, Instagram, Pinterest, YouTube Shorts, X, search, and news",
    examples: [
      {
        title: "Trend reaction",
        body: "Turn a rising topic into a simple reaction video with one honest opinion and one source link.",
      },
      {
        title: "Creator explainer",
        body: "Use the trend as the setup, then explain what viewers should do, avoid, or watch next.",
      },
      {
        title: "Quick list",
        body: "Package the topic as three small lessons, mistakes, or examples that can be filmed fast.",
      },
    ],
  },
  {
    slug: "instagram-content-ideas",
    metaTitle: "Instagram Content Ideas for Reels and Carousels",
    title: "Instagram Content Ideas",
    description:
      "Plan Instagram Reels, captions, carousels, hooks, and hashtags from current creator-platform signals.",
    keyword: "Instagram content ideas",
    focus: "Reels, carousels, captions, and saves-friendly posts",
    audience:
      "Instagram creators, service businesses, influencers, and local brands",
    sources:
      "Instagram/Reels, Pinterest, TikTok, YouTube Shorts, search, and news",
    examples: [
      {
        title: "Save-worthy carousel",
        body: "Convert a trend into a five-slide checklist that teaches one useful thing clearly.",
      },
      {
        title: "Reels hook",
        body: "Open with a relatable line, show one example, and end with a soft save prompt.",
      },
      {
        title: "Caption angle",
        body: "Pair the visual with a short caption that explains why the trend matters this week.",
      },
    ],
  },
  {
    slug: "youtube-shorts-ideas",
    metaTitle: "YouTube Shorts Ideas From Live Trend Signals",
    title: "YouTube Shorts Ideas",
    description:
      "Generate YouTube Shorts ideas, hooks, and brief scripts from trends across social, search, and news.",
    keyword: "YouTube Shorts ideas",
    focus:
      "short videos that need a clear opening, quick payoff, and searchable topic",
    audience: "YouTube creators, educators, niche experts, and small channels",
    sources:
      "YouTube Shorts, TikTok, search demand, news, Instagram, and Pinterest",
    examples: [
      {
        title: "Search-backed explainer",
        body: "Use a rising query as the title and answer it in under a minute.",
      },
      {
        title: "Before and after",
        body: "Show the viewer the problem, the quick fix, and the outcome in three beats.",
      },
      {
        title: "Myth check",
        body: "Use the trend to debunk one common assumption in your niche.",
      },
    ],
  },
  {
    slug: "content-calendar-tool",
    metaTitle: "Content Calendar Tool for Creators",
    title: "Content Calendar Tool",
    description:
      "Organize trend-backed content ideas, source links, hooks, hashtags, and scripts in one creator calendar.",
    keyword: "content calendar tool",
    focus: "turning fresh ideas into a repeatable weekly publishing plan",
    audience:
      "creators, agencies, coaches, founders, and social media managers",
    sources: "saved idea cards, trend scans, hashtags, hooks, and source links",
    examples: [
      {
        title: "Weekly publishing map",
        body: "Save the strongest idea from each scan and assign it to the best day to film.",
      },
      {
        title: "Campaign planning",
        body: "Group related trend cards into a launch week, content series, or product push.",
      },
      {
        title: "Idea archive",
        body: "Keep the source links and creative notes attached so good ideas do not disappear.",
      },
    ],
  },
  {
    slug: "ai-hook-generator",
    metaTitle: "AI Hook Generator for TikTok, Reels, and Shorts",
    title: "AI Hook Generator",
    description:
      "Write short, warmer hooks for TikTok, Instagram Reels, and YouTube Shorts without sounding robotic.",
    keyword: "AI hook generator",
    focus: "short opening lines that feel human and easy to say on camera",
    audience:
      "creators who need faster hooks without fake urgency or clickbait",
    sources: "trend context, niche inputs, saved ideas, and creator examples",
    examples: [
      {
        title: "Curiosity hook",
        body: "Open with the gap between what viewers expect and what is actually happening.",
      },
      {
        title: "Relatable hook",
        body: "Start with a familiar feeling your audience has already experienced.",
      },
      {
        title: "Tiny lesson hook",
        body: "Promise one small, useful takeaway instead of a huge transformation.",
      },
    ],
  },
  {
    slug: "trend-research-tool",
    metaTitle: "Trend Research Tool for Creators",
    title: "Trend Research Tool",
    description:
      "Research creator trends across social platforms, search, and news before choosing what to film next.",
    keyword: "trend research tool",
    focus:
      "finding signals early enough to create while the topic still has momentum",
    audience: "content teams, creators, marketers, and small businesses",
    sources:
      "TikTok, Instagram, X, Pinterest, YouTube, Reddit, search, and news",
    examples: [
      {
        title: "Cross-platform check",
        body: "Compare whether a topic is showing up in video, search, or social conversations.",
      },
      {
        title: "Niche filter",
        body: "Run the same signal through your niche so the idea does not feel random.",
      },
      {
        title: "Source-backed idea",
        body: "Keep links attached so you can verify the trend before filming.",
      },
    ],
  },
  {
    slug: "creator-content-planner",
    metaTitle: "Creator Content Planner With Trend Ideas",
    title: "Creator Content Planner",
    description:
      "Plan creator content from trend research to hooks, scripts, hashtags, saved ideas, and calendar slots.",
    keyword: "creator content planner",
    focus: "keeping research, idea cards, and publishing plans in one workflow",
    audience: "solo creators, creator-led brands, and lean marketing teams",
    sources:
      "trend cards, saved ideas, hooks, scripts, hashtags, and calendar notes",
    examples: [
      {
        title: "Daily idea sprint",
        body: "Scan one niche, save the top idea, and write the first hook before the topic cools.",
      },
      {
        title: "Series planning",
        body: "Turn one trend into a short series for TikTok, Instagram, and YouTube Shorts.",
      },
      {
        title: "Content backlog",
        body: "Build a searchable library of ideas with source links and publish-ready notes.",
      },
    ],
  },
  {
    slug: "pinterest-content-ideas",
    metaTitle: "Pinterest Content Ideas From Live Trend Signals",
    title: "Pinterest Content Ideas",
    description:
      "Find Pinterest content ideas, pins, boards, hooks, and creator briefs from live social and search signals.",
    keyword: "Pinterest content ideas",
    focus: "visual ideas people can save, search, and come back to later",
    audience:
      "Pinterest creators, bloggers, ecommerce brands, coaches, and small businesses",
    sources: "Pinterest, TikTok, Instagram, YouTube Shorts, search, and news",
    examples: [
      {
        title: "Save-first pin",
        body: "Turn one trend into a checklist, template, or before-and-after pin people want to keep.",
      },
      {
        title: "Board angle",
        body: "Group related ideas into a board theme so one trend can become a small content cluster.",
      },
      {
        title: "Search-friendly caption",
        body: "Use the trend phrase in a plain-language title that still sounds natural.",
      },
    ],
  },
  {
    slug: "youtube-shorts-hooks",
    metaTitle: "YouTube Shorts Hooks for Creators",
    title: "YouTube Shorts Hooks",
    description:
      "Write short YouTube Shorts hooks that feel human, searchable, and easy to say on camera.",
    keyword: "YouTube Shorts hooks",
    focus:
      "opening lines that quickly answer why a viewer should keep watching",
    audience: "YouTube creators, educators, coaches, and niche experts",
    sources: "YouTube Shorts, search, TikTok, Instagram, Pinterest, and news",
    examples: [
      {
        title: "Question hook",
        body: "Start with the exact question your viewer would type into search.",
      },
      {
        title: "Mistake hook",
        body: "Name one common mistake, then show the better way in the next beat.",
      },
      {
        title: "Tiny proof hook",
        body: "Open with one result, example, or visual that makes the answer feel real.",
      },
    ],
  },
  {
    slug: "instagram-reels-hook-ideas",
    metaTitle: "Instagram Reels Hook Ideas",
    title: "Instagram Reels Hook Ideas",
    description:
      "Generate Instagram Reels hook ideas that feel warm, specific, and useful for creators and brands.",
    keyword: "Instagram Reels hook ideas",
    focus:
      "opening lines that make a Reel feel worth saving, sharing, or watching again",
    audience:
      "Instagram creators, service providers, local brands, and social media managers",
    sources:
      "Instagram Reels, TikTok, Pinterest, YouTube Shorts, search, and news",
    examples: [
      {
        title: "Relatable setup",
        body: "Start with a feeling your audience already has, then give one small answer.",
      },
      {
        title: "Save prompt angle",
        body: "Promise a checklist, shortcut, or example people can keep for later.",
      },
      {
        title: "Soft opinion",
        body: "Use a grounded take instead of fake urgency so the hook feels more trustworthy.",
      },
    ],
  },
  {
    slug: "social-media-content-calendar-template",
    metaTitle: "Social Media Content Calendar Template",
    title: "Social Media Content Calendar Template",
    description:
      "Plan a social media content calendar with trend-backed ideas, platform notes, hooks, and source links.",
    keyword: "social media content calendar template",
    focus:
      "organizing a week or month of posts without losing the trend context",
    audience:
      "creators, small businesses, social media managers, agencies, and coaches",
    sources:
      "saved trend cards, platform links, hashtags, scripts, and calendar notes",
    examples: [
      {
        title: "Weekly rhythm",
        body: "Balance teaching, trend reactions, proof, and story posts across the week.",
      },
      {
        title: "Platform notes",
        body: "Keep TikTok, Reels, Shorts, and Pinterest versions attached to the same idea.",
      },
      {
        title: "Source-backed plan",
        body: "Save the links that inspired each post so your team can check context later.",
      },
    ],
  },
  {
    slug: "30-content-ideas-for-real-estate-agents",
    metaTitle: "30 Content Ideas for Real Estate Agents",
    title: "30 Content Ideas for Real Estate Agents",
    description:
      "Find real estate content ideas for agents, local experts, investors, and mortgage creators.",
    keyword: "30 content ideas for real estate agents",
    focus:
      "local, trust-building content that answers buyer and seller questions",
    audience:
      "real estate agents, mortgage creators, local experts, and property investors",
    sources:
      "local trends, TikTok, Instagram, Pinterest, YouTube Shorts, search, and news",
    examples: [
      {
        title: "Local market answer",
        body: "Explain one buyer or seller question using a current neighborhood example.",
      },
      {
        title: "Listing lesson",
        body: "Show one mistake in pricing, staging, photos, or offers and how to avoid it.",
      },
      {
        title: "Neighborhood story",
        body: "Connect a local trend to restaurants, schools, commute, lifestyle, or price range.",
      },
    ],
  },
  {
    slug: "30-content-ideas-for-beauty-creators",
    metaTitle: "30 Content Ideas for Beauty Creators",
    title: "30 Content Ideas for Beauty Creators",
    description:
      "Find beauty content ideas for makeup, skincare, salon, hair, and product review creators.",
    keyword: "30 content ideas for beauty creators",
    focus:
      "beauty videos that teach, compare, review, or simplify a current trend",
    audience:
      "beauty creators, salons, makeup artists, skincare brands, and reviewers",
    sources:
      "Instagram, TikTok, Pinterest, YouTube Shorts, search, and product news",
    examples: [
      {
        title: "Routine edit",
        body: "Show what you would keep, skip, or change in a trending routine.",
      },
      {
        title: "Product reality check",
        body: "Test one claim and explain who the product is actually for.",
      },
      {
        title: "Beginner version",
        body: "Make a complicated look or routine easier for your audience to copy.",
      },
    ],
  },
  {
    slug: "30-content-ideas-for-coaches",
    metaTitle: "30 Content Ideas for Coaches",
    title: "30 Content Ideas for Coaches",
    description:
      "Find content ideas for business coaches, consultants, life coaches, and expert-led creators.",
    keyword: "30 content ideas for coaches",
    focus:
      "short content that teaches one useful lesson without sounding stiff or salesy",
    audience:
      "coaches, consultants, course creators, and expert-led service businesses",
    sources:
      "TikTok, Instagram, LinkedIn-style topics, Pinterest, search, and news",
    examples: [
      {
        title: "Client question",
        body: "Answer one question you hear often in a short, practical way.",
      },
      {
        title: "Tiny framework",
        body: "Give viewers a simple three-step way to think through one problem.",
      },
      {
        title: "Myth correction",
        body: "Use a popular belief as the setup, then give the more grounded version.",
      },
    ],
  },
];

function uniqueRelated(paths: string[], selfPath: string) {
  return Array.from(new Set(paths))
    .filter((path) => path !== selfPath)
    .slice(0, 4);
}

function keywordRelatedPaths(entry: KeywordEntry) {
  const selfPath = `/${entry.slug}`;
  const keyword = entry.keyword.toLowerCase();
  const specific: string[] = [];

  if (keyword.includes("tiktok")) {
    specific.push(
      "/free-tiktok-hook-ideas",
      "/tiktok-vs-instagram-reels-content-ideas",
    );
  }
  if (keyword.includes("instagram") || keyword.includes("reels")) {
    specific.push("/instagram-content-ideas", "/instagram-reels-hook-ideas");
  }
  if (keyword.includes("youtube") || keyword.includes("shorts")) {
    specific.push("/youtube-shorts-ideas", "/youtube-shorts-hooks");
  }
  if (keyword.includes("pinterest")) {
    specific.push("/pinterest-content-ideas", "/niches/food-content-ideas");
  }
  if (keyword.includes("calendar")) {
    specific.push("/free-content-calendar-template", "/content-calendar-tool");
  }
  if (keyword.includes("hook")) {
    specific.push("/free-tiktok-hook-ideas", "/ai-hook-generator");
  }
  if (keyword.includes("real estate")) {
    specific.push(
      "/niches/real-estate-content-ideas",
      "/content-calendar-tool",
    );
  }
  if (keyword.includes("beauty")) {
    specific.push("/niches/beauty-content-ideas", "/instagram-content-ideas");
  }
  if (keyword.includes("coach")) {
    specific.push("/niches/coaching-content-ideas", "/creator-content-planner");
  }

  return uniqueRelated(
    [
      ...specific,
      "/trend-research-tool",
      "/creator-content-planner",
      "/free-content-calendar-template",
    ],
    selfPath,
  );
}

function makeKeywordPage(entry: KeywordEntry): SeoPage {
  return {
    slug: entry.slug,
    path: `/${entry.slug}`,
    group: "keyword",
    metaTitle: entry.metaTitle,
    title: entry.title,
    description: entry.description,
    eyebrow: "Creator SEO resource",
    h1: `${entry.title} From Live Trend Signals`,
    intro: `TrendBoard helps ${entry.audience} find ${entry.keyword.toLowerCase()} using ${entry.sources}. The goal is simple: turn live momentum into ${entry.focus}.`,
    primaryKeyword: entry.keyword,
    audience: entry.audience,
    outcomes: [
      `Find ${entry.keyword.toLowerCase()} without staring at a blank page.`,
      "Use source-backed trend context before you commit to an angle.",
      "Move from research to hooks, scripts, hashtags, and saved ideas faster.",
    ],
    workflow: [
      "Type a niche or choose a preset niche.",
      `Scan ${entry.sources} for live creator signals.`,
      "Open the best trend card, then generate hooks or a full script only when needed.",
      "Save the idea with links, hashtags, and calendar context attached.",
    ],
    examples: entry.examples,
    faqs: [
      {
        q: `Can TrendBoard help with ${entry.keyword.toLowerCase()} for any niche?`,
        a: "Yes. You can type a custom niche or choose a preset, then use the trend cards to shape ideas around your audience.",
      },
      {
        q: "Does the app only write AI content?",
        a: "No. The useful part is the live signal research plus short idea cards. Hooks and full scripts are optional when you want help expanding an idea.",
      },
      {
        q: "Do saved ideas keep the original context?",
        a: "Yes. Saved ideas are built to keep source links, hashtags, hooks, scripts, and notes together.",
      },
    ],
    related: keywordRelatedPaths(entry),
  };
}

type NicheEntry = {
  slug: string;
  niche: string;
  audience: string;
  moments: string[];
  examples: SeoExample[];
};

const nicheEntries: NicheEntry[] = [
  {
    slug: "fitness-content-ideas",
    niche: "fitness",
    audience: "trainers, gym creators, wellness coaches, and fitness brands",
    moments: [
      "workout trends",
      "nutrition conversations",
      "challenge formats",
      "before-and-after stories",
    ],
    examples: [
      {
        title: "Workout myth",
        body: "Pick one trending claim and explain the safer, more practical version in plain language.",
      },
      {
        title: "Beginner routine",
        body: "Turn a popular fitness topic into a simple three-move routine viewers can save.",
      },
      {
        title: "Coach reaction",
        body: "React to a trend with one helpful correction and one example from your own approach.",
      },
    ],
  },
  {
    slug: "real-estate-content-ideas",
    niche: "real estate",
    audience: "agents, local experts, investors, and mortgage creators",
    moments: [
      "local market shifts",
      "buyer questions",
      "rate conversations",
      "neighborhood stories",
    ],
    examples: [
      {
        title: "Local market explainer",
        body: "Use one current data point to explain what buyers or sellers should watch this week.",
      },
      {
        title: "Listing lesson",
        body: "Turn a common listing mistake into a quick video with one clear fix.",
      },
      {
        title: "Neighborhood angle",
        body: "Connect a trending local story to a place, price range, or lifestyle question.",
      },
    ],
  },
  {
    slug: "food-content-ideas",
    niche: "food",
    audience:
      "food creators, recipe accounts, restaurants, and home cooking brands",
    moments: [
      "recipe trends",
      "restaurant moments",
      "ingredient swaps",
      "meal prep formats",
    ],
    examples: [
      {
        title: "Shortcut recipe",
        body: "Film a faster version of a trending dish with one honest note about taste or texture.",
      },
      {
        title: "Ingredient test",
        body: "Compare two versions of the same recipe so viewers can see the difference quickly.",
      },
      {
        title: "Local food find",
        body: "Use a trending flavor or dish to highlight a local restaurant or grocery item.",
      },
    ],
  },
  {
    slug: "beauty-content-ideas",
    niche: "beauty",
    audience:
      "beauty creators, makeup artists, salons, skincare brands, and product reviewers",
    moments: [
      "makeup trends",
      "skincare questions",
      "product launches",
      "routine formats",
    ],
    examples: [
      {
        title: "Routine edit",
        body: "Show the one step you would keep, skip, or change from a trending routine.",
      },
      {
        title: "Product reality check",
        body: "Test the claim, show the result, and explain who the product is actually for.",
      },
      {
        title: "Beginner-friendly version",
        body: "Translate a complicated look into a simple version your audience can copy.",
      },
    ],
  },
  {
    slug: "coaching-content-ideas",
    niche: "coaching",
    audience:
      "business coaches, life coaches, consultants, and expert-led creators",
    moments: [
      "mindset conversations",
      "business lessons",
      "client questions",
      "frameworks people can save",
    ],
    examples: [
      {
        title: "Client question",
        body: "Turn a real question into a short answer that teaches without sounding salesy.",
      },
      {
        title: "Tiny framework",
        body: "Give viewers a three-step way to think through one common problem.",
      },
      {
        title: "Myth correction",
        body: "Use a trend as the setup, then explain the more grounded truth behind it.",
      },
    ],
  },
  {
    slug: "tech-ai-content-ideas",
    niche: "tech and AI",
    audience:
      "AI tool reviewers, SaaS founders, educators, developers, and tech creators",
    moments: [
      "new tool launches",
      "AI workflow debates",
      "creator experiments",
      "software updates",
    ],
    examples: [
      {
        title: "Tool test",
        body: "Try one new tool on a real task and show what worked, what broke, and who should use it.",
      },
      {
        title: "Plain-English update",
        body: "Explain one technical change in a way a busy creator or founder can actually use.",
      },
      {
        title: "Workflow teardown",
        body: "Take a trending AI workflow and simplify it into three practical steps.",
      },
    ],
  },
  {
    slug: "finance-content-ideas",
    niche: "finance",
    audience:
      "financial educators, budgeting creators, advisors, and personal finance brands",
    moments: [
      "rate changes",
      "budgeting trends",
      "market questions",
      "money habits",
    ],
    examples: [
      {
        title: "Money myth",
        body: "Correct one common finance claim with a simple example and a clear caveat.",
      },
      {
        title: "Budget scenario",
        body: "Show how one choice changes a realistic monthly budget.",
      },
      {
        title: "Question answer",
        body: "Answer a question people are asking right now without making promises or hype.",
      },
    ],
  },
  {
    slug: "travel-content-ideas",
    niche: "travel",
    audience:
      "travel creators, local guides, hotels, tourism brands, and lifestyle creators",
    moments: [
      "destination trends",
      "packing questions",
      "seasonal trips",
      "local recommendations",
    ],
    examples: [
      {
        title: "Local shortcut",
        body: "Share one practical tip visitors would only learn after being there.",
      },
      {
        title: "Itinerary swap",
        body: "Compare the tourist version of a trip with a more realistic or local version.",
      },
      {
        title: "Packing lesson",
        body: "Use a trending destination to explain what to bring, skip, or plan ahead.",
      },
    ],
  },
  {
    slug: "fashion-content-ideas",
    niche: "fashion",
    audience:
      "fashion creators, stylists, boutiques, thrift creators, and clothing brands",
    moments: [
      "outfit trends",
      "seasonal styling",
      "celebrity looks",
      "shopping questions",
    ],
    examples: [
      {
        title: "Style three ways",
        body: "Turn one trending piece into casual, work, and night-out versions.",
      },
      {
        title: "Trend reality check",
        body: "Explain who a trend works for, how to wear it, and what to skip.",
      },
      {
        title: "Closet remix",
        body: "Recreate a popular look with pieces viewers may already own.",
      },
    ],
  },
  {
    slug: "gaming-content-ideas",
    niche: "gaming",
    audience:
      "gaming creators, streamers, esports commentators, and game communities",
    moments: [
      "new patches",
      "challenge formats",
      "streamer moments",
      "community debates",
    ],
    examples: [
      {
        title: "Patch takeaway",
        body: "Explain one update in terms of how it changes regular gameplay.",
      },
      {
        title: "Challenge format",
        body: "Turn a trend into a short challenge with a clear rule and quick payoff.",
      },
      {
        title: "Community opinion",
        body: "Give a grounded take on a debate and invite viewers to compare experiences.",
      },
    ],
  },
];

function nicheRelatedPaths(entry: NicheEntry) {
  const selfPath = `/niches/${entry.slug}`;
  const relatedBySlug: Record<string, string[]> = {
    "fitness-content-ideas": [
      "/30-content-ideas-for-fitness-creators",
      "/free-tiktok-hook-ideas",
    ],
    "real-estate-content-ideas": [
      "/30-content-ideas-for-real-estate-agents",
      "/content-calendar-tool",
    ],
    "food-content-ideas": [
      "/pinterest-content-ideas",
      "/content-calendar-tool",
    ],
    "beauty-content-ideas": [
      "/30-content-ideas-for-beauty-creators",
      "/instagram-content-ideas",
    ],
    "coaching-content-ideas": [
      "/30-content-ideas-for-coaches",
      "/creator-content-planner",
    ],
    "tech-ai-content-ideas": ["/trend-research-tool", "/youtube-shorts-ideas"],
    "finance-content-ideas": ["/trend-research-tool", "/youtube-shorts-hooks"],
    "travel-content-ideas": [
      "/pinterest-content-ideas",
      "/instagram-content-ideas",
    ],
    "fashion-content-ideas": [
      "/instagram-reels-hook-ideas",
      "/pinterest-content-ideas",
    ],
    "gaming-content-ideas": ["/youtube-shorts-ideas", "/tiktok-content-ideas"],
  };

  return uniqueRelated(
    [
      ...(relatedBySlug[entry.slug] ?? []),
      "/tiktok-content-ideas",
      "/instagram-content-ideas",
      "/content-calendar-tool",
    ],
    selfPath,
  );
}

function makeNichePage(entry: NicheEntry): SeoPage {
  const moments = entry.moments.join(", ");
  return {
    slug: entry.slug,
    path: `/niches/${entry.slug}`,
    group: "niche",
    metaTitle: `${entry.niche.replace(/\b\w/g, (c) => c.toUpperCase())} Content Ideas From Live Trends`,
    title: `${entry.niche.replace(/\b\w/g, (c) => c.toUpperCase())} Content Ideas`,
    description: `Find ${entry.niche} content ideas from live trend signals, source links, hooks, hashtags, and calendar-ready idea cards.`,
    eyebrow: "Niche idea guide",
    h1: `${entry.niche.replace(/\b\w/g, (c) => c.toUpperCase())} Content Ideas That Start With Real Signals`,
    intro: `TrendBoard helps ${entry.audience} turn ${moments} into content ideas that feel current, specific, and easier to film.`,
    primaryKeyword: `${entry.niche} content ideas`,
    audience: entry.audience,
    outcomes: [
      `Find current ${entry.niche} topics before you build a full content plan.`,
      "Use real source links and organic thumbnails for context.",
      "Save the best angle with hooks, hashtags, and calendar notes attached.",
    ],
    workflow: [
      `Search "${entry.niche}" or type a narrower sub-niche in the dashboard.`,
      "Review the trend cards and source platforms before choosing an angle.",
      "Generate hooks or a full script only for the ideas worth filming.",
      "Move the strongest idea into saved ideas or the content calendar.",
    ],
    examples: entry.examples,
    faqs: [
      {
        q: `What makes a good ${entry.niche} content idea?`,
        a: "A good idea connects a timely topic to a specific viewer problem, question, or curiosity. It should be easy to film and clear enough to explain fast.",
      },
      {
        q: `Can I search a more specific ${entry.niche} niche?`,
        a: "Yes. The dashboard now lets you type any niche, so you can search broad categories or narrow angles.",
      },
      {
        q: "Can I use these ideas on multiple platforms?",
        a: "Yes. Most ideas can be adapted for TikTok, Instagram Reels, YouTube Shorts, Pinterest, and other social platforms.",
      },
    ],
    related: nicheRelatedPaths(entry),
  };
}

export const keywordLandingPages = keywordEntries.map(makeKeywordPage);
export const nicheLandingPages = nicheEntries.map(makeNichePage);

export const resourcePages: SeoPage[] = [
  {
    slug: "free-tiktok-hook-ideas",
    path: "/free-tiktok-hook-ideas",
    group: "resource",
    metaTitle: "Free TikTok Hook Ideas",
    title: "Free TikTok Hook Ideas",
    description:
      "Use free TikTok hook templates to turn a topic into warmer short-form opening lines.",
    eyebrow: "Free creator tool",
    h1: "Free TikTok Hook Ideas You Can Adapt Today",
    intro:
      "Use this page to draft simple hooks before you run a full trend analysis. The best hooks sound like a real person, not a billboard.",
    primaryKeyword: "free TikTok hook ideas",
    audience:
      "TikTok creators, Reels creators, Shorts creators, and small brands",
    outcomes: [
      "Draft short hooks without spending credits.",
      "Avoid overused clickbait phrases.",
      "Bring your best hook into TrendBoard when you are ready to research the trend.",
    ],
    workflow: [
      "Type a topic into the free hook box.",
      "Pick the line that sounds easiest to say on camera.",
      "Use TrendBoard to check whether the topic has live momentum.",
    ],
    examples: [
      { title: "Confession hook", body: "I used to get this wrong too." },
      { title: "Tiny lesson hook", body: "Here is the part most people skip." },
      { title: "Pattern hook", body: "This keeps showing up for a reason." },
    ],
    faqs: [
      {
        q: "Are these hooks generated with paid credits?",
        a: "No. This public page uses simple templates. The paid app can generate hooks from live trend context.",
      },
      {
        q: "Should every hook be dramatic?",
        a: "No. Warm, specific hooks usually feel more trustworthy than fake urgency.",
      },
      {
        q: "Can I use these on Instagram or YouTube Shorts?",
        a: "Yes. Short spoken hooks work across most vertical video platforms.",
      },
    ],
    related: [
      "/ai-hook-generator",
      "/tiktok-content-ideas",
      "/trend-research-tool",
    ],
    resourceKind: "hooks",
  },
  {
    slug: "free-content-calendar-template",
    path: "/free-content-calendar-template",
    group: "resource",
    metaTitle: "Free Content Calendar Template for Creators",
    title: "Free Content Calendar Template",
    description:
      "Plan a simple 7-day creator content calendar with trend ideas, hooks, and publishing notes.",
    eyebrow: "Free creator tool",
    h1: "Free Content Calendar Template for a Simple Week of Posts",
    intro:
      "Use this free planning page to map a niche into a week of content. When you want real trend signals and saved idea cards, bring the niche into TrendBoard.",
    primaryKeyword: "free content calendar template",
    audience: "creators, coaches, small businesses, and social media managers",
    outcomes: [
      "Plan a week of posts without opening a spreadsheet.",
      "Balance education, proof, story, and trend reaction formats.",
      "Move stronger ideas into a full TrendBoard calendar later.",
    ],
    workflow: [
      "Pick one niche for the week.",
      "Use each day for a different content job.",
      "Run a TrendBoard scan for the days that need fresh examples.",
    ],
    examples: [
      {
        title: "Monday",
        body: "Teach one basic mistake your audience keeps making.",
      },
      {
        title: "Wednesday",
        body: "React to a current trend with one grounded opinion.",
      },
      { title: "Friday", body: "Show a quick win or before-and-after moment." },
    ],
    faqs: [
      {
        q: "How many posts should I plan each week?",
        a: "Start with a number you can actually publish. Consistency matters more than filling every slot.",
      },
      {
        q: "Should every post follow a trend?",
        a: "No. Trends are useful, but evergreen teaching, proof, and personal context keep the calendar balanced.",
      },
      {
        q: "Can TrendBoard save calendar ideas?",
        a: "Yes. Inside the app you can save ideas and move them into your content calendar with the research context attached.",
      },
    ],
    related: [
      "/content-calendar-tool",
      "/creator-content-planner",
      "/trend-research-tool",
    ],
    resourceKind: "calendar",
  },
  {
    slug: "how-to-find-trends-before-they-blow-up",
    path: "/how-to-find-trends-before-they-blow-up",
    group: "resource",
    metaTitle: "How to Find Trends Before They Blow Up",
    title: "How to Find Trends Before They Blow Up",
    description:
      "A practical creator checklist for spotting early trend signals across TikTok, Instagram, Pinterest, YouTube, search, and news.",
    eyebrow: "Creator guide",
    h1: "How to Find Trends Before They Blow Up",
    intro:
      "The goal is not to chase every popular topic. The goal is to notice repeat signals early, then connect them to your own niche before the feed gets crowded.",
    primaryKeyword: "how to find trends before they blow up",
    audience: "creators and marketers who want earlier content ideas",
    outcomes: [
      "Know what to check before filming.",
      "Separate real momentum from one-off noise.",
      "Turn an early signal into a niche-specific idea.",
    ],
    workflow: [
      "Watch for the same topic appearing on multiple platforms.",
      "Check whether comments are asking questions or just reacting.",
      "Look for a niche angle you can explain better than the original post.",
      "Save the source links so your idea stays grounded.",
    ],
    examples: [
      {
        title: "Signal cluster",
        body: "A topic appears on TikTok, Pinterest, and search in the same week.",
      },
      {
        title: "Comment demand",
        body: "People keep asking the same question under different posts.",
      },
      {
        title: "Niche translation",
        body: "A broad pop culture moment can teach something useful in your niche.",
      },
    ],
    faqs: [
      {
        q: "How early is too early to post about a trend?",
        a: "If you can explain why the trend matters to your audience, it is not too early. If you only know it is popular, wait for more context.",
      },
      {
        q: "What platforms should I check?",
        a: "For creators, start with TikTok, Instagram, YouTube Shorts, Pinterest, X, Reddit, search, and news context.",
      },
      {
        q: "Can TrendBoard do this research in one place?",
        a: "Yes. TrendBoard is built to scan multiple sources and turn the strongest signals into idea cards.",
      },
    ],
    related: [
      "/trend-research-tool",
      "/tiktok-content-ideas",
      "/instagram-content-ideas",
    ],
    resourceKind: "trend-checklist",
  },
  {
    slug: "tiktok-vs-instagram-reels-content-ideas",
    path: "/tiktok-vs-instagram-reels-content-ideas",
    group: "resource",
    metaTitle: "TikTok vs Instagram Reels Content Ideas",
    title: "TikTok vs Instagram Reels Content Ideas",
    description:
      "Compare how to adapt one content idea for TikTok, Instagram Reels, and other short-form platforms.",
    eyebrow: "Creator guide",
    h1: "TikTok vs Instagram Reels Content Ideas",
    intro:
      "One trend can work on both platforms, but the packaging often changes. Use this guide to decide how to adapt the hook, caption, and visual proof.",
    primaryKeyword: "TikTok vs Instagram Reels content ideas",
    audience: "short-form creators, social media managers, and small brands",
    outcomes: [
      "Adapt one trend idea for more than one platform.",
      "Choose a format based on viewer behavior.",
      "Keep the same core idea while changing the delivery.",
    ],
    workflow: [
      "Start with one clear idea.",
      "Use TikTok for raw discovery and fast hooks.",
      "Use Instagram Reels for trust, polish, and save-worthy context.",
      "Save the idea with platform-specific notes.",
    ],
    examples: [
      {
        title: "TikTok version",
        body: "Start with a direct spoken hook and show the result quickly.",
      },
      {
        title: "Instagram version",
        body: "Add cleaner text overlays, a save-friendly caption, and a carousel follow-up.",
      },
      {
        title: "Shorts version",
        body: "Use a searchable title and answer the question in a clean sequence.",
      },
    ],
    faqs: [
      {
        q: "Should I post the exact same video everywhere?",
        a: "You can, but the strongest results usually come from adapting the hook, caption, and pacing to each platform.",
      },
      {
        q: "Which platform should I prioritize?",
        a: "Prioritize the platform where your audience already watches, then repurpose the same core idea elsewhere.",
      },
      {
        q: "Can TrendBoard help with platform-specific ideas?",
        a: "Yes. Trend cards show source platforms and help you expand ideas into hooks, scripts, and hashtags.",
      },
    ],
    related: [
      "/tiktok-content-ideas",
      "/instagram-content-ideas",
      "/youtube-shorts-ideas",
    ],
    resourceKind: "comparison",
  },
  {
    slug: "30-content-ideas-for-fitness-creators",
    path: "/30-content-ideas-for-fitness-creators",
    group: "resource",
    metaTitle: "30 Content Ideas for Fitness Creators",
    title: "30 Content Ideas for Fitness Creators",
    description:
      "Use 30 simple content ideas for fitness creators, trainers, wellness coaches, and gym brands.",
    eyebrow: "Free idea list",
    h1: "30 Content Ideas for Fitness Creators",
    intro:
      "Use these as starting points when you need to post but do not want the video to sound generic. For fresher angles, run a live fitness scan in TrendBoard.",
    primaryKeyword: "30 content ideas for fitness creators",
    audience: "fitness creators, trainers, coaches, gyms, and wellness brands",
    outcomes: [
      "Get a quick list of ideas without logging in.",
      "Turn evergreen topics into current short-form angles.",
      "Use TrendBoard when you want source-backed fitness trends.",
    ],
    workflow: [
      "Pick one idea from the list.",
      "Make it specific to your audience or training style.",
      "Add one example, mistake, or demonstration.",
      "Save the finished version in TrendBoard when you want to plan it.",
    ],
    examples: [
      {
        title: "Beginner mistake",
        body: "Show one common form issue and one cue that fixes it.",
      },
      {
        title: "Myth check",
        body: "Correct a popular fitness claim without being harsh or preachy.",
      },
      {
        title: "Mini routine",
        body: "Give viewers a three-move version they can try today.",
      },
    ],
    faqs: [
      {
        q: "Are these fitness ideas beginner friendly?",
        a: "Yes. Most are designed to be simple, useful, and easy to film quickly.",
      },
      {
        q: "Can I use these for gyms or coaching businesses?",
        a: "Yes. Adjust the examples and call-to-action for your offer, location, or audience.",
      },
      {
        q: "How do I make these ideas feel current?",
        a: "Run a fitness trend scan, then connect the evergreen idea to a current conversation or platform signal.",
      },
    ],
    related: [
      "/niches/fitness-content-ideas",
      "/tiktok-content-ideas",
      "/content-calendar-tool",
    ],
    resourceKind: "fitness-ideas",
  },
];

export const topLevelSeoPages = [...keywordLandingPages, ...resourcePages];
export const allSeoPages = [...topLevelSeoPages, ...nicheLandingPages];

export function getTopLevelSeoPage(slug: string) {
  return topLevelSeoPages.find((page) => page.slug === slug);
}

export function getNicheSeoPage(slug: string) {
  return nicheLandingPages.find((page) => page.slug === slug);
}

export function seoPageUrl(path: string) {
  return `${SEO_BASE_URL}${path}`;
}
