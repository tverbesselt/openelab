import dynamic from "next/dynamic";
import { Languages } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const wordtrainer: Werkvorm<"wordtrainer"> = {
  id: "wordtrainer",
  label: "Woordtrainer",
  uitleg: "Woorden inoefenen met vertaling, uitspraak en voorbeeldzin.",
  icon: Languages,
  waar: "cursist",
  eenheid: ["woord", "woorden"],
  lesfase: "automate",
  secondenPerItem: 25,
  aantal: (inhoud) => inhoud.wordTrainerItems.length,
  opfris: (ex) =>
    ex.content.wordTrainerItems.map((woord) => ({
      id: `${ex.id}-${woord.id}`,
      vraag: woord.word,
      antwoord: woord.translation,
      bron: ex.title,
      toelichting: woord.exampleSentence,
    })),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  Speler: dynamic<SpelerProps<"wordtrainer">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"wordtrainer">>(() => import("./Afdruk")),
};
