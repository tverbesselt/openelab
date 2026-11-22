import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { LucideIcon } from "lucide-react";
import type { DidacticGoal, ExerciseType } from "@/lib/types";
import { WERKVORMEN, WERKVORM_LIJST } from "@/werkvormen/register";
import type { VormProps } from "@/werkvormen/soorten";

/** Een keuze op de maakpagina: meestal één werkvorm, soms meerdere uit één lijst. */
export interface Keuze {
  /** De naam in de URL: /maken?vorm=<id>. Voor een werkvorm is dat haar type. */
  id: string;
  titel: string;
  uitleg: string;
  icon: LucideIcon;
  /** Welke werkvormen de keuze maakt. Ze verdwijnt als die allemaal uit staan. */
  werkvormen: ExerciseType[];
  /** Het formulier, met zijn eigen staat. */
  Vorm: ComponentType<VormProps>;
}

/**
 * Eén lijst van begrippen wordt drie werkvormen tegelijk. Dat is geen werkvorm op zich, dus
 * deze keuze staat niet in het register.
 */
const BEGRIPPEN: Keuze = {
  id: "begrippen",
  titel: "Begrippen of woorden",
  uitleg: "Wordt flashcards, matching en quiz in één keer",
  icon: WERKVORMEN.flashcard.icon,
  werkvormen: ["flashcard", "matching", "quiz"],
  Vorm: dynamic(() => import("./BegrippenVorm")),
};

/** Wat je voor een lesfase kunt maken: elke werkvorm uit het register met een maakvorm. */
function uitRegister(fase: DidacticGoal): Keuze[] {
  return WERKVORM_LIJST.flatMap((w) =>
    w.lesfase === fase && w.maken
      ? [{ id: w.id, titel: w.maken.titel, uitleg: w.maken.uitleg, icon: w.icon, werkvormen: [w.id], Vorm: w.maken.Vorm }]
      : []
  );
}

export interface Keuzegroep {
  titel: string;
  uitleg: string;
  vormen: Keuze[];
}

/**
 * Alles wat een leraar kan maken, gegroepeerd per moment in de les. Eén lijst voedt zowel
 * het keuzescherm (stap 1) als de kop boven het formulier (stap 2). De werkvormen zelf
 * komen uit het register (src/werkvormen): een nieuwe werkvorm met een maakvorm verschijnt
 * hier vanzelf.
 */
export const KEUZES: Keuzegroep[] = [
  {
    titel: "Inoefenen",
    uitleg: "Cursisten herhalen op eigen tempo, thuis of in het open leercentrum.",
    vormen: [BEGRIPPEN, ...uitRegister("automate")],
  },
  {
    titel: "Begrip controleren",
    uitleg: "Kijken of het is blijven hangen, zonder punten.",
    vormen: uitRegister("check"),
  },
  {
    titel: "Afsluiten en reflecteren",
    uitleg: "Op het einde van de les: wat blijft hangen, wat nog niet.",
    vormen: uitRegister("reflect"),
  },
  {
    titel: "Klassikaal op het digibord",
    uitleg: "Jij projecteert, cursisten antwoorden anoniem met hun smartphone.",
    vormen: uitRegister("activate"),
  },
];

export const ALLE_VORMEN = KEUZES.flatMap((groep) => groep.vormen);

/** Namen uit oudere links. De invuloefening heette in de URL "invul". */
export const OUDE_NAMEN: Record<string, string> = { invul: "fillblank" };
