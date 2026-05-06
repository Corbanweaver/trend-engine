# TrendBoard SEO Traffic Next Steps

Use this checklist when Google indexing is available again. Work top to bottom so traffic, tracking, and promotion grow together.

## 1. Submit Search Engines

1. Open Google Search Console for `https://www.contentideamaker.com/`.
2. Submit `https://www.contentideamaker.com/sitemap.xml` under Sitemaps.
3. Use URL Inspection to request indexing for these priority pages first:
   - `https://www.contentideamaker.com/free-tiktok-hook-ideas`
   - `https://www.contentideamaker.com/free-content-calendar-template`
   - `https://www.contentideamaker.com/tiktok-content-ideas`
   - `https://www.contentideamaker.com/pinterest-content-ideas`
   - `https://www.contentideamaker.com/instagram-reels-hook-ideas`
   - `https://www.contentideamaker.com/niches/fitness-content-ideas`
   - `https://www.contentideamaker.com/30-content-ideas-for-real-estate-agents`
4. If the daily URL Inspection quota is hit, stop and come back the next day.
5. Open Bing Webmaster Tools and submit the same sitemap.

## 2. Share Free Resources

1. Start with free pages, not the paid app.
2. Post where the resource answers a real creator problem:
   - creator and short-form marketing communities
   - local business and real estate groups
   - fitness, beauty, coaching, and small business groups
   - Product Hunt, MicroLaunch, Uneed, BetaList, and SaaS directories
3. Use `docs/marketing/seo-backlink-plan.md` for copy and priority links.
4. Track which communities send signups, not just visits.

## 3. Watch Conversion Events

The app now records these first-party conversion breadcrumbs into `operational_events` with `source = conversion`:

- `landing_page_viewed`
- `free_tool_used`
- `signup_clicked`
- `signup_completed`
- `signup_google_clicked`
- `analyze_clicked`
- `analyze_completed`
- `checkout_started`
- `checkout_completed`

Review them in Supabase or the admin analytics views as traffic grows.

## 4. Publish Long-Tail Pages Weekly

Add 5 to 10 pages per week in `apps/web/lib/seo-content.ts`. Best next themes:

- niche pages for creators and service businesses
- platform-specific hook pages
- "30 content ideas for..." pages
- free templates that lead into the app

After each batch, run the web build and confirm the sitemap includes the new URLs.

## 5. Review Search Console Weekly

Every week, check:

- queries getting impressions
- pages getting impressions but low clicks
- pages that are discovered but not indexed
- keywords ranking around positions 8 to 30

Turn those near-wins into better titles, stronger intros, and more internal links.
