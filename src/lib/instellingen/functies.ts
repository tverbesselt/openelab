import type { DidacticGoal, ExerciseType } from "@/lib/types";
import { WERKVORM_LIJST } from "@/werkvormen/register";

/*
 * Alles wat de beheerder aan of uit kan zetten.
 *
 * Een functie die uit staat, verdwijnt uit de menu's en de keuzeschermen. Bestaand materiaal
 * van dat type blijft bewaard, maar opent niet meer: wie het probeert, ziet dat deze
 * werkvorm uitgeschakeld is. Zet je ze weer aan, dan is alles terug.
 */

/** Live-activiteiten en hulpmiddelen die geen eigen oefeningstype zijn. */
export type ExtraFunctie =
  | "snellevraag"
  | "begripsmeter"
  | "wedstrijd"
  | "bord"
  | "opfrissen"
  | "digibord"
  | "herhalen"
  | "afdrukken"
  | "inlezen"
  | "audiotekst";

export type FunctieId = ExerciseType | ExtraFunctie;

export interface Functiegroep {
  /** Naam in de vertaling: beheer.groepen.<id>. */
  id: "inoefenen" | "controleren" | "activeren" | "live" | "klastools" | "cursist" | "spraak";
  functies: FunctieId[];
}

/** De werkvormen van een of meer lesfases, in de volgorde van het register. */
function werkvormenVan(...fases: DidacticGoal[]): ExerciseType[] {
  return WERKVORM_LIJST.filter((w) => fases.includes(w.lesfase)).map((w) => w.id);
}

/*
 * De werkvormen komen uit het register (src/werkvormen): een nieuwe werkvorm verschijnt
 * vanzelf in de groep van zijn lesfase. De functies die geen werkvorm zijn, staan hier.
 */
export const FUNCTIEGROEPEN: Functiegroep[] = [
  { id: "inoefenen", functies: werkvormenVan("automate") },
  { id: "controleren", functies: werkvormenVan("check", "reflect") },
  { id: "activeren", functies: werkvormenVan("activate") },
  { id: "live", functies: ["snellevraag", "begripsmeter", "wedstrijd", "bord"] },
  { id: "klastools", functies: [...werkvormenVan("facilitate"), "opfrissen", "digibord"] },
  { id: "cursist", functies: ["herhalen", "afdrukken"] },
  // Werkt pas met een sleutel van OpenAI (Beheer > Spraak). Zonder sleutel blijven de knoppen weg.
  { id: "spraak", functies: ["inlezen", "audiotekst"] },
];

export const ALLE_FUNCTIES: FunctieId[] = FUNCTIEGROEPEN.flatMap((g) => g.functies);

/** Is dit een eigen oefeningstype (en dus een label in WERKVORMEN)? */
export function isExtraFunctie(id: FunctieId): id is ExtraFunctie {
  return [
    "snellevraag",
    "begripsmeter",
    "wedstrijd",
    "bord",
    "opfrissen",
    "digibord",
    "herhalen",
    "afdrukken",
    "inlezen",
    "audiotekst",
  ].includes(id);
}

/**
 * Sommige functies hangen van een andere af. De quizwedstrijd speelt een Eenvoudige quiz,
 * dus zonder quiz is er ook geen wedstrijd.
 */
export const HANGT_AF_VAN: Partial<Record<FunctieId, FunctieId>> = {
  wedstrijd: "quiz",
};
