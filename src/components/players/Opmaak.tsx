import React from "react";

/*
 * Een beetje opmaak in een vraag of antwoord: **vet** en *schuin*. Meer niet, en nooit
 * HTML: de tekst komt van een leraar of uit een import, en wordt hier alleen in stukken
 * geknipt. Een sterretje met een spatie ernaast ("5 * 3") blijft gewoon een sterretje.
 */

const PATROON = /\*\*(\S(?:[^*]*\S)?)\*\*|\*(\S(?:[^*]*\S)?)\*/g;

export function Opmaak({ tekst }: { tekst: string | undefined | null }) {
  if (!tekst) return null;
  if (!tekst.includes("*")) return <>{tekst}</>;

  const delen: React.ReactNode[] = [];
  let vanaf = 0;
  for (const m of tekst.matchAll(PATROON)) {
    const start = m.index ?? 0;
    if (start > vanaf) delen.push(tekst.slice(vanaf, start));
    delen.push(
      m[1] !== undefined ? <strong key={start}>{m[1]}</strong> : <em key={start}>{m[2]}</em>
    );
    vanaf = start + m[0].length;
  }
  if (vanaf < tekst.length) delen.push(tekst.slice(vanaf));
  return <>{delen}</>;
}

/** De tekst zonder opmaaktekens, bv. voor een alt-tekst of een samenvatting. */
export function zonderOpmaak(tekst: string): string {
  return tekst.replace(PATROON, (_, vet, schuin) => vet ?? schuin);
}
