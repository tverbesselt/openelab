"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { generateExercisesFromWordList } from "@/lib/didacticEngine";
import { leesBegrippen } from "@/lib/begrippen";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import type { VormProps } from "@/werkvormen/soorten";
import { Veld, Foutmelding } from "./Velden";
import { TaalKiezer } from "./TaalKiezer";

/**
 * Eén lijst van begrippen wordt drie werkvormen tegelijk: flashcards, matching en een quiz.
 * Een werkvorm die in Beheer uit staat, maken we niet mee.
 */
export default function BegrippenVorm(p: VormProps) {
  const { isAan } = useInstellingen();
  const [titel, setTitel] = useState("");
  const [begrippen, setBegrippen] = useState("");

  const maakUitBegrippen = (e: React.FormEvent) => {
    e.preventDefault();
    const { begrippen: items } = leesBegrippen(begrippen);

    if (items.length === 0) {
      p.setFout(
        "Zet een puntkomma of een tab tussen het begrip en de betekenis. Bijvoorbeeld: maison;het huis"
      );
      return;
    }

    const maker = p.basis();
    const { flashcardExercise, matchingExercise, quizExercise } = generateExercisesFromWordList(
      titel.trim(),
      items,
      {
        creatorName: maker.creatorName,
        creatorId: maker.creatorId,
        zichtbaarheid: maker.visibility,
        spraakTaal: p.spraakTaal,
      }
    );
    p.bewaar([flashcardExercise, matchingExercise, quizExercise].filter((ex) => isAan(ex.type)));
  };

  return (
    <form
      onSubmit={maakUitBegrippen}
      className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5"
    >
      <Veld label="Waarover gaat het?" hint="Bijvoorbeeld: Frans — woordenschat in de keuken">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </Veld>

      <Veld
        label="Je begrippen"
        hint="Eén per regel: begrip, puntkomma, betekenis. Plakken uit Excel of Word werkt ook, daar staan tabs tussen."
      >
        <textarea
          rows={7}
          value={begrippen}
          onChange={(e) => setBegrippen(e.target.value)}
          placeholder={"maison;het huis\nvoiture;de auto\ntable;de tafel"}
          required
          className="w-full p-3 font-mono text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </Veld>

      <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
        Hieruit maken we automatisch <strong>flashcards</strong>, <strong>matching</strong> en
        een <strong>quiz</strong>. Zo kiest elke cursist de manier die het best werkt.{" "}
        <strong>Ongeveer twintig begrippen per lijst</strong> werkt het best: genoeg om te
        spreiden, niet te veel voor één beurt.
      </p>

      <BegrippenVoorbeeld tekst={begrippen} />

      <TaalKiezer waarde={p.spraakTaal} onWijzig={p.setSpraakTaal} wat="je begrippen" />

      {p.bestemming}

      <Foutmelding tekst={p.fout} />

      <button
        type="submit"
        disabled={p.bezig}
        className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <span>{p.bezig ? "Bezig met bewaren ..." : "Maak mijn werkvormen"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

/**
 * Controlestap bij een begrippenlijst: wat las Open E-lab in, en wat viel weg? Wie uit Excel
 * plakt, ziet zo meteen of de kolommen goed uit elkaar gehaald zijn.
 */
export function BegrippenVoorbeeld({ tekst }: { tekst: string }) {
  const { begrippen, overgeslagen } = leesBegrippen(tekst);
  if (begrippen.length === 0 && overgeslagen.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2">
      <p className="text-sm font-bold text-slate-800">Dit lazen we in je lijst</p>

      {begrippen.length === 0 ? (
        <p className="text-xs text-amber-800">
          Nog geen enkele regel heeft een scheiding tussen het begrip en de betekenis.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {begrippen.slice(0, 4).map((begrip, index) => (
            <li key={index} className="flex items-baseline gap-3 py-1.5 text-sm">
              <span className="font-bold text-slate-900">{begrip.word}</span>
              <span className="text-slate-500">=</span>
              <span className="text-slate-700 min-w-0 truncate">{begrip.translation}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        {begrippen.length} {begrippen.length === 1 ? "begrip klaar" : "begrippen klaar"}
        {begrippen.length > 4 && ", de eerste 4 staan hierboven"}
        {overgeslagen.length > 0 &&
          `. ${overgeslagen.length} ${overgeslagen.length === 1 ? "regel valt" : "regels vallen"} weg: daar staat geen scheiding in`}
        .
      </p>
    </div>
  );
}
