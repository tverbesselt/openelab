"use client";

import React, { useEffect, useState } from "react";
import { X, Check, FolderPlus, Folder, Building2 } from "lucide-react";
import { Exercise, Lesmap } from "@/lib/types";
import { opslag, generateShortCode } from "@/lib/opslag";
import { mapPadTekst, organisatieBoom, type Eigenaar } from "@/lib/labels";

interface MapKiezerProps {
  oefening: Exercise;
  eigenaar: Eigenaar;
  onSluit: () => void;
  /** Zodat de pagina eronder de nieuwe indeling meteen toont. */
  onGewijzigd?: (mappen: Lesmap[]) => void;
  /** Voor een beheerder: kies uit de mappen van de organisatie in plaats van de eigen. */
  organisatie?: boolean;
}

export function MapKiezer({
  oefening,
  eigenaar,
  onSluit,
  onGewijzigd,
  organisatie = false,
}: MapKiezerProps) {
  const [mappen, setMappen] = useState<Lesmap[]>([]);
  const [nieuweNaam, setNieuweNaam] = useState("");
  const [fout, setFout] = useState("");

  useEffect(() => {
    const laad = organisatie ? opslag.organisatieMappen() : opslag.eigenMappen(eigenaar);
    laad.then(setMappen).catch(() => setMappen([]));
  }, [eigenaar, organisatie]);

  useEffect(() => {
    const sluitBijEscape = (e: KeyboardEvent) => e.key === "Escape" && onSluit();
    window.addEventListener("keydown", sluitBijEscape);
    return () => window.removeEventListener("keydown", sluitBijEscape);
  }, [onSluit]);

  // Organisatiemappen kunnen in elkaar zitten: toon ze in de volgorde van de boom, met
  // hun volledige pad, zodat twee submappen "Richtgraad 1" niet door elkaar lopen.
  const mijnMappen = organisatie ? organisatieBoom(mappen).map(({ map }) => map) : mappen;
  const naam = (map: Lesmap) => (organisatie ? mapPadTekst(mappen, map.id) : map.title);

  const toon = (bijgewerkt: Lesmap[]) => {
    setMappen(bijgewerkt);
    onGewijzigd?.(bijgewerkt);
  };

  const wissel = async (map: Lesmap) => {
    const zitErin = map.exerciseIds.includes(oefening.id);
    const exerciseIds = zitErin
      ? map.exerciseIds.filter((id) => id !== oefening.id)
      : [...map.exerciseIds, oefening.id];
    try {
      await opslag.wijzigMap(map.id, { exerciseIds });
      toon(mappen.map((m) => (m.id === map.id ? { ...m, exerciseIds } : m)));
      setFout("");
    } catch {
      // De map blijft zoals ze was; de pagina eronder toont niets verkeerds.
      setFout("Dat is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  const maakMap = async (e: React.FormEvent) => {
    e.preventDefault();
    const naam = nieuweNaam.trim();
    if (!naam) return;

    const nieuw: Lesmap = {
      id: `map-${Date.now()}`,
      title: naam,
      description: "",
      exerciseIds: [oefening.id],
      creatorName: eigenaar.naam,
      creatorId: eigenaar.id,
      shareCode: generateShortCode(),
      createdAt: new Date().toISOString().split("T")[0],
      ...(organisatie && { organisatie: true }),
    };
    try {
      await opslag.maakMap(nieuw);
      toon([nieuw, ...mappen]);
      setNieuweNaam("");
      setFout("");
    } catch {
      setFout("De map bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  const titel = organisatie ? "In organisatiemap plaatsen" : "In map plaatsen";

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs u-fade"
      role="dialog"
      aria-modal="true"
      aria-label={titel}
    >
      {/* Tussenlaag: vangt de klik naast het venster op en houdt het gecentreerd,
          ook wanneer het hoger is dan het scherm en er dus gescrold moet worden. */}
      <div className="flex min-h-full items-center justify-center p-4" onClick={onSluit}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 relative u-pop"
      >
        <button
          onClick={onSluit}
          aria-label="Sluiten"
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 pr-8">
          <p className="text-xs font-bold text-slate-500 mb-1">{titel}</p>
          <h3 className="font-extrabold text-lg text-merk-900 leading-snug line-clamp-2">
            {oefening.title}
          </h3>
        </div>

        {mijnMappen.length > 0 && (
          <div className="divide-y divide-slate-200 border-y border-slate-200 mb-5 max-h-64 overflow-y-auto">
            {mijnMappen.map((map) => {
              const zitErin = map.exerciseIds.includes(oefening.id);
              return (
                <button
                  key={map.id}
                  onClick={() => wissel(map)}
                  aria-pressed={zitErin}
                  className="w-full flex items-center gap-3 py-3 text-left group"
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      zitErin
                        ? "bg-merk-800 border-merk-800 text-white"
                        : "border-slate-300 group-hover:border-merk"
                    }`}
                  >
                    {zitErin && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900 truncate">
                      {naam(map)}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {map.exerciseIds.length}{" "}
                      {map.exerciseIds.length === 1 ? "oefening" : "oefeningen"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={maakMap} className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            {mijnMappen.length > 0
              ? organisatie
                ? "Of maak een nieuwe map op het hoogste niveau"
                : "Of maak een nieuwe map"
              : organisatie
                ? "Maak de eerste organisatiemap"
                : "Maak je eerste map"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nieuweNaam}
              onChange={(e) => setNieuweNaam(e.target.value)}
              placeholder={organisatie ? "Bijvoorbeeld: NT2 richtgraad 1" : "Bijvoorbeeld: wiskunde les 1"}
              className="flex-1 px-3 py-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!nieuweNaam.trim()}
              className="px-3 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Maak</span>
            </button>
          </div>
        </form>

        {fout && (
          <p role="alert" className="mt-4 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {fout}
          </p>
        )}

        {organisatie ? (
          <p className="mt-4 text-xs text-slate-500 flex items-start gap-2">
            <Building2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Organisatiemappen ziet elke leraar van de organisatie. Wie de oefening maakte,
            blijft er de eigenaar van.
          </p>
        ) : (
          mijnMappen.length === 0 && (
            <p className="mt-4 text-xs text-slate-500 flex items-start gap-2">
              <Folder className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Met mappen orden je je eigen materiaal per les of per vak. Ze veranderen niets aan
              wie je oefening kan zien.
            </p>
          )
        )}
      </div>
      </div>
    </div>
  );
}
