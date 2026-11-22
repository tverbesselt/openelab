"use client";

import { useMemo } from "react";
import type { ProjectieProps } from "./Projectiescherm";
import { Projectiekader } from "./Projectiekader";
import { useLiveSessie } from "./useLiveSessie";

/** Een woordwolk: hoe vaker een woord binnenkomt, hoe groter het op het bord staat. */
export default function WoordwolkProjectie({ sessie: begin, onStop }: ProjectieProps) {
  const lopend = useLiveSessie(begin, onStop);
  const { antwoorden } = lopend;

  const woorden = useMemo(() => {
    const telling = new Map<string, number>();
    for (const a of antwoorden) {
      const w = a.woord?.trim().toLowerCase();
      if (w) telling.set(w, (telling.get(w) ?? 0) + 1);
    }
    return [...telling.entries()].sort((a, b) => b[1] - a[1]);
  }, [antwoorden]);

  return (
    <Projectiekader lopend={lopend}>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 min-h-32">
        {woorden.length === 0 ? (
          <span className="text-sm text-white/60">De woorden verschijnen hier zodra cursisten typen.</span>
        ) : (
          woorden.map(([woord, n]) => {
            const max = woorden[0][1];
            const grootte = 1 + (n / max) * 1.6;
            return (
              <span
                key={woord}
                style={{ fontSize: `${grootte}rem` }}
                className="font-extrabold leading-none transition-all"
                title={`${n} keer`}
              >
                {woord}
              </span>
            );
          })
        )}
      </div>
    </Projectiekader>
  );
}
