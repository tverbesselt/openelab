"use client";

/*
 * Vrije beelden uit Openverse, via de server van Open E-lab (/api/beelden). Zie
 * src/lib/server/openverse.ts voor waarom alles via de server loopt.
 *
 * Heette eerst vrijeBeelden.ts. Met die naam faalde `next build` op /maken ("Could not find
 * the module ... in the React Client Manifest"), op Windows en in CI; met deze naam niet.
 */

import type { BeeldBron } from "@/lib/types";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase/client";

export interface VrijBeeld {
  id: string;
  titel: string;
  breedte?: number;
  hoogte?: number;
  bron: BeeldBron;
}

export class BeeldbankFout extends Error {}

async function kop(): Promise<HeadersInit> {
  if (!firebaseConfigured) return {};
  const gebruiker = getFirebaseAuth().currentUser;
  if (!gebruiker) throw new BeeldbankFout("Meld je opnieuw aan om beelden te zoeken.");
  return { Authorization: `Bearer ${await gebruiker.getIdToken()}` };
}

async function foutVan(antwoord: Response, standaard: string): Promise<never> {
  const data = (await antwoord.json().catch(() => ({}))) as { fout?: string };
  throw new BeeldbankFout(data.fout ?? standaard);
}

export async function zoekVrijeBeelden(
  vraag: string,
  pagina = 1
): Promise<{ resultaten: VrijBeeld[]; meer: boolean }> {
  const p = new URLSearchParams({ q: vraag, pagina: String(pagina) });
  const antwoord = await fetch(`/api/beelden?${p}`, { headers: await kop() });
  if (!antwoord.ok) await foutVan(antwoord, "Zoeken lukte niet. Probeer het opnieuw.");
  return antwoord.json();
}

export function miniatuurUrl(id: string): string {
  return `/api/beelden/${id}/miniatuur`;
}

/** Het volledige beeld, om te verkleinen en in de eigen opslag te zetten. */
export async function haalVrijBeeld(id: string): Promise<Blob> {
  const antwoord = await fetch(`/api/beelden/${id}`, { headers: await kop() });
  if (!antwoord.ok) await foutVan(antwoord, "Dit beeld kunnen we nu niet ophalen. Kies een ander beeld.");
  return antwoord.blob();
}
