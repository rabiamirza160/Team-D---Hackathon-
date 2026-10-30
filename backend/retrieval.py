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
TITLE_WEIGHT = 1.5           # page titles are often the question itself ("What information do I need?")

# Common words that don't help find the right page
STOPWORDS = {
    # English
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are", "be",
    "do", "does", "i", "me", "my", "you", "your", "it", "this", "that", "what", "how",
    "can", "with", "at", "by", "from", "as", "if", "am", "was", "will", "about",
    # Conversational / hardship phrasing — high IDF would otherwise kill coverage
    "lost", "lose", "losing", "afford", "need", "needs", "needed", "help", "please",
    "cant", "cannot", "unable", "really", "just", "still", "also", "someone",
    "anyone", "having", "have", "has", "had", "get", "got", "make", "made",
    "behind", "broke", "struggling", "struggle", "hard", "time", "times",
    "anymore", "currently", "lately",
    # French
    "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "en", "est", "je",
    "mon", "ma", "mes", "vous", "votre", "pour", "que", "qui", "quel", "quels",
    "quelle", "comment", "il", "elle", "au", "aux", "dans", "sur", "avec",
    "perdu", "perdre", "besoin", "aide", "peux", "puis", "plus", "sans",
}

# Everyday asks → program terms that exist in our scraped pages
_INTENT_EXPANSIONS = [
    (
        re.compile(
            r"\b(rent|loyer|housing|logement|landlord|propri[eé]taire)\b|"
            r"\b(can'?t|cannot|unable|afford|struggle|struggling|behind)\b.{0,48}"
            r"\b(rent|loyer|housing|pay|bills|loyer)\b|"
            r"\b(rent|loyer)\b.{0,48}\b(afford|pay|cover|help|aide)\b",
            re.I,
        ),
        "Rent Assist Manitoba income assistance housing rent",
    ),
    (
        re.compile(
            r"\b(lost (my |our )?job|laid off|layoff|unemployed|out of work|"
            r"no (more )?work|fired|job loss|perte d.?emploi|ch[oô]mage|sans emploi)\b",
            re.I,
        ),
        "Employment and Income Assistance Manitoba EIA",
    ),
    (
        re.compile(
            r"\b(need (help|assistance|support)|aide (pour|au)|no money|"
            r"can'?t (pay|afford)|cannot (pay|afford))\b",
            re.I,
        ),
        "Manitoba Employment and Income Assistance income support",
    ),
]


def expand_query(query: str) -> str:
    """Append program keywords when the ask uses everyday hardship wording."""
    extras = []
    seen = set()
    for pattern, addition in _INTENT_EXPANSIONS:
        if pattern.search(query) and addition not in seen:
            extras.append(addition)
            seen.add(addition)
    if not extras:
        return query
    return f"{query} {' '.join(extras)}"


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
        return [], None, None, []
    with CHUNKS_FILE.open(encoding="utf-8") as f:
        chunks = [json.loads(line) for line in f if line.strip()]
    # Body index includes the title, so "Saskatchewan" or "income support" matches the right program
    corpus = [tokenize(f"{c['title']} {c['text']}") for c in chunks]
    # Separate title index, so a page titled like the question gets a boost
    titles = [tokenize(c["title"]) for c in chunks]
    print(f"Loaded {len(chunks)} chunks for search")
    return chunks, BM25Okapi(corpus), BM25Okapi(titles), [set(doc) for doc in corpus]


CHUNKS, BM25, TITLE_BM25, CHUNK_WORDS = _load()


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
    expanded = expand_query(query)
    tokens = tokenize(expanded)
    if not tokens:
        return []

    weights = _term_weights(set(tokens))
    total_weight = sum(weights.values())
    if total_weight == 0:
        return []

    body_scores = BM25.get_scores(tokens)
    title_scores = TITLE_BM25.get_scores(tokens)
    rule = _province_rule(expanded)

    scores = []
    for i, chunk in enumerate(CHUNKS):
        # Must cover enough of the important words, not just "apply" or "documents"
        matched = sum(w for t, w in weights.items() if t in CHUNK_WORDS[i])
        if matched / total_weight < MIN_COVERAGE:
            scores.append(0.0)
            continue

        score = body_scores[i] + TITLE_WEIGHT * title_scores[i]

        is_sk = chunk.get("program", "").startswith("Saskatchewan")
        if rule == "sk" and not is_sk:
            score = 0.0      # asked about Saskatchewan: hide Manitoba
        elif rule == "mb" and is_sk:
            score = 0.0      # asked about Manitoba: hide Saskatchewan
        elif rule is None and is_sk:
            score *= OTHER_PROVINCE_WEIGHT  # no province named: prefer Manitoba

        scores.append(score)

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