"use client";

import React, { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { OefeningVan } from "@/lib/types";
import { SECONDEN_KEUZES, secondenLabel } from "@/lib/tekenen";

export interface TekenenKeuzes {
  seconden: number;
  namen: "anoniem" | "naam";
}

/** Twee keuzes voor de leraar: hoe lang mag elke tekening duren, en met of zonder naam. */
export function TekenenOpzet({
  oefening,
  bezig,
  onStart,
  onAnnuleer,
}: {
  oefening: OefeningVan<"tekenen">;
  bezig: boolean;
  onStart: (keuzes: TekenenKeuzes) => void;
  onAnnuleer: () => void;
}) {
  const [seconden, setSeconden] = useState(60);
  const [namen, setNamen] = useState<"anoniem" | "naam">("anoniem");
  const aantal = oefening.content.tekenopdrachten.length;

  const keuze = (actief: boolean) =>
    `px-3 py-2.5 rounded-xl border font-bold text-sm transition-colors ${
      actief
        ? "bg-merk-800 text-white border-merk-800"
        : "bg-white text-slate-700 border-slate-200 hover:border-merk"
    }`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onStart({ seconden, namen });
      }}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
    >
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">Teken uit je geheugen · {aantal} afbeeldingen</p>
        <h2 className="font-bold text-lg text-merk-900">{oefening.title}</h2>
        <p className="text-sm text-slate-600 mt-1">
          Op het digibord en op de toestellen staat alleen de naam. Jij bepaalt wanneer de klas naar
          de volgende afbeelding gaat, en wanneer het origineel verschijnt.
        </p>
      </div>

      <fieldset>
        <legend className="block text-sm font-bold text-slate-800 mb-2">Tekentijd per afbeelding</legend>
        <div className="flex flex-wrap gap-2">
          {SECONDEN_KEUZES.map((s) => (
            <button key={s} type="button" onClick={() => setSeconden(s)} aria-pressed={seconden === s} className={keuze(seconden === s)}>
              {secondenLabel(s)}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Is de tijd om, dan sturen de toestellen de tekening vanzelf in. Ga je eerder verder, dan ook.
        </p>
      </fieldset>

      <fieldset>
        <legend className="block text-sm font-bold text-slate-800 mb-2">Namen bij de tekeningen</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" onClick={() => setNamen("anoniem")} aria-pressed={namen === "anoniem"} className={keuze(namen === "anoniem")}>
            Anoniem
          </button>
          <button type="button" onClick={() => setNamen("naam")} aria-pressed={namen === "naam"} className={keuze(namen === "naam")}>
            Met een zelfgekozen naam
          </button>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={bezig || aantal === 0}
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
        <span>Kies iets anders</span>
      </button>
    </form>
  );
}
