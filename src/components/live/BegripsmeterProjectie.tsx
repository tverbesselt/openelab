"use client";

import type { ProjectieProps } from "./Projectiescherm";
import { Projectiekader } from "./Projectiekader";
import { BEGRIPSMETER_KLEUREN, BEGRIPSMETER_OPTIES } from "./sessie";
import { useLiveSessie } from "./useLiveSessie";

/** De begripsmeter: drie kleuren naast elkaar. In één oogopslag zie je of de klas nog mee is. */
export default function BegripsmeterProjectie({ sessie: begin, onStop }: ProjectieProps) {
  const lopend = useLiveSessie(begin, onStop);
  const { antwoorden, stemmen } = lopend;
  const totaal = antwoorden.length;

  return (
    <Projectiekader
      lopend={lopend}
      eenheid={["cursist", "cursisten"]}
      voetnoot="Cursisten mogen hun kleur de hele les bijstellen. Laat dit scherm gerust staan."
    >
      <div className="mt-8">
        <div className="flex h-24 rounded-2xl overflow-hidden bg-white/10">
          {BEGRIPSMETER_OPTIES.map((label, idx) => {
            const pct = totaal > 0 ? (stemmen[idx] / totaal) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={label}
                style={{ width: `${pct}%` }}
                className={`${BEGRIPSMETER_KLEUREN[idx]} flex items-center justify-center transition-all duration-500`}
                title={`${label}: ${stemmen[idx]}`}
              >
                <span className="text-merk-900 font-black text-2xl">{stemmen[idx]}</span>
              </div>
            );
          })}
          {totaal === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm text-white/60">Nog niemand heeft zich gemeld.</span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {BEGRIPSMETER_OPTIES.map((label, idx) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className={`w-3 h-3 rounded-full ${BEGRIPSMETER_KLEUREN[idx]} shrink-0`} />
              <span className="font-semibold">{label}</span>
              <span className="font-mono text-white/70 ml-auto">{stemmen[idx]}</span>
            </div>
          ))}
        </div>
      </div>
    </Projectiekader>
  );
}
