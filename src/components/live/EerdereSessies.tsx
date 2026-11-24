"use client";

import React, { useState } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { opslag } from "@/lib/opslag";
import { useOpgehaald } from "@/lib/opgehaald";
import { bestandsnaam, datumTijd, downloadCsv } from "@/lib/csv";
import type { LiveSessie, LiveType, WedstrijdSpeler } from "@/lib/types";

const SOORT: Record<LiveType, string> = {
  poll: "Live poll",
  wordcloud: "Woordwolk",
  snellevraag: "Snelle vraag",
  begripsmeter: "Begripsmeter",
  quiz: "Quizwedstrijd",
  bord: "Whiteboard",
  tekenen: "Teken uit je geheugen",
};

/** De spelers van een wedstrijd, één keer opgehaald via de luisteraar van het bord. */
function haalSpelers(code: string): Promise<WedstrijdSpeler[]> {
  return new Promise((klaar) => {
    let stop = () => {};
    let gedaan = false;
    stop = opslag.volgSpelers(code, (spelers) => {
      if (gedaan) return;
      gedaan = true;
      // De luisteraar kan antwoorden voor `stop` gezet is: stop daarom een tel later.
      setTimeout(() => stop(), 0);
      klaar(spelers);
    });
  });
}

/**
 * De eerdere sessies van deze leraar: om het resultaat opnieuw te tonen, te bewaren of weg
 * te halen. Een sessie blijft staan tot de leraar ze weghaalt.
 */
export function EerdereSessies({
  hostId,
  onOpen,
}: {
  hostId: string;
  /** Toon het bord van deze sessie opnieuw. */
  onOpen: (sessie: LiveSessie) => void;
}) {
  const { data, zet } = useOpgehaald<LiveSessie[]>(`sessies:${hostId}`, () => opslag.eigenSessies(hostId));
  const [fout, setFout] = useState("");
  const [alles, setAlles] = useState(false);

  const sessies = data ?? [];
  if (sessies.length === 0) return null;
  const getoond = alles ? sessies : sessies.slice(0, 5);

  const downloadEindstand = async (sessie: LiveSessie) => {
    try {
      const spelers = await haalSpelers(sessie.code);
      const metTeams = spelers.some((s) => typeof s.team === "number");
      downloadCsv(bestandsnaam(sessie.titel, "eindstand"), [
        [sessie.titel],
        [datumTijd(sessie.gestartOp)],
        [],
        ["Plaats", "Bijnaam", ...(metTeams ? ["Team"] : []), "Punten"],
        ...[...spelers]
          .sort((a, b) => (b.punten ?? 0) - (a.punten ?? 0))
          .map((s, i) => [
            s.plaats ?? i + 1,
            s.bijnaam,
            ...(metTeams ? [typeof s.team === "number" ? s.team + 1 : ""] : []),
            s.punten ?? 0,
          ]),
      ]);
      setFout("");
    } catch {
      setFout("De eindstand ophalen is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  const wis = async (sessie: LiveSessie) => {
    if (!confirm(`"${sessie.vraag || sessie.titel}" weghalen? Wat cursisten instuurden, verdwijnt mee.`)) return;
    try {
      await opslag.wisSessie(sessie.code);
      zet(sessies.filter((s) => s.code !== sessie.code));
      setFout("");
    } catch {
      setFout("Weghalen is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-1">
        Eerdere sessies
      </h2>
      <p className="text-xs text-slate-500 mb-3">
        Toon het resultaat opnieuw of bewaar het. Haal weg wat je niet meer nodig hebt: dan
        verdwijnt ook wat cursisten instuurden.
      </p>

      {fout && (
        <p role="alert" className="mb-3 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      <ul className="divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-white">
        {getoond.map((sessie) => {
          return (
            <li key={sessie.code} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 truncate">
                  {sessie.vraag || sessie.titel}
                </span>
                <span className="block text-xs text-slate-600">
                  {SOORT[sessie.type]} · {datumTijd(sessie.gestartOp)}
                  {sessie.status === "actief" && " · loopt nog"}
                </span>
              </span>

              {sessie.type === "quiz" ? (
                <button
                  onClick={() => downloadEindstand(sessie)}
                  className="px-3 py-2 rounded-xl text-merk-900 border border-merk/40 hover:bg-merk-50 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Eindstand
                </button>
              ) : (
                <button
                  onClick={() => onOpen(sessie)}
                  className="px-3 py-2 rounded-xl text-merk-900 border border-merk/40 hover:bg-merk-50 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Toon opnieuw
                </button>
              )}
              <button
                onClick={() => wis(sessie)}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                title="Sessie weghalen"
                aria-label={`${sessie.vraag || sessie.titel} weghalen`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {sessies.length > 5 && !alles && (
        <button onClick={() => setAlles(true)} className="mt-3 text-xs font-bold text-merk-900 hover:underline">
          Toon alle {sessies.length}
        </button>
      )}
    </section>
  );
}
