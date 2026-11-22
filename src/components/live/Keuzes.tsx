"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Play, type LucideIcon } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { WERKVORMEN } from "@/lib/labels";
import { vraagVan } from "./sessie";

/* De bouwstenen van het keuzescherm op de livepagina: wat wil je in de klas starten? */

/** Een grote knop voor iets wat zonder voorbereiding start. */
export function SnelStartKnop({
  icon: Icon,
  titel,
  uitleg,
  onClick,
  bezig,
}: {
  icon: LucideIcon;
  titel: string;
  uitleg: string;
  onClick: () => void;
  bezig?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={bezig}
      className="text-left p-5 rounded-2xl bg-white border border-slate-200 hover:border-merk disabled:opacity-60 transition-colors"
    >
      <span className="w-10 h-10 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20 mb-3">
        <Icon className="w-5 h-5" />
      </span>
      <span className="block text-base font-bold text-slate-900 mb-1">{titel}</span>
      <span className="block text-xs text-slate-600 leading-relaxed">{uitleg}</span>
    </button>
  );
}

/**
 * Een groep op het keuzescherm: een kop, en daaronder het materiaal van de leraar dat zo
 * gespeeld kan worden. Is er nog niets, dan staat er een knop om het te maken.
 */
export function MateriaalSectie<T extends Exercise>({
  titel,
  uitleg,
  oefeningen,
  icon,
  einde: Einde = Play,
  regel,
  leeg,
  onKies,
}: {
  titel: string;
  uitleg?: string;
  oefeningen: T[];
  /** Eén icoon voor de hele groep, of het icoon van de werkvorm als dit ontbreekt. */
  icon?: LucideIcon;
  /** Het icoon rechts in de rij. */
  einde?: LucideIcon;
  /** De tweede regel van een rij, voor de naam van de maker. */
  regel: (oefening: T) => string;
  leeg: { tekst: string; knop: string; href: string };
  onKies: (oefening: T) => void;
}) {
  return (
    <section>
      <h2 className={`text-xs font-bold uppercase tracking-[0.12em] text-slate-600 ${uitleg ? "mb-1" : "mb-3"}`}>
        {titel}
      </h2>
      {uitleg && <p className="text-xs text-slate-500 mb-3">{uitleg}</p>}

      {oefeningen.length === 0 ? (
        <div className={`bg-white rounded-2xl border border-slate-200 text-center ${uitleg ? "p-6" : "p-8"}`}>
          <p className="text-sm text-slate-600 mb-4">{leeg.tekst}</p>
          <Link
            href={leeg.href}
            className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
          >
            {leeg.knop}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {oefeningen.map((ex) => {
            const Icon = icon ?? WERKVORMEN[ex.type].icon;
            return (
              <button
                key={ex.id}
                onClick={() => onKies(ex)}
                className="w-full text-left flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 hover:border-merk transition-colors"
              >
                <span className="w-10 h-10 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900">{ex.title}</span>
                  <span className="block text-xs text-slate-500">
                    {regel(ex)} · {ex.creatorName}
                  </span>
                </span>
                <Einde className="w-4 h-4 text-merk shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** Een poll of woordwolk uit je materiaal is gekozen: nog één klik om ze te tonen. */
export function MateriaalOpzet({
  oefening,
  bezig,
  onStart,
  onAnnuleer,
}: {
  oefening: Exercise;
  bezig: boolean;
  onStart: () => void;
  onAnnuleer: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <p className="text-xs font-bold text-slate-500 mb-1">{WERKVORMEN[oefening.type].label}</p>
      <h2 className="font-bold text-lg text-merk-900 mb-2">{oefening.title}</h2>
      <p className="text-sm text-slate-600 mb-5">{vraagVan(oefening)}</p>

      <button
        onClick={onStart}
        disabled={bezig}
        className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{bezig ? "Sessie starten ..." : "Toon op het digibord"}</span>
      </button>

      <button
        onClick={onAnnuleer}
        className="mt-3 text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kies iets anders</span>
      </button>
    </div>
  );
}
