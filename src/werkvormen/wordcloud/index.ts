import dynamic from "next/dynamic";
import { Cloud } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const wordcloud: Werkvorm<"wordcloud"> = {
  id: "wordcloud",
  label: "Woordwolk",
  uitleg: "Cursisten typen één woord. Samen vormen ze een wolk op het digibord.",
  icon: Cloud,
  waar: "klas",
  eenheid: ["vraag", "vragen"],
  lesfase: "activate",
  secondenPerItem: 20,
  aantal: (inhoud) => (inhoud.wordCloudPrompt ? 1 : 0),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Woordwolk",
    uitleg: "Iedereen typt één woord, om te peilen wat er leeft",
    Vorm: dynamic(() => import("./Maken")),
  },
  klassikaal: { parameter: "oefening" },
  Speler: dynamic<SpelerProps<"wordcloud">>(() => import("../gedeeld/KlassikaalSpeler")),
  Afdruk: dynamic<AfdrukProps<"wordcloud">>(() => import("../gedeeld/KlassikaalAfdruk")),
};
