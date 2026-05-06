import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoContentPage } from "@/components/seo/seo-content-page";
import {
  getTopLevelSeoPage,
  seoPageUrl,
  topLevelSeoPages,
} from "@/lib/seo-content";

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return topLevelSeoPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getTopLevelSeoPage(slug);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: {
      canonical: page.path,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.description,
      url: seoPageUrl(page.path),
      siteName: "TrendBoard",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.description,
    },
  };
}

export default async function TopLevelSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getTopLevelSeoPage(slug);
  if (!page) notFound();
  return <SeoContentPage page={page} />;
}
