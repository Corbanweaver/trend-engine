from pytrends.request import TrendReq
import asyncio
from concurrent.futures import ThreadPoolExecutor

_executor = ThreadPoolExecutor(max_workers=2)


def _fetch_trending(query: str, geo: str = "US", timeframe: str = "now 7-d") -> dict:
    pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))

    result = {
        "query": query,
        "related_queries": [],
        "related_topics": [],
        "trending_searches": [],
    }

    try:
        pytrends.build_payload([query], cat=0, timeframe=timeframe, geo=geo)

        related_q = pytrends.related_queries()
        if query in related_q and related_q[query].get("rising") is not None:
            rising = related_q[query]["rising"]
            for _, row in rising.head(10).iterrows():
                result["related_queries"].append({
                    "query": row.get("query", ""),
                    "value": int(row.get("value", 0)),
                })

        if query in related_q and related_q[query].get("top") is not None:
            top = related_q[query]["top"]
            for _, row in top.head(10).iterrows():
                result["related_queries"].append({
                    "query": row.get("query", ""),
                    "value": int(row.get("value", 0)),
                })
    except Exception:
        pass

    try:
        trending = TrendReq(hl="en-US", tz=360, timeout=(10, 25)).trending_searches(pn="united_states")
        for _, row in trending.head(15).iterrows():
            result["trending_searches"].append(str(row.iloc[0]))
    except Exception:
        pass

    return result


async def google_trends_search(query: str, geo: str = "US") -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_trending, query, geo)


def _fetch_interest_by_keywords(keywords: list[str], timeframe: str = "now 7-d", geo: str = "US") -> list[dict]:
    if not keywords:
        return []

    results = []
    try:
        pytrends = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
        batch = keywords[:5]
        pytrends.build_payload(batch, cat=0, timeframe=timeframe, geo=geo)
        interest = pytrends.interest_over_time()

        if not interest.empty:
            for kw in batch:
                if kw in interest.columns:
                    avg_interest = int(interest[kw].mean())
                    recent = int(interest[kw].iloc[-1]) if len(interest[kw]) > 0 else 0
                    results.append({
                        "keyword": kw,
                        "avg_interest": avg_interest,
                        "recent_interest": recent,
                        "trending_up": recent > avg_interest,
                    })
    except Exception:
        pass

    return results


async def google_trends_interest(keywords: list[str], geo: str = "US") -> list[dict]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _fetch_interest_by_keywords, keywords, "now 7-d", geo)
