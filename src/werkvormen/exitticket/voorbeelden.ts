import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"exitticket">[] = [
  {
    id: "ex-exit-ticket-1",
    title: "Exit Ticket — Einde van de les",
    description: "Formatieve check in 3 snelle vragen: Wat is helder, wat behoeft extra uitleg, en hoe zeker voel je je?",
    category: "collaboration",
    didacticGoal: "reflect",
    type: "exitticket",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "EXIT01",
    tags: ["Reflectie", "Exit Ticket", "Formatief"],
    content: {
      exitTicketPrompts: [
        "Wat is het belangrijkste dat je vandaag hebt geleerd?",
        "Welk onderdeel is nog onduidelijk of behoeft herhaling?",
        "Hoe zeker voel je je over de leerstof voor de volgende les?"
      ]
    },
    didacticConfig: {
      showImmediateFeedback: false,
      allowRetryMissed: false,
      enableGamification: false
    },
    createdAt: "2026-08-09"
  },
];
