import dynamic from "next/dynamic";
import { BookOpen } from "lucide-react";
import { opfrisUitVragen } from "../quiz/vragen";
import type { SpelerProps, AfdrukProps, LeraarProps, Werkvorm } from "../soorten";

export const lezen: Werkvorm<"lezen"> = {
  id: "lezen",
  label: "Lezen met vragen",
  uitleg: "Een korte tekst met vragen ernaast. De tekst blijft zichtbaar tijdens het antwoorden.",
  icon: BookOpen,
  waar: "cursist",
  eenheid: ["vraag", "vragen"],
  lesfase: "check",
  secondenPerItem: 45,
  aantal: (inhoud) => inhoud.questions.length,
  tip:
    "Lees eerst de hele tekst. Zeg dan in twee zinnen waarover hij gaat, zonder te kijken. Beantwoord daarna de vragen.",
  opfris: opfrisUitVragen,
  maken: {
    titel: "Lezen met vragen",
    uitleg: "Een tekst met de vragen ernaast",
    Vorm: dynamic(() => import("@/components/maken/NieuweVormen").then((m) => m.LezenVorm)),
  },
  Speler: dynamic<SpelerProps<"lezen">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"lezen">>(() => import("../quiz/VragenAfdruk")),
  Leraar: dynamic<LeraarProps<"lezen">>(() => import("../quiz/Overzicht")),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
};
