/*
 * Eén vrij beeld volledig ophalen, zodat de browser het kan verkleinen en in de eigen
 * opslag van Open E-lab zetten. Zo blijft een quiz werken als het origineel verdwijnt.
 */

import { demomodus, fout, leraarVan } from "@/lib/server/leraar";
import { geldigId, volledigBeeld } from "@/lib/server/openverse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!demomodus) {
    const email = await leraarVan(request, {
      zonderAanmelding: "Meld je aan met je schoolaccount om een beeld te kiezen.",
      geenLeraar: "Beelden kiezen is er alleen voor leraren.",
    });
    if (email instanceof Response) return email;
  }

  const { id } = await params;
  if (!geldigId(id)) return fout(400, "Dit beeld bestaat niet.");

  try {
    const { data, type } = await volledigBeeld(id);
    return new Response(data, {
      headers: { "Content-Type": type, "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    console.error("Vrij beeld ophalen mislukt", id, e);
    return fout(502, "Dit beeld kunnen we nu niet ophalen. Kies een ander beeld.");
  }
}
