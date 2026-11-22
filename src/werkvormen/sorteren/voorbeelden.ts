import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"sorteren">[] = [
  {
    id: "ex-sorteer-dehet",
    title: "NT2 - de of het",
    description: "Sorteer de woorden in het juiste bakje.",
    category: "language",
    didacticGoal: "automate",
    type: "sorteren",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "DEHET1",
    tags: ["NT2", "Lidwoorden"],
    content: {
      categorieen: ["de", "het"],
      sorteerItems: [
        { id: "s1", tekst: "tafel", categorie: 0 },
        { id: "s2", tekst: "huis", categorie: 1 },
        { id: "s3", tekst: "stoel", categorie: 0 },
        { id: "s4", tekst: "boek", categorie: 1 },
        { id: "s5", tekst: "fiets", categorie: 0 },
        { id: "s6", tekst: "raam", categorie: 1 },
        { id: "s7", tekst: "trein", categorie: 0 },
        { id: "s8", tekst: "brood", categorie: 1 }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
];
