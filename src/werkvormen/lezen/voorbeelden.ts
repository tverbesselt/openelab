import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"lezen">[] = [
  {
    id: "ex-lezen-slapen",
    title: "Lezen — Waarom slaap je geheugen versterkt",
    description:
      "Korte informatieve tekst met begripsvragen ernaast. De tekst blijft zichtbaar tijdens het beantwoorden.",
    category: "quiz",
    didacticGoal: "check",
    type: "lezen",
    creatorName: "Alex De Vries",
    visibility: "organisatie",
    shareCode: "LEZEN1",
    tags: ["Begrijpend lezen", "Leren leren", "NT2"],
    content: {
      leestekst:
        "Veel mensen denken dat hun hersenen volledig rusten wanneer ze slapen. Onderzoek toont echter het omgekeerde aan: tijdens de slaap zijn bepaalde delen van het brein juist heel actief.\n\nOverdag verzamel je voortdurend nieuwe informatie, zoals nieuwe woorden, namen of rekenregels. Die informatie wordt eerst tijdelijk opgeslagen. Pas wanneer je slaapt, sorteert je brein wat belangrijk is en verplaatst het die kennis naar het langetermijngeheugen. Wetenschappers noemen dit proces consolidatie.\n\nDaarom werkt een hele nacht doorstuderen vlak voor een examen meestal averechts. Wie een lesstof verspreidt over meerdere dagen en tussendoor goed slaapt, onthoudt de leerstof niet alleen beter, maar kan ze weken later ook vlotter toepassen.",
      questions: [
        {
          id: "lq1",
          question: "Wat gebeurt er volgens de tekst tijdens de slaap met nieuwe leerstof?",
          options: [
            "De hersenen zetten alles stil zodat je niets vergeet.",
            "Belangrijke informatie wordt gesorteerd en verplaatst naar het langetermijngeheugen.",
            "Alle indrukken van de dag worden gewist om plaats te maken.",
            "Alleen namen en getallen blijven bewaard.",
          ],
          correctAnswers: [1],
          type: "multiple_choice",
          explanation:
            "In de tweede alinea staat dat het brein tijdens de slaap belangrijke kennis sorteert en verplaatst naar het langetermijngeheugen (consolidatie).",
        },
        {
          id: "lq2",
          question: "Hoe noemen wetenschappers het vastleggen van kennis tijdens de slaap?",
          options: ["Herhaling", "Concentratie", "Consolidatie", "Automatisatie"],
          correctAnswers: [2],
          type: "multiple_choice",
          explanation: "De tekst noemt dit proces 'consolidatie'.",
        },
        {
          id: "lq3",
          question: "Volgens de tekst is een hele nacht doorblokken vlak voor een toets de beste strategie.",
          options: ["Waar", "Niet waar"],
          correctAnswers: [1],
          type: "true_false",
          explanation:
            "Niet waar: de derde alinea legt uit dat een hele nacht doorstuderen meestal averechts werkt; spreiden en goed slapen werkt beter.",
        },
      ],
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false,
      tweedeKans: true,
    },
    createdAt: "2026-08-13",
  },
];
