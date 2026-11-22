import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"werkwoorden">[] = [
  {
    id: "ex-ww-frans",
    title: "Frans - werkwoorden op -ER",
    description: "De vormen komen door elkaar aan bod, niet als rijtje.",
    category: "language",
    didacticGoal: "automate",
    type: "werkwoorden",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "PARLER",
    tags: ["Frans", "Werkwoorden"],
    content: {
      werkwoorden: [
        {
          id: "w1",
          infinitief: "parler",
          vormen: [
            { persoon: "je", vorm: "parle" },
            { persoon: "tu", vorm: "parles" },
            { persoon: "nous", vorm: "parlons" },
            { persoon: "vous", vorm: "parlez" }
          ]
        },
        {
          id: "w2",
          infinitief: "habiter",
          vormen: [
            { persoon: "j'", vorm: "habite" },
            { persoon: "tu", vorm: "habites" },
            { persoon: "nous", vorm: "habitons" }
          ]
        }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false,
      spraakTaal: "fr-FR"
    },
    createdAt: "2026-09-09"
  },
];
