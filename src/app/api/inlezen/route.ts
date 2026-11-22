/*
 * Inlezen: de leraar spreekt een tekst in, Whisper (OpenAI) schrijft hem uit.
 *
 * Waarom via de server: de sleutel van OpenAI mag nooit in de browser staan. Deze route
 * controleert eerst of er een leraar aangemeld is, anders kan
 * iedereen op kosten van de school laten transcriberen.
 *
 * De opname wordt nergens bewaard: ze gaat alleen door naar OpenAI en het antwoord komt
 * als tekst terug.
 */

import { fout, leraarVan as gedeeldeLeraarVan } from "@/lib/server/leraar";
import { sleutelStand } from "@/lib/server/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** OpenAI aanvaardt tot 25 MB; tien minuten spraak in webm/opus is een paar MB. */
const MAX_BYTES = 20 * 1024 * 1024;

const MODEL = "whisper-1";

/*
 * Whisper neemt de schrijfwijze over van een korte voorbeeldtekst. Zonder zo'n voorbeeld
 * komt er soms een lange reeks woorden terug zonder hoofdletters of leestekens, en daar
 * kan je geen oefening mee maken.
 */
const STIJLVOORBEELD: Record<string, string> = {
  nl: "Goedemorgen, welkom in de les. Vandaag lezen we samen een korte tekst.",
  fr: "Bonjour, bienvenue au cours. Aujourd'hui, nous lisons ensemble un texte court.",
  en: "Hello, welcome to the lesson. Today, we will read a short text together.",
  es: "Hola, bienvenidos a la clase. Hoy leemos juntos un texto corto.",
  de: "Guten Morgen, willkommen im Unterricht. Heute lesen wir zusammen einen kurzen Text.",
  it: "Buongiorno, benvenuti alla lezione. Oggi leggiamo insieme un breve testo.",
};

/*
 * Eenvoudige rem per leraar, per serverinstantie. Geen echte beveiliging, maar het vangt
 * een knop die per ongeluk in een lus blijft hangen. Live uitschrijven stuurt een stukje
 * per pauze, ongeveer zes per minuut: een uur doorpraten blijft hier onder.
 */
const PER_UUR = 500;
const gebruik = new Map<string, number[]>();

function teVaak(email: string): boolean {
  const nu = Date.now();
  const recent = (gebruik.get(email) ?? []).filter((t) => nu - t < 60 * 60 * 1000);
  if (recent.length >= PER_UUR) {
    gebruik.set(email, recent);
    return true;
  }
  recent.push(nu);
  gebruik.set(email, recent);
  return false;
}

const leraarVan = (request: Request) =>
  gedeeldeLeraarVan(request, {
    zonderAanmelding: "Meld je aan met je schoolaccount om in te lezen.",
    geenLeraar: "Inlezen is er alleen voor leraren.",
  });

/**
 * Voor het beheer: waar de sleutel vandaan komt. Nooit de sleutel zelf. ?vers slaat het
 * geheugen van een halve minuut over, na een wijziging.
 */
export async function GET(request: Request) {
  const email = await leraarVan(request);
  if (email instanceof Response) return email;
  const vers = new URL(request.url).searchParams.has("vers");
  const { bron, serverToegang } = await sleutelStand(vers);
  return Response.json({ bron, serverToegang });
}

export async function POST(request: Request) {
  const email = await leraarVan(request);
  if (email instanceof Response) return email;

  const { sleutel: openaiSleutel } = await sleutelStand();
  if (!openaiSleutel) {
    return fout(503, "Inlezen staat nog niet aan: er is geen sleutel voor OpenAI ingesteld.");
  }
  if (teVaak(email)) return fout(429, "Je hebt het afgelopen uur al veel ingelezen. Probeer het straks opnieuw.");

  let formulier: FormData;
  try {
    formulier = await request.formData();
  } catch {
    return fout(400, "De opname kwam niet goed door. Probeer het opnieuw.");
  }

  const audio = formulier.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return fout(400, "Er zat geen opname bij. Probeer het opnieuw.");
  }
  if (audio.size > MAX_BYTES) {
    return fout(413, "De opname is te lang. Lees de tekst in kleinere stukken in.");
  }

  // nl-BE → nl. Whisper raadt de taal ook zelf, maar met een hint gaat het beter.
  const taal = String(formulier.get("taal") ?? "").split("-")[0].toLowerCase();

  const naarOpenai = new FormData();
  naarOpenai.append("file", audio, audio.name || "opname.webm");
  naarOpenai.append("model", MODEL);
  naarOpenai.append("response_format", "json");
  if (/^[a-z]{2}$/.test(taal)) naarOpenai.append("language", taal);
  // Bij live uitschrijven komt het vorige stuk mee: zo sluit een zin over twee stukken aan.
  const vorige = String(formulier.get("vorige") ?? "").slice(-400);
  const voorbeeld = [STIJLVOORBEELD[taal], vorige].filter(Boolean).join(" ");
  if (voorbeeld) naarOpenai.append("prompt", voorbeeld);

  let antwoord: Response;
  try {
    antwoord = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiSleutel}` },
      body: naarOpenai,
    });
  } catch {
    return fout(502, "OpenAI is even niet bereikbaar. Probeer het straks opnieuw.");
  }

  if (!antwoord.ok) {
    // De details horen in de serverlogs, niet bij de leraar.
    const details = await antwoord.text().catch(() => "");
    console.error("inlezen: OpenAI gaf", antwoord.status, details);
    // Opnieuw proberen helpt niet als het tegoed op is: zeg dan wie er iets aan kan doen.
    if (details.includes("insufficient_quota")) {
      return fout(503, "Inlezen staat even stil: het tegoed bij OpenAI is op. Laat het de beheerder van Open E-lab weten.");
    }
    return fout(502, "Het uitschrijven lukte niet. Probeer het opnieuw.");
  }

  const data = (await antwoord.json()) as { text?: string };
  return Response.json({ tekst: (data.text ?? "").trim() });
}
