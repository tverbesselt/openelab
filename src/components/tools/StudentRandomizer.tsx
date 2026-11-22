"use client";

import React, { useState } from "react";
import { Dices } from "lucide-react";
import { useKlaslijst } from "@/lib/klaslijst";
import { Klaslijst } from "./Klaslijst";

export function StudentRandomizer() {
  const lijst = useKlaslijst();
  const [gekozen, setGekozen] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  // Alleen wie er vandaag is, kan een beurt krijgen.
  const kandidaten = lijst.aanwezig;

  const kiesWillekeurig = () => {
    if (kandidaten.length === 0 || bezig) return;

    setBezig(true);
    setGekozen(null);

    let teller = 0;
    const interval = setInterval(() => {
      setGekozen(kandidaten[Math.floor(Math.random() * kandidaten.length)]);
      teller++;

      if (teller > 14) {
        clearInterval(interval);
        setGekozen(kandidaten[Math.floor(Math.random() * kandidaten.length)]);
        setBezig(false);
      }
    }, 100);
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 max-w-xl mx-auto u-pop space-y-5">
      <div
        className="bg-slate-50 rounded-2xl p-8 text-center min-h-[140px] flex flex-col items-center justify-center"
        aria-live="polite"
      >
        {gekozen ? (
          <>
            <span className="text-xs font-bold text-slate-500 block mb-1">Aan de beurt</span>
            <span className="text-4xl font-extrabold text-merk-900 tracking-tight">
              {gekozen}
            </span>
          </>
        ) : (
          <span className="text-sm text-slate-500">
            {kandidaten.length === 0
              ? "Er staat niemand aanwezig in je lijst."
              : "Klik hieronder om willekeurig een cursist te kiezen."}
          </span>
        )}
      </div>

      <button
        onClick={kiesWillekeurig}
        disabled={bezig || kandidaten.length === 0}
        className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
      >
        <Dices className="w-5 h-5" />
        <span>
          {bezig
            ? "Bezig met kiezen"
            : `Kies een cursist${kandidaten.length > 0 ? ` uit ${kandidaten.length}` : ""}`}
        </span>
      </button>

      <Klaslijst lijst={lijst} />
    </div>
  );
}
