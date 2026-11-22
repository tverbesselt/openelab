import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"rekenen">[] = [
  {
    id: "ex-reken-btw",
    title: "Verkoop - btw berekenen",
    description: "Van een prijs zonder btw naar een prijs met btw. Elke ronde nieuwe getallen.",
    category: "practice",
    didacticGoal: "automate",
    type: "rekenen",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "BTW021",
    tags: ["Rekenen", "Verkoop"],
    content: {
      rekenopdracht: { soort: "btw", aantal: 10 }
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
];
