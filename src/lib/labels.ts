import { Lock, Building2, History, Presentation, AudioLines, type LucideIcon } from "lucide-react";
import { DidacticGoal, Exercise, ExerciseType, Lesmap, Zichtbaarheid } from "./types";
import { WERKVORMEN, WERKVORM_LIJST, aantalItems } from "@/werkvormen/register";

/**
 * Eén centrale plek voor alles wat de leraar te zien krijgt.
 * De app spreekt in lesfases en werkvormen, nooit in systeemwaarden
 * zoals "wordtrainer" of "collaboration".
 *
 * Wat een werkvorm over zichzelf vertelt (label, icoon, lesfase, speler, ...) staat in
 * src/werkvormen; hier staat wat daarboven hangt: de lesfases, de klastools, wie wat ziet.
 */

/* ── Lesfases (didactische doelen) ─────────────────────────────────────── */

export interface Lesfase {
  id: DidacticGoal;
  nummer: number;
  label: string;
  /** Wat de leraar op dat moment in de les wil doen. */
  wanneer: string;
  /** Waarom het werkt, in één zin. */
  waarom: string;
  /**
   * Wat de leraar er in de klas letterlijk bij zegt. Cursisten nemen een manier van
   * oefenen pas over als ze weten dat ze werkt (Studeren met succes, vier stappen).
   */
  zegErbij: string;
  werkvormen: ExerciseType[];
}

/** De werkvormen van een lesfase, in de volgorde van het register. */
function werkvormenVan(fase: DidacticGoal): ExerciseType[] {
  return WERKVORM_LIJST.filter((w) => w.lesfase === fase).map((w) => w.id);
}

export const LESFASES: Lesfase[] = [
  {
    id: "activate",
    nummer: 1,
    label: "Voorkennis activeren",
    wanneer: "Peil bij de start van de les wat je cursisten al weten.",
    waarom: "Je weet meteen waar je moet beginnen en cursisten haken sneller aan.",
    zegErbij:
      "Je weet hier al meer over dan je denkt. Alles wat je nu terugvindt, blijft beter hangen.",
    werkvormen: werkvormenVan("activate"),
  },
  {
    id: "automate",
    nummer: 2,
    label: "Inoefenen",
    wanneer: "Laat cursisten herhalen tot de leerstof vlot zit.",
    waarom: "Zelf ophalen uit het geheugen werkt veel beter dan herlezen.",
    zegErbij:
      "Bedenk eerst zelf het antwoord. Nakijken kan altijd nog, ophalen is het echte oefenen.",
    werkvormen: werkvormenVan("automate"),
  },
  {
    id: "check",
    nummer: 3,
    label: "Begrip controleren",
    wanneer: "Kijk tussendoor na of iedereen nog mee is.",
    waarom: "Cursisten krijgen direct uitleg bij een fout antwoord, zonder punten.",
    zegErbij:
      "Dit is geen toets. Een fout antwoord toont ons allebei waar we nog moeten kijken.",
    werkvormen: werkvormenVan("check"),
  },
  {
    id: "reflect",
    nummer: 4,
    label: "Afsluiten en reflecteren",
    wanneer: "Sluit de les af en verzamel wat blijft hangen.",
    waarom: "Je start de volgende les met wat nog onduidelijk was.",
    zegErbij: "Schrijf op wat je vandaag leerde, in eigen woorden. Niet wat op het bord stond.",
    werkvormen: werkvormenVan("reflect"),
  },
];

export const LESFASE_BY_ID: Record<DidacticGoal, Lesfase | undefined> = {
  activate: LESFASES[0],
  automate: LESFASES[1],
  check: LESFASES[2],
  reflect: LESFASES[3],
  facilitate: undefined,
};

export function lesfaseLabel(goal: DidacticGoal): string {
  return LESFASE_BY_ID[goal]?.label ?? "Klastools";
}

/* ── Werkvormen ────────────────────────────────────────────────────────── */

export { WERKVORMEN, WERKVORM_LIJST, aantalItems };
export type { Werkvorm } from "@/werkvormen/soorten";

/** Wat een klastool van zijn werkvorm overneemt voor de menu's. */
function alsTool(w: { label: string; uitleg: string; icon: LucideIcon }) {
  return { label: w.label, uitleg: w.uitleg, icon: w.icon };
}

export const KLASTOOLS = [
  { ...alsTool(WERKVORMEN.timer), id: "timer" as const, href: "/klastools?tool=timer" },
  { ...alsTool(WERKVORMEN.randomizer), id: "randomizer" as const, href: "/klastools?tool=randomizer" },
  { ...alsTool(WERKVORMEN.groupmaker), id: "groups" as const, href: "/klastools?tool=groups" },
  {
    // Geen werkvorm: er komt geen oefening uit, alleen tekst om verder te gebruiken.
    id: "audiotekst" as const,
    label: "Audio naar tekst",
    uitleg: "Praat, en wat je zegt verschijnt als tekst. Kopieer hem of gebruik hem in een oefening.",
    icon: AudioLines,
    href: "/klastools?tool=audiotekst",
  },
];

/**
 * Alles wat je tijdens de les zonder voorbereiding opent. De klastools plus het opfrissen,
 * dat wel materiaal gebruikt maar geen enkele voorbereiding vraagt.
 */
export interface Leshulp {
  id: string;
  label: string;
  uitleg: string;
  icon: LucideIcon;
  href: string;
}

export const LESHULP: Leshulp[] = [
  ...KLASTOOLS.map((tool) => ({
    id: tool.id as string,
    label: tool.label,
    uitleg: tool.uitleg,
    icon: tool.icon,
    href: tool.href,
  })),
  {
    id: "opfrissen",
    label: "Opfrissen",
    uitleg: "Een paar vragen uit vorige lessen, groot op het digibord.",
    icon: History,
    href: "/opfrissen",
  },
  {
    id: "digibord",
    label: "Digibordscherm",
    uitleg: "Lesdoelen, de opdracht van dit moment, een klok en de code van je oefening.",
    icon: Presentation,
    href: "/digibord",
  },
];

/* ── Zichtbaarheid ─────────────────────────────────────────────────────── */

export const ZICHTBAARHEID: Record<
  Zichtbaarheid,
  { label: string; kort: string; uitleg: string; icon: LucideIcon }
> = {
  prive: {
    label: "Alleen ik",
    kort: "alleen ik",
    uitleg:
      "Je collega's zien dit niet in de bibliotheek. Cursisten met je code of QR-code kunnen wel oefenen.",
    icon: Lock,
  },
  organisatie: {
    label: "de hele school",
    kort: "gedeeld",
    uitleg: "Elke leraar vindt dit in de bibliotheek en kan er een kopie van maken.",
    icon: Building2,
  },
};

/* ── Helpers ───────────────────────────────────────────────────────────── */

/** Aantal items in een oefening, plus het juiste woord erbij. */
export function inhoudSamenvatting(ex: Exercise): string {
  const aantal = aantalItems(ex);
  const [enkel, meer] = WERKVORMEN[ex.type].eenheid;
  return `${aantal} ${aantal === 1 ? enkel : meer}`;
}

/** "± 3 min" — geeft de cursist vooraf zicht op wat hij aangaat. */
export function geschatteDuur(ex: Exercise): string {
  const seconden = aantalItems(ex) * WERKVORMEN[ex.type].secondenPerItem;
  const minuten = Math.max(1, Math.round(seconden / 60));
  return `± ${minuten} min`;
}

/** Draait deze werkvorm klassikaal op het digibord? */
export function isKlassikaal(ex: Exercise): boolean {
  return WERKVORMEN[ex.type].waar === "klas";
}

/** Wie er kijkt: genoeg om te weten of iets van hem is. */
export interface Eigenaar {
  /** Firebase-uid, of het e-mailadres in demomodus. */
  id?: string;
  naam: string;
}

function isVan(
  item: { creatorId?: string; creatorName: string },
  eigenaar: Eigenaar | null | undefined
): boolean {
  if (!eigenaar) return false;
  // Materiaal met een eigenaar-id vergelijk je op id; voorbeeldmateriaal heeft er geen en
  // valt terug op de naam.
  if (item.creatorId) return !!eigenaar.id && item.creatorId === eigenaar.id;
  return item.creatorName.toLowerCase().startsWith(eigenaar.naam.toLowerCase());
}

/** Materiaal dat de leraar zelf maakte of kopieerde. */
export function isEigenMateriaal(ex: Exercise, eigenaar: Eigenaar | null | undefined): boolean {
  return isVan(ex, eigenaar);
}

/** Is deze map van deze leraar? */
export function isEigenMap(map: Lesmap, eigenaar: Eigenaar | null | undefined): boolean {
  return isVan(map, eigenaar);
}

/**
 * Wat deze persoon in de bibliotheek te zien krijgt: alles wat met de organisatie
 * gedeeld is, plus het eigen materiaal. Privé materiaal van een collega blijft weg.
 */
export function zichtbaarVoor(
  oefeningen: Exercise[],
  eigenaar: Eigenaar | null | undefined
): Exercise[] {
  return oefeningen.filter(
    (ex) => ex.visibility === "organisatie" || isEigenMateriaal(ex, eigenaar)
  );
}

/**
 * De persoonlijke mappen van deze leraar, nieuwste eerst. Een organisatiemap die een
 * beheerder aanmaakte, hoort daar niet bij: die is van de school.
 */
export function eigenMappen(mappen: Lesmap[], eigenaar: Eigenaar | null | undefined): Lesmap[] {
  if (!eigenaar) return [];
  return mappen
    .filter((m) => !m.organisatie && isEigenMap(m, eigenaar))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** De Organisatiemappen, alfabetisch: zo vind je een vak of opleiding snel terug. */
export function organisatieMappen(mappen: Lesmap[]): Lesmap[] {
  return mappen
    .filter((m) => m.organisatie)
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));
}

/* ── Organisatiemappen in mappen ────────────────────────────────────────── */

/**
 * De mappen die rechtstreeks in deze map zitten, alfabetisch. Met null krijg je het
 * hoogste niveau. Een map waarvan de bovenliggende map niet (meer) bestaat, telt als
 * hoogste niveau: zo raakt er nooit een map zoek.
 */
export function submappen(orgMappen: Lesmap[], bovenMapId: string | null): Lesmap[] {
  const bestaat = new Set(orgMappen.map((m) => m.id));
  return orgMappen
    .filter((m) => {
      const boven = m.bovenMapId && bestaat.has(m.bovenMapId) ? m.bovenMapId : null;
      return boven === bovenMapId && m.id !== bovenMapId;
    })
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));
}

/** De weg van het hoogste niveau tot en met deze map. */
export function mapPad(orgMappen: Lesmap[], mapId: string): Lesmap[] {
  const perId = new Map(orgMappen.map((m) => [m.id, m]));
  const pad: Lesmap[] = [];
  const gezien = new Set<string>();
  let huidig = perId.get(mapId);
  // Het gezien-lijstje stopt een kring, mocht die er ooit door een fout in staan.
  while (huidig && !gezien.has(huidig.id)) {
    pad.unshift(huidig);
    gezien.add(huidig.id);
    huidig = huidig.bovenMapId ? perId.get(huidig.bovenMapId) : undefined;
  }
  return pad;
}

/** "Nederlands tweede taal › Richtgraad 1": om een map in een keuzelijst te herkennen. */
export function mapPadTekst(orgMappen: Lesmap[], mapId: string): string {
  return mapPad(orgMappen, mapId)
    .map((m) => m.title)
    .join(" › ");
}

/** Alle mappen die ergens onder deze map zitten, op welk niveau ook. */
export function onderliggendeMapIds(orgMappen: Lesmap[], mapId: string): Set<string> {
  const gevonden = new Set<string>();
  const teDoen = [mapId];
  while (teDoen.length > 0) {
    const id = teDoen.pop()!;
    for (const m of orgMappen) {
      if (m.bovenMapId === id && !gevonden.has(m.id) && m.id !== mapId) {
        gevonden.add(m.id);
        teDoen.push(m.id);
      }
    }
  }
  return gevonden;
}

/** Alle organisatiemappen in de volgorde van de boom, elk met hun diepte. */
export function organisatieBoom(orgMappen: Lesmap[]): { map: Lesmap; diepte: number }[] {
  const lijst: { map: Lesmap; diepte: number }[] = [];
  const gezien = new Set<string>();
  const loop = (bovenMapId: string | null, diepte: number) => {
    for (const m of submappen(orgMappen, bovenMapId)) {
      if (gezien.has(m.id)) continue;
      gezien.add(m.id);
      lijst.push({ map: m, diepte });
      loop(m.id, diepte + 1);
    }
  };
  loop(null, 0);
  // Een map in een kring (door een fout) hangt nergens onder: toon ze dan maar bovenaan.
  for (const m of orgMappen) if (!gezien.has(m.id)) lijst.push({ map: m, diepte: 0 });
  return lijst;
}

/**
 * Past deze oefening in een organisatiemap? Alleen wat met heel de school gedeeld is:
 * privé materiaal zou er voor collega's als een gat in de map staan.
 */
export function pastInOrganisatiemap(ex: Exercise): boolean {
  return ex.visibility === "organisatie";
}

/** In welke mappen zit deze oefening? */
export function mappenVanOefening(mappen: Lesmap[], oefeningId: string): Lesmap[] {
  return mappen.filter((m) => m.exerciseIds.includes(oefeningId));
}
