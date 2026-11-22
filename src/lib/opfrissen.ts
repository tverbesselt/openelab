import { Exercise } from "./types";
import { werkvormVan } from "@/werkvormen/register";

/*
 * Dagelijkse herhaling: bij de start van de les een paar vragen uit vorige lessen op het
 * bord, eerst zonder antwoord.
 *
 * Rosenshine noemt dagelijkse herhaling als eerste van zijn tien principes, en het is
 * meteen de goedkoopste: vijf minuten, geen voorbereiding, en het haalt de stof terug
 * boven vóór er nieuwe leerstof bijkomt.
 */

export interface OpfrisItem {
  id: string;
  vraag: string;
  antwoord: string;
  /** Uit welke oefening dit komt; klein onderaan het bord. */
  bron: string;
  /** Extra uitleg bij een quizvraag, als de leraar die meegaf. */
  toelichting?: string;
}

/**
 * Alles uit één oefening waar een vraag en een antwoord in zit. Elke werkvorm zegt zelf hoe
 * (zie `opfris` in src/werkvormen). Polls, woordwolken, exit tickets en rekenen hebben
 * geen vaste vraag met antwoord om uit een vorige les op te frissen.
 */
export function opfrisItemsVan(ex: Exercise): OpfrisItem[] {
  return werkvormVan(ex).opfris?.(ex) ?? [];
}

export function opfrisItems(oefeningen: Exercise[]): OpfrisItem[] {
  return oefeningen.flatMap(opfrisItemsVan);
}

/** Een willekeurige greep, zonder herhaling. */
export function kiesWillekeurig<T>(lijst: T[], aantal: number): T[] {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie.slice(0, aantal);
}
