import dynamic from "next/dynamic";
import { Layers } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const flashcard: Werkvorm<"flashcard"> = {
  id: "flashcard",
  label: "Flashcards",
  uitleg: "Kaartjes met vraag en antwoord. De cursist bedenkt eerst zelf het antwoord en draait dan pas om.",
  icon: Layers,
  waar: "cursist",
  eenheid: ["kaart", "kaarten"],
  lesfase: "automate",
  secondenPerItem: 15,
  aantal: (inhoud) => inhoud.flashcards.length,
  opfris: (ex) =>
    ex.content.flashcards.map((kaart) => ({
      id: `${ex.id}-${kaart.id}`,
      vraag: kaart.front,
      antwoord: kaart.back,
      bron: ex.title,
      toelichting: kaart.exampleSentence,
    })),
  Speler: dynamic<SpelerProps<"flashcard">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"flashcard">>(() => import("./Afdruk")),
};
