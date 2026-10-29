/** FAQ content scoped to services in /data (Student Aid + EIA). */

export const FAQ_ITEMS = {
  student: {
    en: [
      {
        q: "When should I apply for student aid?",
        a: "Apply as early as you can once applications open for your study period. Manitoba and Saskatchewan both publish “when to apply” guidance on their student aid sites — deadlines and document checklists vary by province and program.",
      },
      {
        q: "What information do I usually need?",
        a: "Expect to provide personal details, study program and school information, and financial information for yourself (and sometimes a spouse or parent/sponsor). Official “what information do I need?” pages list the exact documents for your province.",
      },
      {
        q: "What if I’m already in school?",
        a: "You can still get help managing funds, updating your account, and understanding what happens to your loans while you study. Use your province’s “already in school” / managing student aid pages.",
      },
      {
        q: "How do loan repayment and forgiveness work?",
        a: "After studies, you typically enter repayment. Some provinces also offer targeted loan forgiveness (for example certain health or rural careers in Saskatchewan). Check your province’s repay and forgiveness pages for eligibility.",
      },
    ],
    fr: [
      {
        q: "Quand dois-je demander l’aide aux étudiants ?",
        a: "Présentez votre demande dès que possible après l’ouverture des demandes pour votre période d’études. Le Manitoba et la Saskatchewan publient des guides « quand présenter une demande » — les dates et documents varient selon la province et le programme.",
      },
      {
        q: "De quelles informations ai-je généralement besoin ?",
        a: "Prévoyez des renseignements personnels, des infos sur votre programme et votre établissement, et des infos financières (parfois aussi pour un conjoint ou un parent). Les pages officielles listent les documents exacts pour votre province.",
      },
      {
        q: "Et si je suis déjà aux études ?",
        a: "Vous pouvez toujours obtenir de l’aide pour gérer vos fonds, mettre à jour votre compte et comprendre ce qui arrive à vos prêts pendant vos études.",
      },
      {
        q: "Comment fonctionnent le remboursement et l’exonération ?",
        a: "Après les études, vous entrez généralement en remboursement. Certaines provinces offrent aussi des exonérations ciblées. Consultez les pages de remboursement de votre province.",
      },
    ],
  },
  eia: {
    en: [
      {
        q: "What is Employment and Income Assistance (EIA)?",
        a: "Manitoba’s EIA program helps eligible people with income support and connections to employment. Official EIA pages explain who may qualify and how to get started.",
      },
      {
        q: "What is Rent Assist?",
        a: "Rent Assist helps eligible Manitobans with housing costs. There is an online estimator and an application form on the government’s Rent Assist pages.",
      },
      {
        q: "Can EIA help me find work?",
        a: "Yes — Manitoba also publishes employment and “finding work” resources alongside income support. Your recommended forms may include those pages when that matches your profile.",
      },
      {
        q: "Are disability supports separate from EIA?",
        a: "Manitoba has related disability support information in the same family of services. If you indicated disability supports in your profile, we prioritize those official pages.",
      },
    ],
    fr: [
      {
        q: "Qu’est-ce que l’aide à l’emploi et au revenu (EIA) ?",
        a: "Le programme EIA du Manitoba aide les personnes admissibles avec un soutien du revenu et des liens vers l’emploi. Les pages officielles expliquent l’admissibilité et les démarches.",
      },
      {
        q: "Qu’est-ce que l’aide au loyer (Rent Assist) ?",
        a: "Rent Assist aide les Manitobains admissibles avec les coûts de logement. Il existe un estimateur en ligne et un formulaire de demande sur les pages officielles.",
      },
      {
        q: "L’EIA peut-elle m’aider à trouver un emploi ?",
        a: "Oui — le Manitoba publie aussi des ressources sur l’emploi et la recherche de travail avec le soutien du revenu.",
      },
      {
        q: "Les soutiens liés au handicap sont-ils séparés de l’EIA ?",
        a: "Le Manitoba offre des renseignements sur des soutiens liés au handicap dans la même famille de services. Si votre profil l’indique, nous priorisons ces pages officielles.",
      },
    ],
  },
  general: {
    en: [
      {
        q: "What can this guide help with right now?",
        a: "With the data we have loaded, we focus on Student Aid (Manitoba and Saskatchewan) and Manitoba Employment & Income Assistance (including Rent Assist and related supports).",
      },
      {
        q: "Why do answers need official links?",
        a: "Government programs change. We point you to official pages so you always verify requirements, deadlines, and forms at the source.",
      },
    ],
    fr: [
      {
        q: "En quoi ce guide peut-il m’aider pour l’instant ?",
        a: "Avec les données actuelles, nous nous concentrons sur l’aide aux étudiants (Manitoba et Saskatchewan) et l’aide à l’emploi et au revenu du Manitoba (y compris l’aide au loyer).",
      },
      {
        q: "Pourquoi faut-il des liens officiels ?",
        a: "Les programmes gouvernementaux changent. Nous vous dirigeons vers les pages officielles pour vérifier exigences, dates et formulaires à la source.",
      },
    ],
  },
};

export function faqsForProfile(profile, language = "en") {
  const lang = language === "fr" ? "fr" : "en";
  const topic = (profile?.topic || "").toLowerCase();

  if (topic.includes("student")) {
    return [...FAQ_ITEMS.student[lang], ...FAQ_ITEMS.general[lang]];
  }
  if (
    topic.includes("employment") ||
    topic.includes("income") ||
    (profile?.program || "").toLowerCase().includes("income")
  ) {
    return [...FAQ_ITEMS.eia[lang], ...FAQ_ITEMS.general[lang]];
  }
  return [
    ...FAQ_ITEMS.general[lang],
    ...FAQ_ITEMS.student[lang].slice(0, 2),
    ...FAQ_ITEMS.eia[lang].slice(0, 2),
  ];
}
