import dynamic from "next/dynamic";
import { Calculator } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const rekenen: Werkvorm<"rekenen"> = {
  id: "rekenen",
  label: "Rekenen",
  uitleg: "Elke ronde nieuwe getallen, dus onbeperkt oefenen zonder dat jij vragen typt.",
  icon: Calculator,
  waar: "cursist",
  eenheid: ["opgave", "opgaven"],
  lesfase: "automate",
  secondenPerItem: 45,
  aantal: (inhoud) => inhoud.rekenopdracht.aantal,
  tip:
    "Elke ronde nieuwe getallen. Kom morgen nog eens terug: twee korte beurten leren meer dan één lange.",
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Rekenen",
    uitleg: "Elke ronde nieuwe getallen, jij typt niets",
    Vorm: dynamic(() => import("@/components/maken/NieuweVormen").then((m) => m.RekenenVorm)),
  },
  Speler: dynamic<SpelerProps<"rekenen">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"rekenen">>(() => import("./Afdruk")),
};
