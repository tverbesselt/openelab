"use client";

import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { opslag } from "@/lib/opslag";
import type { SpelerProps } from "../soorten";

/* Exit ticket: de cursist vult in, de leraar ontvangt. */

export default function Speler({ oefening }: SpelerProps<"exitticket">) {
  return <ExitTicket oefeningId={oefening.id} vragen={oefening.content.exitTicketPrompts} />;
}

function ExitTicket({ oefeningId, vragen }: { oefeningId: string; vragen: string[] }) {
  const [antwoorden, setAntwoorden] = useState<string[]>(() => vragen.map(() => ""));
  const [toestand, setToestand] = useState<"invullen" | "bezig" | "verstuurd" | "fout">("invullen");

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    setToestand("bezig");
    try {
      await opslag.stuurInzending(
        oefeningId,
        antwoorden.map((a) => a.trim().slice(0, 1000))
      );
      setToestand("verstuurd");
    } catch {
      setToestand("fout");
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-slate-200 u-pop">
      <h2 className="text-lg font-extrabold text-merk-900 mb-1">Nog even terugblikken</h2>
      <p className="text-sm text-slate-600 mb-5">
        Je antwoorden gaan anoniem naar je leraar. Er staan geen punten op.
      </p>

      {toestand === "verstuurd" ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-2" />
          <p className="font-bold text-base text-merk-900">Bedankt</p>
          <p className="text-sm text-slate-600">Je leraar ontvangt je antwoorden.</p>
        </div>
      ) : (
        <form onSubmit={verstuur} className="space-y-4">
          {vragen.map((p, idx) => (
            <label key={idx} className="block">
              <span className="block text-sm font-bold text-slate-800 mb-1.5">
                {idx + 1}. {p}
              </span>
              <textarea
                rows={2}
                required
                maxLength={1000}
                value={antwoorden[idx]}
                onChange={(e) =>
                  setAntwoorden(antwoorden.map((a, i) => (i === idx ? e.target.value : a)))
                }
                placeholder="Jouw antwoord"
                className="w-full p-3 text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-merk focus:outline-none"
              />
            </label>
          ))}

          {toestand === "fout" && (
            <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              Versturen is niet gelukt. Kijk je verbinding na en probeer opnieuw.
            </p>
          )}

          <button
            type="submit"
            disabled={toestand === "bezig"}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors"
          >
            {toestand === "bezig" ? "Bezig met versturen ..." : "Verstuur naar je leraar"}
          </button>
        </form>
      )}
    </div>
  );
}
