import type { BordItem, LiveSessie, Tekening, WedstrijdAntwoord } from "@/lib/types";

/*
 * Wat in de demomodus de plaats inneemt van firestore.rules, voor wat een toestel in een
 * live-sessie instuurt. Zonder deze controles zou een cursist in de demo twee keer kunnen
 * stemmen of iets op een gesloten bord zetten, en dan toont de demo iets wat op school
 * niet kan.
 *
 * Het is geen volledige kopie van de regels: wie wat mag lezen en wie eigenaar is, speelt
 * in één browser niet. De echte regels hebben hun eigen tests (tests/rules).
 */

export interface Inzet {
  /** "maak" voor iets nieuws van een toestel, "zet" als het document vervangen mag worden. */
  soort: "maak" | "zet";
  /** De sessie waar het document bij hoort, of null als ze niet bestaat. */
  sessie: LiveSessie | null;
  /** Wat er al op dit adres stond. */
  bestaand: unknown;
  /** Wat het toestel wil wegschrijven. */
  nieuw: unknown;
}

const actief = (sessie: LiveSessie | null): sessie is LiveSessie => sessie?.status === "actief";

/** Per deelverzameling van een sessie: mag dit document er zo in? Gooit een fout als het niet mag. */
export const BIJ_INSTUREN: Record<string, (inzet: Inzet) => void> = {
  antwoorden({ sessie, bestaand }) {
    if (!actief(sessie)) throw new Error("Deze sessie is niet (meer) actief.");
    // De begripsmeter loopt de hele les mee: een nieuw signaal vervangt het vorige.
    if (bestaand && sessie.type !== "begripsmeter") throw new Error("Je hebt al geantwoord.");
  },

  spelers({ soort, sessie, bestaand }) {
    // Het bord zet de punten van de hele klas in één keer; dat mag altijd.
    if (soort === "zet") return;
    if (!actief(sessie)) throw new Error("Deze sessie is niet (meer) actief.");
    if (bestaand) throw new Error("Je doet al mee.");
  },

  quizantwoorden({ sessie, bestaand, nieuw }) {
    const antwoord = nieuw as WedstrijdAntwoord;
    if (!actief(sessie) || sessie.quiz?.fase !== "vraag" || sessie.quiz.vraagNr !== antwoord.vraagNr) {
      throw new Error("Deze vraag is al afgesloten.");
    }
    if (bestaand) throw new Error("Je hebt al geantwoord.");
  },

  bord({ sessie, nieuw }) {
    const item = nieuw as BordItem;
    if (!actief(sessie)) throw new Error("Dit bord is gesloten.");
    const instellingen = sessie.bord;
    if (!item.leraar && (!instellingen?.open || !instellingen.soorten.includes(item.soort))) {
      throw new Error("Dit mag nu niet op het bord.");
    }
  },

  tekeningen({ sessie, bestaand, nieuw }) {
    const tekening = nieuw as Tekening;
    if (!actief(sessie) || !sessie.tekenen) throw new Error("Deze sessie is niet (meer) actief.");
    if (tekening.nr > sessie.tekenen.nr) throw new Error("Deze opdracht is nog niet aan de beurt.");
    if (bestaand) throw new Error("Al ingestuurd.");
  },
};

/**
 * Wat een cursist van het bord te zien krijgt: niets, zolang de leraar het bord niet op de
 * toestellen toont. De host vraagt het hele bord op, zonder voorwaarde, en ziet alles.
 */
export function magBordLezen(sessie: LiveSessie | null, alsCursist: boolean): boolean {
  return !alsCursist || sessie?.bord?.zichtbaar === true;
}
