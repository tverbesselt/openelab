import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { DidacticGoal, Exercise, ExerciseType, InhoudPerType, OefeningVan } from "@/lib/types";
import type { Zelfoordeel } from "@/lib/herhalen";
import type { OpfrisItem } from "@/lib/opfrissen";
import type { FunctieId } from "@/lib/instellingen/functies";

/*
 * Wat een werkvorm over zichzelf vertelt.
 *
 * Elke werkvorm heeft een eigen map in src/werkvormen met een index.ts die één Werkvorm
 * uitvoert. Het register (register.ts) verzamelt ze; de rest van de app leest daaruit en
 * heeft geen eigen lijst per werkvorm meer.
 *
 * De onderdelen met een scherm (speler, afdruk, maakvorm) laadt een werkvorm met
 * dynamic(() => import(...)). Zo blijft het register licht: een pagina die alleen een
 * label of een icoon nodig heeft, sleept niet alle spelers mee.
 */

/** Wat de oefenpagina aan een speler meegeeft. */
export interface SpelerProps<T extends ExerciseType> {
  oefening: OefeningVan<T>;
  /** Is de kijker een leraar? Een klassikale werkvorm toont dan de knop om te starten. */
  isLeraar: boolean;
  /** Een kaart is beoordeeld: de oefenpagina plant wanneer ze terugkomt. */
  onBeoordeeld: (kaartId: string, oordeel: Zelfoordeel) => void;
  /** Een quiz is af: welke vragen gingen fout. Anoniem, voor het overzicht van de leraar. */
  onQuizKlaar: (foutVragen: string[], aantalVragen: number) => void;
}

/** Wat de afdrukpagina aan een werkblad meegeeft. */
export interface AfdrukProps<T extends ExerciseType> {
  oefening: OefeningVan<T>;
  /** De versie voor de leraar, met de antwoorden erbij. */
  metAntwoorden: boolean;
}

/** Een blok onder de speler dat alleen de maker ziet, zoals de inzendingen of de struikelvragen. */
export interface LeraarProps<T extends ExerciseType> {
  oefening: OefeningVan<T>;
}

/** Wat de maakpagina aan elk formulier meegeeft. */
export interface VormProps {
  /** De velden die elke oefening deelt: maker, zichtbaarheid, code, datum. */
  basis: () => Pick<
    Exercise,
    "creatorName" | "creatorId" | "visibility" | "shareCode" | "createdAt"
  >;
  bezig: boolean;
  fout: string;
  setFout: (tekst: string) => void;
  bewaar: (nieuwe: Exercise[]) => void;
  /** De gedeelde blokken onderaan: wie mag dit zien, en in welke map. */
  bestemming: ReactNode;
  /** Taal van de voorleesknop, gekozen bovenaan het formulier. */
  spraakTaal: string;
  setSpraakTaal: (taal: string) => void;
  /** De kiezer met de gewone uitleg. Wie een eigen woord wil, zet zelf een TaalKiezer. */
  taalKiezer: ReactNode;
  /**
   * Bij aanpassen: de oefening zoals ze nu is. Het formulier start dan ingevuld, en wat het
   * bewaart komt in de plaats van deze oefening (zelfde code). Leeg bij iets nieuws.
   */
  bestaand?: Exercise;
}

/** De bestaande oefening, als het formulier ze aanpast en ze van deze werkvorm is. */
export function bestaandVan<T extends ExerciseType>(p: VormProps, type: T): OefeningVan<T> | undefined {
  return p.bestaand?.type === type ? (p.bestaand as OefeningVan<T>) : undefined;
}

/** De tekst op de knop onderaan: iets maken, of je wijzigingen bewaren. */
export function knopTekst(p: VormProps, nieuw: string): string {
  return p.bestaand ? "Bewaar je wijzigingen" : nieuw;
}

export interface Werkvorm<T extends ExerciseType = ExerciseType> {
  id: T;
  label: string;
  /** Wat is dit, in mensentaal. Eén zin, voor een leraar die het nog nooit zag. */
  uitleg: string;
  icon: LucideIcon;
  /** Waar draait de werkvorm: op het digibord of op het toestel van de cursist. */
  waar: "klas" | "cursist";
  /** Enkelvoud/meervoud van de inhoud, voor "12 kaarten". */
  eenheid: [enkelvoud: string, meervoud: string];
  /**
   * Op welk moment in de les de werkvorm thuishoort. Bepaalt de groep op de startpagina,
   * in de bibliotheek, op de maakpagina en in Beheer. Een klastool is "facilitate".
   */
  lesfase: DidacticGoal;
  /**
   * Ruwe tijdsinschatting in seconden per item. Bewust aan de royale kant: een cursist die
   * sneller klaar is voelt zich goed, omgekeerd niet.
   */
  secondenPerItem: number;
  /** Hoeveel items er in de inhoud zitten, voor "12 kaarten" en de geschatte duur. */
  aantal: (inhoud: InhoudPerType[T]) => number;
  /** Eén zin onder de speler: waarom je het zo doet. */
  tip?: string;
  /** Vragen met een antwoord, voor Opfrissen. Ontbreekt waar er niets op te frissen valt. */
  opfris?: (oefening: OefeningVan<T>) => OpfrisItem[];
  /**
   * Voorbeeldmateriaal voor de demomodus. Laadt pas als de demo erom vraagt, zodat het op
   * school niet mee in de bundel zit.
   */
  voorbeelden?: () => Promise<OefeningVan<T>[]>;
  /** De keuze op de maakpagina en het formulier erachter. Ontbreekt: niet zelf te maken. */
  maken?: {
    titel: string;
    uitleg: string;
    Vorm: ComponentType<VormProps>;
  };
  /**
   * Hoe de werkvorm klassikaal start, op de livepagina. Ontbreekt: ze is er niet voor het
   * digibord. Een poll draait alleen zo; een quiz kan het ook, als Quizwedstrijd.
   */
  klassikaal?: {
    /** De naam in de URL van de livepagina: /live?<parameter>=<id>. */
    parameter: "oefening" | "wedstrijd" | "tekenen";
    /** De schakelaar in Beheer die dit toelaat, als dat een andere is dan de werkvorm zelf. */
    functie?: FunctieId;
  };
  /** De speler op de oefenpagina. */
  Speler?: ComponentType<SpelerProps<T>>;
  /** Het werkblad op de afdrukpagina. */
  Afdruk?: ComponentType<AfdrukProps<T>>;
  /** Wat alleen de maker onder de speler ziet. */
  Leraar?: ComponentType<LeraarProps<T>>;
}
