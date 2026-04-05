import feedparser
import httpx

NICHE_SUBREDDITS = {
    "fitness": ["fitness", "bodyweightfitness", "weightroom", "running", "GYM", "naturalbodybuilding"],
    "dating": ["dating_advice", "relationships", "Tinder", "seduction", "socialskills"],
    "finance": ["personalfinance", "investing", "financialindependence", "stocks", "CryptoCurrency"],
    "cooking": ["Cooking", "MealPrepSunday", "EatCheapAndHealthy", "recipes", "foodhacks"],
    "tech": ["technology", "programming", "webdev", "MachineLearning", "artificial"],
    "gaming": ["gaming", "Games", "pcgaming", "IndieGaming", "gamedev"],
    "fashion": ["malefashionadvice", "femalefashionadvice", "streetwear", "fashion"],
    "music": ["WeAreTheMusicMakers", "musicproduction", "edmproduction", "Songwriting"],
    "health": ["Health", "nutrition", "loseit", "intermittentfasting", "Supplements"],
    "travel": ["travel", "solotravel", "backpacking", "digitalnomad", "TravelHacks"],
    "beauty": ["SkincareAddiction", "MakeupAddiction", "HaircareScience", "beauty"],
    "parenting": ["Parenting", "Mommit", "daddit", "beyondthebump"],
    "pets": ["dogs", "cats", "pets", "Dogtraining", "CatAdvice"],
    "diy": ["DIY", "woodworking", "HomeImprovement", "crafts"],
    "education": ["learnprogramming", "languagelearning", "GetStudying", "college"],
    "motivation": ["GetMotivated", "selfimprovement", "DecidingToBeBetter", "productivity"],
    "entrepreneurship": ["Entrepreneur", "startups", "smallbusiness", "SideProject"],
    "photography": ["photography", "photocritique", "EditMyRaw", "videography"],
    "mental health": ["mentalhealth", "Anxiety", "depression", "selfimprovement"],
    "sports": ["sports", "nba", "nfl", "soccer", "MMA"],
}


def get_subreddits_for_niche(niche: str) -> list[str]:
    key = niche.lower().strip()
    if key in NICHE_SUBREDDITS:
        return NICHE_SUBREDDITS[key]

    for k, v in NICHE_SUBREDDITS.items():
        if key in k or k in key:
            return v

    return ["all"]


async def multi_reddit_ingest(niche: str, max_per_sub: int = 10) -> list[dict]:
    subreddits = get_subreddits_for_niche(niche)
    all_posts = []

    async with httpx.AsyncClient(
        timeout=10.0,
        headers={"User-Agent": "ContentEngine/1.0"},
        follow_redirects=True,
    ) as client:
        for sub in subreddits:
            try:
                url = f"https://www.reddit.com/r/{sub}/hot.json?limit={max_per_sub}"
                resp = await client.get(url)

                if resp.status_code == 200:
                    data = resp.json()
                    children = data.get("data", {}).get("children", [])

                    for child in children:
                        post = child.get("data", {})
                        if post.get("stickied"):
                            continue

                        all_posts.append({
                            "id": post.get("id", ""),
                            "title": post.get("title", ""),
                            "subreddit": sub,
                            "score": post.get("score", 0),
                            "num_comments": post.get("num_comments", 0),
                            "url": f"https://reddit.com{post.get('permalink', '')}",
                            "created_utc": post.get("created_utc", 0),
                            "selftext": (post.get("selftext", "") or "")[:200],
                        })
            except Exception:
                continue

    all_posts.sort(key=lambda x: x["score"], reverse=True)
    return all_posts


async def reddit_trending_topics(niche: str, max_posts: int = 50) -> list[dict]:
    posts = await multi_reddit_ingest(niche, max_per_sub=15)
    return posts[:max_posts]
