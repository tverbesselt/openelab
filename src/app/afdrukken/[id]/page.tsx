"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { opslag } from "@/lib/opslag";
import { Exercise } from "@/lib/types";
import { WERKVORMEN } from "@/lib/labels";
import { WerkvormAfdruk } from "@/werkvormen/Weergave";
import { Lijn } from "@/werkvormen/gedeeld/afdruk";
import { CornellBlad } from "@/components/CornellBlad";
import { FunctiePoort } from "@/components/FunctiePoort";
import { GeenVerbinding, Melding } from "@/components/Melding";

/*
 * Afdrukbare versie van een oefening.
 *
 * Niet elke cursist heeft een smartphone bij zich, en sommigen oefenen liever op papier.
 * Dat is geen tweederangs oplossing maar een tweede weg naar dezelfde inhoud (UDL).
 *
 * Opmaak volgens een heldere schrijfstijl: links uitgelijnd, geen cursief,
 * en invullen op lijntjes in plaats van puntjes.
 *
 * Het werkblad zelf komt van de werkvorm (Afdruk in src/werkvormen); deze pagina zet er
 * de kop, de keuze met of zonder antwoorden en de voettekst rond.
 */

function AfdrukkenPaginaInhoud() {
  const params = useParams();
  const id = params.id as string;

  const [oefening, setOefening] = useState<Exercise | null>(null);
  const [toestand, setToestand] = useState<"laden" | "klaar" | "weg" | "fout">("laden");
  const [metAntwoorden, setMetAntwoorden] = useState(false);
  // Een leeg notitieblad met de titel van deze oefening als lesonderwerp.
  const [cornell, setCornell] = useState(false);

  useEffect(() => {
    opslag
      .oefening(id)
      .then((gevonden) => {
        setOefening(gevonden);
        setToestand(gevonden ? "klaar" : "weg");
      })
      .catch(() => setToestand("fout"));
  }, [id]);

  if (toestand === "laden") return <div className="h-64" aria-hidden />;

  if (toestand === "fout") return <GeenVerbinding terug={{ href: "/bibliotheek", label: "Naar de bibliotheek" }} />;

  if (!oefening) {
    return (
      <Melding titel="Deze oefening bestaat niet" terug={{ href: "/bibliotheek", label: "Naar de bibliotheek" }}>
        Misschien werd ze verwijderd. Er is dus niets om af te drukken.
      </Melding>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Bediening; verdwijnt op papier */}
      <div className="niet-afdrukken flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <Link
          href={`/oefen/${oefening.id}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar de oefening</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => {
                setMetAntwoorden(false);
                setCornell(false);
              }}
              aria-pressed={!metAntwoorden && !cornell}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                !metAntwoorden && !cornell ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
              }`}
            >
              Werkblad
            </button>
            <button
              onClick={() => {
                setMetAntwoorden(true);
                setCornell(false);
              }}
              aria-pressed={metAntwoorden && !cornell}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                metAntwoorden && !cornell ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
              }`}
            >
              Met antwoorden
            </button>
            <button
              onClick={() => setCornell(true)}
              aria-pressed={cornell}
              title="Leeg notitieblad in twee kolommen, om jezelf later mee te testen"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                cornell ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
              }`}
            >
              Notitieblad
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Afdrukken</span>
          </button>
        </div>
      </div>

      <p className="niet-afdrukken text-xs text-slate-500 mb-6">
        Kies in het afdrukvenster staand papier en schaal 100%.{" "}
        {cornell
          ? "Het notitieblad heeft rechts plaats voor notities en links voor kernwoorden en vragen. Dek later de rechterkolom af en test jezelf."
          : "Het werkblad is opgemaakt volgens de schrijfwijzer: links uitgelijnd, geen cursief, invullen op lijntjes."}
      </p>

      {cornell && <CornellBlad titel={oefening.title} />}

      {/* Het blad zelf */}
      {!cornell && (
      <article className="bg-white text-black p-8 sm:p-10 rounded-2xl border border-slate-200 print:border-0 print:p-0 print:rounded-none leading-relaxed">
        <header className="mb-8 pb-4 border-b border-black">
          <p className="text-sm font-bold">de organisatie</p>
          <h1 className="text-2xl font-extrabold mt-1">{oefening.title}</h1>
          <p className="text-sm mt-1">
            {WERKVORMEN[oefening.type].label}
            {metAntwoorden && " — met antwoorden, alleen voor de leraar"}
          </p>
          {!metAntwoorden && (
            <p className="text-sm mt-4">
              Naam: <Lijn breedte="14rem" /> Datum: <Lijn breedte="8rem" />
            </p>
          )}
        </header>

        <WerkvormAfdruk oefening={oefening} metAntwoorden={metAntwoorden} />

        <footer className="mt-10 pt-3 border-t border-black text-xs">
          Open E-lab — de organisatie. Online oefenen met code {oefening.shareCode}.
        </footer>
      </article>
      )}
    </div>
  );
}

export default function AfdrukkenPagina() {
  return (
    <FunctiePoort functie="afdrukken">
      <AfdrukkenPaginaInhoud />
    </FunctiePoort>
  );
}
