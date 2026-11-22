import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"wordcloud">[] = [
  {
    id: "ex-wolk-veilig",
    title: "Waar denk je aan bij veilig werken?",
    description: "Woordwolk om bij de start van de les te peilen wat er al leeft in de groep.",
    category: "live",
    didacticGoal: "activate",
    type: "wordcloud",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "WOLK01",
    tags: ["Live", "Techniek", "Voorkennis"],
    content: {
      wordCloudPrompt: "Welk woord past bij veilig werken?"
    },
    didacticConfig: {
      showImmediateFeedback: false,
      allowRetryMissed: false,
      enableGamification: false
    },
    createdAt: "2026-09-09"
  },
];
