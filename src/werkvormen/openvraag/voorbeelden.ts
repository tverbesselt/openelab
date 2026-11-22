import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"openvraag">[] = [
  {
    id: "ex-open-leren",
    title: "Open vraag — Slim studeren in eigen woorden",
    description:
      "Formuleer eerst een eigen antwoord en vergelijk het daarna kritisch met het modelantwoord.",
    category: "quiz",
    didacticGoal: "check",
    type: "openvraag",
    creatorName: "Alex De Vries",
    visibility: "organisatie",
    shareCode: "OPENV1",
    tags: ["Leren leren", "Reflectie", "Begrip"],
    content: {
      openVragen: [
        {
          id: "ov1",
          vraag:
            "Waarom werkt jezelf testen (bv. met flashcards of een quiz) veel beter dan een tekst drie keer opnieuw lezen en markeren?",
          modelantwoord:
            "Door jezelf te testen moet je de leerstof actief uit je geheugen ophalen (retrieval practice). Dat versterkt het geheugenspoor en laat meteen zien wat je nog niet kent. Herlezen geeft vaak het gevoel dat je iets kent, terwijl je de tekst eigenlijk alleen herkent.",
        },
        {
          id: "ov2",
          vraag:
            "Een medecursist wil alles in één lange avond van vier uur studeren. Welk concreet advies geef je op basis van gespreid herhalen?",
          modelantwoord:
            "Verdeel die vier uur liever over meerdere korte sessies op verschillende dagen (bv. vier keer een uur of acht keer een halfuur). Door tussendoor bijna iets te vergeten en het opnieuw op te halen, blijft de leerstof veel langer hangen.",
        },
        {
          id: "ov3",
          vraag:
            "Wat is het voordeel van directe uitleg (feedback) na een fout antwoord tijdens het oefenen?",
          modelantwoord:
            "Je ziet meteen waarom je antwoord nog niet klopte en wat de juiste redenering is. Zo voorkom je dat een misvatting blijft hangen en leer je bij zonder dat er een punt of beoordeling aan vastzit.",
        },
      ],
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false,
    },
    createdAt: "2026-08-14",
  },
];
