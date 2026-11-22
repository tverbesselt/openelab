"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { Studietip } from "@/components/Studietip";
import type { Keuzegroep } from "./keuzes";
import { Stap } from "./Stap";

/** Stap 1 van de maakpagina: wat wil je maken? */
export function Keuzescherm({
  groepen,
  onKies,
}: {
  groepen: Keuzegroep[];
  onKies: (id: string) => void;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 u-fade">
      <div>
        <Stap nummer={1} />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          Wat wil je maken?
        </h1>
        <p className="text-sm text-slate-700">
          Kies een werkvorm. Daarna typ of plak je je inhoud, en Open E-lab doet de rest.
        </p>
      </div>

      {groepen.map((groep) => (
        <section key={groep.titel}>
          <div className="mb-3">
            <h2 className="text-base font-extrabold text-slate-900">{groep.titel}</h2>
            <p className="text-sm text-slate-600">{groep.uitleg}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groep.vormen.map((vorm) => {
              const Icon = vorm.icon;
              return (
                <button
                  key={vorm.id}
                  onClick={() => onKies(vorm.id)}
                  className="group text-left p-4 rounded-2xl bg-white border border-slate-300 shadow-sm hover:border-merk-800 hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                >
                  <span className="w-11 h-11 shrink-0 rounded-xl bg-merk-50 text-merk-900 border border-merk/30 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{vorm.titel}</span>
                    <span className="block text-xs text-slate-600 mt-0.5 leading-snug">
                      {vorm.uitleg}
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-merk-900 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <Studietip plek="maken" meer />
    </div>
  );
}
