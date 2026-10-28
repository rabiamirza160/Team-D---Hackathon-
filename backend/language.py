import re

# Common short words that strongly signal each language
FRENCH_WORDS = {
    "comment", "je", "est", "quel", "quels", "quelle", "quelles", "pour", "une",
    "des", "les", "le", "la", "du", "mon", "ma", "mes", "obtenir", "faire",
    "demande", "demander", "besoin", "où", "quoi", "pourquoi", "combien",
    "dois", "puis", "peux", "vous", "nous", "avec", "sans", "dans", "carte",
    "santé", "permis", "conduire", "papiers", "documents", "ai", "suis",
}
ENGLISH_WORDS = {
    "how", "do", "does", "the", "what", "where", "when", "which", "why",
    "need", "for", "my", "can", "is", "to", "get", "apply", "i", "you",
    "card", "health", "licence", "license", "driver", "documents", "am",
}
FRENCH_ACCENTS = re.compile(r"[àâçéèêëîïôûùüÿœ]")


def detect_language(text: str, fallback: str = "en") -> str:
    """Return 'en' or 'fr' based on the text. Uses fallback when it can't tell."""
    lowered = text.lower()
    words = re.findall(r"[a-zàâçéèêëîïôûùüÿœ]+", lowered)

    fr_score = sum(1 for w in words if w in FRENCH_WORDS)
    en_score = sum(1 for w in words if w in ENGLISH_WORDS)
    fr_score += min(len(FRENCH_ACCENTS.findall(lowered)), 3)  # accents are a strong hint

    if fr_score > en_score:
        return "fr"
    if en_score > fr_score:
        return "en"
    return fallback