import type { Exercise, ExerciseType, InhoudPerType } from "./types";

/*
 * De inhoud van een oefening, per werkvorm.
 *
 * In de code is elk veld van een werkvorm verplicht (zie InhoudPerType). In Firestore staat
 * ouder en geïmporteerd materiaal waar een veld kan ontbreken. `vulInhoudAan` zet daar een
 * lege waarde, zodat de rest van de code niet bij elke lezing moet nagaan of het veld er is.
 * De opslaglaag roept het aan bij het inlezen; wat op schijf staat, verandert niet.
 */

/** Een lege inhoud per werkvorm. Telkens een nieuw object, zodat niemand een lijst deelt. */
const LEEG: { [T in ExerciseType]: () => InhoudPerType[T] } = {
  flashcard: () => ({ flashcards: [] }),
  quiz: () => ({ questions: [] }),
  matching: () => ({ matchingPairs: [] }),
  wordtrainer: () => ({ wordTrainerItems: [] }),
  fillblank: () => ({ fillBlanks: [] }),
  zinbouwen: () => ({ ordenItems: [] }),
  volgorde: () => ({ ordenItems: [] }),
  sorteren: () => ({ categorieen: [], sorteerItems: [] }),
  openvraag: () => ({ openVragen: [] }),
  lezen: () => ({ leestekst: "", questions: [] }),
  werkwoorden: () => ({ werkwoorden: [] }),
  rekenen: () => ({ rekenopdracht: { soort: "procent", aantal: 0 } }),
  escaperoom: () => ({ escaperoom: { sloten: [] } }),
  tekenen: () => ({ tekenopdrachten: [] }),
  poll: () => ({ pollQuestion: "", pollOptions: [] }),
  wordcloud: () => ({ wordCloudPrompt: "" }),
  exitticket: () => ({ exitTicketPrompts: [] }),
  timer: () => ({}),
  randomizer: () => ({}),
  groupmaker: () => ({}),
};

/**
 * Maakt van een ingelezen document een oefening waar elk veld van de werkvorm in zit.
 * Een veld dat ontbreekt of leeg (null) is, krijgt de lege waarde; de rest blijft staan.
 */
export function vulInhoudAan(ruw: Exercise): Exercise {
  const maakLeeg = LEEG[ruw.type];
  // Een type dat deze versie niet kent: laat het document zoals het is.
  if (!maakLeeg) return ruw;

  const content: Record<string, unknown> = { ...maakLeeg() };
  for (const [veld, waarde] of Object.entries(ruw.content ?? {})) {
    if (waarde !== undefined && waarde !== null) content[veld] = waarde;
  }
  // Een escaperoom zonder lijst van sloten is even onbruikbaar als een zonder escaperoom.
  if (ruw.type === "escaperoom") {
    const kamer = content.escaperoom as Partial<InhoudPerType["escaperoom"]["escaperoom"]>;
    if (!Array.isArray(kamer.sloten)) content.escaperoom = { ...kamer, sloten: [] };
  }
  return { ...ruw, content } as Exercise;
}

/**
 * Een filter op werkvorm die TypeScript ook begrijpt:
 * `oefeningen.filter(vanType("quiz"))` geeft een lijst van `OefeningVan<"quiz">`.
 */
export function vanType<T extends ExerciseType>(...types: T[]) {
  return (ex: Exercise): ex is Extract<Exercise, { type: T }> => (types as ExerciseType[]).includes(ex.type);
}
