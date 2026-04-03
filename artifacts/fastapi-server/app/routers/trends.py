import re
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text

from app.database import get_db
from app.models import TrendsResponse, TrendTopic

router = APIRouter(prefix="/trends", tags=["trends"])

STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "just", "don", "now", "and", "but", "or", "if", "while", "this",
    "that", "these", "those", "i", "me", "my", "myself", "we", "our",
    "you", "your", "he", "him", "his", "she", "her", "it", "its", "they",
    "them", "their", "what", "which", "who", "whom", "up", "about", "get",
    "like", "also", "back", "even", "still", "way", "take", "come", "make",
    "know", "think", "see", "go", "got", "really", "much", "any", "one",
    "two", "new", "want", "say", "said", "right", "well", "going", "been",
    "since", "though", "because", "re", "ve", "ll", "amp", "gt", "lt",
    "http", "https", "www", "com", "reddit", "submitted", "link", "comments",
    "deleted", "removed", "href", "span", "div", "class", "old", "org",
    "wiki", "html", "faq", "read", "post", "sure", "feel", "free", "rule",
    "info", "check", "please", "note", "subreddit", "moderator", "bot",
    "thread", "daily", "weekly", "welcome", "question", "questions",
    "help", "looking", "anyone", "people", "things", "thing", "time",
    "started", "start", "best", "good", "great", "bad", "long", "day",
    "days", "week", "weeks", "month", "months", "year", "years", "first",
    "january", "february", "march", "april", "may", "june", "july",
    "august", "september", "october", "november", "december",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
    "simple", "rant", "moronic", "daily", "victory",
}

MIN_WORD_LENGTH = 3


def extract_topics(texts: list[tuple[str, int]]) -> list[TrendTopic]:
    bigram_counter: Counter = Counter()
    bigram_engagement: Counter = Counter()
    word_counter: Counter = Counter()
    word_engagement: Counter = Counter()

    for post_text, engagement in texts:
        cleaned = re.sub(r"[^a-zA-Z\s]", " ", post_text.lower())
        words = [w for w in cleaned.split() if w not in STOP_WORDS and len(w) >= MIN_WORD_LENGTH]

        unique_words = set(words)
        for w in unique_words:
            word_counter[w] += 1
            word_engagement[w] += engagement

        for i in range(len(words) - 1):
            bigram = f"{words[i]} {words[i+1]}"
            bigram_counter[bigram] += 1
            bigram_engagement[bigram] += engagement

    topics: list[TrendTopic] = []

    for bigram, count in bigram_counter.most_common(20):
        if count >= 2:
            topics.append(TrendTopic(
                topic=bigram,
                count=count,
                total_engagement=bigram_engagement[bigram],
            ))

    if len(topics) < 5:
        used_words = set()
        for t in topics:
            used_words.update(t.topic.split())

        for word, count in word_counter.most_common(30):
            if word in used_words:
                continue
            if count >= 2:
                topics.append(TrendTopic(
                    topic=word,
                    count=count,
                    total_engagement=word_engagement[word],
                ))
                used_words.add(word)
            if len(topics) >= 10:
                break

    topics.sort(key=lambda t: (t.count * 2 + t.total_engagement), reverse=True)
    return topics[:5]


@router.get("/", response_model=TrendsResponse)
def get_trends(db: Session = Depends(get_db)):
    rows = db.execute(
        sql_text("SELECT title, engagement FROM reddit_posts WHERE title != '' ORDER BY created_at DESC LIMIT 200")
    ).fetchall()

    texts = [(row[0], row[1]) for row in rows]
    trends = extract_topics(texts)
    return TrendsResponse(trends=trends)
