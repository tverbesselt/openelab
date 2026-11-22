"use client";

/*
 * Een opname laten uitschrijven door Whisper, via /api/inlezen. Gedeeld door de knop in de
 * maakformulieren en de klastool "Audio naar tekst".
 */

import { getFirebaseAuth } from "@/lib/firebase/client";

/**
 * Stuurt één opname naar de server en geeft de tekst terug. Gooit een fout met een melding
 * die je zo aan de leraar kan tonen.
 *
 * @param vorige Wat er net voor deze opname gezegd werd. Whisper gebruikt dat als context,
 *   zodat een zin die over twee stukken loopt toch goed aansluit.
 */
export async function schrijfUit(opname: Blob, taal: string, vorige = ""): Promise<string> {
  const gebruiker = getFirebaseAuth().currentUser;
  if (!gebruiker) throw new Error("Meld je opnieuw aan om in te lezen.");
  const token = await gebruiker.getIdToken();

  const extensie = opname.type.includes("mp4") ? "mp4" : opname.type.includes("ogg") ? "ogg" : "webm";
  const formulier = new FormData();
  formulier.append("audio", opname, `opname.${extensie}`);
  formulier.append("taal", taal);
  if (vorige) formulier.append("vorige", vorige.slice(-400));

  const antwoord = await fetch("/api/inlezen", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formulier,
  });
  const data = (await antwoord.json().catch(() => ({}))) as { tekst?: string; fout?: string };
  if (!antwoord.ok) throw new Error(data.fout ?? "Het uitschrijven lukte niet.");
  return (data.tekst ?? "").trim();
}

export const GEEN_MICROFOON =
  "Open E-lab mag de microfoon niet gebruiken. Geef toestemming via het slotje naast het adres.";
