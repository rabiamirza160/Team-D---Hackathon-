import re

# SAMPLE DATA ONLY, so the API works before the real data is ready.
# The data/retrieval teammate replaces this file's contents with real search.
# Keep the search() signature and the chunk keys (text, title, url, lang) the same.
SAMPLE_CHUNKS = [
    {
        "text": "Sample: information about registering for Manitoba Health coverage "
                "and getting a health card.",
        "title": "Manitoba Health Registration",
        "url": "https://www.gov.mb.ca/health/mhsip/",
        "lang": "en",
    },
    {
        "text": "Sample: information about driver licences and vehicle registration "
                "in Manitoba.",
        "title": "Manitoba Public Insurance - Driver Licensing",
        "url": "https://www.mpi.mb.ca",
        "lang": "en",
    },
    {
        "text": "Sample: information about ordering birth, marriage, and death "
                "certificates in Manitoba.",
        "title": "Manitoba Vital Statistics",
        "url": "https://vitalstats.gov.mb.ca",
        "lang": "en",
    },
]


def search(query: str, k: int = 5) -> list[dict]:
    """Return up to k chunks relevant to the query. Placeholder: simple keyword match."""
    words = {w for w in re.findall(r"\w+", query.lower()) if len(w) > 2}
    scored = []
    for chunk in SAMPLE_CHUNKS:
        haystack = f"{chunk['title']} {chunk['text']}".lower()
        score = sum(1 for w in words if w in haystack)
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [chunk for _, chunk in scored[:k]]