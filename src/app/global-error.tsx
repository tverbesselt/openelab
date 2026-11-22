"use client";

import React, { useEffect } from "react";
import "./globals.css";

/*
 * Het laatste vangnet: een fout in de opmaak van de site zelf (kop, aanmelding, instellingen).
 * Deze pagina vervangt dan alles, dus ze staat op zichzelf: geen kop, geen voet, geen
 * onderdelen die zelf kunnen falen, en een gewone link die de site opnieuw laadt.
 */
export default function AlgemeneFout({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Fout in de opmaak van de site", error);
  }, [error]);

  return (
    <html lang="nl">
      <body className="min-h-dvh flex flex-col antialiased">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-sm text-center">
            <p className="text-sm font-bold text-merk-900 mb-4">Open E-lab</p>
            <h1 className="text-xl font-extrabold text-merk-900 mb-2">Er ging iets mis</h1>
            <p className="text-sm text-slate-600 mb-5">
              Open E-lab kon niet starten. Probeer het opnieuw. Lukt het nog niet, sluit dan dit
              tabblad en open de app opnieuw.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
              >
                Probeer opnieuw
              </button>
              {/* Een gewone link: die laadt de hele site opnieuw. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className="inline-flex px-4 py-2.5 rounded-xl border border-slate-300 hover:border-merk-800 text-merk-900 font-bold text-sm transition-colors"
              >
                Naar start
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
