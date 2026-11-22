import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"flashcard">[] = [
  {
    id: "ex-flash-ehbo",
    title: "Biologie & EHBO — Belangrijke begrippen",
    description:
      "Oefen kernbegrippen met flashcards. Bedenk eerst zelf het antwoord en draai daarna pas de kaart om voor actief ophalen.",
    category: "practice",
    didacticGoal: "automate",
    type: "flashcard",
    creatorName: "Alex De Vries",
    visibility: "organisatie",
    shareCode: "KAART1",
    tags: ["Biologie", "EHBO", "Begrippen"],
    content: {
      flashcards: [
        {
          id: "fc1",
          front: "Stabiele zijligging",
          back: "Houding voor een bewusteloos slachtoffer dat wél normaal ademt, zodat de luchtweg vrij blijft.",
          exampleSentence: "Controleer eerst of het slachtoffer normaal ademt voor je het in stabiele zijligging legt.",
        },
        {
          id: "fc2",
          front: "Heimlich-greep (buikstoten)",
          back: "Eerstehulptechniek bij een volledige verslikking waarbij vijf krachtige stoten naar binnen en omhoog worden gegeven.",
          exampleSentence: "Wissel vijf rugslagen af met vijf buikstoten als het slachtoffer niet meer kan hoesten.",
        },
        {
          id: "fc3",
          front: "AED (Automatische Externe Defibrillator)",
          back: "Toestel dat het hartritme analyseert en zo nodig een elektrische schok toedient bij een hartstilstand.",
          exampleSentence: "Volg bij een reanimatie meteen de gesproken instructies van de AED.",
        },
        {
          id: "fc4",
          front: "Brandwonde koelen (de 20-minutenregel)",
          back: "Spoel een brandwonde minstens 20 minuten met lauw, zacht stromend leidingwater.",
          exampleSentence: "Gebruik geen ijskoud water: dat kan het weefsel extra beschadigen.",
        },
        {
          id: "fc5",
          front: "Europese noodnummer",
          back: "112 — gratis bereikbaar in heel Europa voor dringende medische hulp, brandweer en politie.",
          exampleSentence: "Geef bij 112 altijd eerst het exacte adres en wat er gebeurd is door.",
        },
      ],
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false,
    },
    createdAt: "2026-08-12",
  },
];
