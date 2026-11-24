"use client";

import { useEffect, useState } from "react";
import { Download, Inbox, Trash2 } from "lucide-react";
import { opslag } from "@/lib/opslag";
import { bestandsnaam, datumTijd, downloadCsv } from "@/lib/csv";
import type { Inzending } from "@/lib/types";
import type { LeraarProps } from "../soorten";

export default function Inzendingen({ oefening }: LeraarProps<"exitticket">) {
  return (
    <InzendingenVanLeraar
      oefeningId={oefening.id}
      titel={oefening.title}
      vragen={oefening.content.exitTicketPrompts}
    />
  );
}

/** Wat cursisten instuurden, alleen zichtbaar voor wie het exit ticket beheert. */
function InzendingenVanLeraar({
  oefeningId,
  titel,
  vragen,
}: {
  oefeningId: string;
  titel: string;
  vragen: string[];
}) {
  const [inzendingen, setInzendingen] = useState<Inzending[] | null>(null);
  const [open, setOpen] = useState(false);
  const [fout, setFout] = useState("");

  useEffect(() => {
    opslag
      .inzendingen(oefeningId)
      .then(setInzendingen)
      .catch(() => setInzendingen([]));
  }, [oefeningId]);

  if (inzendingen === null) return null;

  const download = () =>
    downloadCsv(bestandsnaam(titel, "antwoorden"), [
      ["Ingestuurd op", ...vragen],
      ...inzendingen.map((inz) => [datumTijd(inz.op), ...vragen.map((_, idx) => inz.antwoorden[idx] ?? "")]),
    ]);

  const wis = async () => {
    const vraag =
      `Alle ${inzendingen.length} antwoorden wissen?\n\n` +
      "Handig voor een nieuwe groep. Download ze eerst als je ze wil bewaren: dit kan je niet ongedaan maken.";
    if (!confirm(vraag)) return;
    try {
      await opslag.wisInzendingen(oefeningId);
      setInzendingen([]);
      setOpen(false);
      setFout("");
    } catch {
      setFout("Wissen is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  return (
    <section className="max-w-lg mx-auto border-t border-slate-200 pt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left"
      >
        <Inbox className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-bold text-slate-900 flex-1">
          {inzendingen.length === 0
            ? "Nog geen antwoorden ontvangen"
            : `${inzendingen.length} ${inzendingen.length === 1 ? "antwoord" : "antwoorden"} ontvangen`}
        </span>
        <span className="text-xs font-bold text-merk-900">
          {inzendingen.length > 0 && (open ? "Verberg" : "Bekijk")}
        </span>
      </button>
      <p className="text-xs text-slate-500 mt-1 ml-6">Alleen jij ziet dit. De antwoorden zijn anoniem.</p>

      {inzendingen.length > 0 && (
        <div className="mt-3 ml-6 flex flex-wrap gap-x-4 gap-y-1">
          <button onClick={download} className="text-xs font-bold text-merk-900 hover:underline inline-flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Download voor Excel
          </button>
          <button onClick={wis} className="text-xs font-bold text-slate-600 hover:text-rose-700 inline-flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" />
            Wis alle antwoorden
          </button>
        </div>
      )}

      {fout && (
        <p role="alert" className="mt-3 ml-6 text-xs font-semibold text-rose-800">
          {fout}
        </p>
      )}

      {open && inzendingen.length > 0 && (
        <div className="mt-4 space-y-6">
          {vragen.map((vraag, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                {idx + 1}. {vraag}
              </h3>
              <ul className="space-y-1.5">
                {inzendingen.map((inz) => (
                  <li
                    key={inz.id}
                    className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {inz.antwoorden[idx] || <span className="text-slate-400">(leeg)</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
