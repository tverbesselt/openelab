import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"escaperoom">[] = [
  {
    id: "ex-escape-elektriciteit",
    title: "Elektriciteit - ontsnap uit het labo",
    description: "Open de sloten één voor één met het juiste antwoord.",
    category: "collaboration",
    didacticGoal: "check",
    type: "escaperoom",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "ESCAPE",
    tags: ["Escaperoom", "Samenwerken", "Elektriciteit"],
    content: {
      escaperoom: {
        verhaal:
          "De technieker is naar huis en de deur van het labo zit op slot. Het codeslot vraagt vier antwoorden. Alleen wie de basis van elektriciteit kent, komt eruit.",
        sloten: [
          {
            id: "slot-1",
            opdracht: "Een lamp op 230 V trekt 0,5 A. Hoeveel watt verbruikt ze?",
            antwoorden: ["115", "115 W", "115 watt"],
            hint: "Vermogen = spanning × stroom."
          },
          {
            id: "slot-2",
            opdracht:
              "Welk onderdeel in de verdeelkast schakelt de stroom af als ze te groot wordt?",
            antwoorden: ["zekering", "automaat", "smeltzekering"],
            hint: "Het zit in elke verdeelkast, en je zet het terug op als het is 'gesprongen'."
          },
          {
            id: "slot-3",
            opdracht: "Door een weerstand van 4 Ω loopt 2,5 A. Hoeveel volt staat erover?",
            antwoorden: ["10", "10 V", "10 volt"],
            hint: "Wet van Ohm: U = R × I."
          },
          {
            id: "slot-4",
            opdracht: "Welke twee kleuren heeft de aardingsdraad?",
            antwoorden: ["geel en groen", "groen en geel", "geelgroen", "groengeel"],
            hint: "Denk aan een banaan en een blad."
          }
        ],
        afloop:
          "De deur gaat open. Bespreek met je groepje welk slot het moeilijkst was, en waarom."
      }
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-09-24"
  },
];
