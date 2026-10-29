"""
Turns the scraped JSON in data/raw/ into clean, searchable chunks in data/chunks.jsonl.

Run from the repo root (with the backend venv active):
    python3 data/ingest.py
"""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from ftfy import fix_text

DATA_DIR = Path(__file__).resolve().parent
RAW_DIR = DATA_DIR / "raw"
OUT_FILE = DATA_DIR / "chunks.jsonl"

# Raw file -> program name shown in source titles
SOURCES = {
    "manitobaStudentAid.json": "Manitoba Student Aid",
    "manitobaIncomeSupport.json": "Manitoba Income Support",
    "saskatchewanStudentAid.json": "Saskatchewan Student Aid",
}

# Pages that are only navigation/promo banners, not program content
SKIP_URLS = {
    "https://www.gov.mb.ca/index.html",
}

CHUNK_WORDS = 180     # target chunk size
OVERLAP_WORDS = 40    # words repeated between neighbouring chunks
MIN_CHUNK_WORDS = 25  # drop tiny leftovers

SHINGLE_WORDS = 8     # a run of this many words...
SHINGLE_MIN_PAGES = 4 # ...repeated on this many pages is a menu/footer, not content

# The scraper glued words together ("MenuContent", "2025Processing", "apply.Depending").
# Split wherever a lowercase letter, digit or punctuation is directly followed by a capital.
SEGMENT_SPLIT = re.compile(r"(?<=[a-z0-9.?!:)])(?=[A-Z])")

FR_HINTS = [" le ", " la ", " les ", " des ", " est ", " pour ", " vous ", " votre "]
EN_HINTS = [" the ", " and ", " you ", " for ", " is ", " your ", " are "]

# Site names that get tacked onto page titles
TITLE_SUFFIXES = [" - Province of Manitoba", " - Government of Saskatchewan", " | Province of Manitoba"]
GENERIC_TITLES = {"province of manitoba", "government of saskatchewan", "residents portal", ""}


def to_segments(text: str) -> list[str]:
    """Fix encoding, then split the glued page text into short segments."""
    text = fix_text(text).replace("\u00a0", " ")
    parts = SEGMENT_SPLIT.split(text)
    return [re.sub(r"\s+", " ", p).strip() for p in parts if p.strip()]


def find_boilerplate(pages: list[list[str]]) -> set[str]:
    """Pass 1: whole segments repeated across many pages of the same site."""
    n = len(pages)
    counts = Counter()
    for segments in pages:
        counts.update(set(segments))
    return {
        seg
        for seg, c in counts.items()
        if c >= max(3, 0.3 * n) or (c >= 4 and len(seg) < 60)
    }


def remove_repeated_runs(pages_lines: list[list[str]]) -> list[list[str]]:
    """
    Pass 2: remove any run of SHINGLE_WORDS words that appears on SHINGLE_MIN_PAGES+ pages.
    Catches menus and footers that weren't glued together (normal spaces), across all sites.
    """
    page_words = []
    for lines in pages_lines:
        words = []
        for line_idx, line in enumerate(lines):
            for w in line.split():
                words.append((line_idx, w))
        page_words.append(words)

    counts = Counter()
    for words in page_words:
        toks = [w.lower() for _, w in words]
        shingles = {tuple(toks[i : i + SHINGLE_WORDS]) for i in range(len(toks) - SHINGLE_WORDS + 1)}
        counts.update(shingles)
    frequent = {s for s, c in counts.items() if c >= SHINGLE_MIN_PAGES}

    cleaned = []
    for words in page_words:
        toks = [w.lower() for _, w in words]
        drop = [False] * len(words)
        for i in range(len(toks) - SHINGLE_WORDS + 1):
            if tuple(toks[i : i + SHINGLE_WORDS]) in frequent:
                for j in range(i, i + SHINGLE_WORDS):
                    drop[j] = True
        kept_lines = {}
        for (line_idx, w), dropped in zip(words, drop):
            if not dropped:
                kept_lines.setdefault(line_idx, []).append(w)
        cleaned.append([" ".join(kept_lines[i]) for i in sorted(kept_lines)])
    return cleaned


def page_title(url: str, metadata, program: str) -> str:
    """Page title from metadata (minus repeated site names), otherwise built from the URL."""
    if isinstance(metadata, dict):
        for key in ("title", "og:title", "Title"):
            if metadata.get(key):
                title = fix_text(str(metadata[key])).strip()
                for suffix in TITLE_SUFFIXES + [f" - {program}", f" | {program}"]:
                    if title.endswith(suffix):
                        title = title[: -len(suffix)].strip()
                title = title.split("|")[0].strip()
                if title.lower() not in GENERIC_TITLES and title.lower() != program.lower():
                    return title
    parts = [p for p in url.split("?")[0].split("/") if p and p != "index.html"]
    slug = re.sub(r"\.(html?|php|aspx|pdf)$", "", parts[-1])
    if len(slug) <= 4:  # e.g. ".../msa/" or ".../eia/" is the program home page
        return "Overview"
    return slug.replace("-", " ").replace("_", " ").capitalize()


def detect_lang(text: str) -> str:
    t = f" {text.lower()} "
    fr = sum(t.count(w) for w in FR_HINTS)
    en = sum(t.count(w) for w in EN_HINTS)
    return "fr" if fr > en else "en"


def chunk_lines(lines: list[str]) -> list[str]:
    """Pack lines into ~CHUNK_WORDS chunks, repeating a little overlap between chunks."""
    pieces = []
    for line in lines:
        words = line.split()
        if len(words) <= CHUNK_WORDS:
            pieces.append(line)
        else:
            step = CHUNK_WORDS - OVERLAP_WORDS
            for i in range(0, len(words), step):
                pieces.append(" ".join(words[i : i + CHUNK_WORDS]))

    chunks, current, count = [], [], 0
    for piece in pieces:
        n = len(piece.split())
        if current and count + n > CHUNK_WORDS:
            chunks.append("\n".join(current))
            overlap, overlap_words = [], 0
            for prev in reversed(current):
                w = len(prev.split())
                if overlap_words + w > OVERLAP_WORDS:
                    break
                overlap.insert(0, prev)
                overlap_words += w
            current, count = overlap, overlap_words
        current.append(piece)
        count += n
    if current:
        chunks.append("\n".join(current))

    return [c for c in chunks if len(c.split()) >= MIN_CHUNK_WORDS]


def main():
    # ---- Load every page and apply per-site cleaning (pass 1) ----
    pages = []  # dicts: url, program, file stem, metadata, lines
    for filename, program in SOURCES.items():
        path = RAW_DIR / filename
        if not path.exists():
            print(f"Skipping {filename} (not found)")
            continue

        data = json.loads(path.read_text(encoding="utf-8"))
        urls = [u for u in data.keys() if u not in SKIP_URLS]
        segments = [to_segments(data[u].get("text", "")) for u in urls]
        boilerplate = find_boilerplate(segments)

        for url, segs in zip(urls, segments):
            pages.append({
                "url": url,
                "program": program,
                "stem": Path(filename).stem,
                "metadata": data[url].get("metadata"),
                "lines": [s for s in segs if s not in boilerplate],
            })
        print(f"{program}: {len(urls)} pages, {len(boilerplate)} boilerplate segments removed (pass 1)")

    # ---- Remove repeated menus/footers across all sites (pass 2) ----
    cleaned = remove_repeated_runs([p["lines"] for p in pages])
    for page, lines in zip(pages, cleaned):
        page["lines"] = [l for l in lines if l.strip()]

    # ---- Deduplicate pages and chunk ----
    all_chunks, seen_pages, kept = [], set(), Counter()
    for page in pages:
        body = "\n".join(page["lines"])
        if len(body.split()) < MIN_CHUNK_WORDS:
            continue

        # The same page sometimes appears under two URLs (with/without index.html)
        digest = hashlib.md5(body.encode("utf-8")).hexdigest()
        if digest in seen_pages:
            continue
        seen_pages.add(digest)

        title = f"{page['program']} - {page_title(page['url'], page['metadata'], page['program'])}"
        lang = detect_lang(body)

        for text in chunk_lines(page["lines"]):
            all_chunks.append({
                "id": f"{page['stem']}-{len(all_chunks):05d}",
                "text": text,
                "title": title,
                "url": page["url"],
                "lang": lang,
                "program": page["program"],
            })
        kept[page["program"]] += 1

    with OUT_FILE.open("w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print()
    for program, n in kept.items():
        print(f"{program}: kept {n} pages")
    print(f"\nWrote {len(all_chunks)} chunks to {OUT_FILE}")


if __name__ == "__main__":
    main()