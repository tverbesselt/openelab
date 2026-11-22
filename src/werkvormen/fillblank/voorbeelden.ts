import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"fillblank">[] = [
  {
    id: "ex-invul-nt2",
    title: "NT2 - werkwoorden in de zin",
    description: "Vul het werkwoord aan op de juiste plaats en in de juiste vorm.",
    category: "language",
    didacticGoal: "automate",
    type: "fillblank",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "INVUL1",
    tags: ["NT2", "Grammatica", "Werkwoorden"],
    content: {
      fillBlanks: [
        { id: "fb1", textWithBlanks: "Ik [[ga]] elke dag met de tram naar mijn werk.", answers: ["ga"] },
        { id: "fb2", textWithBlanks: "Zij [[woont]] al drie jaar in Antwerpen.", answers: ["woont"] },
        { id: "fb3", textWithBlanks: "Gisteren [[heb]] ik soep gemaakt.", answers: ["heb"] },
        { id: "fb4", textWithBlanks: "Morgen [[gaan]] wij samen naar de markt.", answers: ["gaan"] },
        { id: "fb5", textWithBlanks: "Wij [[kopen|halen]] brood bij de bakker.", answers: ["kopen"] }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false,
      spraakTaal: "nl-BE"
    },
    createdAt: "2026-09-09"
  },
];
