"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, RefreshCw, History } from "lucide-react";
import { useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isEigenMateriaal } from "@/lib/labels";
import { opfrisItems, kiesWillekeurig, type OpfrisItem } from "@/lib/opfrissen";
import { LeraarPoort } from "@/components/LeraarPoort";
import { Studietip } from "@/components/Studietip";
import { FunctiePoort } from "@/components/FunctiePoort";

/*
 * Dagelijkse herhaling voor op het digibord. Vijf minuten aan het begin van de les,
 * zonder voorbereiding: kies waaruit, en er verschijnen een paar vragen uit vorige lessen.
 */

const AANTALLEN = [3, 5, 8];

function OpfrissenPaginaInhoud() {
  const { isLeraar, gebruiker } = useAuth();
  const { oefeningen, mappen, laden } = useMateriaal();

  const [mapId, setMapId] = useState("alles");
  const [aantal, setAantal] = useState(3);
  const [ronde, setRonde] = useState<OpfrisItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [toont, setToont] = useState(false);

  const eigen = useMemo(
    () => oefeningen.filter((ex) => isEigenMateriaal(ex, gebruiker)),
    [oefeningen, gebruiker]
  );

  /** Waar de vragen uit komen: één map, of al je eigen materiaal. */
  const bron = useMemo(() => {
    if (mapId === "alles") return eigen;
    const map = mappen.find((m) => m.id === mapId);
    if (!map) return [];
    return eigen.filter((ex) => map.exerciseIds.includes(ex.id));
  }, [mapId, mappen, eigen]);

  const beschikbaar = useMemo(() => opfrisItems(bron), [bron]);

  const startRonde = () => {
    setRonde(kiesWillekeurig(beschikbaar, Math.min(aantal, beschikbaar.length)));
    setIndex(0);
    setToont(false);
  };

  if (laden) return <div className="h-64" aria-hidden />;

  if (!isLeraar) {
    return (
      <LeraarPoort uitleg="Opfrissen is bedoeld voor op het digibord, aan het begin van je les. Als cursist oefen je met de code of QR-code die je van je leraar krijgt." />
    );
  }

  /* ── Op het bord ──────────────────────────────────────────────────────── */
  if (ronde && ronde.length > 0) {
    const item = ronde[index];
    const laatste = index + 1 >= ronde.length;

    return (
      <div className="max-w-4xl mx-auto space-y-4 u-fade">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setRonde(null)}
            className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Stoppen</span>
          </button>
          <span className="text-xs font-bold text-slate-500 tabular-nums">
            {index + 1} van {ronde.length}
          </span>
        </div>

        <div className="bg-merk-900 text-white rounded-3xl p-8 sm:p-12 shadow-lg min-h-[22rem] flex flex-col">
          <span className="text-xs uppercase font-bold tracking-widest text-white/70 mb-6">
            Uit een vorige les
          </span>

          <p className="text-2xl sm:text-4xl font-extrabold leading-snug">{item.vraag}</p>

          {toont ? (
            <div className="mt-8 pt-6 border-t border-white/20 u-rise">
              <span className="text-xs uppercase font-bold tracking-widest text-white/70 block mb-2">
                Antwoord
              </span>
              <p className="text-xl sm:text-3xl font-extrabold text-merk-300 leading-snug">
                {item.antwoord}
              </p>
              {item.toelichting && (
                <p className="text-sm sm:text-base text-white/80 mt-3 leading-relaxed">
                  {item.toelichting}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-8 text-sm text-white/70">
              Laat iedereen eerst zelf nadenken. Pas daarna het antwoord tonen.
            </p>
          )}

          <p className="mt-auto pt-6 text-xs text-white/60">{item.bron}</p>
        </div>

        {!toont ? (
          <button
            onClick={() => setToont(true)}
            className="w-full py-4 rounded-2xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            <span>Toon het antwoord</span>
          </button>
        ) : laatste ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startRonde}
              className="flex-1 py-4 rounded-2xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Nog een ronde</span>
            </button>
            <button
              onClick={() => setRonde(null)}
              className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base transition-colors"
            >
              Klaar, verder met de les
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setIndex(index + 1);
              setToont(false);
            }}
            className="w-full py-4 rounded-2xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            <span>Volgende vraag</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  /* ── Instellen ────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-6 u-fade">
      <div>
        <span className="w-11 h-11 rounded-2xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20 mb-3">
          <History className="w-5 h-5" />
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          Opfrissen
        </h1>
        <p className="text-sm text-slate-600">
          Een paar vragen uit vorige lessen, groot op het digibord. Eerst laten nadenken, dan het
          antwoord tonen. Vijf minuten aan het begin van je les, zonder voorbereiding.
        </p>
      </div>

      {beschikbaar.length === 0 && eigen.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-600 mb-4">
            Je hebt nog geen eigen materiaal om uit op te frissen.
          </p>
          <Link
            href="/maken"
            className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
          >
            Maak je eerste oefening
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <label className="block">
            <span className="block text-sm font-bold text-slate-800 mb-1">Waaruit?</span>
            <select
              value={mapId}
              onChange={(e) => setMapId(e.target.value)}
              className="w-full p-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            >
              <option value="alles">Al mijn materiaal</option>
              {mappen.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.title}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="block text-sm font-bold text-slate-800 mb-2">Hoeveel vragen?</span>
            <div className="flex gap-2">
              {AANTALLEN.map((n) => (
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
                  {n}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
            {beschikbaar.length === 0
              ? "In deze map staat geen materiaal met een juist antwoord. Polls, woordwolken en exit tickets vallen weg."
              : `${beschikbaar.length} ${beschikbaar.length === 1 ? "vraag staat" : "vragen staan"} klaar om uit te putten. Elke ronde is een nieuwe greep.`}
          </p>

          <button
            onClick={startRonde}
            disabled={beschikbaar.length === 0}
            className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-base transition-colors"
          >
            Start op het digibord
          </button>
        </div>
      )}

      <Studietip plek="opfrissen" meer />
    </div>
  );
}

export default function OpfrissenPagina() {
  return (
    <FunctiePoort functie="opfrissen">
      <OpfrissenPaginaInhoud />
    </FunctiePoort>
  );
}
