import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"poll">[] = [
  {
    id: "ex-live-ai",
    title: "Live Poll: Voorkennis AI in het Onderwijs",
    description: "Activeer voorkennis aan de start van de les. Cursisten antwoorden anoniem via hun smartphone.",
    category: "live",
    didacticGoal: "activate",
    type: "poll",
    creatorName: "Alex De Vries",
    visibility: "prive",
    shareCode: "AIPOLL",
    tags: ["Live", "AI", "Voorkennis"],
    content: {
      pollQuestion: "Hoe vaak gebruik je al tools zoals ChatGPT of Gemini voor je werk of studie?",
      pollOptions: [
        "1. Nog nooit gebruikt",
        "2. Af en toe (1-2 keer per maand)",
        "3. Wekelijks",
        "4. Dagelijks / Intensief"
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: false,
      enableGamification: false
    },
    createdAt: "2026-08-08"
  },
];
