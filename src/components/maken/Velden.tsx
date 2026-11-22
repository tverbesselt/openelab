"use client";

import React from "react";

/** Eén invoerveld met label en, waar nodig, een zin uitleg eronder. */
export function Veld({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-800 mb-1">{label}</span>
      {hint && <span className="block text-xs text-slate-500 mb-2">{hint}</span>}
      {children}
    </label>
  );
}

export function Foutmelding({ tekst }: { tekst: string }) {
  if (!tekst) return null;
  return (
    <p
      role="alert"
      className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3"
    >
      {tekst}
    </p>
  );
}

/** De knop onderaan elk maakformulier. */
export function MaakKnop({
  bezig,
  label,
  uploads = 0,
}: {
  bezig: boolean;
  label: string;
  /** Hoeveel foto's of fragmenten nog aan het uploaden zijn: zolang dat loopt, wacht bewaren. */
  uploads?: number;
}) {
  return (
    <button
      type="submit"
      disabled={bezig || uploads > 0}
      className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors"
    >
      {bezig
        ? "Bezig met bewaren ..."
        : uploads > 0
          ? "Even wachten tot de upload klaar is ..."
          : label}
    </button>
  );
}

/** Kader met uitleg of een voorbeeld, in dezelfde stijl door alle formulieren heen. */
export function Toelichting({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">{children}</p>;
}

export const INVOER =
  "w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none";

export const INVOER_MONO = `${INVOER} font-mono`;

/**
 * Wat ziet een cursist na een fout antwoord? Meteen het juiste antwoord, of eerst een
 * tweede poging. Die tweede poging dwingt om zelf nog eens na te denken in plaats van het
 * antwoord gewoon te lezen.
 */
export function FeedbackKiezer({
  tweedeKans,
  onWijzig,
}: {
  tweedeKans: boolean;
  onWijzig: (tweedeKans: boolean) => void;
}) {
  const keuzes = [
    {
      waarde: true,
      titel: "Eerst een tweede poging",
      uitleg:
        "Bij een fout antwoord zegt Open E-lab alleen dat het nog niet juist is. Het juiste antwoord en de uitleg volgen na de tweede poging.",
    },
    {
      waarde: false,
      titel: "Meteen het juiste antwoord",
      uitleg: "Na elk antwoord zie je meteen wat juist is, met de uitleg erbij.",
    },
  ];

  return (
    <fieldset>
      <legend className="block text-sm font-bold text-slate-800 mb-1">
        Wat gebeurt er na een fout antwoord?
      </legend>
      <span className="block text-xs text-slate-500 mb-2">
        Bij een vraag met maar twee antwoorden, zoals waar of niet waar, is er geen tweede
        poging: dan zou het antwoord al vastliggen.
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {keuzes.map((k) => (
          <button
            key={k.titel}
            type="button"
            aria-pressed={tweedeKans === k.waarde}
            onClick={() => onWijzig(k.waarde)}
            className={`text-left p-3 rounded-xl border transition-colors ${
              tweedeKans === k.waarde
                ? "bg-merk-50 border-merk-800 ring-1 ring-merk-800"
                : "bg-white border-slate-200 hover:border-merk"
            }`}
          >
            <span className="block text-sm font-bold text-slate-900">{k.titel}</span>
            <span className="block text-xs text-slate-600 mt-0.5">{k.uitleg}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
