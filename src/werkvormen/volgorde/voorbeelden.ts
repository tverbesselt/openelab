import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"volgorde">[] = [
  {
    id: "ex-volgorde-zorg",
    title: "Zorg - handelingen stap voor stap",
    description: "Zet de stappen van elke handeling in de juiste volgorde.",
    category: "practice",
    didacticGoal: "automate",
    type: "volgorde",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "STAPPN",
    tags: ["Zorg", "Procedure"],
    content: {
      ordenItems: [
        {
          id: "p1",
          opdracht: "Hoe verzorg je een kleine wonde?",
          delen: [
            "handen wassen",
            "wonde spoelen met water",
            "wonde ontsmetten",
            "verband aanbrengen",
            "handen opnieuw wassen"
          ]
        },
        {
          id: "p2",
          opdracht: "Hoe help je iemand veilig rechtstaan?",
          delen: [
            "vraag of de persoon wil rechtstaan",
            "zet de rem op de rolstoel",
            "plaats de voeten stevig op de grond",
            "ondersteun bij de heupen",
            "sta samen rustig recht"
          ]
        }
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
