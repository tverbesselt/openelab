import type { Exercise, ExerciseType } from "@/lib/types";
import type { FunctieId } from "@/lib/instellingen/functies";
import type { Werkvorm } from "./soorten";
import { poll } from "./poll";
import { wordcloud } from "./wordcloud";
import { tekenen } from "./tekenen";
import { flashcard } from "./flashcard";
import { wordtrainer } from "./wordtrainer";
import { matching } from "./matching";
import { fillblank } from "./fillblank";
import { zinbouwen } from "./zinbouwen";
import { volgorde } from "./volgorde";
import { sorteren } from "./sorteren";
import { werkwoorden } from "./werkwoorden";
import { rekenen } from "./rekenen";
import { quiz } from "./quiz";
import { lezen } from "./lezen";
import { openvraag } from "./openvraag";
import { escaperoom } from "./escaperoom";
import { exitticket } from "./exitticket";
import { timer } from "./timer";
import { randomizer } from "./randomizer";
import { groupmaker } from "./groupmaker";

/*
 * Het register: alle werkvormen op één plaats.
 *
 * Een nieuwe werkvorm toevoegen:
 *   1. het type en zijn inhoud in src/lib/types.ts (ExerciseType en InhoudPerType);
 *   2. een map src/werkvormen/<type> met een index.ts die een Werkvorm uitvoert;
 *   3. hieronder één import en één regel in WERKVORMEN;
 *   4. de Firestore-regels, met een test erbij.
 * Labels, lesfases, Beheer, de maak-, oefen- en afdrukpagina, Opfrissen en het
 * voorbeeldmateriaal lezen allemaal hieruit.
 *
 * De volgorde hieronder is de volgorde in de lijsten: per lesfase, en binnen een lesfase
 * zoals de leraar ze te zien krijgt.
 */
export const WERKVORMEN: { [T in ExerciseType]: Werkvorm<T> } = {
  poll,
  wordcloud,
  tekenen,
  flashcard,
  wordtrainer,
  matching,
  fillblank,
  zinbouwen,
  volgorde,
  sorteren,
  werkwoorden,
  rekenen,
  quiz,
  lezen,
  openvraag,
  escaperoom,
  exitticket,
  timer,
  randomizer,
  groupmaker,
};

/** Eén werkvorm, van welk type ook. */
export type EenWerkvorm = (typeof WERKVORMEN)[ExerciseType];

export const WERKVORM_LIJST: EenWerkvorm[] = Object.values(WERKVORMEN);

/**
 * De werkvorm van een oefening, breed getypeerd. TypeScript kan niet volgen dat
 * WERKVORMEN[ex.type] en ex.content bij elkaar horen; deze ene plek zegt het.
 */
export function werkvormVan(ex: Exercise): Werkvorm {
  return WERKVORMEN[ex.type] as unknown as Werkvorm;
}

/** Hoeveel items zitten er in deze oefening? */
export function aantalItems(ex: Exercise): number {
  return werkvormVan(ex).aantal(ex.content);
}

/**
 * Waar deze oefening klassikaal start, en welke schakelaar in Beheer dat moet toelaten.
 * Geeft niets terug voor een werkvorm die niet op het digibord gespeeld wordt.
 */
export function klassikaleStart(ex: Exercise): { href: string; functie: FunctieId } | null {
  const { klassikaal } = werkvormVan(ex);
  if (!klassikaal) return null;
  return {
    href: `/live?${klassikaal.parameter}=${ex.id}`,
    functie: klassikaal.functie ?? ex.type,
  };
}
