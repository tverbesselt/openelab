import type { OefeningVan } from "@/lib/types";

/** Voorbeeldmateriaal voor de demomodus. */
export const voorbeelden: OefeningVan<"zinbouwen">[] = [
  {
    id: "ex-zin-nt2",
    title: "NT2 - woordvolgorde in de zin",
    description: "De woorden staan door elkaar. Zet ze in de juiste volgorde.",
    category: "language",
    didacticGoal: "automate",
    type: "zinbouwen",
    creatorName: "Open E-lab",
    visibility: "organisatie",
    shareCode: "ZINNEN",
    tags: ["NT2", "Zinsbouw"],
    content: {
      ordenItems: [
        { id: "z1", delen: ["Morgen", "ga", "ik", "naar", "de", "dokter."] },
        { id: "z2", delen: ["Zij", "werkt", "elke", "zaterdag", "in", "de", "winkel."] },
        { id: "z3", delen: ["Wij", "hebben", "gisteren", "samen", "gekookt."] },
        { id: "z4", delen: ["Omdat", "het", "regent,", "neem", "ik", "de", "tram."] }
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
