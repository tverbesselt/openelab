"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { CornellBlad } from "@/components/CornellBlad";
import { FunctiePoort } from "@/components/FunctiePoort";

/*
 * Een leeg notitieblad in twee kolommen, los van een oefening. Voor cursisten die thuis of
 * in de les notities willen nemen waarmee ze zichzelf later kunnen testen, en voor leraren
 * die het blad in de klas uitdelen.
 */

function CornellPaginaInhoud() {
  const [titel, setTitel] = useState("");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="niet-afdrukken space-y-4 mb-6 pb-4 border-b border-slate-200">
        <Link
          href="/slim-oefenen"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar slim oefenen</span>
        </Link>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
            Notitieblad in twee kolommen
          </h1>
          <p className="text-sm text-slate-600">
            Rechts noteer je, links schrijf je er later een kernwoord of vraag bij. Dek dan de
            rechterkolom af en test jezelf. Zo wordt je samenvatting een oefening in plaats van
            iets om te herlezen.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="block flex-1">
            <span className="block text-sm font-bold text-slate-800 mb-1">
              Lesonderwerp <span className="font-normal text-slate-500">(mag leeg)</span>
            </span>
            <input
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Bijvoorbeeld: de werking van het geheugen"
              className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </label>
          <button
            onClick={() => window.print()}
            className="px-4 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Afdrukken</span>
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Kies in het afdrukvenster staand papier en schaal 100%.
        </p>
      </div>

      <CornellBlad titel={titel.trim() || undefined} />
    </div>
  );
}

export default function CornellPagina() {
  return (
    <FunctiePoort functie="afdrukken">
      <CornellPaginaInhoud />
    </FunctiePoort>
  );
}
