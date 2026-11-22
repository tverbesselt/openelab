/*
 * Studeertips, één per scherm, in eigen woorden.
 *
 * De inhoud komt uit "Studeren met succes" (Hoof, Surma & Kirschner, Thomas More, 2023),
 * een tweeluik voor cursisten en leraren over wat de wetenschap weet over effectief
 * studeren. Zie docs/STUDEERTIPS.md voor de analyse en de licentie: we nemen geen tekst
 * over, elke tip verwijst wel naar de studeerkaart of paragraaf waar ze vandaan komt.
 *
 * Regels: één tip per scherm, in de handeling, nooit blokkerend. Geen reeksen, geen druk.
 */

/** De schermen waar een roterende tip staat. */
export type TipPlek =
  | "cursist-start"
  | "leraar-start"
  | "maken"
  | "opfrissen"
  | "digibord"
  | "live";

export interface Studietip {
  id: string;
  voor: "cursist" | "leraar";
  plek: TipPlek;
  /** Kort label vooraan, bijvoorbeeld "Zeg erbij" voor een zin die de leraar letterlijk zegt. */
  kop?: string;
  tekst: string;
  /** Studeerkaart of paragraaf in het boekje, zodat elke zin herleidbaar blijft. */
  bron: string;
}

export const STUDIETIPS: Studietip[] = [
  /* ── Cursist, startpagina ─────────────────────────────────────────────── */
  {
    id: "c-kort-en-vaak",
    voor: "cursist",
    plek: "cursist-start",
    tekst:
      "Oefen liever drie keer een kwartier dan één keer een uur. Je onthoudt de leerstof langer én haalt ze makkelijker op.",
    bron: "studeerkaart 10",
  },
  {
    id: "c-niet-meteen",
    voor: "cursist",
    plek: "cursist-start",
    tekst:
      "Test jezelf niet meteen na de les. Vanavond of morgen moet je harder nadenken, en net dat blijft hangen.",
    bron: "3.2.1",
  },
  {
    id: "c-vast-moment",
    voor: "cursist",
    plek: "cursist-start",
    tekst:
      "Koppel oefenen aan een vast moment: op de trein, bij de koffie, voor het slapen. Een gewoonte kost minder moeite dan wilskracht.",
    bron: "2.1",
  },
  {
    id: "c-herkennen",
    voor: "cursist",
    plek: "cursist-start",
    tekst:
      "Herkennen is niet hetzelfde als herinneren. Lukt de quiz? Zeg het antwoord daarna eens zonder naar de keuzes te kijken.",
    bron: "3.1",
  },
  {
    id: "c-meldingen",
    voor: "cursist",
    plek: "cursist-start",
    tekst: "Zet je meldingen uit terwijl je oefent. Je brein kan niet twee dingen tegelijk.",
    bron: "1.3.2",
  },

  /* ── Leraar, startpagina ──────────────────────────────────────────────── */
  {
    id: "l-benoem",
    voor: "leraar",
    plek: "leraar-start",
    tekst:
      "Benoem in de les welke manier van oefenen je inzet en waarom. Cursisten nemen een strategie pas over als ze weten dat ze werkt.",
    bron: "docenten, vier stappen",
  },
  {
    id: "l-drie-minuten",
    voor: "leraar",
    plek: "leraar-start",
    tekst:
      "Start je les met drie minuten “wat weet je nog van vorige keer”, boek dicht, zonder overleg. Dat haalt de stof terug boven vóór er nieuwe bijkomt.",
    bron: "docenten, braindump",
  },
  {
    id: "l-drie-keer",
    voor: "leraar",
    plek: "leraar-start",
    tekst:
      "Laat dezelfde vraag drie keer terugkomen, gespreid over weken. De eerste keer ophalen telt het meest, de derde keer maakt het duurzaam.",
    bron: "docenten, drie tips",
  },
  {
    id: "l-code-later",
    voor: "leraar",
    plek: "leraar-start",
    tekst:
      "Deel de code niet alleen op het einde van de les. Wie thuis over twee dagen nog eens oefent, onthoudt het langer dan wie het nu meteen afwerkt.",
    bron: "3.2.1",
  },

  /* ── Leraar, maken ────────────────────────────────────────────────────── */
  {
    id: "m-twintig",
    voor: "leraar",
    plek: "maken",
    tekst:
      "Ongeveer twintig items per oefening werkt het best: genoeg om te spreiden, niet te veel voor één beurt.",
    bron: "studeerkaart 1",
  },
  {
    id: "m-uitleg-is-leerwinst",
    voor: "leraar",
    plek: "maken",
    tekst:
      "De uitleg bij een fout antwoord is de leerwinst. Zeg niet alleen dat het fout is, maar waarom het juiste antwoord juist is.",
    bron: "docenten, feedback",
  },
  {
    id: "m-uitgewerkt-voorbeeld",
    voor: "leraar",
    plek: "maken",
    tekst:
      "Schrijf een modelantwoord voluit, met de tussenstappen. Voor een cursist met weinig voorkennis is een uitgewerkt voorbeeld de beste start.",
    bron: "studeerkaart 8",
  },
  {
    id: "m-code-later",
    voor: "leraar",
    plek: "maken",
    tekst:
      "Deel de code niet alleen op het einde van de les. Wie thuis over twee dagen nog eens oefent, onthoudt het langer dan wie het nu meteen afwerkt.",
    bron: "3.2.1",
  },

  /* ── Leraar, opfrissen ────────────────────────────────────────────────── */
  {
    id: "o-zeg-erbij",
    voor: "leraar",
    plek: "opfrissen",
    kop: "Zeg erbij",
    tekst:
      "“Eerst iedereen zelf, boek dicht, niet overleggen. Het antwoord komt straks.” Geef een halve minuut per vraag.",
    bron: "docenten, oefentoetsen",
  },
  {
    id: "o-drie-weken",
    voor: "leraar",
    plek: "opfrissen",
    tekst:
      "Neem ook een oefening van drie weken geleden. Hoe verder terug, hoe harder ze moeten denken, en hoe meer het oplevert.",
    bron: "docenten, spaced retrieval",
  },
  {
    id: "o-andere-kleur",
    voor: "leraar",
    plek: "opfrissen",
    tekst:
      "Laat cursisten hun eigen antwoord verbeteren, in een andere kleur. Wat ze fout hadden, is hun startpunt voor thuis.",
    bron: "studeerkaart 2",
  },

  /* ── Leraar, digibord ─────────────────────────────────────────────────── */
  {
    id: "d-doel-als-kunnen",
    voor: "leraar",
    plek: "digibord",
    tekst:
      "Formuleer het doel als wat de cursist straks kan: “je kan een afspraak maken bij de dokter”. Zeg erbij wat ze daarvoor nodig hebben.",
    bron: "docenten, leerdoelen",
  },
  {
    id: "d-tijd-erbij",
    voor: "leraar",
    plek: "digibord",
    tekst:
      "Zet de tijd bij de opdracht. Een zichtbare klok van drie minuten voor “schrijf op wat je nog weet” werkt beter dan “even nadenken”.",
    bron: "docenten, braindump",
  },

  /* ── Leraar, live ─────────────────────────────────────────────────────── */
  {
    id: "v-eerst-zelf",
    voor: "leraar",
    plek: "live",
    tekst:
      "Laat iedereen eerst zelf stemmen. Pas daarna overleggen. Anders leunt de helft op het denkwerk van de andere helft.",
    bron: "docenten, oefentoetsen",
  },
  {
    id: "v-zeg-waarom",
    voor: "leraar",
    plek: "live",
    kop: "Zeg erbij",
    tekst:
      "“Wie zelf een antwoord ophaalt, onthoudt het langer dan wie het hoort.” Zo weten cursisten waarom je dit doet.",
    bron: "docenten, vier stappen",
  },
];

/**
 * De tip van vandaag voor een scherm. Per dag één, in vaste volgorde: wie de app elke dag
 * opent, ziet in een week alle tips zonder ooit een lijst te krijgen. Het dagnummer is
 * hetzelfde op de server en in de browser, dus de pagina springt niet om bij het laden.
 */
export function tipVanDeDag(plek: TipPlek, nu: number = Date.now()): Studietip | null {
  const tips = STUDIETIPS.filter((t) => t.plek === plek);
  if (tips.length === 0) return null;
  const dag = Math.floor(nu / 86_400_000);
  return tips[dag % tips.length];
}

/* ── Klasopdrachten met een vaste tijd ────────────────────────────────── */

/**
 * Korte opdrachten uit de boekjes, met de tijd die erbij hoort. De klastimer en het
 * digibordscherm zetten er met één klik de opdracht en de klok voor klaar.
 */
export interface Klasopdracht {
  id: string;
  label: string;
  minuten: number;
  opdracht: string;
  bron: string;
}

export const KLASOPDRACHTEN: Klasopdracht[] = [
  {
    id: "wat-weet-je-nog",
    label: "Wat weet je nog?",
    minuten: 3,
    opdracht: "Schrijf op wat je nog weet van vorige les. Boek dicht, niet overleggen.",
    bron: "studeerkaart 2, braindump",
  },
  {
    id: "eerst-zelf",
    label: "Eerst zelf",
    minuten: 1,
    opdracht: "Denk eerst alleen na over de vraag. Nog niet overleggen.",
    bron: "docenten, oefentoetsen",
  },
  {
    id: "leg-uit",
    label: "Leg het uit",
    minuten: 2,
    opdracht: "Leg aan je buur uit wat je net leerde, met een voorbeeld. Daarna wissel je.",
    bron: "studeerkaart 5",
  },
];

/* ── Standaardvragen voor het exit ticket ─────────────────────────────── */

export interface Vragenset {
  id: string;
  label: string;
  uitleg: string;
  vragen: string[];
}

export const EXIT_TICKET_SETS: Vragenset[] = [
  {
    id: "ophalen",
    label: "Ophalen",
    uitleg: "Cursisten halen de les zelf terug, in eigen woorden.",
    vragen: ["Noteer twee begrippen die je vandaag leerde en leg ze uit in eigen woorden."],
  },
  {
    id: "inschatten",
    label: "Inschatten",
    uitleg: "Wat ze snel vergeten, is je start van de volgende les.",
    vragen: ["Welk deel van vandaag ga je het snelst vergeten?", "Welke vraag heb je nog?"],
  },
  {
    id: "vooruitkijken",
    label: "Vooruitkijken",
    uitleg: "Een vast moment om te herhalen, gekozen door de cursist zelf.",
    vragen: ["Wanneer ga je dit thuis nog eens oefenen?"],
  },
];

/* ── Overzichtspagina "Slim oefenen" ──────────────────────────────────── */

export interface TipBlok {
  kop: string;
  tekst: string;
  /** Waar je dit in Open E-lab toepast. */
  link?: { href: string; label: string };
}

export const SLIM_OEFENEN_CURSIST: TipBlok[] = [
  {
    kop: "Haal het uit je hoofd, kijk niet na",
    tekst:
      "Bedenk eerst zelf het antwoord en draai dan pas om. Ophalen uit je geheugen is wat blijft hangen; herlezen voelt vlot maar leert weinig. Test jezelf liever vanavond of morgen dan meteen na de les: hoe harder je moet nadenken, hoe meer je leert.",
    link: { href: "/bibliotheek", label: "Naar de flashcards en de woordtrainer" },
  },
  {
    kop: "Kort en vaak",
    tekst:
      "Drie keer een kwartier werkt beter dan één keer een uur. Je vergeet snel na een eerste keer, maar elke herhaling maakt dat trager. Open E-lab plant je kaarten: wat je niet wist komt morgen terug, wat je wist pas over dagen of weken.",
    link: { href: "/herhalen", label: "Naar herhalen" },
  },
  {
    kop: "Door elkaar",
    tekst:
      "Tien keer hetzelfde type na elkaar gaat vlot, maar je leert er weinig van. Door elkaar moet je telkens kiezen welke regel geldt. Dat voelt lastiger en werkt beter. Daarom staan werkwoordsvormen, rekentypes en je herhaalkaarten gemengd.",
    link: { href: "/herhalen", label: "Herhalen mengt je kaarten" },
  },
  {
    kop: "Schat jezelf eerlijk in",
    tekst:
      "Wie nog weinig weet over iets, overschat zichzelf makkelijk. Kies dus “twijfel” als je twijfelt. Lukt de quiz? Herkennen is makkelijker dan herinneren. Probeer daarna de flashcards van dezelfde lijst.",
  },
  {
    kop: "Ook zonder de app",
    tekst:
      "Sluit je boek en schrijf drie minuten op wat je nog weet. Leg de leerstof uit aan iemand, met details en een voorbeeld. Neem notities in twee kolommen: rechts de inhoud, links een kernwoord of vraag. Dek dan de rechterkolom af en test jezelf.",
    link: { href: "/afdrukken/cornell", label: "Druk een leeg notitieblad in twee kolommen af" },
  },
];

export const SLIM_OEFENEN_LERAAR: TipBlok[] = [
  {
    kop: "Benoem het",
    tekst:
      "Zeg welke manier van oefenen je inzet en waarom ze werkt. Doe ze hardop voor, met je eigen denkstappen. Cursisten nemen een strategie pas over als ze ze in jouw les toegepast zien op hun leerstof, niet in een losse workshop.",
    link: { href: "/bibliotheek", label: "Elke lesfase heeft een zin om erbij te zeggen" },
  },
  {
    kop: "Begin met ophalen",
    tekst:
      "Drie minuten “wat weet je nog van vorige keer”, boek dicht, geen overleg. Pas daarna de nieuwe leerstof. Wat ze zelf ophalen, blijft langer hangen dan wat jij herhaalt.",
    link: { href: "/klastools?tool=timer", label: "De klastimer zet de opdracht en de klok klaar" },
  },
  {
    kop: "Herhaal cumulatief",
    tekst:
      "Laat vragen van drie weken geleden meedraaien. Hoe verder terug, hoe harder ze moeten denken en hoe meer het oplevert. Dezelfde vraag drie keer, gespreid over weken, maakt kennis duurzaam.",
    link: { href: "/opfrissen", label: "Opfrissen put uit al je materiaal" },
  },
  {
    kop: "Fouten zijn informatie",
    tekst:
      "Geen punten in de les. Een fout antwoord toont waar de klas nog moet kijken. De struikelvraag bij een quiz is je startpunt voor de volgende les, en de uitleg bij een fout antwoord is de leerwinst.",
    link: { href: "/maken", label: "Maak een quiz met uitleg per antwoord" },
  },
  {
    kop: "Laat cursisten zelf vragen bedenken",
    tekst:
      "Vijf toetsvragen per cursist over de les, met antwoord. Bespreek welke goed zijn en waarom. De volgende les beantwoordt iedereen een vraag van een medecursist, met gesloten boek. De goede vragen neem je op in je eigen quiz. Sluit af met een exit ticket: wat cursisten zelf aanduiden als “vergeet ik snel”, is je start van de volgende les.",
    link: { href: "/maken?vorm=exitticket", label: "Maak een exit ticket met standaardvragen" },
  },
];

export const BRON = {
  titel: "Studeren met succes",
  auteurs: "Tine Hoof, Tim Surma en Paul Kirschner",
  uitgever: "Thomas More",
  jaar: 2023,
  licentie: "Creative Commons: naamsvermelding, niet-commercieel, gelijk delen",
};
