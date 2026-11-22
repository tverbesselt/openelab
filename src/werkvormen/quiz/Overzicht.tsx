"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { opslag } from "@/lib/opslag";
import type { Quizresultaat } from "@/lib/types";
import { Studietip } from "@/components/Studietip";
import type { LeraarProps } from "../soorten";

/**
 * Voor de leraar: welke vraag ging het vaakst fout. Geaggregeerd over alle cursisten, dus
 * je ziet waar de klas struikelt zonder te weten wie wat deed.
 */
export default function Overzicht({ oefening }: LeraarProps<"quiz" | "lezen">) {
  const [resultaten, setResultaten] = useState<Quizresultaat[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    opslag
      .quizresultaten(oefening.id)
      .then(setResultaten)
      .catch(() => setResultaten([]));
  }, [oefening.id]);

  if (resultaten === null) return null;

  const vragen = oefening.content.questions;
  const totaal = resultaten.length;

  // Per vraag: hoe vaak ging ze fout, over alle ingestuurde rondes heen.
  const perVraag = vragen
    .map((vraag) => ({
      vraag,
      fout: resultaten.filter((r) => r.foutVragen.includes(vraag.id)).length,
    }))
    .sort((a, b) => b.fout - a.fout);

  const moeilijkste = perVraag[0];

  return (
    <section className="max-w-lg mx-auto border-t border-slate-200 pt-6">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left"
      >
        <BarChart3 className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-bold text-slate-900 flex-1">
          {totaal === 0
            ? "Nog niemand maakte deze quiz"
            : `${totaal} ${totaal === 1 ? "keer gemaakt" : "keer gemaakt"}`}
        </span>
        <span className="text-xs font-bold text-merk-900">
          {totaal > 0 && (open ? "Verberg" : "Bekijk")}
        </span>
      </button>

      <p className="text-xs text-slate-500 mt-1 ml-6">
        {totaal === 0
          ? "Zodra cursisten de quiz maken, zie je hier welke vraag het vaakst fout gaat."
          : moeilijkste && moeilijkste.fout > 0
            ? `Struikelvraag: "${moeilijkste.vraag.question}"`
            : "Alle vragen gingen tot nu toe juist."}
      </p>

      {moeilijkste && moeilijkste.fout > 0 && (
        <Studietip
          className="mt-3"
          voor="leraar"
          tekst={
            <>
              Neem deze vraag volgende week nog eens op in{" "}
              <Link href="/opfrissen" className="font-bold hover:underline">
                Opfrissen
              </Link>
              . Eén herhaling later doet meer dan nu opnieuw uitleggen.
            </>
          }
        />
      )}

      {open && totaal > 0 && (
        <ul className="mt-4 space-y-3">
          {perVraag.map(({ vraag, fout }) => {
            const pct = Math.round((fout / totaal) * 100);
            return (
              <li key={vraag.id}>
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-sm text-slate-800 min-w-0">{vraag.question}</span>
                  <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">
                    {fout} van {totaal} fout
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 50 ? "bg-rose-400" : pct > 0 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
