// Branching question tree scoped to services present in /data:
// - Student Aid (Manitoba + Saskatchewan)
// - Employment & Income Assistance / income support (Manitoba EIA)

export const COPY = {
  en: {
    brand: "GovernmentGuide AI",
    tagline:
      "Ask about Student Aid or Employment & Income Assistance, then answer a few follow-ups so we can match the right forms.",
    searchPlaceholder: "Ask a question — e.g. student aid, EIA, rent assist…",
    searchSubmit: "Find forms",
    searchHint: "Or try:",
    profileLabel: "Your profile",
    stepLabel: "Question",
    answered: "Answered",
    back: "Go back",
    resultsTitle: "Your recommended forms",
    resultsLoading: "Finding the right forms for you…",
    resultsError: "We couldn’t reach the server. Please try again.",
    resultsEmpty: "No matching forms yet — try restarting with a different path.",
    restart: "Start over",
    task: "What to do",
    form: "Form / service",
    openLink: "Open official page",
    situationPrefix: "My situation:",
  },
  fr: {
    brand: "GovernmentGuide AI",
    tagline:
      "Posez une question sur l’aide aux étudiants ou l’aide à l’emploi et au revenu, puis répondez à quelques suivis pour trouver les bons formulaires.",
    searchPlaceholder: "Posez une question — ex. aide aux étudiants, EIA, aide au loyer…",
    searchSubmit: "Trouver",
    searchHint: "Ou essayez :",
    profileLabel: "Votre profil",
    stepLabel: "Question",
    answered: "Répondu",
    back: "Retour",
    resultsTitle: "Formulaires recommandés",
    resultsLoading: "Recherche des formulaires adaptés…",
    resultsError: "Impossible de joindre le serveur. Réessayez.",
    resultsEmpty: "Aucun formulaire trouvé — recommencez avec un autre parcours.",
    restart: "Recommencer",
    task: "À faire",
    form: "Formulaire / service",
    openLink: "Ouvrir la page officielle",
    situationPrefix: "Ma situation :",
  },
};

export const QUESTIONS = {
  need: {
    id: "need",
    color: "#0A4D68",
    accent: "#E8A838",
    en: {
      title: "What do you need help with?",
      prompt:
        "Right now we cover Student Aid and Employment & Income Assistance (EIA) — the services in our current data.",
      options: [
        {
          id: "student",
          label: "Student Aid (loans, grants, bursaries)",
          next: "student_province",
          tags: { topic: "student aid" },
        },
        {
          id: "eia",
          label: "Employment & Income Assistance (EIA)",
          next: "eia_goal",
          tags: { topic: "employment and income assistance" },
        },
      ],
    },
    fr: {
      title: "De quoi avez-vous besoin ?",
      prompt:
        "Pour l’instant, nous couvrons l’aide aux étudiants et l’aide à l’emploi et au revenu (EIA) — les services de nos données actuelles.",
      options: [
        {
          id: "student",
          label: "Aide aux étudiants (prêts, bourses, subventions)",
          next: "student_province",
          tags: { topic: "student aid" },
        },
        {
          id: "eia",
          label: "Aide à l’emploi et au revenu (EIA)",
          next: "eia_goal",
          tags: { topic: "employment and income assistance" },
        },
      ],
    },
  },

  student_province: {
    id: "student_province",
    color: "#1B4F72",
    accent: "#F0C75E",
    en: {
      title: "Which province’s student aid?",
      prompt: "We have Manitoba Student Aid and Saskatchewan Student Aid in our data.",
      options: [
        {
          id: "mb",
          label: "Manitoba Student Aid",
          next: "student_goal",
          tags: { province: "Manitoba", program: "Manitoba Student Aid" },
        },
        {
          id: "sk",
          label: "Saskatchewan Student Aid",
          next: "student_goal",
          tags: { province: "Saskatchewan", program: "Saskatchewan Student Aid" },
        },
      ],
    },
    fr: {
      title: "Aide aux étudiants de quelle province ?",
      prompt:
        "Nous avons l’Aide aux étudiants du Manitoba et l’Aide aux étudiants de la Saskatchewan.",
      options: [
        {
          id: "mb",
          label: "Aide aux étudiants du Manitoba",
          next: "student_goal",
          tags: { province: "Manitoba", program: "Manitoba Student Aid" },
        },
        {
          id: "sk",
          label: "Aide aux étudiants de la Saskatchewan",
          next: "student_goal",
          tags: { province: "Saskatchewan", program: "Saskatchewan Student Aid" },
        },
      ],
    },
  },

  student_goal: {
    id: "student_goal",
    color: "#146C7A",
    accent: "#7EC8C4",
    en: {
      title: "Where are you in the student aid process?",
      prompt: "This points us at apply, manage, or repay pages.",
      options: [
        {
          id: "plan",
          label: "Planning / checking if I qualify",
          next: "student_situation",
          tags: { intent: "plan and check eligibility for student aid" },
        },
        {
          id: "apply",
          label: "Applying — what do I need?",
          next: "student_situation",
          tags: { intent: "apply for student aid" },
        },
        {
          id: "inschool",
          label: "Already in school / managing funds",
          next: "student_situation",
          tags: { intent: "manage student aid while in school" },
        },
        {
          id: "repay",
          label: "Repaying loans or loan forgiveness",
          next: "student_situation",
          tags: { intent: "repay student loans or loan forgiveness" },
        },
      ],
    },
    fr: {
      title: "Où en êtes-vous dans le processus d’aide aux étudiants ?",
      prompt: "Cela oriente vers les pages de demande, de gestion ou de remboursement.",
      options: [
        {
          id: "plan",
          label: "Planification / vérifier mon admissibilité",
          next: "student_situation",
          tags: { intent: "plan and check eligibility for student aid" },
        },
        {
          id: "apply",
          label: "Je présente une demande — de quoi ai-je besoin ?",
          next: "student_situation",
          tags: { intent: "apply for student aid" },
        },
        {
          id: "inschool",
          label: "Déjà aux études / gérer mes fonds",
          next: "student_situation",
          tags: { intent: "manage student aid while in school" },
        },
        {
          id: "repay",
          label: "Rembourser un prêt ou exonération",
          next: "student_situation",
          tags: { intent: "repay student loans or loan forgiveness" },
        },
      ],
    },
  },

  student_situation: {
    id: "student_situation",
    color: "#244855",
    accent: "#E64833",
    en: {
      title: "Anything else about your situation?",
      prompt: "Optional context that often changes which forms apply.",
      options: [
        {
          id: "fulltime",
          label: "Full-time student",
          next: "results",
          tags: { student_status: "full-time student" },
        },
        {
          id: "parttime",
          label: "Part-time student",
          next: "results",
          tags: { student_status: "part-time student" },
        },
        {
          id: "disability",
          label: "I have a disability / need related supports",
          next: "results",
          tags: { student_status: "student with disability supports" },
        },
        {
          id: "general",
          label: "No extras — just the basics",
          next: "results",
          tags: { student_status: "general student aid inquiry" },
        },
      ],
    },
    fr: {
      title: "Autre chose à propos de votre situation ?",
      prompt: "Contexte optionnel qui change souvent les formulaires applicables.",
      options: [
        {
          id: "fulltime",
          label: "Études à temps plein",
          next: "results",
          tags: { student_status: "full-time student" },
        },
        {
          id: "parttime",
          label: "Études à temps partiel",
          next: "results",
          tags: { student_status: "part-time student" },
        },
        {
          id: "disability",
          label: "J’ai un handicap / besoin de soutiens liés",
          next: "results",
          tags: { student_status: "student with disability supports" },
        },
        {
          id: "general",
          label: "Rien de plus — juste l’essentiel",
          next: "results",
          tags: { student_status: "general student aid inquiry" },
        },
      ],
    },
  },

  eia_goal: {
    id: "eia_goal",
    color: "#2C5F2D",
    accent: "#97BC62",
    en: {
      title: "What do you need from Employment & Income Assistance?",
      prompt: "Our data covers Manitoba EIA, Rent Assist, and related employment supports.",
      options: [
        {
          id: "apply",
          label: "Apply for EIA / income assistance",
          next: "eia_household",
          tags: { intent: "apply for employment and income assistance" },
        },
        {
          id: "rent",
          label: "Rent Assist or housing help",
          next: "eia_household",
          tags: { intent: "rent assist application" },
        },
        {
          id: "work",
          label: "Finding work / employment supports",
          next: "eia_household",
          tags: { intent: "finding work employment supports" },
        },
        {
          id: "disability",
          label: "Disability supports",
          next: "eia_household",
          tags: { intent: "Manitoba supports for persons with disabilities" },
        },
        {
          id: "info",
          label: "General eligibility / program info",
          next: "eia_household",
          tags: { intent: "EIA eligibility information" },
        },
      ],
    },
    fr: {
      title: "De quoi avez-vous besoin concernant l’aide à l’emploi et au revenu ?",
      prompt:
        "Nos données couvrent l’EIA du Manitoba, l’aide au loyer et les soutiens à l’emploi liés.",
      options: [
        {
          id: "apply",
          label: "Demander l’EIA / l’aide au revenu",
          next: "eia_household",
          tags: { intent: "apply for employment and income assistance" },
        },
        {
          id: "rent",
          label: "Aide au loyer ou logement",
          next: "eia_household",
          tags: { intent: "rent assist application" },
        },
        {
          id: "work",
          label: "Trouver un emploi / soutiens à l’emploi",
          next: "eia_household",
          tags: { intent: "finding work employment supports" },
        },
        {
          id: "disability",
          label: "Soutiens pour personnes handicapées",
          next: "eia_household",
          tags: { intent: "Manitoba supports for persons with disabilities" },
        },
        {
          id: "info",
          label: "Admissibilité / info générale sur le programme",
          next: "eia_household",
          tags: { intent: "EIA eligibility information" },
        },
      ],
    },
  },

  eia_household: {
    id: "eia_household",
    color: "#5C3D2E",
    accent: "#E0C097",
    en: {
      title: "Who is this for?",
      prompt: "Household size often changes EIA and Rent Assist forms.",
      options: [
        {
          id: "self",
          label: "Just me",
          next: "eia_residency",
          tags: { household: "myself only" },
        },
        {
          id: "partner",
          label: "Me and a partner",
          next: "eia_residency",
          tags: { household: "myself and a partner" },
        },
        {
          id: "kids",
          label: "Me and kids / dependents",
          next: "eia_residency",
          tags: { household: "myself and dependents" },
        },
        {
          id: "family",
          label: "Whole family",
          next: "eia_residency",
          tags: { household: "whole family" },
        },
      ],
    },
    fr: {
      title: "Pour qui est-ce ?",
      prompt: "La taille du ménage change souvent les formulaires EIA et d’aide au loyer.",
      options: [
        {
          id: "self",
          label: "Seulement moi",
          next: "eia_residency",
          tags: { household: "myself only" },
        },
        {
          id: "partner",
          label: "Moi et un conjoint",
          next: "eia_residency",
          tags: { household: "myself and a partner" },
        },
        {
          id: "kids",
          label: "Moi et des enfants / personnes à charge",
          next: "eia_residency",
          tags: { household: "myself and dependents" },
        },
        {
          id: "family",
          label: "Toute la famille",
          next: "eia_residency",
          tags: { household: "whole family" },
        },
      ],
    },
  },

  eia_residency: {
    id: "eia_residency",
    color: "#0F2C3A",
    accent: "#F4A261",
    en: {
      title: "Are you a Manitoba resident?",
      prompt: "EIA and Rent Assist in our data are Manitoba programs.",
      options: [
        {
          id: "yes",
          label: "Yes — I live in Manitoba",
          next: "results",
          tags: {
            province: "Manitoba",
            residency: "Manitoba resident",
            program: "Employment and Income Assistance",
          },
        },
        {
          id: "moving",
          label: "Moving to Manitoba soon",
          next: "results",
          tags: {
            province: "Manitoba",
            residency: "moving to Manitoba",
            program: "Employment and Income Assistance",
          },
        },
        {
          id: "unsure",
          label: "Not sure / need general info",
          next: "results",
          tags: {
            province: "Manitoba",
            residency: "residency unclear",
            program: "Employment and Income Assistance",
          },
        },
      ],
    },
    fr: {
      title: "Êtes-vous résident du Manitoba ?",
      prompt: "L’EIA et l’aide au loyer dans nos données sont des programmes du Manitoba.",
      options: [
        {
          id: "yes",
          label: "Oui — j’habite au Manitoba",
          next: "results",
          tags: {
            province: "Manitoba",
            residency: "Manitoba resident",
            program: "Employment and Income Assistance",
          },
        },
        {
          id: "moving",
          label: "Je déménage bientôt au Manitoba",
          next: "results",
          tags: {
            province: "Manitoba",
            residency: "moving to Manitoba",
            program: "Employment and Income Assistance",
          },
        },
        {
          id: "unsure",
          label: "Pas sûr / besoin d’info générale",
          next: "results",
          tags: {
            province: "Manitoba",
            residency: "residency unclear",
            program: "Employment and Income Assistance",
          },
        },
      ],
    },
  },
};

export const START_QUESTION_ID = "need";

/** Build a plain-language situation string for POST /api/checklist */
export function buildSituation(profile, language = "en") {
  const prefix = COPY[language]?.situationPrefix || COPY.en.situationPrefix;
  const { query, ...rest } = profile;
  const parts = Object.entries(rest)
    .filter(([, v]) => v)
    .map(([key, value]) => `${key}: ${value}`);
  const queryPart = query ? `Asked: "${query}". ` : "";
  return `${prefix} ${queryPart}${parts.join("; ")}.`;
}

const CHIP_LABELS = {
  query: "Asked",
  topic: "Topic",
  intent: "Goal",
  program: "Program",
  province: "Province",
  student_status: "Student",
  household: "For",
  residency: "Residency",
};

/** Human-readable chips for the profile strip */
export function profileChips(profile) {
  return Object.entries(profile)
    .filter(([, v]) => v)
    .map(([key, value]) => ({
      key: CHIP_LABELS[key] || key,
      value,
    }));
}
