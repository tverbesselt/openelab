"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search, X } from "lucide-react";
import {
  BeeldbankFout,
  VrijBeeld,
  haalVrijBeeld,
  miniatuurUrl,
  zoekVrijeBeelden,
} from "@/lib/beeldbank";

/**
 * Een venster om een vrije afbeelding te zoeken in Openverse. Het gekozen beeld komt terug
 * als bestand, zodat de fotokiezer het verkleint en uploadt zoals een eigen foto.
 */
export function VrijBeeldZoeker({
  onGekozen,
  onSluit,
}: {
  onGekozen: (bestand: Blob, beeld: VrijBeeld) => void | Promise<void>;
  onSluit: () => void;
}) {
  const [vraag, setVraag] = useState("");
  const [gezocht, setGezocht] = useState("");
  const [resultaten, setResultaten] = useState<VrijBeeld[]>([]);
  const [pagina, setPagina] = useState(1);
  const [meer, setMeer] = useState(false);
  const [zoekt, setZoekt] = useState(false);
  const [haalt, setHaalt] = useState<string | null>(null);
  const [fout, setFout] = useState("");
  const veld = useRef<HTMLInputElement>(null);

  useEffect(() => {
    veld.current?.focus();
    const toets = (e: KeyboardEvent) => e.key === "Escape" && !haalt && onSluit();
    window.addEventListener("keydown", toets);
    return () => window.removeEventListener("keydown", toets);
  }, [haalt, onSluit]);

  const zoek = async (nieuw: boolean) => {
    const q = nieuw ? vraag.trim() : gezocht;
    if (!q || zoekt) return;
    const p = nieuw ? 1 : pagina + 1;
    setZoekt(true);
    setFout("");
    try {
      const { resultaten: r, meer: m } = await zoekVrijeBeelden(q, p);
      setResultaten(nieuw ? r : [...resultaten, ...r.filter((x) => !resultaten.some((y) => y.id === x.id))]);
      setPagina(p);
      setMeer(m);
      setGezocht(q);
    } catch (e) {
      setFout(e instanceof BeeldbankFout ? e.message : "Zoeken lukte niet. Kijk je verbinding na.");
    } finally {
      setZoekt(false);
    }
  };

  const kies = async (beeld: VrijBeeld) => {
    if (haalt) return;
    setHaalt(beeld.id);
    setFout("");
    try {
      const bestand = await haalVrijBeeld(beeld.id);
      await onGekozen(bestand, beeld);
    } catch (e) {
      setFout(e instanceof BeeldbankFout ? e.message : "Dit beeld kunnen we nu niet ophalen. Kies een ander beeld.");
    } finally {
      setHaalt(null);
    }
  };

  // Via een portal naar <body>: de fotokiezer staat zelf in het formulier van de quiz, en
  // Enter of een klik mag dat formulier niet versturen.
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-start sm:items-center justify-center p-3 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && !haalt && onSluit()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vrij-beeld-titel"
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 id="vrij-beeld-titel" className="font-bold text-base text-merk-900">
            Zoek een vrije afbeelding
          </h2>
          <button
            type="button"
            onClick={onSluit}
            disabled={Boolean(haalt)}
            aria-label="Sluiten"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4 flex gap-2">
          <input
            ref={veld}
            type="search"
            value={vraag}
            onChange={(e) => setVraag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                zoek(true);
              }
            }}
            placeholder="Bijvoorbeeld: zekeringkast, appel, Brussel"
            maxLength={100}
            aria-label="Zoekwoord"
            className="flex-1 min-w-0 p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => zoek(true)}
            disabled={!vraag.trim() || zoekt}
            className="px-4 py-2 rounded-lg bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white text-sm font-bold flex items-center gap-1.5"
          >
            {zoekt && pagina === 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Zoek
          </button>
        </div>
        <p className="px-5 pt-1.5 text-xs text-slate-500">
          Tip: zoek ook in het Engels, daar vind je veel meer.
        </p>

        {fout && (
          <p role="alert" className="mx-5 mt-3 text-xs font-semibold text-rose-800 bg-rose-50 rounded-lg px-3 py-2">
            {fout}
          </p>
        )}

        <div className="px-5 py-4 overflow-y-auto flex-1" aria-live="polite">
          {gezocht && resultaten.length === 0 && !zoekt && (
            <p className="text-sm text-slate-600">Niets gevonden voor &ldquo;{gezocht}&rdquo;. Probeer een ander woord.</p>
          )}
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {resultaten.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => kies(b)}
                  disabled={Boolean(haalt)}
                  title={b.titel || "Afbeelding"}
                  className="group w-full text-left rounded-xl border border-slate-200 hover:border-merk overflow-hidden disabled:opacity-60 relative"
                >
                  <img
                    src={miniatuurUrl(b.id)}
                    alt={b.titel || ""}
                    loading="lazy"
                    className="w-full h-28 object-cover bg-slate-100"
                  />
                  <span className="block px-2 py-1.5">
                    <span className="block text-[11px] font-semibold text-slate-800 truncate">
                      {b.titel || "Zonder titel"}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate">
                      {b.bron.maker ? `${b.bron.maker} · ` : ""}
                      {b.bron.licentie}
                    </span>
                  </span>
                  {haalt === b.id && (
                    <span className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-merk-900" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {meer && (
            <button
              type="button"
              onClick={() => zoek(false)}
              disabled={zoekt}
              className="mt-4 mx-auto block px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:border-merk disabled:opacity-50"
            >
              {zoekt ? "Bezig ..." : "Meer tonen"}
            </button>
          )}
        </div>

        <p className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-500">
          Beelden uit{" "}
          <a href="https://openverse.org" target="_blank" rel="noreferrer" className="underline">
            Openverse
          </a>
          , met een Creative Commons-licentie of uit het publiek domein. De maker en de licentie
          komen klein onder het beeld, zoals de licentie vraagt.
        </p>
      </div>
    </div>,
    document.body
  );
}
