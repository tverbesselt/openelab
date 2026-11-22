"use client";

import React from "react";
import Link from "next/link";

/*
 * Eén vorm voor alles wat misloopt of ontbreekt: een pagina die niet bestaat, een code die
 * niets oplevert, een gewiste oefening, geen verbinding. Altijd met de weg terug.
 */

export const KNOP_VOL =
  "inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors";
export const KNOP_RAND =
  "inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-300 hover:border-merk-800 text-merk-900 font-bold text-sm transition-colors";

interface Props {
  titel: string;
  /** De uitleg: wat er aan de hand is en wat de lezer kan doen. */
  children: React.ReactNode;
  /** Opnieuw proberen; zonder deze functie staat er alleen de weg terug. */
  opnieuw?: () => void;
  /** De weg terug. Standaard naar start. */
  terug?: { href: string; label: string };
}

export function Melding({ titel, children, opnieuw, terug = { href: "/", label: "Naar start" } }: Props) {
  return (
    <div className="max-w-sm mx-auto text-center py-20 u-fade">
      <h1 className="text-xl font-extrabold text-merk-900 mb-2">{titel}</h1>
      <p className="text-sm text-slate-600 mb-5">{children}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {opnieuw && (
          <button type="button" onClick={opnieuw} className={KNOP_VOL}>
            Probeer opnieuw
          </button>
        )}
        <Link href={terug.href} className={opnieuw ? KNOP_RAND : KNOP_VOL}>
          {terug.label}
        </Link>
      </div>
    </div>
  );
}

/** De melding bij een netwerkfout: de pagina opnieuw laden is dan de eerste stap. */
export function GeenVerbinding({ terug }: Pick<Props, "terug">) {
  return (
    <Melding titel="Even geen verbinding" opnieuw={() => window.location.reload()} terug={terug}>
      Kijk je internetverbinding na en probeer opnieuw.
    </Melding>
  );
}

/** Wat er te zien is terwijl een pagina laadt. */
export function EvenGeduld() {
  return (
    <p role="status" className="text-center py-20 text-sm text-slate-500">
      Even geduld ...
    </p>
  );
}
