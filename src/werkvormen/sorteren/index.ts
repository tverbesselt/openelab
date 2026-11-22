import dynamic from "next/dynamic";
import { Boxes } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const sorteren: Werkvorm<"sorteren"> = {
  id: "sorteren",
  label: "Sorteren",
  uitleg: "Cursisten verdelen de items over twee tot vier bakjes.",
  icon: Boxes,
  waar: "cursist",
  eenheid: ["item", "items"],
  lesfase: "automate",
  secondenPerItem: 15,
  aantal: (inhoud) => inhoud.sorteerItems.length,
  opfris: (ex) =>
    ex.content.sorteerItems.map((item) => ({
      id: `${ex.id}-${item.id}`,
      vraag: `Waar hoort dit bij: ${item.tekst}?`,
      antwoord: ex.content.categorieen[item.categorie] ?? "",
      bron: ex.title,
    })),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Sorteren",
    uitleg: "Items verdelen over twee tot vier bakjes",
    Vorm: dynamic(() => import("@/components/maken/NieuweVormen").then((m) => m.SorterenVorm)),
  },
  Speler: dynamic<SpelerProps<"sorteren">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"sorteren">>(() => import("./Afdruk")),
};
