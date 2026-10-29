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

CHUNK_WORDS = 180     # target chunk size
OVERLAP_WORDS = 40    # words repeated between neighbouring chunks
MIN_CHUNK_WORDS = 25  # drop tiny leftovers

# The scraper glued words together ("MenuContent", "2025Processing", "apply.Depending").
# Split wherever a lowercase letter, digit or punctuation is directly followed by a capital.
SEGMENT_SPLIT = re.compile(r"(?<=[a-z0-9.?!:)])(?=[A-Z])")

FR_HINTS = [" le ", " la ", " les ", " des ", " est ", " pour ", " vous ", " votre "]
EN_HINTS = [" the ", " and ", " you ", " for ", " is ", " your ", " are "]


def to_segments(text: str) -> list[str]:
    """Fix encoding, then split the glued page text into short segments."""
    text = fix_text(text).replace("\u00a0", " ")
    parts = SEGMENT_SPLIT.split(text)
    return [re.sub(r"\s+", " ", p).strip() for p in parts if p.strip()]


def find_boilerplate(pages: list[list[str]]) -> set[str]:
    """Segments repeated across many pages of the same site are menus/footers, not content."""
    n = len(pages)
    counts = Counter()
    for segments in pages:
        counts.update(set(segments))
    return {
        seg
        for seg, c in counts.items()
        if c >= max(3, 0.3 * n) or (c >= 4 and len(seg) < 60)
    }


def page_title(url: str, metadata) -> str:
    """Use the page title from metadata if there is one, otherwise build one from the URL."""
    if isinstance(metadata, dict):
        for key in ("title", "og:title", "Title"):
            if metadata.get(key):
                return fix_text(str(metadata[key])).split("|")[0].strip()
    parts = [p for p in url.split("/") if p and p != "index.html"]
    slug = re.sub(r"\.(html?|php|aspx)$", "", parts[-1])
    if len(slug) <= 4:  # e.g. ".../msa/" is the program home page
        return "Overview"
    return slug.replace("-", " ").replace("_", " ").capitalize()


def detect_lang(text: str) -> str:
    t = f" {text.lower()} "
    fr = sum(t.count(w) for w in FR_HINTS)
    en = sum(t.count(w) for w in EN_HINTS)
    return "fr" if fr > en else "en"


def chunk_lines(lines: list[str]) -> list[str]:
    """Pack lines into ~CHUNK_WORDS chunks, repeating a little overlap between chunks."""
    # Break any single very long line into word windows first
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
            # Carry the last few lines into the next chunk as overlap
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
    all_chunks = []
    seen_pages = set()

    for filename, program in SOURCES.items():
        path = RAW_DIR / filename
        if not path.exists():
            print(f"Skipping {filename} (not found)")
            continue

        data = json.loads(path.read_text(encoding="utf-8"))
        urls = list(data.keys())
        pages = [to_segments(data[u].get("text", "")) for u in urls]
        boilerplate = find_boilerplate(pages)

        kept = 0
        for url, segments in zip(urls, pages):
            lines = [s for s in segments if s not in boilerplate]
            body = "\n".join(lines)
            if len(body.split()) < MIN_CHUNK_WORDS:
                continue

            # The same page sometimes appears under two URLs (with/without index.html)
            digest = hashlib.md5(body.encode("utf-8")).hexdigest()
            if digest in seen_pages:
                continue
            seen_pages.add(digest)

            title = f"{program} - {page_title(url, data[url].get('metadata'))}"
            lang = detect_lang(body)

            for text in chunk_lines(lines):
                all_chunks.append({
                    "id": f"{Path(filename).stem}-{len(all_chunks):05d}",
                    "text": text,
                    "title": title,
                    "url": url,
                    "lang": lang,
                    "program": program,
                })
            kept += 1

        print(f"{program}: kept {kept}/{len(urls)} pages, removed {len(boilerplate)} boilerplate segments")

    with OUT_FILE.open("w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print(f"\nWrote {len(all_chunks)} chunks to {OUT_FILE}")


if __name__ == "__main__":
    main()