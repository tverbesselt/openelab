import { bepaalRol } from "@/lib/auth/account";
import { normaliseer } from "@/lib/instellingen/types";

/*
 * Wie roept deze serverroute aan? Gedeeld door de routes die alleen voor leraren zijn.
 * Controleert het ID-token van Firebase bij Google en leest daarna de toegangsregels uit
 * Firestore met het token van de gebruiker zelf — zonder dat firebase-admin nodig is.
 */

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const DATABANK = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || "(default)";

export function fout(status: number, melding: string) {
  return Response.json({ fout: melding }, { status });
}

/**
 * Controleert het ID-token van Firebase bij Google zelf. accounts:lookup weigert een vals
 * of verlopen token.
 */
async function emailVanToken(idToken: string): Promise<string | null> {
  const sleutel = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!sleutel) return null;
  const antwoord = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${sleutel}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!antwoord.ok) return null;
  const data = (await antwoord.json()) as {
    users?: { email?: string; emailVerified?: boolean }[];
  };
  const gebruiker = data.users?.[0];
  if (!gebruiker?.email || !gebruiker.emailVerified) return null;
  return gebruiker.email.toLowerCase();
}

/** Een waarde uit de REST-API van Firestore omzetten naar gewone JavaScript. */
function gewoon(w: Record<string, unknown> | undefined): unknown {
  if (!w) return undefined;
  if ("stringValue" in w) return w.stringValue;
  if ("booleanValue" in w) return w.booleanValue;
  if ("integerValue" in w) return Number(w.integerValue);
  if ("doubleValue" in w) return w.doubleValue;
  if ("nullValue" in w) return null;
  if ("arrayValue" in w) {
    const waarden = (w.arrayValue as { values?: Record<string, unknown>[] }).values ?? [];
    return waarden.map(gewoon);
  }
  if ("mapValue" in w) {
    const velden = (w.mapValue as { fields?: Record<string, Record<string, unknown>> }).fields ?? {};
    return Object.fromEntries(Object.entries(velden).map(([k, v]) => [k, gewoon(v)]));
  }
  return undefined;
}

/**
 * Leest een document met het token van de gebruiker zelf, dus volgens firestore.rules.
 * Geeft null als het niet bestaat of niet leesbaar is.
 */
async function leesAlsGebruiker(pad: string, idToken: string): Promise<Record<string, unknown> | null> {
  if (!PROJECT) return null;
  const antwoord = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DATABANK}/documents/${pad}`,
    { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" }
  );
  if (!antwoord.ok) return null;
  const doc = (await antwoord.json()) as { fields?: Record<string, Record<string, unknown>> };
  return gewoon({ mapValue: { fields: doc.fields ?? {} } }) as Record<string, unknown>;
}

/**
 * Het e-mailadres van de aangemelde leraar, of een foutantwoord met de melding die de
 * route meegeeft. Past exact dezelfde regels toe als de app en firestore.rules.
 */
export async function leraarVan(
  request: Request,
  meldingen: { zonderAanmelding: string; geenLeraar: string }
): Promise<string | Response> {
  const idToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!idToken) return fout(401, meldingen.zonderAanmelding);

  const email = await emailVanToken(idToken).catch(() => null);
  if (!email) return fout(401, "Je aanmelding is verlopen. Laad de pagina opnieuw en probeer nog eens.");

  const [instellingen, beheerder] = await Promise.all([
    leesAlsGebruiker("instellingen/app", idToken).catch(() => null),
    leesAlsGebruiker(`beheerders/${encodeURIComponent(email)}`, idToken).catch(() => null),
  ]);
  const { toegang } = normaliseer(instellingen);
  if (bepaalRol(email, toegang, beheerder !== null) !== "leraar") {
    return fout(403, meldingen.geenLeraar);
  }
  return email;
}

/** Zonder Firebase draait de app in demomodus: dan is er niemand om aan te melden. */
export const demomodus = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
