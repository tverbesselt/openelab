"use client";

import React, { useId } from "react";
import { MAX_VAK, type Vindbaarheid } from "@/lib/vindbaarheid";

const veld =
  "w-full p-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none";

/**
 * Vak, beschrijving en trefwoorden: waarmee collega's dit materiaal terugvinden in de
 * bibliotheek. Alles mag leeg blijven.
 */
export function VindbaarheidVelden({
  waarde,
  onWijzig,
  vakken,
}: {
  waarde: Vindbaarheid;
  onWijzig: (nieuw: Vindbaarheid) => void;
  /** Vakken die collega's al gebruikten, als suggestie. */
  vakken: string[];
}) {
  const id = useId();
  const zet = (stuk: Partial<Vindbaarheid>) => onWijzig({ ...waarde, ...stuk });

  return (
    <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-slate-800">Zo vind je het terug</p>
        <p className="text-xs text-slate-600">
          Niet verplicht. Collega&apos;s zoeken en filteren hierop in de bibliotheek.
        </p>
      </div>

      <label className="block">
        <span className="block text-sm font-bold text-slate-800 mb-1">Vak of opleiding</span>
        <input
          type="text"
          value={waarde.vak}
          onChange={(e) => zet({ vak: e.target.value })}
          maxLength={MAX_VAK}
          list={`${id}-vakken`}
          placeholder="Bijvoorbeeld: NT2 richtgraad 1"
          className={veld}
        />
        <datalist id={`${id}-vakken`}>
          {vakken.map((vak) => (
            <option key={vak} value={vak} />
          ))}
        </datalist>
      </label>

      <label className="block">
        <span className="block text-sm font-bold text-slate-800 mb-1">Trefwoorden</span>
        <input
          type="text"
          value={waarde.trefwoorden}
          onChange={(e) => zet({ trefwoorden: e.target.value })}
          placeholder="Gescheiden door komma's, bijvoorbeeld: winkelen, hoofdstuk 3"
          className={veld}
        />
      </label>

      <label className="block">
        <span className="block text-sm font-bold text-slate-800 mb-1">Beschrijving</span>
        <textarea
          value={waarde.beschrijving}
          onChange={(e) => zet({ beschrijving: e.target.value })}
          rows={2}
          maxLength={400}
          placeholder="Eén of twee zinnen over wat cursisten hier oefenen"
          className={veld}
        />
      </label>
    </div>
  );
}
