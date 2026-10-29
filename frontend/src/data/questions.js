// Branching question tree for the stacking-card guide.
// Each answer updates the profile and points to the next question id (or "results").

export const COPY = {
  en: {
    brand: "GovernmentGuide AI",
    tagline: "Answer a few questions. We’ll match you to the right Manitoba forms.",
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
    tagline: "Répondez à quelques questions. Nous vous orienterons vers les bons formulaires du Manitoba.",
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
      prompt: "Pick the closest match — we’ll ask follow-ups from here.",
      options: [
        { id: "health", label: "Health card or coverage", next: "health_status", tags: { topic: "health card" } },
        { id: "id", label: "ID documents (SIN, passport…)", next: "id_type", tags: { topic: "identification" } },
        { id: "ei", label: "Employment / EI benefits", next: "ei_status", tags: { topic: "employment insurance" } },
        { id: "move", label: "I just moved to Manitoba", next: "move_from", tags: { topic: "new resident", event: "moved to Manitoba" } },
        { id: "unsure", label: "Not sure — guide me", next: "life_event", tags: { topic: "general guidance" } },
      ],
    },
    fr: {
      title: "De quoi avez-vous besoin ?",
      prompt: "Choisissez l’option la plus proche — nous poserons des questions de suivi.",
      options: [
        { id: "health", label: "Carte santé ou couverture", next: "health_status", tags: { topic: "health card" } },
        { id: "id", label: "Pièces d’identité (NAS, passeport…)", next: "id_type", tags: { topic: "identification" } },
        { id: "ei", label: "Emploi / prestations d’AE", next: "ei_status", tags: { topic: "employment insurance" } },
        { id: "move", label: "Je viens d’arriver au Manitoba", next: "move_from", tags: { topic: "new resident", event: "moved to Manitoba" } },
        { id: "unsure", label: "Je ne suis pas sûr — guidez-moi", next: "life_event", tags: { topic: "general guidance" } },
      ],
    },
  },

  health_status: {
    id: "health_status",
    color: "#146C7A",
    accent: "#7EC8C4",
    en: {
      title: "What’s your health coverage situation?",
      prompt: "This helps us point to the right Manitoba Health forms.",
      options: [
        { id: "new", label: "I need a new health card", next: "household", tags: { intent: "new health card" } },
        { id: "replace", label: "Replace a lost or damaged card", next: "household", tags: { intent: "replace health card" } },
        { id: "update", label: "Update my address or details", next: "household", tags: { intent: "update health registration" } },
        { id: "dependents", label: "Add family members / dependents", next: "household", tags: { intent: "add dependents to health coverage" } },
      ],
    },
    fr: {
      title: "Quelle est votre situation de couverture santé ?",
      prompt: "Cela nous aide à trouver les bons formulaires de Santé Manitoba.",
      options: [
        { id: "new", label: "J’ai besoin d’une nouvelle carte", next: "household", tags: { intent: "new health card" } },
        { id: "replace", label: "Remplacer une carte perdue ou endommagée", next: "household", tags: { intent: "replace health card" } },
        { id: "update", label: "Mettre à jour mon adresse ou mes infos", next: "household", tags: { intent: "update health registration" } },
        { id: "dependents", label: "Ajouter des membres de la famille", next: "household", tags: { intent: "add dependents to health coverage" } },
      ],
    },
  },

  id_type: {
    id: "id_type",
    color: "#1B4F72",
    accent: "#F0C75E",
    en: {
      title: "Which document are you after?",
      prompt: "We’ll tailor the checklist to that service.",
      options: [
        { id: "sin", label: "Social Insurance Number (SIN)", next: "household", tags: { document: "SIN" } },
        { id: "passport", label: "Passport", next: "household", tags: { document: "passport" } },
        { id: "licence", label: "Driver’s licence / MPI", next: "household", tags: { document: "driver licence" } },
        { id: "vital", label: "Birth / marriage / vital stats", next: "household", tags: { document: "vital statistics" } },
      ],
    },
    fr: {
      title: "Quel document cherchez-vous ?",
      prompt: "Nous adapterons la liste à ce service.",
      options: [
        { id: "sin", label: "Numéro d’assurance sociale (NAS)", next: "household", tags: { document: "SIN" } },
        { id: "passport", label: "Passeport", next: "household", tags: { document: "passport" } },
        { id: "licence", label: "Permis de conduire / MPI", next: "household", tags: { document: "driver licence" } },
        { id: "vital", label: "Naissance / mariage / statistiques de l’état civil", next: "household", tags: { document: "vital statistics" } },
      ],
    },
  },

  ei_status: {
    id: "ei_status",
    color: "#2C5F2D",
    accent: "#97BC62",
    en: {
      title: "Where are you in the EI process?",
      prompt: "A little context goes a long way for the right forms.",
      options: [
        { id: "apply", label: "I need to apply for benefits", next: "household", tags: { intent: "apply for EI" } },
        { id: "claim", label: "I have an open claim / report hours", next: "household", tags: { intent: "report EI claim" } },
        { id: "appeal", label: "I want to appeal a decision", next: "household", tags: { intent: "appeal EI decision" } },
        { id: "info", label: "I just need eligibility info", next: "household", tags: { intent: "EI eligibility information" } },
      ],
    },
    fr: {
      title: "Où en êtes-vous dans le processus d’AE ?",
      prompt: "Un peu de contexte nous aide à trouver les bons formulaires.",
      options: [
        { id: "apply", label: "Je dois présenter une demande", next: "household", tags: { intent: "apply for EI" } },
        { id: "claim", label: "J’ai une demande ouverte / déclarer des heures", next: "household", tags: { intent: "report EI claim" } },
        { id: "appeal", label: "Je veux contester une décision", next: "household", tags: { intent: "appeal EI decision" } },
        { id: "info", label: "J’ai besoin d’info sur l’admissibilité", next: "household", tags: { intent: "EI eligibility information" } },
      ],
    },
  },

  move_from: {
    id: "move_from",
    color: "#5C3D2E",
    accent: "#E0C097",
    en: {
      title: "Where did you move from?",
      prompt: "Coverage and ID steps differ for newcomers vs. interprovincial moves.",
      options: [
        { id: "province", label: "Another Canadian province", next: "household", tags: { origin: "another Canadian province" } },
        { id: "intl", label: "Another country", next: "household", tags: { origin: "another country" } },
        { id: "within", label: "Within Manitoba (new address)", next: "household", tags: { origin: "within Manitoba" } },
      ],
    },
    fr: {
      title: "D’où avez-vous déménagé ?",
      prompt: "Les étapes diffèrent pour les nouveaux arrivants et les déménagements interprovinciaux.",
      options: [
        { id: "province", label: "Une autre province canadienne", next: "household", tags: { origin: "another Canadian province" } },
        { id: "intl", label: "Un autre pays", next: "household", tags: { origin: "another country" } },
        { id: "within", label: "Au Manitoba (nouvelle adresse)", next: "household", tags: { origin: "within Manitoba" } },
      ],
    },
  },

  life_event: {
    id: "life_event",
    color: "#3D5A80",
    accent: "#98C1D9",
    en: {
      title: "What changed recently?",
      prompt: "Life events often unlock a bundle of related forms.",
      options: [
        { id: "job", label: "Lost or changed jobs", next: "household", tags: { event: "job change" } },
        { id: "family", label: "New baby or family change", next: "household", tags: { event: "family change" } },
        { id: "student", label: "Starting school / student aid", next: "household", tags: { event: "student", topic: "student aid" } },
        { id: "retired", label: "Retiring or turning 65", next: "household", tags: { event: "retirement" } },
      ],
    },
    fr: {
      title: "Qu’est-ce qui a changé récemment ?",
      prompt: "Les événements de vie ouvrent souvent plusieurs formulaires liés.",
      options: [
        { id: "job", label: "Perte ou changement d’emploi", next: "household", tags: { event: "job change" } },
        { id: "family", label: "Nouveau bébé ou changement familial", next: "household", tags: { event: "family change" } },
        { id: "student", label: "Début des études / aide aux étudiants", next: "household", tags: { event: "student", topic: "student aid" } },
        { id: "retired", label: "Retraite ou 65 ans", next: "household", tags: { event: "retirement" } },
      ],
    },
  },

  household: {
    id: "household",
    color: "#244855",
    accent: "#E64833",
    en: {
      title: "Who is this for?",
      prompt: "Household size changes which documents you’ll need.",
      options: [
        { id: "self", label: "Just me", next: "residency", tags: { household: "myself only" } },
        { id: "partner", label: "Me and a partner", next: "residency", tags: { household: "myself and a partner" } },
        { id: "kids", label: "Me and kids / dependents", next: "residency", tags: { household: "myself and dependents" } },
        { id: "family", label: "Whole family", next: "residency", tags: { household: "whole family" } },
      ],
    },
    fr: {
      title: "Pour qui est-ce ?",
      prompt: "La taille du ménage change les documents requis.",
      options: [
        { id: "self", label: "Seulement moi", next: "residency", tags: { household: "myself only" } },
        { id: "partner", label: "Moi et un conjoint", next: "residency", tags: { household: "myself and a partner" } },
        { id: "kids", label: "Moi et des enfants / personnes à charge", next: "residency", tags: { household: "myself and dependents" } },
        { id: "family", label: "Toute la famille", next: "residency", tags: { household: "whole family" } },
      ],
    },
  },

  residency: {
    id: "residency",
    color: "#0F2C3A",
    accent: "#F4A261",
    en: {
      title: "How long have you lived in Manitoba?",
      prompt: "Waiting periods and eligibility often hinge on this.",
      options: [
        { id: "new", label: "Less than 3 months", next: "results", tags: { residency: "less than 3 months in Manitoba" } },
        { id: "settling", label: "3 to 12 months", next: "results", tags: { residency: "3 to 12 months in Manitoba" } },
        { id: "resident", label: "More than a year", next: "results", tags: { residency: "more than a year in Manitoba" } },
        { id: "visitor", label: "I’m visiting / not a resident yet", next: "results", tags: { residency: "visitor, not yet a resident" } },
      ],
    },
    fr: {
      title: "Depuis combien de temps vivez-vous au Manitoba ?",
      prompt: "Les délais d’attente et l’admissibilité en dépendent souvent.",
      options: [
        { id: "new", label: "Moins de 3 mois", next: "results", tags: { residency: "less than 3 months in Manitoba" } },
        { id: "settling", label: "De 3 à 12 mois", next: "results", tags: { residency: "3 to 12 months in Manitoba" } },
        { id: "resident", label: "Plus d’un an", next: "results", tags: { residency: "more than a year in Manitoba" } },
        { id: "visitor", label: "Je visite / pas encore résident", next: "results", tags: { residency: "visitor, not yet a resident" } },
      ],
    },
  },
};

export const START_QUESTION_ID = "need";

/** Build a plain-language situation string for POST /api/checklist */
export function buildSituation(profile, language = "en") {
  const prefix = COPY[language]?.situationPrefix || COPY.en.situationPrefix;
  const parts = Object.entries(profile)
    .filter(([, v]) => v)
    .map(([key, value]) => `${key}: ${value}`);
  return `${prefix} ${parts.join("; ")}.`;
}

const CHIP_LABELS = {
  topic: "Topic",
  intent: "Goal",
  document: "Document",
  event: "Event",
  origin: "From",
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
