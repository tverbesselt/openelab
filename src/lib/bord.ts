"use client";

import { BordInstellingen, BordItem, BordSoort } from "./types";
import { MediaFout, herkenVideo, leesAlsDataUrl, startUitLink, verkleinAfbeelding } from "./media";

/*
 * De regels van het whiteboard. Wat cursisten insturen, blijft klein: een foto of
 * ingesproken fragment wordt in de browser verkleind tot het in één Firestore-document
 * past. Zo hoeft een cursist zonder account niets te uploaden naar de opslag, en gelden
 * dezelfde regels (firestore.rules) voor alles wat op het bord komt.
 */

export const BORD_SOORTEN: { soort: BordSoort; label: string; uitleg: string }[] = [
  { soort: "tekst", label: "Tekst", uitleg: "Een idee, antwoord of vraag." },
  { soort: "afbeelding", label: "Foto", uitleg: "Uit de galerij of meteen met de camera." },
  { soort: "tekening", label: "Tekening", uitleg: "Met de vinger of de muis, op een wit blad." },
  { soort: "video", label: "Filmpje", uitleg: "Een link naar YouTube of Vimeo." },
  { soort: "audio", label: "Ingesproken", uitleg: "Zelf iets inspreken met de microfoon." },
];

export function soortLabel(soort: BordSoort): string {
  return BORD_SOORTEN.find((s) => s.soort === soort)?.label ?? soort;
}

export const STANDAARD_BORD: BordInstellingen = {
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

/** Keuzes in de instellingen. */
export const TEKEN_GRENZEN = [50, 140, 280, 500];
export const SECONDEN_KEUZES = [30, 60, 120];
export const PER_CURSIST_KEUZES = [1, 3, 5];
export const MAX_KOLOMMEN = 5;
export const MAX_KOLOMNAAM = 40;

/** Zonder eigen grens mag een tekst zo lang zijn. Staat ook in firestore.rules. */
export const MAX_TEKST = 1000;
export const MAX_NAAM = 30;
export const MAX_ALT = 200;
/** Zoveel tekens mag een data-URL tellen, ruim onder de grens van 1 MiB per document. */
export const MAX_DATA = 900_000;

export function tekstGrens(inst: Pick<BordInstellingen, "maxTekens">): number {
  return inst.maxTekens > 0 ? Math.min(inst.maxTekens, MAX_TEKST) : MAX_TEKST;
}

/* ── Inhoud klaarmaken ─────────────────────────────────────────────────── */

/**
 * Een foto of tekening als data-URL die in één document past. Eerst scherp genoeg voor
 * het digibord; lukt dat niet onder de grens, dan kleiner en iets minder scherp.
 */
export async function beeldVoorBord(bron: Blob): Promise<string> {
  const pogingen = [
    { maxZijde: 1400, kwaliteit: 0.8 },
    { maxZijde: 1100, kwaliteit: 0.72 },
    { maxZijde: 800, kwaliteit: 0.62 },
    { maxZijde: 600, kwaliteit: 0.55 },
  ];
  for (const poging of pogingen) {
    const blob = await verkleinAfbeelding(bron, { ...poging, gifOok: true });
    const url = await leesAlsDataUrl(blob);
    if (!/^data:image\/(webp|jpeg|png);base64,/.test(url)) {
      throw new MediaFout("Deze afbeelding kunnen we niet omzetten. Probeer een JPG of PNG.");
    }
    if (url.length <= MAX_DATA) return url;
  }
  throw new MediaFout("Deze afbeelding is te groot. Probeer een andere foto.");
}

/** Een ingesproken fragment als data-URL. */
export async function audioVoorBord(bron: Blob): Promise<string> {
  if (!bron.type.startsWith("audio/")) throw new MediaFout("Dit is geen geluidsopname.");
  const url = await leesAlsDataUrl(bron);
  if (url.length > MAX_DATA) {
    throw new MediaFout("Dit fragment is te lang om op het bord te zetten. Spreek iets korters in.");
  }
  return url;
}

/**
 * Een link naar YouTube of Vimeo in een vaste vorm, met de starttijd als die in de link
 * stond. Geeft null voor al de rest: andere links komen niet op het bord.
 */
export function videoVoorBord(link: string): string | null {
  const bron = herkenVideo(link);
  if (!bron) return null;
  const start = startUitLink(link);
  if (bron.dienst === "vimeo") return `https://vimeo.com/${bron.id}${start ? `?t=${start}` : ""}`;
  return `https://www.youtube.com/watch?v=${bron.id}${start ? `&t=${start}` : ""}`;
}

/* ── Volgorde ──────────────────────────────────────────────────────────── */

/** Vastgepinde kaartjes bovenaan, daarna het nieuwste eerst: zo zie je wat binnenkomt. */
export function ordenBord(items: BordItem[]): BordItem[] {
  return [...items].sort(
    (a, b) => Number(Boolean(b.vast)) - Number(Boolean(a.vast)) || b.op.localeCompare(a.op)
  );
}

export function nieuwBordId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ── Wat dit toestel onthoudt ──────────────────────────────────────────── */

const NAAM_SLEUTEL = "openelab_bordnaam";
const EIGEN_SLEUTEL = "openelab_bord_eigen_";

export function bewaardeNaam(): string {
  try {
    return localStorage.getItem(NAAM_SLEUTEL) ?? "";
  } catch {
    return "";
  }
}

export function bewaarNaam(naam: string) {
  try {
    localStorage.setItem(NAAM_SLEUTEL, naam);
  } catch {
    // Dan vraagt het toestel de naam de volgende keer opnieuw.
  }
}

/**
 * Wat dit toestel op dit bord zette. Een bijdrage die nog op de leraar wacht, kan de
 * cursist niet uit de databank lezen; zo ziet hij ze toch in zijn eigen lijst.
 */
export function eigenBijdragen(code: string): BordItem[] {
  try {
    const bewaard = localStorage.getItem(EIGEN_SLEUTEL + code);
    return bewaard ? (JSON.parse(bewaard) as BordItem[]) : [];
  } catch {
    return [];
  }
}

export function onthoudBijdrage(code: string, item: BordItem) {
  try {
    // Zonder de inhoud van foto's en audio: die past niet in localStorage.
    const licht: BordItem = { ...item, url: item.soort === "video" ? item.url : undefined };
    localStorage.setItem(EIGEN_SLEUTEL + code, JSON.stringify([...eigenBijdragen(code), licht]));
  } catch {
    // Niet erg: dan telt de grens per cursist hier niet mee.
  }
}
