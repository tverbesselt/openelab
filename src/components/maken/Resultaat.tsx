"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Share2 } from "lucide-react";
import type { Exercise } from "@/lib/types";
import { WERKVORMEN, inhoudSamenvatting, isKlassikaal } from "@/lib/labels";
import { klassikaleStart } from "@/werkvormen/register";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import { ShareModal } from "@/components/ShareModal";

/** Wat is er precies gemaakt? Met per oefening de knop om ze te delen of te starten. */
export function Resultaat({
  oefeningen,
  onOpnieuw,
}: {
  oefeningen: Exercise[];
  onOpnieuw: () => void;
}) {
  const { isAan } = useInstellingen();
  const [delen, setDelen] = useState<Exercise | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-5 u-fade">
      <div className="text-center">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-2" />
        <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight">
          Klaar om te gebruiken
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {oefeningen.length === 1
            ? "Je oefening staat in je bibliotheek."
            : `Uit één lijst maakten we ${oefeningen.length} werkvormen. Ze staan in je bibliotheek.`}
        </p>
      </div>

      <div className="space-y-3">
        {oefeningen.map((ex) => {
          const Icon = WERKVORMEN[ex.type].icon;
          const start = klassikaleStart(ex);
          const klassikaal = isKlassikaal(ex);
          return (
            <div
              key={ex.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3"
            >
              <span className="w-10 h-10 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {WERKVORMEN[ex.type].label}
                </p>
                <p className="text-xs text-slate-500">
                  {inhoudSamenvatting(ex)} · code {ex.shareCode}
                </p>
              </div>
              {start && !klassikaal && isAan(start.functie) && (
                <Link
                  href={start.href}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:border-merk text-slate-800 font-bold text-xs transition-colors"
                >
                  Start in de klas
                </Link>
              )}
              {start && klassikaal ? (
                <Link
                  href={start.href}
                  className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors"
                >
                  Start in de klas
                </Link>
              ) : (
                <button
                  onClick={() => setDelen(ex)}
                  className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Deel</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/bibliotheek?van=mij"
          className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm text-center transition-colors"
        >
          Naar mijn bibliotheek
        </Link>
        <button
          onClick={onOpnieuw}
          className="flex-1 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          Nog een oefening maken
        </button>
      </div>

      {delen && (
        <ShareModal
          isOpen={!!delen}
          onClose={() => setDelen(null)}
          title={delen.title}
          shareCode={delen.shareCode}
          id={delen.id}
        />
      )}
    </div>
  );
}
