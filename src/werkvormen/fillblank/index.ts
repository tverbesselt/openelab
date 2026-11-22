import dynamic from "next/dynamic";
import { TextCursorInput } from "lucide-react";
import { ontleedInvulzin, volledigeZin } from "@/lib/invulzin";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const fillblank: Werkvorm<"fillblank"> = {
  id: "fillblank",
  label: "Invuloefening",
  uitleg: "Cursisten vullen de ontbrekende woorden aan in een tekst.",
  icon: TextCursorInput,
  waar: "cursist",
  eenheid: ["zin", "zinnen"],
  lesfase: "automate",
  secondenPerItem: 25,
  aantal: (inhoud) => inhoud.fillBlanks.length,
  tip:
    "Vul eerst in wat je denkt, ook als je twijfelt. Zelf proberen en dan nakijken leert meer dan meteen kijken.",
  opfris: (ex) =>
    ex.content.fillBlanks.map((zin) => ({
      id: `${ex.id}-${zin.id}`,
      // De zin met een streep waar het gat zit; het antwoord is de volledige zin.
      vraag: ontleedInvulzin(zin.textWithBlanks)
        .map((stuk) => (stuk.soort === "tekst" ? stuk.waarde : " ______ "))
        .join("")
        .replace(/\s+/g, " ")
        .trim(),
      antwoord: volledigeZin(zin.textWithBlanks),
      bron: ex.title,
    })),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Invuloefening",
    uitleg: "Zinnen met een weggelaten woord",
    Vorm: dynamic(() => import("./Maken")),
  },
  Speler: dynamic<SpelerProps<"fillblank">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"fillblank">>(() => import("./Afdruk")),
};
