import dynamic from "next/dynamic";
import { Link2 } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const matching: Werkvorm<"matching"> = {
  id: "matching",
  label: "Matching",
  uitleg: "Cursisten koppelen begrippen aan de juiste betekenis.",
  icon: Link2,
  waar: "cursist",
  eenheid: ["paar", "paren"],
  lesfase: "automate",
  secondenPerItem: 20,
  aantal: (inhoud) => inhoud.matchingPairs.length,
  tip:
    "Herkennen is makkelijker dan herinneren. Lukt dit? Dek daarna de rechterkolom af en zeg de betekenis zonder te kijken: dat is wat je op een toets moet.",
  opfris: (ex) =>
    ex.content.matchingPairs.map((paar) => ({
      id: `${ex.id}-${paar.id}`,
      vraag: paar.left,
      antwoord: paar.right,
      bron: ex.title,
    })),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  Speler: dynamic<SpelerProps<"matching">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"matching">>(() => import("./Afdruk")),
};
