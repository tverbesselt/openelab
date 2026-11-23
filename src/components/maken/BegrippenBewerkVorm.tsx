"use client";

import React, { useState } from "react";
import { leesBegrippen, schrijfBegrippen } from "@/lib/begrippen";
import { begrippenVan, inhoudMetBegrippen, isBegrippenType } from "@/lib/begrippenBewerken";
import type { Exercise } from "@/lib/types";
import { knopTekst, type VormProps } from "@/werkvormen/soorten";
import { Veld, Foutmelding, MaakKnop, Toelichting, INVOER, INVOER_MONO } from "./Velden";
import { TaalKiezer } from "./TaalKiezer";
import { BegrippenVoorbeeld } from "./BegrippenVorm";

/**
 * Flashcards, matching of de woordentrainer aanpassen. Die maak je samen uit één
 * begrippenlijst; aanpassen doe je per werkvorm, met dezelfde lijst als invoer.
 */
export default function BegrippenBewerkVorm(p: VormProps) {
  const bestaand = p.bestaand && isBegrippenType(p.bestaand.type) ? p.bestaand : undefined;
  const [titel, setTitel] = useState(bestaand?.title ?? "");
  const [begrippen, setBegrippen] = useState(() =>
    bestaand ? schrijfBegrippen(begrippenVan(bestaand) ?? []) : ""
  );

  if (!bestaand) return null;

  const bewaar = (e: React.FormEvent) => {
    e.preventDefault();
    const { begrippen: items } = leesBegrippen(begrippen);
    if (items.length === 0) {
      p.setFout(
        "Zet een puntkomma of een tab tussen het begrip en de betekenis. Bijvoorbeeld: maison;het huis"
      );
      return;
    }
    p.setFout("");

    const aangepast = {
      ...bestaand,
      title: titel.trim(),
      content: inhoudMetBegrippen(bestaand as Parameters<typeof inhoudMetBegrippen>[0], items),
      didacticConfig: { ...bestaand.didacticConfig, spraakTaal: p.spraakTaal },
    } as Exercise;
    p.bewaar([aangepast]);
  };

  return (
    <form onSubmit={bewaar} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Titel">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label="Je begrippen"
        hint="Eén per regel: begrip, puntkomma, betekenis. Plakken uit Excel of Word werkt ook, daar staan tabs tussen."
      >
        <textarea
          rows={10}
          value={begrippen}
          onChange={(e) => setBegrippen(e.target.value)}
          required
          className={INVOER_MONO}
        />
      </Veld>

      <Toelichting>
        Een voorbeeldzin of foto bij een begrip blijft staan, zolang je het begrip zelf niet
        verandert. Je past alleen deze werkvorm aan: maakte je flashcards, matching en een quiz
        uit dezelfde lijst, dan pas je die elk apart aan.
      </Toelichting>

      <BegrippenVoorbeeld tekst={begrippen} />

      <TaalKiezer waarde={p.spraakTaal} onWijzig={p.setSpraakTaal} wat="je begrippen" />

      {p.bestemming}

      <Foutmelding tekst={p.fout} />

      <MaakKnop bezig={p.bezig} label={knopTekst(p, "Bewaar")} />
    </form>
  );
}
