import dynamic from "next/dynamic";
import { KeyRound } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const escaperoom: Werkvorm<"escaperoom"> = {
  id: "escaperoom",
  label: "Escaperoom",
  uitleg:
    "Een reeks sloten die pas opengaan met het juiste antwoord. Cursisten lossen ze samen op, in groepjes of alleen.",
  icon: KeyRound,
  waar: "cursist",
  eenheid: ["slot", "sloten"],
  lesfase: "check",
  // Samen overleggen, zoeken en een hint lezen kost tijd.
  secondenPerItem: 120,
  aantal: (inhoud) => inhoud.escaperoom.sloten.length,
  tip:
    "Zeg eerst hardop wat je denkt, ook als je twijfelt. Wie zijn denken uitlegt aan een ander, onthoudt het zelf beter.",
  opfris: (ex) =>
    ex.content.escaperoom.sloten.map((slot) => ({
      id: `${ex.id}-${slot.id}`,
      vraag: slot.opdracht,
      antwoord: slot.antwoorden[0] ?? "",
      bron: ex.title,
    })),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Escaperoom",
    uitleg: "Sloten die opengaan met het juiste antwoord, om samen op te lossen",
    Vorm: dynamic(() => import("@/components/maken/EscaperoomVorm").then((m) => m.EscaperoomVorm)),
  },
  Speler: dynamic<SpelerProps<"escaperoom">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"escaperoom">>(() => import("./Afdruk")),
};
