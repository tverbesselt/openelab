"use client";

import React, { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { LETTERS } from "./sessie";

/** Twee keuzes voor de leraar: waarover gaat het, en hoeveel antwoordmogelijkheden. */
export function SnelleVraagOpzet({
  bezig,
  onStart,
  onAnnuleer,
}: {
  bezig: boolean;
  onStart: (vraag: string, aantal: number) => void;
  onAnnuleer: () => void;
}) {
  const [vraag, setVraag] = useState("");
  const [aantal, setAantal] = useState(4);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onStart(vraag, aantal);
      }}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
    >
      <label className="block">
        <span className="block text-sm font-bold text-slate-800 mb-1">
          Waarover gaat je vraag? <span className="font-normal text-slate-500">(mag leeg)</span>
        </span>
        <span className="block text-xs text-slate-500 mb-2">
          Dit komt op het bord te staan. Laat je het leeg, dan stel je de vraag gewoon hardop.
        </span>
        <input
          type="text"
          value={vraag}
          onChange={(e) => setVraag(e.target.value)}
          placeholder="Bijvoorbeeld: welke schakeling hoort bij dit schema?"
          className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </label>

      <div>
        <span className="block text-sm font-bold text-slate-800 mb-2">
          Hoeveel antwoordmogelijkheden?
        </span>
        <div className="flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAantal(n)}
              aria-pressed={aantal === n}
              className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors ${
                aantal === n
                  ? "bg-merk-800 text-white border-merk-800"
                  : "bg-white text-slate-700 border-slate-200 hover:border-merk"
              }`}
            >
              {LETTERS.slice(0, n).join(" ")}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={bezig}
        className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{bezig ? "Sessie starten ..." : "Toon op het digibord"}</span>
      </button>

      <button
        type="button"
        onClick={onAnnuleer}
        className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Terug</span>
      </button>
    </form>
  );
}
