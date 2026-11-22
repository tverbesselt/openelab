/*
 * Gedeelde opzet voor de regeltests van Open E-lab.
 *
 * Elke test praat met de emulator als een van deze personen:
 *   - anoniem        een cursist zonder account, met de link of de code
 *   - cursist        s123456@voorbeeld.school (volgt het cursistPatroon)
 *   - leraar         leraar@voorbeeld.school
 *   - collega        collega@voorbeeld.school, een andere leraar
 *   - beheerder      beheerder@voorbeeld.school, met een vermelding in beheerders/
 *   - buitenstaander iemand@gmail.com
 *
 * `metRegelsUit` schrijft testdata weg zonder dat de regels meekijken, om een situatie klaar
 * te zetten. De tests zelf gaan altijd door de regels.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import type { Firestore } from "firebase/firestore";

export { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

export const UID = {
  cursist: "uid-cursist",
  leraar: "uid-leraar",
  collega: "uid-collega",
  beheerder: "uid-beheerder",
  buitenstaander: "uid-buiten",
} as const;

export const EMAIL = {
  cursist: "s123456@voorbeeld.school",
  leraar: "leraar@voorbeeld.school",
  collega: "collega@voorbeeld.school",
  beheerder: "beheerder@voorbeeld.school",
  buitenstaander: "iemand@gmail.com",
} as const;

export type Persoon = keyof typeof UID | "anoniem";

export const STANDAARD_TEST_INSTELLINGEN = {
  naam: "Open E-lab",
  organisatie: "Voorbeeldschool",
  logo: null,
  kleur: "#2f6fde",
  uit: [] as string[],
  tips: { cursisten: true, leraren: true },
  toegang: {
    leraarDomeinen: ["voorbeeld.school"],
    cursistDomeinen: ["voorbeeld.school"],
    cursistPatroon: "s[0-9]+@voorbeeld[.]school",
  },
};

/**
 * Eén testomgeving per bestand. De Storage-regels laadt alleen storage.test.ts: de emulator
 * houdt één ruleset tegelijk vast, en een ander bestand dat opruimt zou ze anders wissen.
 */
export async function maakOmgeving(projectId: string, metStorage = false): Promise<RulesTestEnvironment> {
  const wortel = resolve(__dirname, "..", "..");
  return initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync(resolve(wortel, "firestore.rules"), "utf8") },
    ...(metStorage ? { storage: { rules: readFileSync(resolve(wortel, "storage.rules"), "utf8") } } : {}),
  });
}

export function als(omgeving: RulesTestEnvironment, wie: Persoon): RulesTestContext {
  if (wie === "anoniem") return omgeving.unauthenticatedContext();
  return omgeving.authenticatedContext(UID[wie], { email: EMAIL[wie], email_verified: true });
}

export function db(omgeving: RulesTestEnvironment, wie: Persoon): Firestore {
  return als(omgeving, wie).firestore() as unknown as Firestore;
}

/** Testdata klaarzetten zonder regels. */
export async function metRegelsUit(
  omgeving: RulesTestEnvironment,
  werk: (db: Firestore) => Promise<void>
): Promise<void> {
  await omgeving.withSecurityRulesDisabled(async (ctx) => {
    await werk(ctx.firestore() as unknown as Firestore);
  });
}

/** Stelt de schooldomeinen in zodat de dynamische regels in firestore.rules en storage.rules weten wie leraar is. */
export async function maakToegang(omgeving: RulesTestEnvironment): Promise<void> {
  const { doc, setDoc } = await import("firebase/firestore");
  await metRegelsUit(omgeving, async (d) => {
    await setDoc(doc(d, "instellingen", "app"), STANDAARD_TEST_INSTELLINGEN);
  });
}

/** Een beheerder bestaat alleen als zijn adres in beheerders/ staat. */
export async function maakBeheerder(omgeving: RulesTestEnvironment): Promise<void> {
  const { doc, setDoc } = await import("firebase/firestore");
  await metRegelsUit(omgeving, async (d) => {
    await setDoc(doc(d, "beheerders", EMAIL.beheerder.toLowerCase()), { sinds: "2026-10-09" });
  });
}

export const NU = "2026-10-09T10:00:00.000Z";

/** Een geldige oefening van de leraar, zoals de app ze wegschrijft. */
export function oefening(extra: Record<string, unknown> = {}) {
  return {
    title: "Hoofdsteden",
    description: "",
    category: "quiz",
    didacticGoal: "check",
    type: "quiz",
    creatorName: "Alex De Vries",
    creatorId: UID.leraar,
    visibility: "organisatie",
    shareCode: "ABC123",
    content: { questions: [] },
    didacticConfig: { showImmediateFeedback: true, allowRetryMissed: true, enableGamification: false },
    createdAt: NU,
    tags: [],
    ...extra,
  };
}

/** Een geldige map van de leraar. */
export function lesmap(extra: Record<string, unknown> = {}) {
  return {
    title: "Les 1",
    description: "",
    exerciseIds: [],
    creatorName: "Alex De Vries",
    creatorId: UID.leraar,
    shareCode: "MAP001",
    createdAt: NU,
    ...extra,
  };
}

/** Een live-sessie van de leraar; standaard een stemming met vier opties. */
export function sessie(extra: Record<string, unknown> = {}) {
  return {
    code: "123456",
    hostId: UID.leraar,
    hostNaam: "Alex De Vries",
    titel: "Stemming",
    type: "poll",
    vraag: "Welke kleur?",
    opties: ["rood", "groen", "blauw", "geel"],
    status: "actief",
    toonResultaten: false,
    gestartOp: NU,
    ...extra,
  };
}

export const STANDAARD_BORD = {
  soorten: ["tekst", "afbeelding", "tekening"],
  maxTekens: 280,
  maxSeconden: 60,
  maxPerCursist: 0,
  namen: "anoniem",
  nakijken: false,
  zichtbaar: true,
  kolommen: [],
  open: true,
};

export const WEDSTRIJD_WACHT = {
  fase: "wachtruimte",
  vraagNr: -1,
  aantalVragen: 3,
  instellingen: { spelvorm: "rustig", seconden: 0, reeksbonus: false, tussenstand: "elkeVraag", teams: 0 },
};

export const WEDSTRIJD_VRAAG = {
  ...WEDSTRIJD_WACHT,
  fase: "vraag",
  vraagNr: 0,
  vraag: { tekst: "Hoofdstad van Frankrijk?", opties: ["Parijs", "Lyon", "Nice"], meerdere: false },
};

/** Een kleine PNG als data-URL, zoals het bord en de tekeningen ze opslaan. */
export const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
