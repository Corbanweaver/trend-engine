import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrendIdea } from "@/lib/trend-ideas-types";

export function IdeaPanel({ trend }: { trend: TrendIdea | null }) {
  if (!trend) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-slate-300">
          Select a trend card
        </p>
        <p className="max-w-xs text-xs text-slate-400">
          AI-generated video ideas, hooks, and scripts for that topic appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pr-2">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-slate-100">
          {trend.trend}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {trend.ideas.length} idea{trend.ideas.length === 1 ? "" : "s"} from
          your Content Engine
        </p>
      </div>

      <div className="space-y-3">
        {trend.ideas.map((idea, i) => (
          <Card
            key={`${trend.trend}-${i}`}
            className="border-white/10 bg-slate-900/80 text-slate-100 shadow-md shadow-black/20"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base leading-snug text-slate-100">
                {idea.optimized_title?.trim() || `Idea ${i + 1}`}
              </CardTitle>
              {idea.hook ? (
                <CardDescription className="text-sm font-medium text-slate-200">
                  Hook: {idea.hook}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {idea.angle ? (
                <p>
                  <span className="font-medium text-slate-200">Angle: </span>
                  <span className="text-slate-400">{idea.angle}</span>
                </p>
              ) : null}
              {idea.idea ? (
                <p>
                  <span className="font-medium text-slate-200">Concept: </span>
                  <span className="text-slate-400">{idea.idea}</span>
                </p>
              ) : null}
              {idea.seo_description ? (
                <p className="text-xs text-slate-400">
                  <span className="font-medium text-slate-200">SEO: </span>
                  {idea.seo_description}
                </p>
              ) : null}
              {idea.script ? (
                <div className="rounded-md border border-white/10 bg-slate-800/50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Script
                  </p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-200">
                    {idea.script}
                  </p>
                </div>
              ) : null}
              {idea.hashtags && idea.hashtags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {idea.hashtags.map((tag, hi) => (
                    <Badge
                      key={`${tag}-${hi}`}
                      variant="secondary"
                      className="border border-cyan-400/30 bg-cyan-500/10 font-normal text-cyan-200"
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
