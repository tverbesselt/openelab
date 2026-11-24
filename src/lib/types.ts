export type DidacticGoal = 
  | 'activate'     // Voorkennis activeren & interesse wekken
  | 'automate'     // Inoefenen & automatiseren (Retrieval Practice)
  | 'check'        // Begrip controleren & formatieve toetsing
  | 'reflect'      // Metacognitie & samenwerken
  | 'facilitate';  // Lesfacilitatie & klastools

export type ExerciseCategory = 
  | 'practice'      // Oefenen & Onthouden
  | 'quiz'          // Quiz & Kennischeck
  | 'live'          // Live in de Klas
  | 'language'      // Taal & Woordenschat
  | 'media'         // Afbeelding & Media
  | 'collaboration' // Samenwerken & Reflecteren
  | 'tool';         // Klastools

export type ExerciseType =
  | 'flashcard'
  | 'quiz'
  | 'matching'
  | 'wordtrainer'
  | 'fillblank'
  | 'zinbouwen'
  | 'volgorde'
  | 'sorteren'
  | 'openvraag'
  | 'lezen'
  | 'werkwoorden'
  | 'rekenen'
  | 'escaperoom'
  | 'tekenen'
  | 'poll'
  | 'wordcloud'
  | 'exitticket'
  | 'timer'
  | 'randomizer'
  | 'groupmaker';

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  audio?: string;
  image?: string;
  exampleSentence?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  /**
   * Leeg bij 'typ' en 'dia': daar is er niets om uit te kiezen. Bij 'volgorde' staan de
   * delen hier in de juiste volgorde; de speler husselt ze.
   */
  options: string[];
  correctAnswers: number[]; // index numbers; leeg bij 'volgorde' en 'dia'
  /**
   *  - volgorde: zet de delen in de juiste volgorde (een zin, de stappen van een procedure).
   *  - dia: geen vraag, alleen uitleg tussendoor. `question` is de titel, `explanation` de
   *    tekst. Telt niet mee voor de score.
   */
  type: 'multiple_choice' | 'multiple_response' | 'true_false' | 'typ' | 'volgorde' | 'dia';
  /**
   * Hoeveel seconden deze vraag krijgt in de Quizwedstrijd, als de leraar kiest voor
   * "tijd zoals in de quiz". Leeg = de tijd die de leraar bij de start kiest.
   */
  seconden?: number;
  /** Punten in de wedstrijd: 0 geen, 1 gewoon (standaard), 2 dubbel. */
  punten?: 0 | 1 | 2;
  /**
   * Een afbeelding per antwoordmogelijkheid, op dezelfde plaats als in `options`. null waar
   * een optie geen beeld heeft. Bij een optie met alleen een beeld is de tekst in `options`
   * de beschrijving (alt) van dat beeld.
   */
  optieMedia?: (QuizMedia | null)[];
  /**
   * Alleen bij 'typ': de antwoorden die goed gerekend worden. Het eerste is het antwoord
   * dat we tonen. Hoofdletters, accenten en extra spaties maken niet uit
   * (zie src/lib/typantwoord.ts).
   */
  antwoorden?: string[];
  explanation: string; // Actionable immediate feedback explaining WHY
  /** Een foto, filmpje of audiofragment waar de vraag over gaat. */
  media?: QuizMedia;
}

/**
 * Media bij een quizvraag.
 *  - afbeelding en audio staan in Firebase Storage (of als data-URL in demomodus);
 *  - video is altijd een link naar YouTube of Vimeo: uploaden is te zwaar en te duur.
 */
export interface QuizMedia {
  soort: 'afbeelding' | 'video' | 'audio';
  url: string;
  /** Beschrijving voor wie de afbeelding niet ziet. Verplicht bij een afbeelding. */
  alt?: string;
  /** Alleen video: vanaf en tot welke seconde het fragment loopt. */
  start?: number;
  eind?: number;
  /** Waar een vrije afbeelding vandaan komt. De licentie vraagt dat we de maker vermelden. */
  bron?: BeeldBron;
}

/**
 * De bronvermelding van een afbeelding uit een vrije beeldbank (Openverse). Een eigen
 * upload heeft er geen.
 */
export interface BeeldBron {
  /** Bijvoorbeeld "CC BY 4.0", "CC0" of "Publiek domein". */
  licentie: string;
  licentieUrl?: string;
  maker?: string;
  makerUrl?: string;
  /** De pagina van het origineel. */
  pagina?: string;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface WordTrainerItem {
  id: string;
  word: string;
  translation: string;
  definition?: string;
  exampleSentence?: string;
}

export interface FillBlankItem {
  id: string;
  textWithBlanks: string; // e.g. "De hoofdstad van België is [[Brussel]]."
  answers: string[];
}

/**
 * Eén reeks die op volgorde moet komen: de woorden van een zin, of de stappen van een
 * procedure. De volgorde in `delen` is de juiste; de speler husselt.
 */
export interface OrdenItem {
  id: string;
  /** Optionele opdracht boven de reeks, bijvoorbeeld "Hoe verzorg je een wonde?". */
  opdracht?: string;
  delen: string[];
}

export interface SorteerItem {
  id: string;
  tekst: string;
  /** Index in content.categorieen. */
  categorie: number;
}

export interface OpenVraag {
  id: string;
  vraag: string;
  modelantwoord: string;
}

/** Eén werkwoord met zijn vormen. De persoon staat erbij, zodat de vraag klopt. */
export interface WerkwoordItem {
  id: string;
  infinitief: string;
  /** Bijvoorbeeld { persoon: "nous", vorm: "parlons" }. */
  vormen: { persoon: string; vorm: string }[];
}

export type Rekensoort =
  | 'procent'
  | 'btw'
  | 'korting'
  | 'eenheden'
  | 'breuken'
  | 'ohm'
  | 'verhouding';

/**
 * Rekenen met telkens nieuwe getallen. De leraar kiest het type; Open E-lab maakt de
 * opgaven, zodat een cursist onbeperkt kan oefenen zonder dat er honderd vragen getypt zijn.
 */
export interface Rekenopdracht {
  soort: Rekensoort;
  /** Hoeveel opgaven per ronde. */
  aantal: number;
}

/**
 * Eén slot in een escaperoom: een opdracht, en het antwoord dat het slot opent. Dat
 * antwoord is een woord, een getal of een code; het wordt nagekeken zoals een quizvraag
 * waarbij je het antwoord intypt (zie src/lib/escaperoom.ts).
 */
export interface Slot {
  id: string;
  opdracht: string;
  /** Wat het slot opent. Het eerste tonen we als oplossing. */
  antwoorden: string[];
  /** Een duwtje in de goede richting, voor wie vastzit. */
  hint?: string;
  /** Een foto, filmpje of audiofragment waar de opdracht over gaat. */
  media?: QuizMedia;
}

/**
 * Een reeks sloten die één voor één opengaan. Het verhaal zet de toon, de afloop is wat
 * de cursisten te lezen krijgen als het laatste slot open is.
 */
export interface Escaperoom {
  verhaal?: string;
  sloten: Slot[];
  afloop?: string;
}

/**
 * Teken uit je geheugen: de cursist krijgt alleen de naam (bv. "Vlag van Zweden") en
 * tekent het beeld zoals hij het zich herinnert. Het echte beeld zie je pas na het
 * tekenen, om te vergelijken. Generiek: logo's, vlaggen, verkeersborden, organen, ...
 */
export interface Tekenopdracht {
  id: string;
  /** Wat de cursist te zien krijgt. Het enige, tot hij klaar is met tekenen. */
  naam: string;
  /** Het echte beeld. Altijd een afbeelding. */
  beeld: QuizMedia;
}

export interface DidacticConfig {
  showImmediateFeedback: boolean;
  allowRetryMissed: boolean;
  enableGamification: boolean; // default false (Andragogie rule)
  /**
   * Alleen bij een quiz (ook de vragen bij een leestekst). Aan: wie fout antwoordt, krijgt
   * eerst te horen dat het nog niet juist is, zonder het juiste antwoord, en probeert een
   * tweede keer. Pas daarna volgen het juiste antwoord en de uitleg. Uit of leeg: meteen
   * het juiste antwoord, zoals vroeger. De leraar kiest dit bij het maken.
   */
  tweedeKans?: boolean;
  timerSeconds?: number;
  /**
   * Taal waarin de voorleesknop het materiaal uitspreekt, bijvoorbeeld "fr-FR".
   * Leeg = Nederlands. Zie src/lib/spraak.ts voor de talen.
   */
  spraakTaal?: string;
}

/**
 * Wie ziet dit materiaal staan?
 *  - prive       enkel de leraar die het maakte. Cursisten met de code of QR-code kunnen
 *                het wél openen — dat is het hele punt van drempelloos oefenen.
 *  - organisatie iedereen van de organisatie vindt het in de bibliotheek.
 */
export type Zichtbaarheid = 'prive' | 'organisatie';

/**
 * Wat er in `content` zit, per werkvorm. Elke werkvorm heeft alleen zijn eigen velden, en
 * die zijn verplicht: wie `content.questions` leest, moet eerst weten dat het een quiz of
 * een leestekst is. Oude documenten zonder een veld vult de opslaglaag aan bij het inlezen
 * (zie src/lib/oefeningInhoud.ts); de vorm in Firestore blijft zoals ze was.
 */
export interface InhoudPerType {
  flashcard: { flashcards: FlashcardItem[] };
  quiz: { questions: QuizQuestion[] };
  matching: { matchingPairs: MatchingPair[] };
  wordtrainer: { wordTrainerItems: WordTrainerItem[] };
  fillblank: { fillBlanks: FillBlankItem[] };
  /** Rijen die in de juiste volgorde moeten komen. */
  zinbouwen: { ordenItems: OrdenItem[] };
  volgorde: { ordenItems: OrdenItem[] };
  sorteren: { categorieen: string[]; sorteerItems: SorteerItem[] };
  openvraag: { openVragen: OpenVraag[] };
  /** De tekst, en de vragen die erbij horen. */
  lezen: { leestekst: string; questions: QuizQuestion[] };
  werkwoorden: { werkwoorden: WerkwoordItem[] };
  rekenen: { rekenopdracht: Rekenopdracht };
  escaperoom: { escaperoom: Escaperoom };
  tekenen: { tekenopdrachten: Tekenopdracht[] };
  poll: { pollQuestion: string; pollOptions: string[] };
  wordcloud: { wordCloudPrompt: string };
  exitticket: { exitTicketPrompts: string[] };
  /** Klastools hebben geen inhoud. */
  timer: Record<string, never>;
  randomizer: Record<string, never>;
  groupmaker: Record<string, never>;
}

/** Wat elke oefening heeft, los van de werkvorm. */
export interface OefeningBasis {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  didacticGoal: DidacticGoal;
  creatorName: string;
  /**
   * Wie het maakte: de Firebase-uid van de leraar, of het e-mailadres in demomodus.
   * Voorbeeldmateriaal heeft dit niet; daar valt de eigenaarscheck terug op de naam.
   */
  creatorId?: string;
  visibility: Zichtbaarheid;
  shareCode: string;
  /** Omslagfoto, op de kaart in de bibliotheek en bij de start van een quiz. */
  cover?: QuizMedia;
  /** Waar dit materiaal vandaan komt, als het geïmporteerd is (bv. "kahoot:<uuid>"). */
  bron?: string;
  didacticConfig: DidacticConfig;
  createdAt: string;
  /** Trefwoorden: de werkvorm zet er een paar, de leraar vult aan. */
  tags: string[];
  /** Het vak of de opleiding, zoals de leraar het noemt (bv. "NT2 richtgraad 1"). */
  vak?: string;
  /**
   * Wanneer dit in de prullenbak belandde. Leeg = gewoon in gebruik. Na dertig dagen
   * verdwijnt het voorgoed (zie PRULLENBAK_DAGEN in de opslag).
   */
  verwijderdOp?: string;
}

/** Een oefening van één bepaalde werkvorm, bijvoorbeeld `OefeningVan<"quiz">`. */
export type OefeningVan<T extends ExerciseType> = {
  [K in T]: OefeningBasis & { type: K; content: InhoudPerType[K] };
}[T];

/**
 * Een oefening. `type` zegt welke werkvorm het is en dus wat er in `content` zit: na
 * `ex.type === "quiz"` kent TypeScript `ex.content.questions`.
 */
export type Exercise = OefeningVan<ExerciseType>;

/**
 * Een map waarin een leraar materiaal ordent, bijvoorbeeld "Wiskunde les 1".
 * De map is van de leraar zelf, maar heeft een eigen code: zo geef je een hele les
 * in één keer mee aan je cursisten.
 *
 * Een organisatiemap is van de hele school: elke leraar ziet ze, alleen een
 * beheerder maakt ze aan en schikt er gedeeld materiaal in.
 */
export interface Lesmap {
  id: string;
  title: string;
  description: string;
  exerciseIds: string[];
  creatorName: string;
  creatorId?: string;
  shareCode: string;
  createdAt: string;
  organisatie?: boolean;
  /** Alleen bij een organisatiemap: de map waar deze map in zit. Leeg = bovenaan. */
  bovenMapId?: string;
}

/**
 * Een klassikale sessie: de leraar projecteert, cursisten antwoorden op hun toestel.
 * De pincode van zes cijfers is meteen de sleutel van de sessie.
 */
/**
 * De klassikale werkvormen.
 *  - poll en wordcloud komen uit klaargezet materiaal;
 *  - snellevraag, begripsmeter en bord start de leraar ter plekke, zonder voorbereiding;
 *  - quiz is de Quizwedstrijd, met een Eenvoudige quiz als bron.
 */
export type LiveType = 'poll' | 'wordcloud' | 'snellevraag' | 'begripsmeter' | 'quiz' | 'bord' | 'tekenen';

/* ── Teken uit je geheugen, klassikaal ─────────────────────────────────────
 * Een live-sessie van het type 'tekenen'. De leraar zet de opdrachten één voor één
 * klaar; alle toestellen volgen. Het sessiedocument bevat alleen de naam van de huidige
 * opdracht. Het echte beeld komt er pas in als de leraar op "Toon origineel" drukt.
 */
export interface TekenToestand {
  /** De huidige opdracht, vanaf 0. */
  nr: number;
  aantal: number;
  /** De naam van de huidige opdracht: het enige wat de cursist ziet. */
  naam: string;
  /** Tekentijd per opdracht in seconden. 0 = geen limiet. */
  seconden: number;
  /** Wanneer de huidige opdracht begon, voor de klok. */
  gestartOp: string;
  /** Anoniem, of met een naam die de cursist zelf kiest. */
  namen: 'anoniem' | 'naam';
  /** Het echte beeld van de huidige opdracht, pas na "Toon origineel". */
  origineel?: string;
  origineelAlt?: string;
}

/** Eén tekening van één toestel voor één opdracht. Alleen de leraar leest ze. */
export interface Tekening {
  /** apparaat_nr: één tekening per toestel en per opdracht. */
  id: string;
  apparaat: string;
  nr: number;
  /** Alleen bij een sessie met namen. */
  auteur?: string;
  /** De tekening als data-URL (PNG, WebP of JPEG), klein genoeg voor één document. */
  beeld: string;
  /** Hoe lang de cursist tekende. */
  seconden: number;
  op: string;
}

/* ── Whiteboard ────────────────────────────────────────────────────────────
 * Een live-sessie van het type 'bord': leraar en cursisten zetten tekst, foto's,
 * tekeningen, filmpjes en ingesproken audio op één bord, en iedereen ziet het groeien.
 * De leraar kiest wat cursisten mogen toevoegen en kan dat tijdens de les bijstellen.
 */

export type BordSoort = 'tekst' | 'afbeelding' | 'tekening' | 'video' | 'audio';

export interface BordInstellingen {
  /** Wat cursisten mogen toevoegen. De leraar zelf mag altijd alles. */
  soorten: BordSoort[];
  /** Hoeveel tekens een tekst mag tellen. 0 = geen eigen grens (dan 1000). */
  maxTekens: number;
  /** Hoe lang een ingesproken fragment mag duren, in seconden. */
  maxSeconden: number;
  /** Hoeveel bijdragen per toestel. 0 = onbeperkt. Het toestel houdt dit bij. */
  maxPerCursist: number;
  /** Anoniem, of met een naam die de cursist zelf kiest. */
  namen: 'anoniem' | 'naam';
  /** Eerst goedkeuren: een bijdrage verschijnt pas als de leraar ze vrijgeeft. */
  nakijken: boolean;
  /** Zien cursisten het bord op hun toestel, of alleen vooraan? */
  zichtbaar: boolean;
  /** Optionele kolommen, bv. "Voordelen" en "Nadelen". Leeg = één muur. */
  kolommen: string[];
  /** Kunnen cursisten nu iets toevoegen? De leraar zet het bord tussendoor even dicht. */
  open: boolean;
}

/** Eén kaartje op het bord. */
export interface BordItem {
  id: string;
  apparaat: string;
  /** Alleen bij een bord met namen. */
  auteur?: string;
  /** Gezet door de leraar zelf. */
  leraar?: boolean;
  soort: BordSoort;
  /** De tekst, of het onderschrift bij een foto, tekening, filmpje of fragment. */
  tekst?: string;
  /**
   * Foto, tekening en audio: een data-URL, verkleind in de browser zodat een kaartje in
   * één document past. Video: de link naar YouTube of Vimeo.
   */
  url?: string;
  /** Beschrijving van een foto, voor wie hem niet ziet. */
  alt?: string;
  /** In welke kolom, vanaf 0. Ontbreekt bij een bord zonder kolommen. */
  kolom?: number;
  status: 'wacht' | 'zichtbaar';
  /** Vastgepind: staat bovenaan. */
  vast?: boolean;
  op: string;
}

/* ── Quizwedstrijd ─────────────────────────────────────────────────────────
 * Een live-sessie van het type 'quiz'. Het bord van de leraar stuurt het verloop en
 * berekent de punten; de toestellen sturen alleen hun keuze in. Zie
 * docs/VOORSTEL_QUIZWEDSTRIJD.md.
 */

export type WedstrijdFase = 'wachtruimte' | 'vraag' | 'uitleg' | 'tussenstand' | 'podium';

export interface WedstrijdInstellingen {
  /** rustig: 1000 punten per juist antwoord. klassiek: sneller antwoorden levert meer op. */
  spelvorm: 'rustig' | 'klassiek';
  /** Seconden per vraag. 0 = de leraar sluit de vraag zelf af (alleen bij rustig). */
  seconden: number;
  /**
   * Elke vraag krijgt de tijd die in de quiz staat (QuizQuestion.seconden). Een vraag
   * zonder eigen tijd krijgt `seconden`.
   */
  tijdUitQuiz?: boolean;
  reeksbonus: boolean;
  /** Na elke vraag de tussenstand tonen, of pas op het einde. */
  tussenstand: 'elkeVraag' | 'einde';
  /**
   * Op het einde een podium met de top 3. Uit: geen rangschikking, iedereen ziet alleen
   * zijn eigen punten. Leeg = aan.
   */
  podium?: boolean;
  /**
   * In hoeveel teams de klas speelt. 0 = ieder voor zich. De teamscore is het gemiddelde
   * van de leden, zodat een groter team geen voordeel heeft.
   */
  teams: number;
}

/** Wat alle toestellen van de wedstrijd zien. Het juiste antwoord pas na de vraag. */
export interface WedstrijdToestand {
  fase: WedstrijdFase;
  /** Welke vraag loopt of net liep, vanaf 0. -1 in de wachtruimte. */
  vraagNr: number;
  aantalVragen: number;
  instellingen: WedstrijdInstellingen;
  /** De vraag zoals het toestel ze toont, met de antwoorden al gehusseld. */
  vraag?: {
    tekst: string;
    opties: string[];
    meerdere: boolean;
    /** Bij 'typ' typt de cursist zijn antwoord; dan zijn er geen opties. */
    typen?: boolean;
    /** Bij 'volgorde' zet de cursist de opties in de juiste volgorde. */
    volgorde?: boolean;
    /** Een dia: alleen kijken, niets te antwoorden. De tekst staat in `uitleg`. */
    dia?: boolean;
    /** De tekst van een dia. */
    diaTekst?: string;
    media?: QuizMedia;
    /** Beelden bij de opties, in dezelfde (gehusselde) volgorde. */
    optieMedia?: (QuizMedia | null)[];
    /** De tijd voor deze vraag, in seconden. 0 = de leraar sluit zelf af. */
    seconden?: number;
    /** 0 geen punten, 2 dubbele punten. Leeg = gewoon. */
    punten?: number;
  };
  /** Na het afsluiten van de vraag. */
  juist?: number[];
  /** Bij 'typ': het juiste antwoord, uitgeschreven. */
  juisteTekst?: string;
  uitleg?: string;
  /** Hoeveel toestellen elke optie kozen. */
  verdeling?: number[];
  /** Bij 'typ': wat de klas intypte, met hoe vaak. Zonder namen. */
  gegeven?: { tekst: string; aantal: number; juist: boolean }[];
}

/** Eén deelnemer, met een bijnaam. De punten schrijft alleen het bord. */
export interface WedstrijdSpeler {
  apparaat: string;
  bijnaam: string;
  op: string;
  /** In welk team, vanaf 0. Ontbreekt bij een wedstrijd zonder teams. */
  team?: number;
  punten?: number;
  /** Aantal juiste antwoorden op rij. */
  reeks?: number;
  plaats?: number;
  /** De stand van het eigen team; het bord rekent ze uit. */
  teamPunten?: number;
  teamPlaats?: number;
  /** Hoe de laatste vraag voor dit toestel afliep. */
  laatste?: { vraagNr: number; beantwoord: boolean; juist: boolean; punten: number; bonus: number };
}

/** Het antwoord van één toestel op één vraag. */
export interface WedstrijdAntwoord {
  apparaat: string;
  vraagNr: number;
  /** De gekozen opties, in de gehusselde volgorde van het toestel. */
  keuze?: number[];
  /** Bij een vraag van het type 'typ': wat de cursist intypte. */
  tekst?: string;
  op: string;
}

export interface LiveSessie {
  code: string;
  hostId: string;
  hostNaam: string;
  /** Ontbreekt bij een snelle vraag of begripsmeter: die hangen aan geen materiaal. */
  oefeningId?: string;
  titel: string;
  type: LiveType;
  vraag: string;
  /** De antwoordmogelijkheden. Bij een woordwolk leeg. */
  opties: string[];
  status: 'actief' | 'afgesloten';
  /** Zolang dit uit staat, ziet de cursist alleen "bedankt", geen tussenstand. */
  toonResultaten: boolean;
  /** Alleen bij een snelle vraag: wat de leraar achteraf als juist aanduidt. */
  juisteOptie?: number;
  gestartOp: string;
  /** Alleen bij een quizwedstrijd. */
  quiz?: WedstrijdToestand;
  /** Alleen bij een whiteboard. */
  bord?: BordInstellingen;
  /** Alleen bij Teken uit je geheugen. */
  tekenen?: TekenToestand;
}

/** Eén antwoord van één toestel. Het toestel-id is de sleutel: zo stem je maar één keer. */
export interface LiveAntwoord {
  apparaat: string;
  /** Index van de gekozen optie (poll). */
  optie?: number;
  /** Ingetypt woord (woordwolk). */
  woord?: string;
  op: string;
}

/** Iemand die de app mee beheert. Het e-mailadres is de sleutel. */
export interface Beheerder {
  adres: string;
  toegevoegdDoor?: string;
  op?: string;
}

/**
 * Een oefening zoals ze in een lijst staat. Hier is dat de oefening zelf: de lijsten halen
 * het materiaal volledig op.
 */
export type OefeningKort = Exercise;

/** De vorige versie van een aangepaste oefening, met wanneer ze vervangen werd. */
export interface VorigeVersie {
  oefening: Exercise;
  bewaardOp: string;
}

/** Wat een cursist instuurt bij een exit ticket. Anoniem, alleen voor de maker leesbaar. */
export interface Inzending {
  id: string;
  antwoorden: string[];
  op: string;
}

/**
 * Wanneer een cursist een kaart weer moet zien. Gespreid herhalen laat kennis van het
 * werkgeheugen naar het langetermijngeheugen verhuizen (Cepeda e.a., Dunlosky e.a.).
 */
export interface Herhaling {
  /** oefeningId en kaartId samen; dat is ook de sleutel in de opslag. */
  id: string;
  oefeningId: string;
  kaartId: string;
  /** Leitner-doos 0 tot 5. Hoe hoger, hoe langer tot de volgende beurt. */
  doos: number;
  /** Datum JJJJ-MM-DD waarop de kaart weer aan de beurt is. */
  volgende: string;
  bijgewerkt: string;
}

/**
 * Wat een quiz opleverde, zonder wie het was. De leraar ziet daarmee welke vraag het
 * vaakst fout ging, niet hoe een cursist scoorde.
 */
export interface Quizresultaat {
  id: string;
  /** Ids van de vragen die fout beantwoord werden. */
  foutVragen: string[];
  aantalVragen: number;
  op: string;
}
