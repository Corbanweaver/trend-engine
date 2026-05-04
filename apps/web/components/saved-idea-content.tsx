import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const URL_PATTERN =
  /((?:https?:\/\/|www\.)[^\s<>"']+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s<>"']*)/gi;
const TRAILING_PUNCTUATION_PATTERN = /[),.;!?]+$/;

function splitTrailingPunctuation(url: string) {
  const match = url.match(TRAILING_PUNCTUATION_PATTERN);
  if (!match) return { href: url, trailing: "" };
  return {
    href: url.slice(0, -match[0].length),
    trailing: match[0],
  };
}

function renderLinkedContent(content: string) {
  const parts = content.split(URL_PATTERN);
  const nodes: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) return;
    if (URL_PATTERN.test(part)) {
      URL_PATTERN.lastIndex = 0;
      const { href, trailing } = splitTrailingPunctuation(part);
      const normalizedHref = href.startsWith("www.") ? `https://${href}` : href;
      nodes.push(
        <Fragment key={`${href}-${index}`}>
          <a
            href={normalizedHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:opacity-85 dark:text-cyan-200"
          >
            {href}
          </a>
          {trailing}
        </Fragment>,
      );
      return;
    }
    nodes.push(<Fragment key={`text-${index}`}>{part}</Fragment>);
  });

  return nodes;
}

export function SavedIdeaContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {renderLinkedContent(content)}
    </div>
  );
}
