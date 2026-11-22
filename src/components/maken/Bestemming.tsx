"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import type { Lesmap, Zichtbaarheid } from "@/lib/types";
import { ZICHTBAARHEID } from "@/lib/labels";

/** Zichtbaarheid en map kiezen: twee keuzes die de leraar bewust maakt, niet wij. */
export function Bestemming({
  zichtbaarheid,
  setZichtbaarheid,
  mapId,
  setMapId,
  mappen,
}: {
  zichtbaarheid: Zichtbaarheid;
  setZichtbaarheid: (z: Zichtbaarheid) => void;
  mapId: string;
  setMapId: (id: string) => void;
  mappen: Lesmap[];
}) {
  return (
    <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 space-y-3">
      <p className="text-sm font-bold text-slate-800">Wie mag dit zien?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(["prive", "organisatie"] as const).map((keuze) => {
          const meta = ZICHTBAARHEID[keuze];
          const Icon = meta.icon;
          const actief = zichtbaarheid === keuze;
          return (
            <button
              key={keuze}
              type="button"
              onClick={() => setZichtbaarheid(keuze)}
              aria-pressed={actief}
              className={`text-left p-3 rounded-xl border-2 transition-colors cursor-pointer ${
                actief
                  ? "bg-merk-50 border-merk-800"
                  : "bg-white border-slate-300 hover:border-merk-800"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <Icon className="w-4 h-4 text-slate-600" />
                {meta.label}
                {actief && <CheckCircle2 className="w-4 h-4 text-merk-800 ml-auto" />}
              </span>
              <span className="block text-xs text-slate-600 mt-1 leading-snug">{meta.uitleg}</span>
            </button>
          );
        })}
      </div>

      {mappen.length > 0 && (
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            In een map plaatsen <span className="font-normal text-slate-500">(mag ook later)</span>
          </span>
          <select
            value={mapId}
            onChange={(e) => setMapId(e.target.value)}
            className="w-full p-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          >
            <option value="">Geen map</option>
            {mappen.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
