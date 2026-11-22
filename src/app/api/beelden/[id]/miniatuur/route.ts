/*
 * De miniatuur van een vrij beeld, voor de zoekresultaten. Zonder aanmelding, want een
 * <img> stuurt geen token mee; daarom alleen een geldig Openverse-id en niets anders.
 */

import { geldigId, miniatuur } from "@/lib/server/openverse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!geldigId(id)) return new Response(null, { status: 400 });

  try {
    const antwoord = await miniatuur(id);
    const type = antwoord.headers.get("content-type") ?? "";
    if (!antwoord.ok || !type.startsWith("image/") || type.includes("svg")) {
      return new Response(null, { status: 404 });
    }
    return new Response(await antwoord.arrayBuffer(), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
