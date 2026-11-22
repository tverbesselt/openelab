/*
 * De databank onder de opslag: documenten in verzamelingen, met een pad als adres
 * ("oefeningen/abc", "sessies/123456/antwoorden/toestel-1").
 *
 * Er zijn twee uitvoeringen: Firestore (firestore.ts) en localStorage voor de demomodus
 * (lokaal.ts). Alles wat Open E-lab over zijn gegevens weet, staat één keer in opslag.ts en
 * praat alleen met dit contract.
 */

/** Een voorwaarde bij het opvragen van een lijst: dit veld heeft deze waarde. */
export type Waar = [veld: string, waarde: string | number | boolean];

export interface Document<T> {
  id: string;
  data: T;
}

export type Schrijfactie =
  /** Zet het hele document, of het al bestond of niet. */
  | { soort: "zet"; pad: string; data: object }
  /**
   * Een nieuw document dat er nog niet mag staan, zoals een toestel dat meedoet of een
   * antwoord instuurt. Firestore laat de regels dat bewaken; de demomodus doet het zelf.
   */
  | { soort: "maak"; pad: string; data: object }
  /** Werk een bestaand document bij. */
  | {
      soort: "wijzig";
      pad: string;
      /** Velden die een nieuwe waarde krijgen. */
      data?: object;
      /** Velden die verdwijnen. */
      weg?: string[];
      /** Waarden die bij een lijstveld komen, als ze er nog niet in staan. */
      erbij?: Record<string, unknown[]>;
      /** Waarden die uit een lijstveld verdwijnen. */
      eraf?: Record<string, unknown[]>;
    }
  | { soort: "wis"; pad: string };

export interface Databank {
  /** Eén document, of null als het niet bestaat. */
  lees<T>(pad: string): Promise<T | null>;
  /** De documenten van een verzameling die aan alle voorwaarden voldoen. */
  lijst<T>(verzameling: string, waar?: Waar[]): Promise<Document<T>[]>;
  /** Voert de acties samen uit: allemaal, of geen enkele. */
  schrijf(...acties: Schrijfactie[]): Promise<void>;
  /** Volg één document; null zodra het niet (meer) bestaat of niet gelezen mag worden. */
  volg<T>(pad: string, bij: (document: T | null) => void): () => void;
  /** Volg een verzameling. `bijFout` meldt dat volgen niet (meer) lukt. */
  volgLijst<T>(
    verzameling: string,
    waar: Waar[],
    bij: (documenten: T[]) => void,
    bijFout?: () => void
  ): () => void;
  /** Een nieuw, uniek id voor een document. */
  nieuwId(): string;
}
