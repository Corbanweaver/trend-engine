export type CreatorManagerPost = {
  title: string;
  format: string;
  hook: string;
  why: string;
  action: string;
  score: number;
};

export type CreatorManagerTask = {
  task: string;
  category: "Engagement" | "Content" | "Distribution" | "Research" | "Profile";
  minutes: number;
};

export type CreatorManagerScheduleItem = {
  day: string;
  focus: string;
  format: string;
  status: "Ready" | "Draft" | "Research";
};

export type CreatorManagerPillar = {
  name: string;
  description: string;
};

export type CreatorManagerPlan = {
  handle: string;
  platform: string;
  niche: string;
  nicheLabel: string;
  confidence?: "high" | "medium" | "low";
  summary: string;
  audienceAngle: string;
  primaryGoal: string;
  contentPillars: CreatorManagerPillar[];
  postQueue: CreatorManagerPost[];
  dailyActions: CreatorManagerTask[];
  weeklySchedule: CreatorManagerScheduleItem[];
  profileMoves: string[];
  contentGaps: string[];
  trendPrompts: string[];
};

type BuildCreatorManagerPlanInput = {
  handle?: string;
  platform?: string | null;
  niche: string;
  nicheLabel?: string;
  confidence?: "high" | "medium" | "low";
};

type Blueprint = {
  audience: string;
  outcome: string;
  pillars: CreatorManagerPillar[];
  postTemplates: Array<Omit<CreatorManagerPost, "score">>;
  actions: CreatorManagerTask[];
  profileMoves: string[];
  contentGaps: string[];
  trendPrompts: string[];
};

const blueprints: Record<string, Blueprint> = {
  fitness: {
    audience: "busy people who want practical workouts, food choices, and visible progress without overcomplicating the routine",
    outcome: "turn fitness knowledge into repeatable short-form series that people can save and follow",
    pillars: [
      {
        name: "Fast wins",
        description: "Short routines, swaps, and fixes viewers can try today.",
      },
      {
        name: "Proof and progress",
        description: "Show before/after logic, client examples, or personal tracking.",
      },
      {
        name: "Myth busting",
        description: "Correct common fitness advice with a simple demonstration.",
      },
    ],
    postTemplates: [
      {
        title: "The 10-minute reset your audience can do before work",
        format: "Reel",
        hook: "If you only have 10 minutes, do this before you scroll.",
        why: "Low-friction routines tend to earn saves because the viewer can copy them immediately.",
        action: "Film 3 moves, add timer text, and end with a save prompt.",
      },
      {
        title: "What I would stop doing if I wanted faster progress",
        format: "Talking head",
        hook: "These are the habits making your progress slower than it needs to be.",
        why: "Contrarian coaching gives viewers a reason to watch through the list.",
        action: "List 3 mistakes, then give one replacement for each.",
      },
      {
        title: "A realistic day of meals for your niche",
        format: "Carousel",
        hook: "Here is what a simple high-protein day can actually look like.",
        why: "Meal examples are easy to save and adapt.",
        action: "Use 5 slides: breakfast, lunch, snack, dinner, grocery note.",
      },
      {
        title: "Beginner mistake breakdown",
        format: "Reel",
        hook: "You are not lazy. Your plan is just too hard to repeat.",
        why: "Beginner empathy broadens reach without weakening authority.",
        action: "Show the mistake, explain the fix, then give a next-step checklist.",
      },
    ],
    actions: [
      {
        task: "Reply to 10 comments with follow-up questions",
        category: "Engagement",
        minutes: 15,
      },
      {
        task: "Save 5 recent trend sounds or hooks from similar creators",
        category: "Research",
        minutes: 10,
      },
      {
        task: "Turn yesterday's best tip into a carousel outline",
        category: "Content",
        minutes: 20,
      },
      {
        task: "Add a clear result promise to the bio",
        category: "Profile",
        minutes: 8,
      },
    ],
    profileMoves: [
      "Make the bio promise specific: who you help, what they get, and how often you post.",
      "Pin one beginner-friendly result post, one proof post, and one personal credibility post.",
      "Use highlights for routines, meals, results, and start-here content.",
    ],
    contentGaps: [
      "Beginner education",
      "Weekly proof or progress",
      "Saveable checklists",
    ],
    trendPrompts: [
      "What fitness advice is your audience currently confused by?",
      "Which routine could be simplified into a 3-step challenge?",
      "What grocery, gym, or routine mistake is showing up in comments?",
    ],
  },
  "beauty and makeup": {
    audience: "viewers looking for easier routines, product decisions, and visual transformations they can copy",
    outcome: "turn product knowledge and technique into visual tutorials, comparison posts, and saveable routines",
    pillars: [
      {
        name: "Routine clarity",
        description: "Simple morning, night, and event-ready workflows.",
      },
      {
        name: "Product decisions",
        description: "Comparisons, dupes, wear tests, and what to skip.",
      },
      {
        name: "Technique demos",
        description: "Small fixes shown visually in tight before/after clips.",
      },
    ],
    postTemplates: [
      {
        title: "One product, three ways to use it",
        format: "Reel",
        hook: "Stop using this product only one way.",
        why: "Usage variety gives viewers more value from a single product.",
        action: "Film three close-up applications with labels and a final look.",
      },
      {
        title: "Routine audit for a common skin or makeup problem",
        format: "Carousel",
        hook: "If your makeup separates by lunch, check these three things.",
        why: "Problem-solving posts pull in search demand and saves.",
        action: "Create five slides: symptom, cause, fix, product type, checklist.",
      },
      {
        title: "Affordable vs premium result test",
        format: "Split-screen Reel",
        hook: "Can the cheaper version actually hold up?",
        why: "Comparison formats create curiosity and comments.",
        action: "Show application, wear check, close-up texture, final verdict.",
      },
      {
        title: "Mistakes that make the look harder than it needs to be",
        format: "Talking head",
        hook: "These tiny steps are making your routine take twice as long.",
        why: "Fixing mistakes gives practical authority.",
        action: "Name 3 mistakes and show a fast correction for each.",
      },
    ],
    actions: [
      {
        task: "Reply to product questions with short video reply ideas",
        category: "Engagement",
        minutes: 15,
      },
      {
        task: "Save 5 creator examples using the same product category",
        category: "Research",
        minutes: 10,
      },
      {
        task: "Outline one before/after tutorial",
        category: "Content",
        minutes: 20,
      },
      {
        task: "Pin the clearest transformation post",
        category: "Profile",
        minutes: 8,
      },
    ],
    profileMoves: [
      "Name the exact beauty problem you solve in the first line of the bio.",
      "Pin one transformation, one product decision post, and one routine tutorial.",
      "Group highlights by skin type, product tests, routines, and favorites.",
    ],
    contentGaps: [
      "Before/after proof",
      "Product decision posts",
      "Routine checklists",
    ],
    trendPrompts: [
      "What product is everyone buying but using wrong?",
      "Which routine step could be turned into a close-up tutorial?",
      "What beauty myth keeps appearing in comments?",
    ],
  },
  "business and entrepreneurship": {
    audience: "creators, founders, and operators trying to grow revenue with practical systems instead of vague motivation",
    outcome: "turn lessons, proof, and frameworks into authority-building posts that generate leads",
    pillars: [
      {
        name: "Operator lessons",
        description: "What worked, what failed, and what changed the result.",
      },
      {
        name: "Frameworks",
        description: "Clear systems viewers can screenshot and apply.",
      },
      {
        name: "Proof",
        description: "Numbers, walkthroughs, and behind-the-scenes decisions.",
      },
    ],
    postTemplates: [
      {
        title: "One decision that saved time or made money",
        format: "Talking head",
        hook: "This small change made the whole process easier to sell.",
        why: "Concrete business lessons build trust faster than broad advice.",
        action: "Explain the old way, the new way, and the measurable result.",
      },
      {
        title: "Steal this simple workflow",
        format: "Carousel",
        hook: "Here is the system I would use if I had to start from zero.",
        why: "Framework posts are saveable and position you as a practical expert.",
        action: "Create a 6-slide checklist with one action per slide.",
      },
      {
        title: "Build in public update",
        format: "Reel",
        hook: "Here is what actually moved the number this week.",
        why: "Progress updates create repeat viewers and credibility.",
        action: "Show the metric, the move, the mistake, and the next test.",
      },
      {
        title: "Myth that keeps beginners stuck",
        format: "Short post",
        hook: "You do not need more ideas. You need a cleaner offer.",
        why: "Contrarian takes are easy to debate and share.",
        action: "Give the myth, the truth, and a next-step prompt.",
      },
    ],
    actions: [
      {
        task: "Turn one customer question into a post outline",
        category: "Content",
        minutes: 15,
      },
      {
        task: "Comment on 5 posts from creators in the same market",
        category: "Distribution",
        minutes: 12,
      },
      {
        task: "Collect 3 proof points from recent work",
        category: "Research",
        minutes: 10,
      },
      {
        task: "Clarify the profile CTA",
        category: "Profile",
        minutes: 8,
      },
    ],
    profileMoves: [
      "Make the bio outcome measurable or concrete.",
      "Pin one proof post, one framework, and one founder story.",
      "Add a direct CTA to the next business step: free resource, call, product, or newsletter.",
    ],
    contentGaps: [
      "Proof posts",
      "Lead-generating frameworks",
      "Behind-the-scenes decisions",
    ],
    trendPrompts: [
      "What change in your market is people underestimating?",
      "Which process could be turned into a checklist?",
      "What failed experiment would build trust if you explained it?",
    ],
  },
  "tech and ai": {
    audience: "builders and operators who want useful AI tools, automation examples, and clear technical shortcuts",
    outcome: "turn tool discoveries and workflows into demos people can copy",
    pillars: [
      {
        name: "Tool demos",
        description: "Short walkthroughs that show a real before and after.",
      },
      {
        name: "Automation recipes",
        description: "Repeatable workflows with inputs, steps, and output.",
      },
      {
        name: "Plain-English education",
        description: "Explain technical changes without hype.",
      },
    ],
    postTemplates: [
      {
        title: "I used AI to automate this boring task",
        format: "Screen-record Reel",
        hook: "This used to take 30 minutes. Now it takes two.",
        why: "Time-saving demos are easy to understand and share.",
        action: "Show the manual version, the automation, and the output.",
      },
      {
        title: "Tool comparison for one specific job",
        format: "Carousel",
        hook: "Use this tool for speed, this one for control.",
        why: "Clear recommendations cut through tool overload.",
        action: "Compare use case, pros, limits, cost, and best user.",
      },
      {
        title: "Prompt or workflow teardown",
        format: "Talking head",
        hook: "Your prompt is not the problem. Your input is too vague.",
        why: "Teardowns feel practical and build expertise.",
        action: "Show bad input, improved input, and final output.",
      },
      {
        title: "AI news translated into creator impact",
        format: "Short post",
        hook: "Here is what this AI update actually changes for creators.",
        why: "Timely translation captures trend demand without shallow news posting.",
        action: "State the update, impact, opportunity, and risk.",
      },
    ],
    actions: [
      {
        task: "Record a 30-second screen demo",
        category: "Content",
        minutes: 20,
      },
      {
        task: "Save 3 AI tool updates worth translating",
        category: "Research",
        minutes: 10,
      },
      {
        task: "Reply to a technical question with a short example",
        category: "Engagement",
        minutes: 12,
      },
      {
        task: "Add your strongest use case to the bio",
        category: "Profile",
        minutes: 8,
      },
    ],
    profileMoves: [
      "Lead with the specific outcome your tools or tutorials help people create.",
      "Pin one demo, one workflow breakdown, and one credibility post.",
      "Use highlights or playlists for tools, automations, prompts, and case studies.",
    ],
    contentGaps: [
      "Screen demos",
      "Tool comparison posts",
      "Plain-English update explainers",
    ],
    trendPrompts: [
      "Which new tool would save your audience the most time this week?",
      "What workflow can you show in under 45 seconds?",
      "What AI update needs a practical translation?",
    ],
  },
  "personal brand": {
    audience: "people who follow the creator for practical perspective, personality, and a clear point of view",
    outcome: "turn experience into repeatable content pillars and a stronger reason to follow",
    pillars: [
      {
        name: "Point of view",
        description: "Opinions, lessons, and beliefs your audience can recognize.",
      },
      {
        name: "Proof of work",
        description: "Behind-the-scenes progress, experiments, and results.",
      },
      {
        name: "Useful systems",
        description: "Checklists, templates, and steps viewers can use.",
      },
    ],
    postTemplates: [
      {
        title: "What I would do differently if I started today",
        format: "Talking head",
        hook: "If I had to restart, I would skip this part completely.",
        why: "Restart advice turns personal experience into useful guidance.",
        action: "List 3 lessons and one action for each.",
      },
      {
        title: "Behind the scenes of a current project",
        format: "Reel",
        hook: "Here is the part people do not see.",
        why: "Process content makes the account feel active and credible.",
        action: "Show the project, decision, obstacle, and next move.",
      },
      {
        title: "A checklist your audience can save",
        format: "Carousel",
        hook: "Use this before you start the next one.",
        why: "Saveable systems build repeat engagement.",
        action: "Create 5 steps with a final recap slide.",
      },
      {
        title: "Common mistake in your niche",
        format: "Short post",
        hook: "Most people are solving the wrong problem first.",
        why: "Simple reframe posts are easy to share and discuss.",
        action: "Explain the mistake, the better target, and the first step.",
      },
    ],
    actions: [
      {
        task: "Write 3 strong opinions your audience should know you for",
        category: "Profile",
        minutes: 12,
      },
      {
        task: "Turn one recent lesson into a post outline",
        category: "Content",
        minutes: 15,
      },
      {
        task: "Reply to 10 comments or DMs",
        category: "Engagement",
        minutes: 15,
      },
      {
        task: "Save 5 creators with similar audience behavior",
        category: "Research",
        minutes: 10,
      },
    ],
    profileMoves: [
      "Make the bio clear enough that a new visitor knows why to follow in five seconds.",
      "Pin one opinion post, one proof post, and one useful checklist.",
      "Use recurring series names so viewers recognize your best formats.",
    ],
    contentGaps: [
      "Point-of-view posts",
      "Proof of work",
      "Saveable systems",
    ],
    trendPrompts: [
      "What belief do you have that your audience needs to hear?",
      "What project update can you make useful for someone one step behind you?",
      "Which repeated question should become a post series?",
    ],
  },
};

const aliasMap: Record<string, keyof typeof blueprints> = {
  "beauty & makeup": "beauty and makeup",
  beauty: "beauty and makeup",
  makeup: "beauty and makeup",
  skincare: "beauty and makeup",
  business: "business and entrepreneurship",
  entrepreneurship: "business and entrepreneurship",
  founder: "business and entrepreneurship",
  "tech & ai": "tech and ai",
  ai: "tech and ai",
  technology: "tech and ai",
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function resolveBlueprint(niche: string) {
  const normalized = normalize(niche);
  const aliased = aliasMap[normalized];
  if (aliased) return blueprints[aliased];

  const direct = Object.entries(blueprints).find(([key]) => {
    const normalizedKey = normalize(key);
    return normalized === normalizedKey || normalized.includes(normalizedKey);
  });
  return direct?.[1] ?? blueprints["personal brand"];
}

function formatHandle(handle?: string) {
  const trimmed = (handle ?? "").trim();
  if (!trimmed) return "@yourhandle";
  if (trimmed.startsWith("@")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      const username = parts.find((part) => !["channel", "c", "user"].includes(part));
      return username ? `@${username.replace(/^@+/, "")}` : trimmed;
    } catch {
      return trimmed;
    }
  }
  return `@${trimmed.replace(/^@+/, "")}`;
}

function formatPlatform(platform?: string | null) {
  const raw = (platform ?? "").trim();
  if (!raw) return "Creator account";
  const normalized = normalize(raw);
  if (normalized.includes("tiktok")) return "TikTok";
  if (normalized.includes("instagram")) return "Instagram";
  if (normalized.includes("youtube")) return "YouTube";
  if (normalized === "x" || normalized.includes("twitter")) return "X";
  if (normalized.includes("threads")) return "Threads";
  return titleCase(raw);
}

function platformFormat(format: string, platform: string) {
  if (platform === "TikTok" && format === "Reel") return "TikTok";
  if (platform === "TikTok" && format === "Carousel") return "Photo carousel";
  if (platform === "Instagram" && format === "TikTok") return "Reel";
  return format;
}

export function buildCreatorManagerPlan({
  handle,
  platform,
  niche,
  nicheLabel,
  confidence,
}: BuildCreatorManagerPlanInput): CreatorManagerPlan {
  const blueprint = resolveBlueprint(niche);
  const formattedPlatform = formatPlatform(platform);
  const formattedHandle = formatHandle(handle);
  const label = nicheLabel?.trim() || titleCase(niche || "Personal Brand");

  const postQueue = blueprint.postTemplates.map((post, index) => ({
    ...post,
    format: platformFormat(post.format, formattedPlatform),
    score: [92, 88, 84, 79][index] ?? 76,
  }));

  const weeklySchedule = weekdays.map((day, index) => {
    const post = postQueue[index % postQueue.length];
    return {
      day,
      focus: post.title,
      format: post.format,
      status: index < 2 ? "Ready" : index < 5 ? "Draft" : "Research",
    } satisfies CreatorManagerScheduleItem;
  });

  return {
    handle: formattedHandle,
    platform: formattedPlatform,
    niche,
    nicheLabel: label,
    confidence,
    summary: `${formattedHandle} should lead with ${label.toLowerCase()} content for ${blueprint.audience}.`,
    audienceAngle: blueprint.audience,
    primaryGoal: blueprint.outcome,
    contentPillars: blueprint.pillars,
    postQueue,
    dailyActions: blueprint.actions,
    weeklySchedule,
    profileMoves: blueprint.profileMoves,
    contentGaps: blueprint.contentGaps,
    trendPrompts: blueprint.trendPrompts,
  };
}
