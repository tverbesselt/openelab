"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

/**
 * Eén balk per antwoordmogelijkheid, met het aantal stemmen en het percentage. De poll en
 * de snelle vraag delen dit; bij de snelle vraag is elke balk ook een knop.
 */
export function Stembalken({
  opties,
  stemmen,
  totaal,
  juisteOptie,
  alsLetter = false,
  onKies,
}: {
  opties: string[];
  stemmen: number[];
  /** Het aantal antwoorden in de sessie: de noemer van het percentage. */
  totaal: number;
  /** Het antwoord dat de leraar als juist aanduidde. */
  juisteOptie?: number;
  /** Toon de optie als letter in een blokje, zoals bij een snelle vraag. */
  alsLetter?: boolean;
  /** Maakt van elke balk een knop: de leraar duidt het juiste antwoord aan. */
  onKies?: (index: number) => void;
}) {
  const isAangeduid = typeof juisteOptie === "number";

  return (
    <div className="mt-8 space-y-4">
      {opties.map((optie, idx) => {
        const pct = totaal > 0 ? Math.round((stemmen[idx] / totaal) * 100) : 0;
        const isJuist = juisteOptie === idx;

        const balk = (
          <>
            <div className="flex items-center justify-between text-sm sm:text-base font-semibold">
              <span className="flex items-center gap-2">
                {alsLetter ? (
                  <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center font-black text-sm shrink-0">
                    {optie}
                  </span>
                ) : (
                  <span>{optie}</span>
                )}
                {isJuist && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
              </span>
              <span className="font-mono">
                {stemmen[idx]} ({pct}%)
              </span>
            </div>
            <div className="w-full h-4 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isJuist ? "bg-emerald-400" : isAangeduid ? "bg-white/40" : "bg-merk"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        );

        return onKies ? (
          <button
            key={idx}
            onClick={() => onKies(idx)}
            className="w-full space-y-1.5 text-left rounded-xl p-1 -m-1 hover:bg-white/5 transition-colors"
            title={isJuist ? "Niet meer als juist tonen" : "Toon dit als het juiste antwoord"}
          >
            {balk}
          </button>
        ) : (
          <div key={idx} className="space-y-1.5">
            {balk}
          </div>
        );
      })}
    </div>
  );
}
