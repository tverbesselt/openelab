"use client";

import React, { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { opslag } from "@/lib/opslag";
import { PRULLENBAK_DAGEN } from "@/lib/opslag/opslag";
import { useOpgehaald } from "@/lib/opgehaald";
import type { OefeningKort } from "@/lib/types";
import { WERKVORMEN, isEigenMateriaal, type Eigenaar } from "@/lib/labels";

const DAG = 24 * 60 * 60 * 1000;

/** Hoeveel dagen dit nog in de prullenbak blijft. */
function dagenOver(verwijderdOp: string): number {
  const weg = new Date(verwijderdOp).getTime() + PRULLENBAK_DAGEN * DAG;
  return Math.max(0, Math.ceil((weg - Date.now()) / DAG));
}

/**
 * Wat de leraar verwijderde, dertig dagen lang terug te zetten. Een beheerder ziet hier ook
 * gedeeld materiaal van collega's dat in de prullenbak zit.
 */
export function Prullenbak({
  kijker,
  isBeheerder,
  onTeruggezet,
}: {
  kijker: Eigenaar;
  isBeheerder: boolean;
  /** Er staat weer iets in de bibliotheek: de pagina eromheen haalt haar lijst opnieuw op. */
  onTeruggezet?: () => void;
}) {
  const { data, laden, fout, zet } = useOpgehaald<OefeningKort[]>(
    `prullenbak:${kijker.id ?? kijker.naam}:${isBeheerder}`,
    () => opslag.prullenbak(kijker, isBeheerder)
  );
  const [melding, setMelding] = useState<{ soort: "ok" | "fout"; tekst: string } | null>(null);
  const [bezig, setBezig] = useState("");

  const lijst = data ?? [];

  const zetTerug = async (ex: OefeningKort) => {
    setBezig(ex.id);
    try {
      await opslag.herstelOefening(ex.id);
      zet(lijst.filter((o) => o.id !== ex.id));
      onTeruggezet?.();
      setMelding({
        soort: "ok",
        tekst: `"${ex.title}" staat terug in de bibliotheek. De code ${ex.shareCode} werkt weer.`,
      });
    } catch {
      setMelding({ soort: "fout", tekst: "Terugzetten is niet gelukt. Kijk je verbinding na en probeer opnieuw." });
    } finally {
      setBezig("");
    }
  };

  const wis = async (ex: OefeningKort) => {
    const vraag =
      `"${ex.title}" voorgoed verwijderen?\n\n` +
      `De oefening, de code ${ex.shareCode} en alles wat cursisten instuurden, verdwijnen. ` +
      "Dit kan je niet ongedaan maken.";
    if (!confirm(vraag)) return;
    setBezig(ex.id);
    try {
      await opslag.wisOefening(ex.id);
      zet(lijst.filter((o) => o.id !== ex.id));
      setMelding({ soort: "ok", tekst: `"${ex.title}" is voorgoed verwijderd.` });
    } catch {
      setMelding({ soort: "fout", tekst: "Verwijderen is niet gelukt. Kijk je verbinding na en probeer opnieuw." });
    } finally {
      setBezig("");
    }
  };

  if (laden) return <div className="h-40" aria-hidden />;

  return (
    <section className="space-y-4">
      <p className="text-sm text-slate-600">
        Wat je verwijdert, blijft hier {PRULLENBAK_DAGEN} dagen staan. Zolang kunnen cursisten het
        niet openen, en kan je het terugzetten met dezelfde code.
      </p>

      {melding && (
        <p
          role={melding.soort === "fout" ? "alert" : "status"}
          className={`text-xs font-semibold rounded-xl px-4 py-3 border ${
            melding.soort === "ok"
              ? "text-emerald-800 bg-emerald-50 border-emerald-200"
              : "text-rose-800 bg-rose-50 border-rose-200"
          }`}
        >
          {melding.tekst}
        </p>
      )}

      {fout ? (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          We konden de prullenbak niet laden. Kijk je verbinding na en probeer opnieuw.
        </p>
      ) : lijst.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-10 text-center">
          De prullenbak is leeg.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-white">
          {lijst.map((ex) => {
            const Icon = WERKVORMEN[ex.type].icon;
            const over = dagenOver(ex.verwijderdOp!);
            return (
              <li key={ex.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Icon className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900 truncate">{ex.title}</span>
                  <span className="block text-xs text-slate-600">
                    {WERKVORMEN[ex.type].label}
                    {!isEigenMateriaal(ex, kijker) && ` · van ${ex.creatorName}`} · nog {over}{" "}
                    {over === 1 ? "dag" : "dagen"}
                  </span>
                </span>
                <button
                  onClick={() => zetTerug(ex)}
                  disabled={bezig === ex.id}
                  className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Terugzetten
                </button>
                <button
                  onClick={() => wis(ex)}
                  disabled={bezig === ex.id}
                  className="px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 disabled:opacity-50 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Voorgoed verwijderen
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
