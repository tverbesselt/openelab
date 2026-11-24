import {
  Beheerder,
  BordItem,
  Exercise,
  Herhaling,
  Inzending,
  Lesmap,
  LiveAntwoord,
  LiveSessie,
  OefeningKort,
  Tekening,
  Quizresultaat,
  VorigeVersie,
  WedstrijdAntwoord,
  WedstrijdSpeler,
} from "@/lib/types";
import type { Eigenaar } from "@/lib/labels";

/** Waar een code van zes tekens naartoe leidt. */
export type CodeDoel = { soort: "oefening"; id: string } | { soort: "map"; id: string };

/**
 * Eén contract voor de opslag, twee uitvoeringen:
 *  - Firestore zodra er een Firebase-project ingesteld is (gedeeld over alle toestellen);
 *  - localStorage in demomodus (alles blijft in deze browser).
 * Pagina's praten alleen met dit contract, nooit rechtstreeks met Firestore.
 */
export interface Opslag {
  /* Materiaal */

  /** Alles wat deze persoon mag zien: gedeeld met de organisatie plus eigen materiaal. */
  zichtbareOefeningen(kijker: Eigenaar | null): Promise<Exercise[]>;
  oefening(id: string): Promise<Exercise | null>;
  /** Nieuw materiaal wegschrijven, elk met zijn eigen code. */
  maakOefeningen(nieuwe: Exercise[]): Promise<void>;
  wijzigOefening(id: string, wijziging: Partial<Exercise>): Promise<void>;
  /**
   * Een aangepaste oefening in de plaats van de oude zetten: zelfde id, zelfde code. Anders
   * dan wijzigOefening verdwijnen velden die de nieuwe versie niet meer heeft, zoals een
   * weggehaalde omslagfoto.
   */
  vervangOefening(oefening: Exercise): Promise<void>;
  /** De versie van vóór de laatste aanpassing, of null als er geen is. */
  vorigeVersie(id: string): Promise<VorigeVersie | null>;
  /** Zet de vorige versie terug. Wat er nu staat, wordt zelf de vorige versie. */
  herstelVorigeVersie(id: string): Promise<Exercise>;
  /**
   * Naar de prullenbak. De oefening verdwijnt uit elke lijst en cursisten kunnen ze niet
   * meer openen, maar ze blijft bewaard, met haar code en haar resultaten.
   */
  verwijderOefening(id: string): Promise<void>;
  /** Uit de prullenbak terug in gebruik, met dezelfde code. */
  herstelOefening(id: string): Promise<void>;
  /** Voorgoed weg: de oefening, haar code, haar vorige versie en wat cursisten instuurden. */
  wisOefening(id: string): Promise<void>;
  /**
   * Wat in de prullenbak zit: het eigen materiaal, en voor een beheerder ook gedeeld
   * materiaal van collega's. Wat er langer dan PRULLENBAK_DAGEN zit, wordt hierbij gewist.
   */
  prullenbak(kijker: Eigenaar | null, alsBeheerder: boolean): Promise<OefeningKort[]>;

  /* Mappen */

  /** Persoonlijke mappen; organisatiemappen zitten er niet bij. */
  eigenMappen(eigenaar: Eigenaar | null): Promise<Lesmap[]>;
  /** De mappen van de school. Alleen voor leraren. */
  organisatieMappen(): Promise<Lesmap[]>;
  map(id: string): Promise<Lesmap | null>;
  maakMap(map: Lesmap): Promise<void>;
  wijzigMap(id: string, wijziging: Partial<Lesmap>): Promise<void>;
  /** Zet de map in een andere map van dezelfde soort. null = het hoogste niveau. */
  verplaatsMap(id: string, bovenMapId: string | null): Promise<void>;
  /**
   * De submappen schuiven in dezelfde beweging een niveau hoger, naar de map waar zij zelf
   * in zat. Zo raakt er nooit een map zoek.
   */
  verwijderMap(id: string): Promise<void>;
  /** Haal een oefening uit de ene map en zet ze in de andere, in één beweging. */
  verplaatsOefening(oefeningId: string, vanMapId: string, naarMapId: string): Promise<void>;

  /** Waar hoort deze code bij? */
  viaCode(code: string): Promise<CodeDoel | null>;

  /* Live in de klas */

  startSessie(sessie: LiveSessie): Promise<void>;
  wijzigSessie(code: string, wijziging: Partial<LiveSessie>): Promise<void>;
  /** Volg één sessie; null zodra ze niet (meer) bestaat. Geeft een stopfunctie terug. */
  volgSessie(code: string, bij: (sessie: LiveSessie | null) => void): () => void;
  /** De eigen sessies van de voorbije weken, nieuwste eerst. */
  eigenSessies(hostId: string): Promise<LiveSessie[]>;
  /** Een sessie en alles wat erin zit meteen weghalen, zonder op de vervaldatum te wachten. */
  wisSessie(code: string): Promise<void>;
  /** Alleen de host: de antwoorden van een sessie in één keer, om ze te bewaren. */
  antwoorden(code: string): Promise<LiveAntwoord[]>;
  /** Alleen de leraar die de sessie host krijgt de antwoorden binnen. */
  volgAntwoorden(code: string, bij: (antwoorden: LiveAntwoord[]) => void): () => void;
  /**
   * Eén antwoord per toestel. Bij een stemming wordt een tweede poging geweigerd; bij de
   * begripsmeter vervangt ze het vorige signaal, want die mag de hele les meebewegen.
   */
  stuurAntwoord(code: string, antwoord: LiveAntwoord): Promise<void>;

  /* Quizwedstrijd: spelers met een bijnaam, één antwoord per vraag en per toestel */

  /** Een toestel doet mee onder een bijnaam. Alleen aanmaken; de punten schrijft het bord. */
  meldSpeler(code: string, speler: WedstrijdSpeler): Promise<void>;
  /** Het toestel volgt zijn eigen stand; null zodra het bord de speler verwijderde. */
  volgSpeler(code: string, apparaat: string, bij: (speler: WedstrijdSpeler | null) => void): () => void;
  /** Alleen de host: alle spelers. */
  volgSpelers(code: string, bij: (spelers: WedstrijdSpeler[]) => void): () => void;
  /** Alleen de host: punten, reeks en plaats in één keer bijwerken. */
  werkSpelersBij(code: string, spelers: WedstrijdSpeler[]): Promise<void>;
  /** Alleen de host: een ongepaste bijnaam weghalen. */
  verwijderSpeler(code: string, apparaat: string): Promise<void>;
  /** Eén antwoord per vraag; een tweede poging wordt geweigerd. */
  stuurWedstrijdAntwoord(code: string, antwoord: WedstrijdAntwoord): Promise<void>;
  /** Alleen de host: de antwoorden op één vraag. */
  volgWedstrijdAntwoorden(
    code: string,
    vraagNr: number,
    bij: (antwoorden: WedstrijdAntwoord[]) => void
  ): () => void;

  /* Whiteboard: kaartjes van leraar en cursisten */

  /** Een kaartje op het bord zetten. Voor cursisten gelden de keuzes van de leraar. */
  stuurBordItem(code: string, item: BordItem): Promise<void>;
  /**
   * Volg het bord. De host krijgt alles, ook wat nog op goedkeuring wacht; een cursist
   * alleen wat zichtbaar is, en alleen als de leraar het bord op de toestellen toont.
   */
  volgBord(code: string, alles: boolean, bij: (items: BordItem[]) => void, bijFout?: () => void): () => void;
  /** Alleen de host: goedkeuren, vastpinnen, naar een andere kolom. */
  wijzigBordItem(code: string, id: string, wijziging: Partial<BordItem>): Promise<void>;
  /** Alleen de host. */
  verwijderBordItem(code: string, id: string): Promise<void>;

  /* Teken uit je geheugen: één tekening per toestel en per opdracht */

  /** Een tekening insturen. Mag ook voor een vorige opdracht, als de leraar al verder ging. */
  stuurTekening(code: string, tekening: Tekening): Promise<void>;
  /** Alleen de host: alle tekeningen van de sessie, live. */
  volgTekeningen(code: string, bij: (tekeningen: Tekening[]) => void, bijFout?: () => void): () => void;
  /** Alleen de host, bijvoorbeeld bij iets ongepasts. */
  verwijderTekening(code: string, id: string): Promise<void>;

  /* Exit tickets */

  stuurInzending(oefeningId: string, antwoorden: string[]): Promise<void>;
  inzendingen(oefeningId: string): Promise<Inzending[]>;
  /** Alle inzendingen wissen, bijvoorbeeld voor een nieuwe groep. */
  wisInzendingen(oefeningId: string): Promise<void>;

  /* Quizresultaten: geaggregeerd en anoniem, alleen voor de maker */

  stuurQuizresultaat(
    oefeningId: string,
    foutVragen: string[],
    aantalVragen: number
  ): Promise<void>;
  quizresultaten(oefeningId: string): Promise<Quizresultaat[]>;
  wisQuizresultaten(oefeningId: string): Promise<void>;

  /* Beheerders: alleen een beheerder leest en wijzigt de lijst */

  beheerders(): Promise<Beheerder[]>;
  voegBeheerderToe(adres: string, door: string): Promise<void>;
  verwijderBeheerder(adres: string): Promise<void>;

  /* Gespreid herhalen: van de cursist zelf, voor niemand anders leesbaar */

  herhalingen(gebruikerId: string): Promise<Herhaling[]>;
  bewaarHerhaling(gebruikerId: string, herhaling: Herhaling): Promise<void>;
}
