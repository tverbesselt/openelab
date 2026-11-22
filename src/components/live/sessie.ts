import { nieuwePincode } from "@/lib/opslag";
import type { Gebruiker } from "@/lib/auth/AuthProvider";
import type { Exercise, LiveSessie, LiveType } from "@/lib/types";

/** De drie standen van de begripsmeter. Volgorde = van goed naar kwijt. */
export const BEGRIPSMETER_OPTIES = ["Ik volg", "Ik twijfel", "Ik ben kwijt"];
export const BEGRIPSMETER_KLEUREN = ["bg-emerald-400", "bg-amber-400", "bg-rose-400"];

/** Letters voor de snelle vraag: de leraar zegt de vraag, het bord toont alleen de keuzes. */
export const LETTERS = ["A", "B", "C", "D"];

/** De vraag die op het bord komt: die van de poll of de woordwolk, anders de titel. */
export function vraagVan(ex: Exercise): string {
  if (ex.type === "poll") return ex.content.pollQuestion || ex.title;
  if (ex.type === "wordcloud") return ex.content.wordCloudPrompt || ex.title;
  return ex.title;
}

/** Een nieuwe sessie met een verse pincode. Elk sessietype vult zijn eigen velden aan. */
export function nieuweSessie(
  persoon: Gebruiker,
  type: LiveType,
  velden: Partial<LiveSessie>
): LiveSessie {
  return {
    code: nieuwePincode(),
    hostId: persoon.id,
    hostNaam: persoon.naam,
    titel: "",
    type,
    vraag: "",
    opties: [],
    status: "actief",
    toonResultaten: true,
    gestartOp: new Date().toISOString(),
    ...velden,
  };
}
