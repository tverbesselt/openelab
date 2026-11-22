import dynamic from "next/dynamic";
import { Radio } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const poll: Werkvorm<"poll"> = {
  id: "poll",
  label: "Live poll",
  uitleg: "Jij projecteert de vraag, cursisten stemmen anoniem met hun smartphone.",
  icon: Radio,
  waar: "klas",
  eenheid: ["antwoordoptie", "antwoordopties"],
  lesfase: "activate",
  secondenPerItem: 20,
  aantal: (inhoud) => inhoud.pollOptions.length,
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Live poll",
    uitleg: "Stemvraag met vaste antwoorden, om voorkennis te activeren",
    Vorm: dynamic(() => import("./Maken")),
  },
  klassikaal: { parameter: "oefening" },
  Speler: dynamic<SpelerProps<"poll">>(() => import("../gedeeld/KlassikaalSpeler")),
  Afdruk: dynamic<AfdrukProps<"poll">>(() => import("../gedeeld/KlassikaalAfdruk")),
};
