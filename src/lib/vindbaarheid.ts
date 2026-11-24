import type { Exercise, OefeningKort } from "@/lib/types";

/*
 * Wat een leraar bij zijn materiaal zet zodat collega's het terugvinden: het vak of de
 * opleiding, een eigen beschrijving en trefwoorden. Alles is vrij en mag leeg blijven.
 */

export interface Vindbaarheid {
  vak: string;
  beschrijving: string;
  /** Zoals getypt: gescheiden door komma's. */
  trefwoorden: string;
}

export const LEGE_VINDBAARHEID: Vindbaarheid = { vak: "", beschrijving: "", trefwoorden: "" };

export const MAX_VAK = 80;
const MAX_TREFWOORD = 40;
const MAX_TREFWOORDEN = 12;

/** "NT2, richtgraad 1 , NT2" wordt ["NT2", "richtgraad 1"]. */
export function leesTrefwoorden(tekst: string): string[] {
  const gezien = new Set<string>();
  const lijst: string[] = [];
  for (const deel of tekst.split(/[,\n;]/)) {
    const woord = deel.trim().slice(0, MAX_TREFWOORD);
    const sleutel = woord.toLowerCase();
    if (!woord || gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    lijst.push(woord);
  }
  return lijst.slice(0, MAX_TREFWOORDEN);
}

/** Wat er nu bij een oefening staat, om het formulier mee te vullen. */
export function vindbaarheidVan(ex: Exercise | OefeningKort): Vindbaarheid {
  return { vak: ex.vak ?? "", beschrijving: ex.description, trefwoorden: ex.tags.join(", ") };
}

/**
 * De oefening met het vak, de beschrijving en de trefwoorden van de leraar erin.
 *  - Bij iets nieuws komen de trefwoorden bij die van de werkvorm ("Quiz").
 *  - Bij aanpassen staan alle trefwoorden in het veld; wat de leraar wegveegt, is weg.
 * Een lege beschrijving laat staan wat de werkvorm zelf schreef.
 */
export function metVindbaarheid<T extends Exercise>(ex: T, v: Vindbaarheid, bijAanpassen: boolean): T {
  const eigen = leesTrefwoorden(v.trefwoorden);
  const tags = bijAanpassen ? eigen : leesTrefwoorden([...ex.tags, ...eigen].join(","));
  const nieuw: T = {
    ...ex,
    description: v.beschrijving.trim() || ex.description,
    tags,
  };
  const vak = v.vak.trim().slice(0, MAX_VAK);
  // Een leeg vak is geen veld: de databank bewaart geen lege waarden.
  if (vak) nieuw.vak = vak;
  else delete nieuw.vak;
  return nieuw;
}

/** De vakken die al in gebruik zijn, alfabetisch: zo typt iedereen hetzelfde vak hetzelfde. */
export function bekendeVakken(oefeningen: { vak?: string }[]): string[] {
  const perSleutel = new Map<string, string>();
  for (const ex of oefeningen) {
    const vak = ex.vak?.trim();
    if (vak && !perSleutel.has(vak.toLowerCase())) perSleutel.set(vak.toLowerCase(), vak);
  }
  return [...perSleutel.values()].sort((a, b) => a.localeCompare(b, "nl"));
}
