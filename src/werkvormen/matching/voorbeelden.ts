import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"matching">[] = [
  {
    id: "ex-elec-1",
    title: "Elektriciteit — Symbolen & Schakelingen",
    description: "Sleep het elektrisch symbool naar de juiste naam. Essentieel voor technisch tekenen.",
    category: "practice",
    didacticGoal: "automate",
    type: "matching",
    creatorName: "Luc Van Den Broeck",
    visibility: "prive",
    shareCode: "VOLT24",
    tags: ["Elektriciteit", "Techniek", "Symbolen"],
    content: {
      matchingPairs: [
        { id: "m1", left: "Wisselspanningsbron", right: "AC Symbool (~)" },
        { id: "m2", left: "Gelijkspanningsbron", right: "DC Symbool (=)" },
        { id: "m3", left: "Schakelaar open", right: "Onderbroken lijn met hendel" },
        { id: "m4", left: "Zekering", right: "Rechthoek met doorlopende lijn" },
        { id: "m5", left: "Aardleiding", right: "Horizontale streep met zakkende streepjes" }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-08-05"
  },
];
