"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Eye, RotateCcw } from "lucide-react";
import { Tekenopdracht } from "@/lib/types";
import { TekenBlad } from "@/components/TekenBlad";
import { Vergelijk } from "@/components/tekenen/Vergelijk";
import {
  ZELFOORDELEN,
  bestandsnaam,
  bewaarOordeel,
  bewaardeOordelen,
  downloadAlsPng,
} from "@/lib/tekenen";

/**
 * Teken uit je geheugen, alleen. De cursist kiest een naam, tekent zonder voorbeeld en
 * ziet pas daarna het origineel. Hoe goed het leek, zegt hij zelf; dat oordeel blijft
 * op zijn toestel.
 */
export function TekenenPlayer({ oefeningId, opdrachten }: { oefeningId: string; opdrachten: Tekenopdracht[] }) {
  const [nr, setNr] = useState<number | null>(null);
  const [tekening, setTekening] = useState<string | null>(null);
  const [leeg, setLeeg] = useState(true);
  const [poging, setPoging] = useState(0);
  const [oordelen, setOordelen] = useState<Record<string, number>>(() => bewaardeOordelen(oefeningId));
  const canvas = useRef<HTMLCanvasElement | null>(null);

  const kies = (n: number | null) => {
    setNr(n);
    setTekening(null);
    setLeeg(true);
    setPoging((p) => p + 1);
    window.scrollTo({ top: 0 });
  };

  /* ── Lijst: alleen namen, nooit een voorbeeld ─────────────────────────── */
  if (nr === null) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 u-fade">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-extrabold text-merk-900 mb-1">Teken uit je geheugen</h2>
          <p className="text-sm text-slate-600 mb-5">
            Kies een naam en teken het beeld zoals jij het je herinnert. Niet opzoeken: pas als je
            klaar bent, zie je het origineel.
          </p>
          <button
            onClick={() => kies(opdrachten.findIndex((o) => !oordelen[o.id]) >= 0 ? opdrachten.findIndex((o) => !oordelen[o.id]) : 0)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors inline-flex items-center justify-center gap-2"
          >
            Begin met tekenen
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {opdrachten.map((o, i) => {
            const oordeel = ZELFOORDELEN.find((z) => z.waarde === oordelen[o.id]);
            return (
              <li key={o.id}>
                <button
                  onClick={() => kies(i)}
                  className="w-full text-left p-4 bg-white rounded-2xl border border-slate-200 hover:border-merk transition-colors flex items-center gap-3"
                >
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center font-black text-sm border border-merk/20">
                    {oordeel ? <Check className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{o.naam}</span>
                    {oordeel && <span className="block text-xs text-slate-500">Vorige keer: {oordeel.label.toLowerCase()}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const opdracht = opdrachten[nr];
  const volgende = nr + 1 < opdrachten.length ? nr + 1 : null;

  return (
    <div className="max-w-3xl mx-auto space-y-4 u-fade">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => kies(null)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle afbeeldingen
        </button>
        <span className="text-xs font-bold text-slate-500 tabular-nums">
          {nr + 1} van {opdrachten.length}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-merk-800 mb-1">
          {tekening ? "Vergelijk" : "Teken uit je geheugen"}
        </p>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-merk-900 leading-tight break-words mb-4">
          {opdracht.naam}
        </h2>

        {!tekening ? (
          <>
            <TekenBlad key={poging} canvasRef={canvas} onLeeg={setLeeg} />
            <button
              onClick={() => canvas.current && setTekening(canvas.current.toDataURL("image/png"))}
              disabled={leeg}
              className="mt-4 w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-base transition-colors inline-flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Klaar, toon het origineel
            </button>
          </>
        ) : (
          <div className="space-y-5">
            <Vergelijk tekening={tekening} origineel={opdracht.beeld.url} alt={opdracht.beeld.alt} />

            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">Hoe goed leek je tekening?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ZELFOORDELEN.map((z) => (
                  <button
                    key={z.waarde}
                    onClick={() => {
                      bewaarOordeel(oefeningId, opdracht, z.waarde);
                      setOordelen((o) => ({ ...o, [opdracht.id]: z.waarde }));
                    }}
                    aria-pressed={oordelen[opdracht.id] === z.waarde}
                    className={`py-2.5 px-2 rounded-xl border text-sm font-bold transition-colors ${
                      oordelen[opdracht.id] === z.waarde
                        ? "bg-merk-800 border-merk-800 text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-merk"
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Wat liet je weg, wat zat ergens anders? Dat zegt meer dan het cijfer. Alleen jij ziet dit.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => kies(nr)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-merk"
              >
                <RotateCcw className="w-4 h-4" />
                Nog eens tekenen
              </button>
              <button
                onClick={() => downloadAlsPng(tekening, bestandsnaam("tekening", opdracht.naam))}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-merk"
              >
                <Download className="w-4 h-4" />
                Bewaar als PNG
              </button>
              <span className="flex-1" />
              <button
                onClick={() => kies(volgende)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white text-sm font-bold"
              >
                {volgende === null ? "Terug naar de lijst" : "Volgende afbeelding"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
