"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { opslag } from "@/lib/opslag";
import type { Inzending } from "@/lib/types";
import type { LeraarProps } from "../soorten";

export default function Inzendingen({ oefening }: LeraarProps<"exitticket">) {
  return (
    <InzendingenVanLeraar oefeningId={oefening.id} vragen={oefening.content.exitTicketPrompts} />
  );
}

/** Wat cursisten instuurden, alleen zichtbaar voor de leraar die het exit ticket maakte. */
function InzendingenVanLeraar({ oefeningId, vragen }: { oefeningId: string; vragen: string[] }) {
  const [inzendingen, setInzendingen] = useState<Inzending[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    opslag
      .inzendingen(oefeningId)
      .then(setInzendingen)
      .catch(() => setInzendingen([]));
  }, [oefeningId]);

  if (inzendingen === null) return null;

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
