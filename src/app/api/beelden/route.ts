/*
 * Vrije beelden zoeken in Openverse, voor de fotokiezer in de maakformulieren.
 * Alleen voor leraren: zo wordt Open E-lab geen open doorgeefluik naar Openverse.
 */

import { demomodus, fout, leraarVan } from "@/lib/server/leraar";
import { zoek } from "@/lib/server/openverse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!demomodus) {
    const email = await leraarVan(request, {
      zonderAanmelding: "Meld je aan met je schoolaccount om beelden te zoeken.",
      geenLeraar: "Beelden zoeken is er alleen voor leraren.",
    });
    if (email instanceof Response) return email;
  }

  const params = new URL(request.url).searchParams;
  const vraag = (params.get("q") ?? "").trim().slice(0, 100);
  const pagina = Math.min(20, Math.max(1, Number(params.get("pagina")) || 1));
  if (!vraag) return fout(400, "Typ eerst waar je een afbeelding van zoekt.");

  try {
    return Response.json(await zoek(vraag, pagina));
  } catch (e) {
    console.error("Openverse zoeken mislukt", e);
    return fout(502, "De beeldbank antwoordt nu niet. Probeer het straks opnieuw.");
  }
}
