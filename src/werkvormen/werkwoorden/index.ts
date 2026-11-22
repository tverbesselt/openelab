import dynamic from "next/dynamic";
import { Repeat2 } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const werkwoorden: Werkvorm<"werkwoorden"> = {
  id: "werkwoorden",
  label: "Werkwoorden",
  uitleg: "Vervoegingen inoefenen: de cursist krijgt de persoon en typt de juiste vorm.",
  icon: Repeat2,
  waar: "cursist",
  eenheid: ["werkwoord", "werkwoorden"],
  lesfase: "automate",
  secondenPerItem: 20,
  aantal: (inhoud) => inhoud.werkwoorden.length,
  tip:
    "De vormen staan door elkaar. Dat voelt lastiger, maar je leert er meer van dan van tien keer hetzelfde rijtje.",
  opfris: (ex) =>
    ex.content.werkwoorden.flatMap((werkwoord) =>
      werkwoord.vormen.map((vorm, i) => ({
        id: `${ex.id}-${werkwoord.id}-${i}`,
        vraag: `${werkwoord.infinitief}: ${vorm.persoon} ...`,
        antwoord: vorm.vorm,
        bron: ex.title,
      }))
    ),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Werkwoorden",
    uitleg: "Vervoegingen door elkaar inoefenen",
    Vorm: dynamic(() => import("@/components/maken/NieuweVormen").then((m) => m.WerkwoordenVorm)),
  },
  Speler: dynamic<SpelerProps<"werkwoorden">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"werkwoorden">>(() => import("./Afdruk")),
};
