import type { Exercise, FlashcardItem, InhoudPerType, MatchingPair, OefeningVan, WordTrainerItem } from "./types";
import type { Begrip } from "./begrippen";

/*
 * Flashcards, matching en de woordentrainer pas je aan als een begrippenlijst: één begrip
 * en zijn betekenis per regel. Een kaart kan meer hebben dan dat (een voorbeeldzin, een
 * foto, een geluid). Wat bij een begrip hoort dat blijft staan, blijft dus mee, met zijn id:
 * zo loopt de herhaalplanning van een cursist gewoon door.
 */

/** De werkvormen die je als begrippenlijst aanpast. */
export const BEGRIPPEN_TYPES = ["flashcard", "matching", "wordtrainer"] as const;
export type BegrippenType = (typeof BEGRIPPEN_TYPES)[number];

export function isBegrippenType(type: string): type is BegrippenType {
  return (BEGRIPPEN_TYPES as readonly string[]).includes(type);
}

/** De begrippen in een bestaande oefening, of null als het geen begrippenlijst is. */
export function begrippenVan(ex: Exercise): Begrip[] | null {
  switch (ex.type) {
    case "flashcard":
      return ex.content.flashcards.map((k) => ({ word: k.front, translation: k.back }));
    case "matching":
      return ex.content.matchingPairs.map((p) => ({ word: p.left, translation: p.right }));
    case "wordtrainer":
      return ex.content.wordTrainerItems.map((w) => ({ word: w.word, translation: w.translation }));
    default:
      return null;
  }
}

/**
 * Zoekt bij elk begrip het oude item met hetzelfde begrip, elk oud item hoogstens één keer.
 * Een nieuw begrip krijgt een id dat nog niet bestaat.
 */
function koppel<T extends { id: string }>(
  oud: T[],
  begrippen: Begrip[],
  sleutel: (item: T) => string,
  voorvoegsel: string
): T[] {
  const vrij = [...oud];
  const gevonden = begrippen.map((b) => {
    const plaats = vrij.findIndex((item) => sleutel(item).trim() === b.word.trim());
    return plaats === -1 ? undefined : vrij.splice(plaats, 1)[0];
  });

  // Een id dat ooit bij een ander begrip hoorde, geven we niet opnieuw uit.
  const bezet = new Set(oud.map((o) => o.id));
  return gevonden.map((item, index) => {
    if (item) return item;
    let id = `${voorvoegsel}-${index}`;
    for (let n = 1; bezet.has(id); n++) id = `${voorvoegsel}-${index}-${n}`;
    bezet.add(id);
    return { id } as T;
  });
}

/** De nieuwe inhoud uit de aangepaste lijst, met wat bij een gebleven begrip hoorde. */
export function inhoudMetBegrippen(
  ex: OefeningVan<BegrippenType>,
  begrippen: Begrip[]
): InhoudPerType[BegrippenType] {
  switch (ex.type) {
    case "flashcard": {
      const oud = ex.content.flashcards;
      const flashcards: FlashcardItem[] = koppel(oud, begrippen, (k) => k.front, "fc").map((k, i) => ({
        ...k,
        front: begrippen[i].word,
        back: begrippen[i].translation,
      }));
      return { flashcards };
    }
    case "matching": {
      const oud = ex.content.matchingPairs;
      const matchingPairs: MatchingPair[] = koppel(oud, begrippen, (p) => p.left, "mp").map((p, i) => ({
        ...p,
        left: begrippen[i].word,
        right: begrippen[i].translation,
      }));
      return { matchingPairs };
    }
    case "wordtrainer": {
      const oud = ex.content.wordTrainerItems;
      const wordTrainerItems: WordTrainerItem[] = koppel(oud, begrippen, (w) => w.word, "wt").map((w, i) => ({
        ...w,
        word: begrippen[i].word,
        translation: begrippen[i].translation,
      }));
      return { wordTrainerItems };
    }
  }
}
