import dynamic from "next/dynamic";
import { Brush } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const tekenen: Werkvorm<"tekenen"> = {
  id: "tekenen",
  label: "Teken uit je geheugen",
  uitleg:
    "Cursisten krijgen alleen een naam, bijvoorbeeld een logo of een vlag, en tekenen het zoals ze het zich herinneren. Pas daarna zie je het echte beeld.",
  icon: Brush,
  waar: "cursist",
  eenheid: ["afbeelding", "afbeeldingen"],
  lesfase: "activate",
  // Tekenen en dan rustig vergelijken.
  secondenPerItem: 90,
  aantal: (inhoud) => inhoud.tekenopdrachten.length,
  tip:
    "Teken eerst alles wat je nog weet, ook als je twijfelt. Wie zich iets probeert te herinneren voor hij kijkt, onthoudt het origineel daarna beter.",
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Teken uit je geheugen",
    uitleg: "Een logo, vlag of bord tekenen zoals je het je herinnert; daarna het origineel",
    Vorm: dynamic(() => import("@/components/maken/TekenenVorm").then((m) => m.TekenenVorm)),
  },
  klassikaal: { parameter: "tekenen" },
  Speler: dynamic<SpelerProps<"tekenen">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"tekenen">>(() => import("./Afdruk")),
};
