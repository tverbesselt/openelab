/*
 * Openverse: een open zoekmachine voor vrije beelden (Creative Commons en publiek domein),
 * onder meer uit Wikimedia Commons en Flickr. Geen sleutel nodig.
 *
 * Alles loopt via de server van Open E-lab, ook de miniaturen. Een schoolnetwerk kan
 * Openverse of de sites erachter tegenhouden; de eigen server komt overal door.
 */

import type { BeeldBron } from "@/lib/types";

/** Instelbaar, zodat je lokaal tegen een nagebootste Openverse kan testen. */
const API = (process.env.OPENVERSE_API ?? "https://api.openverse.org").replace(/\/+$/, "");

/** Openverse vraagt een herkenbare User-Agent. */
const KOP = { "User-Agent": "Open-E-lab/1.0 (https://github.com/tverbesselt/openelab)" };

/** Het grootste beeld dat we ophalen, voor het verkleinen in de browser. */
export const MAX_BEELD_BYTES = 15 * 1024 * 1024;

const TOEGELATEN = /^image\/(jpeg|png|gif|webp)$/;

/** Zonder sleutel geeft Openverse hoogstens 20 beelden per vraag (anders 401). */
export const PER_PAGINA = 20;

/** Een Openverse-id is een UUID. Alles anders weigeren we, voor we iets doorsturen. */
export function geldigId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/** Eén zoekresultaat zoals de browser het krijgt. */
export interface VrijBeeld {
  id: string;
  titel: string;
  breedte?: number;
  hoogte?: number;
  bron: BeeldBron;
}

interface OpenverseBeeld {
  id: string;
  title?: string | null;
  url?: string;
  creator?: string | null;
  creator_url?: string | null;
  license?: string;
  license_version?: string | null;
  license_url?: string | null;
  foreign_landing_url?: string | null;
  width?: number | null;
  height?: number | null;
  filetype?: string | null;
  mature?: boolean;
}

/** "by" + "4.0" wordt "CC BY 4.0"; "cc0" wordt "CC0"; "pdm" wordt "Publiek domein". */
export function licentieLabel(licentie: string | undefined, versie?: string | null): string {
  const l = (licentie ?? "").toLowerCase();
  if (l === "cc0") return "CC0";
  if (l === "pdm") return "Publiek domein";
  if (!l) return "Vrije licentie";
  return `CC ${l.toUpperCase()}${versie ? ` ${versie}` : ""}`;
}

function alsVrijBeeld(b: OpenverseBeeld): VrijBeeld {
  const bron: BeeldBron = { licentie: licentieLabel(b.license, b.license_version) };
  if (b.license_url) bron.licentieUrl = b.license_url;
  if (b.creator) bron.maker = b.creator.slice(0, 120);
  if (b.creator_url) bron.makerUrl = b.creator_url;
  if (b.foreign_landing_url) bron.pagina = b.foreign_landing_url;
  return {
    id: b.id,
    titel: (b.title ?? "").trim().slice(0, 200),
    ...(b.width ? { breedte: b.width } : {}),
    ...(b.height ? { hoogte: b.height } : {}),
    bron,
  };
}

async function haal(url: string, ms: number): Promise<Response> {
  return fetch(url, { headers: KOP, signal: AbortSignal.timeout(ms), cache: "no-store" });
}

/**
 * Zoeken. Alleen beelden die je mag gebruiken én aanpassen (verkleinen is aanpassen), geen
 * SVG (daar kan code in zitten) en niets wat Openverse als ongepast markeert.
 */
export async function zoek(
  vraag: string,
  pagina: number
): Promise<{ resultaten: VrijBeeld[]; meer: boolean }> {
  const p = new URLSearchParams({
    q: vraag,
    page: String(pagina),
    page_size: String(PER_PAGINA),
    license_type: "commercial,modification",
    mature: "false",
  });
  const antwoord = await haal(`${API}/v1/images/?${p}`, 10_000);
  if (!antwoord.ok) {
    const uitleg = (await antwoord.text().catch(() => "")).slice(0, 300);
    throw new Error(`Openverse antwoordde ${antwoord.status}: ${uitleg}`);
  }
  const data = (await antwoord.json()) as { results?: OpenverseBeeld[]; page_count?: number };
  const resultaten = (data.results ?? [])
    .filter((b) => geldigId(b.id) && !b.mature && (b.filetype ?? "").toLowerCase() !== "svg")
    .map(alsVrijBeeld);
  return { resultaten, meer: pagina < (data.page_count ?? 0) };
}

/** De miniatuur, zoals Openverse ze klaarzet. */
export async function miniatuur(id: string): Promise<Response> {
  return haal(`${API}/v1/images/${id}/thumb/`, 10_000);
}

/** Het volledige beeld: eerst de gegevens bij Openverse, dan het bestand bij de bron. */
export async function volledigBeeld(id: string): Promise<{ data: ArrayBuffer; type: string }> {
  const detail = await haal(`${API}/v1/images/${id}/`, 10_000);
  if (!detail.ok) throw new Error(`Openverse antwoordde ${detail.status}`);
  const beeld = (await detail.json()) as OpenverseBeeld;
  if (!beeld.url || !/^https?:\/\//.test(beeld.url)) throw new Error("Geen bruikbare link");

  const bestand = await haal(beeld.url, 20_000);
  if (!bestand.ok) throw new Error(`De bron antwoordde ${bestand.status}`);
  const type = (bestand.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!TOEGELATEN.test(type)) throw new Error(`Geen foto maar ${type || "iets onbekends"}`);
  const lengte = Number(bestand.headers.get("content-length") ?? 0);
  if (lengte > MAX_BEELD_BYTES) throw new Error("Te groot");
  const data = await bestand.arrayBuffer();
  if (data.byteLength > MAX_BEELD_BYTES) throw new Error("Te groot");
  return { data, type };
}
