import type { OefeningVan } from "@/lib/types";

/** Een eenvoudige vlag als afbeelding, voor het voorbeeld van Teken uit je geheugen. */
const vlag = (inhoud: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">${inhoud}</svg>`
  )}`;

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"tekenen">[] = [
  {
    id: "ex-tekenen-vlaggen",
    title: "Vlaggen uit je geheugen",
    description: "Teken het zoals je het je herinnert. Daarna zie je het origineel.",
    category: "media",
    didacticGoal: "activate",
    type: "tekenen",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "VLAGGEN",
    tags: ["Tekenen", "Geheugen", "Aardrijkskunde"],
    content: {
      tekenopdrachten: [
        {
          id: "teken-1",
          naam: "Vlag van België",
          beeld: {
            soort: "afbeelding",
            alt: "Drie verticale banden: zwart, geel en rood",
            url: vlag('<rect width="100" height="200" fill="#000"/><rect x="100" width="100" height="200" fill="#fdda24"/><rect x="200" width="100" height="200" fill="#ef3340"/>'),
          },
        },
        {
          id: "teken-2",
          naam: "Vlag van Japan",
          beeld: {
            soort: "afbeelding",
            alt: "Een rode cirkel in het midden van een wit vlak",
            url: vlag('<rect width="300" height="200" fill="#fff"/><circle cx="150" cy="100" r="60" fill="#bc002d"/>'),
          },
        },
        {
          id: "teken-3",
          naam: "Vlag van Zweden",
          beeld: {
            soort: "afbeelding",
            alt: "Een geel kruis op een blauw vlak, iets naar links",
            url: vlag('<rect width="300" height="200" fill="#006aa7"/><rect x="94" width="38" height="200" fill="#fecc00"/><rect y="81" width="300" height="38" fill="#fecc00"/>'),
          },
        },
        {
          id: "teken-4",
          naam: "Vlag van Zwitserland",
          beeld: {
            soort: "afbeelding",
            alt: "Een wit kruis met gelijke armen op een rood vlak",
            url: vlag('<rect width="300" height="200" fill="#da291c"/><rect x="130" y="40" width="40" height="120" fill="#fff"/><rect x="90" y="80" width="120" height="40" fill="#fff"/>'),
          },
        },
      ],
    },
    didacticConfig: {
      showImmediateFeedback: true,
      allowRetryMissed: true,
      enableGamification: false
    },
    createdAt: "2026-10-04"
  },
];
