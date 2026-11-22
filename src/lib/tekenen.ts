"use client";

import { TekenToestand, Tekening, Tekenopdracht } from "./types";
import { beeldVoorBord } from "./bord";
import { tekeningAlsBlob } from "@/components/TekenBlad";

/*
 * Teken uit je geheugen. De kernregel: het echte beeld zie je nooit vóór of tijdens het
 * tekenen, ook niet als klein voorbeeld. De cursist krijgt alleen de naam. Het origineel
 * komt pas na het tekenen, om te vergelijken.
 */

/** Keuzes voor de tekentijd per afbeelding, in seconden. 0 = geen limiet. */
export const SECONDEN_KEUZES = [0, 30, 60, 90, 120];

export function secondenLabel(s: number): string {
  if (s === 0) return "Geen limiet";
  return s < 60 ? `${s} sec` : s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`;
}

export const MAX_NAAM = 30;

/** Eén tekening per toestel en per opdracht: dat is ook de sleutel in de databank. */
export function tekeningId(apparaat: string, nr: number): string {
  return `${apparaat}_${nr}`;
}

/** Het tekenblad als data-URL die in één document past. */
export async function tekeningAlsData(canvas: HTMLCanvasElement | null): Promise<string> {
  return beeldVoorBord(await tekeningAlsBlob(canvas));
}

/** Hoeveel seconden er nog over zijn. null = geen limiet. */
export function resterend(t: Pick<TekenToestand, "seconden" | "gestartOp">, nu: number): number | null {
  if (!t.seconden) return null;
  const voorbij = (nu - new Date(t.gestartOp).getTime()) / 1000;
  return Math.max(0, Math.ceil(t.seconden - voorbij));
}

export function klok(seconden: number): string {
  return `${Math.floor(seconden / 60)}:${String(seconden % 60).padStart(2, "0")}`;
}

/** De tekeningen per opdracht, oudste eerst: zo staat de volgorde van binnenkomen vast. */
export function perOpdracht(tekeningen: Tekening[], aantal: number): Tekening[][] {
  const groepen: Tekening[][] = Array.from({ length: aantal }, () => []);
  for (const t of [...tekeningen].sort((a, b) => a.op.localeCompare(b.op))) {
    if (t.nr >= 0 && t.nr < aantal) groepen[t.nr].push(t);
  }
  return groepen;
}

/** Een bestandsnaam zonder rare tekens, voor een download. */
export function bestandsnaam(...delen: string[]): string {
  return delen
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Een data-URL als bestand bewaren. */
export function downloadBeeld(url: string, naam: string) {
  const a = document.createElement("a");
  a.href = url;
  const ext = url.match(/^data:image\/(\w+)/)?.[1]?.replace("jpeg", "jpg") ?? "png";
  a.download = `${naam}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Een tekening als PNG, op een wit vlak. Een WebP of JPEG uit de databank wordt eerst
 * omgezet, zodat het bestand overal opent.
 */
export async function downloadAlsPng(url: string, naam: string) {
  if (url.startsWith("data:image/png")) return downloadBeeld(url, naam);
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return downloadBeeld(url, naam);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  downloadBeeld(canvas.toDataURL("image/png"), naam);
}

/* ── Wat dit toestel onthoudt ──────────────────────────────────────────── */

const INGESTUURD_SLEUTEL = "openelab_tekenen_";

/** Welke opdrachten dit toestel in deze sessie al instuurde. */
export function ingestuurd(code: string): number[] {
  try {
    const bewaard = sessionStorage.getItem(INGESTUURD_SLEUTEL + code);
    return bewaard ? (JSON.parse(bewaard) as number[]) : [];
  } catch {
    return [];
  }
}

export function onthoudIngestuurd(code: string, nr: number) {
  try {
    sessionStorage.setItem(INGESTUURD_SLEUTEL + code, JSON.stringify([...new Set([...ingestuurd(code), nr])]));
  } catch {
    // Dan weigeren de regels een tweede inzending voor dezelfde opdracht.
  }
}

/* ── Oefenmodus: hoe goed leek het, volgens de cursist zelf ────────────── */

export const ZELFOORDELEN = [
  { waarde: 1, label: "Helemaal niet" },
  { waarde: 2, label: "Een beetje" },
  { waarde: 3, label: "Grotendeels" },
  { waarde: 4, label: "Bijna exact" },
] as const;

const OORDEEL_SLEUTEL = "openelab_tekenoordeel_";

export function bewaardeOordelen(oefeningId: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(OORDEEL_SLEUTEL + oefeningId) ?? "{}");
  } catch {
    return {};
  }
}

export function bewaarOordeel(oefeningId: string, opdracht: Tekenopdracht, waarde: number) {
  try {
    localStorage.setItem(
      OORDEEL_SLEUTEL + oefeningId,
      JSON.stringify({ ...bewaardeOordelen(oefeningId), [opdracht.id]: waarde })
    );
  } catch {
    // Niet erg: het oordeel is alleen voor de cursist zelf.
  }
}
