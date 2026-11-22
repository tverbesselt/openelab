import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"quiz">[] = [
  {
    id: "ex-frans-1",
    title: "Frans — Reguliere werkwoorden op -ER",
    description: "Verkozen tot beste formatieve zelftest voor Frans Niveau 1. Directe feedback bij elke vervoeging.",
    category: "quiz",
    didacticGoal: "check",
    type: "quiz",
    creatorName: "Marc Hermans",
    visibility: "organisatie",
    shareCode: "FRQUIZ",
    tags: ["Frans", "Grammatica", "Werkwoorden"],
    content: {
      questions: [
        {
          id: "q1",
          question: "Vervoeg 'parler' bij 'nous': Nous ______ français.",
          options: ["parlons", "parlez", "parlent", "parles"],
          correctAnswers: [0],
          type: "multiple_choice",
          explanation: "Bij 'nous' krijgt een regulier -ER werkwoord de uitgang '-ons': nous parlons."
        },
        {
          id: "q2",
          question: "Welke vormen zijn correct voor 'habiter'? (Selecteer alle juiste antwoorden)",
          options: ["J'habite", "Tu habites", "Il habites", "Ils habitent"],
          correctAnswers: [0, 1, 3],
          type: "multiple_response",
          explanation: "'Il habite' is zonder -s! 'J'habite', 'Tu habites' en 'Ils habitent' zijn wel correct."
        },
        {
          id: "q3",
          question: "Is 'vous écoutez' de correcte vorm voor 'jullie luisteren'?",
          options: ["Waar", "Niet waar"],
          correctAnswers: [0],
          type: "true_false",
          explanation: "Correct! Bij 'vous' is de uitgang altijd '-ez'."
        }
      ]
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-08-04"
  },
];
