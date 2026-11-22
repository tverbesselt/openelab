import dynamic from "next/dynamic";
import { ArrowDownUp } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const zinbouwen: Werkvorm<"zinbouwen"> = {
  id: "zinbouwen",
  label: "Zinnen bouwen",
  uitleg: "De woorden staan door elkaar. Cursisten zetten ze in de juiste volgorde.",
  icon: ArrowDownUp,
  waar: "cursist",
  eenheid: ["zin", "zinnen"],
  lesfase: "automate",
  secondenPerItem: 40,
  aantal: (inhoud) => inhoud.ordenItems.length,
  opfris: (ex) =>
    ex.content.ordenItems.map((item) => ({
      id: `${ex.id}-${item.id}`,
      vraag: `Zet op volgorde: ${[...item.delen].sort(() => 0.5 - Math.random()).join(" · ")}`,
      antwoord: item.delen.join(" "),
      bron: ex.title,
    })),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Zinnen bouwen",
    uitleg: "De woorden staan door elkaar",
    Vorm: dynamic(() => import("@/components/maken/NieuweVormen").then((m) => m.ZinbouwenVorm)),
  },
  Speler: dynamic<SpelerProps<"zinbouwen">>(() => import("../gedeeld/OrdenenSpeler")),
  Afdruk: dynamic<AfdrukProps<"zinbouwen">>(() => import("../gedeeld/OrdenenAfdruk")),
};
