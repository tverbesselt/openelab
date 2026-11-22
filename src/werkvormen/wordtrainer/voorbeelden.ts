import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"wordtrainer">[] = [
  {
    id: "ex-nt2-1",
    title: "NT2 — Woordenschat: Naar de markt",
    description: "Inoefenen van groenten, fruit en gewichten op de markt via actieve ophaalpraktijk (Retrieval Practice).",
    category: "language",
    didacticGoal: "automate",
    type: "wordtrainer",
    creatorName: "Alex De Vries",
    visibility: "organisatie",
    shareCode: "MARKT1",
    tags: ["NT2", "Woordenschat", "Niveau 1", "Boodschappen"],
    content: {
      wordTrainerItems: [
        { id: "w1", word: "de appel", translation: "pomme (FR) / apple (EN)", exampleSentence: "Ik koop één kilo appels." },
        { id: "w2", word: "de wortel", translation: "carotte (FR) / carrot (EN)", exampleSentence: "Wortels zijn oranje." },
        { id: "w3", word: "de aardbei", translation: "fraise (FR) / strawberry (EN)", exampleSentence: "Aardbeien zijn zoet." },
        { id: "w4", word: "het pond", translation: "500 gram", exampleSentence: "Een pond kaas, alstublieft." },
        { id: "w5", word: "de wisselkoers / het wisselgeld", translation: "monnaie (FR) / change (EN)", exampleSentence: "Hier is uw wisselgeld." },
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-08-01"
  },
];
