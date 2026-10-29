import { QUESTIONS, START_QUESTION_ID } from "./questions";

/** Prefer English option objects — tags are shared across locales. */
function option(questionId, optionId) {
  const q = QUESTIONS[questionId];
  return q?.en?.options?.find((o) => o.id === optionId) || null;
}

function route(path, answerEntries, extraTags = {}) {
  const answers = {};
  for (const [questionId, optionId] of answerEntries) {
    const opt = option(questionId, optionId);
    if (opt) answers[questionId] = opt;
  }
  return { path, answers, extraTags };
}

/**
 * Map a free-text query to a seeded stack path scoped to /data services:
 * Student Aid (MB/SK) and Manitoba Employment & Income Assistance (EIA).
 *
 * When the query already implies Student Aid or EIA, "need" is stored in
 * answers for the profile but omitted from the visible path so the first
 * card is a real follow-up.
 */
export function routeQuery(rawQuery) {
  const query = (rawQuery || "").trim();
  const q = query.toLowerCase();

  if (!q) {
    return {
      path: [START_QUESTION_ID],
      answers: {},
      extraTags: {},
      query: "",
    };
  }

  const extraTags = { query };

  // —— Out of scope (no data yet) → start guided chooser, keep the ask ——
  if (
    /\b(passport|passeport|health card|carte sant[eé]|sin\b|nas\b|driver'?s? licen[cs]e|permis de conduire)\b/.test(
      q
    )
  ) {
    return {
      path: [START_QUESTION_ID],
      answers: {},
      extraTags: {
        ...extraTags,
        note: "query may be outside current Student Aid / EIA data",
      },
      query,
    };
  }

  // —— Student Aid ——
  const isStudent =
    /\b(student aid|aide aux [eé]tudiants|student loan|prêt [eé]tudiant|pret etudiant|bursar|scholarship|grant|bourse|msa|saskatchewan student|manitoba student)\b/.test(
      q
    ) || /\b(student|étudiant|etudiant)\b/.test(q);

  if (isStudent) {
    const isSk = /\b(saskatchewan|sask\b|sk\b)\b/.test(q);
    const isMb = /\b(manitoba|mb\b)\b/.test(q);

    let provinceId = null;
    if (isSk && !isMb) provinceId = "sk";
    if (isMb && !isSk) provinceId = "mb";

    let goalId = null;
    if (/\b(repay|rembours|forgiveness|exon[eé]ration)\b/.test(q)) goalId = "repay";
    else if (/\b(in school|already|managing|funds|fonds|account)\b/.test(q))
      goalId = "inschool";
    else if (/\b(apply|application|demande|what (do|information)|documents?)\b/.test(q))
      goalId = "apply";
    else if (/\b(eligib|qualif|admissib|plan|planning|avenir)\b/.test(q)) goalId = "plan";

    if (provinceId && goalId) {
      return {
        ...route(
          ["student_province", "student_goal", "student_situation"],
          [
            ["need", "student"],
            ["student_province", provinceId],
            ["student_goal", goalId],
          ],
          extraTags
        ),
        query,
      };
    }

    if (provinceId) {
      return {
        ...route(
          ["student_province", "student_goal"],
          [
            ["need", "student"],
            ["student_province", provinceId],
          ],
          extraTags
        ),
        query,
      };
    }

    return {
      ...route(
        ["student_province"],
        [["need", "student"]],
        goalId ? { ...extraTags, intent_hint: goalId } : extraTags
      ),
      query,
    };
  }

  // —— EIA / Income support / Rent Assist / “EI” as users often type ——
  const isEia =
    /\b(eia|income support|income assistance|aide au revenu|aide à l.?emploi|aide a l.?emploi|rent assist|aide au loyer|employment and income|disability support|finding work)\b/.test(
      q
    ) ||
    // bare "ei" / "ae" — scoped to our EIA data, not federal EI
    /(^|\s)(ei|e\.i\.|ae)(\s|$)/.test(q);

  if (isEia) {
    let goalId = null;
    if (/\b(rent|loyer|housing|logement)\b/.test(q)) goalId = "rent";
    else if (/\b(work|job|emploi|finding work)\b/.test(q)) goalId = "work";
    else if (/\b(disabilit|handicap)\b/.test(q)) goalId = "disability";
    else if (/\b(eligib|admissib|info|what is)\b/.test(q)) goalId = "info";
    else if (/\b(apply|application|demande)\b/.test(q)) goalId = "apply";

    if (goalId) {
      return {
        ...route(
          ["eia_goal", "eia_household"],
          [
            ["need", "eia"],
            ["eia_goal", goalId],
          ],
          extraTags
        ),
        query,
      };
    }

    return {
      ...route(["eia_goal"], [["need", "eia"]], extraTags),
      query,
    };
  }

  // Fallback — let the user pick Student Aid vs EIA
  return {
    path: [START_QUESTION_ID],
    answers: {},
    extraTags,
    query,
  };
}

export const SEARCH_SUGGESTIONS = {
  en: [
    "How do I apply for Manitoba Student Aid?",
    "Saskatchewan student loans",
    "Rent Assist",
    "Employment and Income Assistance",
  ],
  fr: [
    "Comment demander l’aide aux étudiants du Manitoba ?",
    "Prêts étudiants de la Saskatchewan",
    "Aide au loyer",
    "Aide à l’emploi et au revenu",
  ],
};
