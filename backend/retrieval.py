"""
Search over the real scraped data using BM25 keyword ranking.
Chunks come from data/chunks.jsonl, built by data/ingest.py.
"""
import json
import re
from pathlib import Path

from rank_bm25 import BM25Okapi

CHUNKS_FILE = Path(__file__).resolve().parent.parent / "data" / "chunks.jsonl"

MAX_PER_PAGE = 2             # avoid filling results with chunks from one page
OTHER_PROVINCE_WEIGHT = 0.6  # when no province is named, prefer Manitoba (our focus)
MIN_COVERAGE = 0.5           # a result must match at least half of the question's important words
RELATIVE_CUTOFF = 0.35       # drop results scoring far below the best one

# Common words that don't help find the right page
STOPWORDS = {
    # English
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are", "be",
    "do", "does", "i", "me", "my", "you", "your", "it", "this", "that", "what", "how",
    "can", "with", "at", "by", "from", "as", "if", "am", "was", "will", "about",
    # French
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "en", "est", "je",
    "mon", "ma", "mes", "vous", "votre", "pour", "que", "qui", "quel", "quels",
    "quelle", "comment", "il", "elle", "au", "aux", "dans", "sur", "avec",
}


def tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-zàâçéèêëîïôûùüÿœ0-9]+", text.lower())
    result = []
    for t in tokens:
        if len(t) < 2 or t in STOPWORDS:
            continue
        if len(t) > 4 and t.endswith("s"):  # crude plural handling: loans -> loan
            t = t[:-1]
        result.append(t)
    return result


def _load():
    if not CHUNKS_FILE.exists():
        print(f"WARNING: {CHUNKS_FILE} not found. Run: python3 data/ingest.py")
        return [], None, []
    with CHUNKS_FILE.open(encoding="utf-8") as f:
        chunks = [json.loads(line) for line in f if line.strip()]
    # Index the title too, so "Saskatchewan" or "income support" matches the right program
    corpus = [tokenize(f"{c['title']} {c['text']}") for c in chunks]
    print(f"Loaded {len(chunks)} chunks for search")
    return chunks, BM25Okapi(corpus), [set(doc) for doc in corpus]


CHUNKS, BM25, CHUNK_WORDS = _load()


def _province_rule(query: str):
    """Which province the person is asking about: 'mb', 'sk', 'both', or None."""
    q = query.lower()
    sk = "saskatchewan" in q or re.search(r"\bsask\b", q) is not None
    mb = "manitoba" in q
    if sk and mb:
        return "both"
    if sk:
        return "sk"
    if mb:
        return "mb"
    return None


def _term_weights(terms: set[str]) -> dict[str, float]:
    """
    How important each question word is. Rare words (like 'passport') matter most.
    Words that never appear in our data get the highest weight, because if the
    question is about something we don't have, results shouldn't pretend to match.
    Short unknown words (typos, 'pls') are ignored.
    """
    idf = BM25.idf
    max_idf = max(idf.values())
    weights = {}
    for t in terms:
        if t in idf:
            weights[t] = max(idf[t], 0.0)
        elif len(t) >= 4:
            weights[t] = max_idf
    return weights


def search(query: str, k: int = 5) -> list[dict]:
    """Return up to k chunks most relevant to the query: [{text, title, url, lang, ...}]."""
    if BM25 is None:
        return []
    tokens = tokenize(query)
    if not tokens:
        return []

    weights = _term_weights(set(tokens))
    total_weight = sum(weights.values())
    if total_weight == 0:
        return []

    scores = list(BM25.get_scores(tokens))
    rule = _province_rule(query)

    for i, chunk in enumerate(CHUNKS):
        # Must cover enough of the important words, not just "apply" or "documents"
        matched = sum(w for t, w in weights.items() if t in CHUNK_WORDS[i])
        if matched / total_weight < MIN_COVERAGE:
            scores[i] = 0
            continue

        is_sk = chunk.get("program", "").startswith("Saskatchewan")
        if rule == "sk" and not is_sk:
            scores[i] = 0      # asked about Saskatchewan: hide Manitoba
        elif rule == "mb" and is_sk:
            scores[i] = 0      # asked about Manitoba: hide Saskatchewan
        elif rule is None and is_sk:
            scores[i] *= OTHER_PROVINCE_WEIGHT  # no province named: prefer Manitoba

    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    if not ranked or scores[ranked[0]] <= 0:
        return []
    cutoff = scores[ranked[0]] * RELATIVE_CUTOFF

    results, per_page = [], {}
    for i in ranked:
        if scores[i] <= 0 or scores[i] < cutoff or len(results) >= k:
            break
        url = CHUNKS[i]["url"]
        if per_page.get(url, 0) >= MAX_PER_PAGE:
            continue
        per_page[url] = per_page.get(url, 0) + 1
        results.append(CHUNKS[i])
    return results