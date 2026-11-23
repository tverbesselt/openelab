"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { gatenVan, heeftGat, ontleedInvulzin } from "@/lib/invulzin";
import type { FillBlankItem } from "@/lib/types";
import { Veld, Foutmelding } from "@/components/maken/Velden";
import { InleesKnop } from "@/components/maken/InleesKnop";
import { TaalKiezer } from "@/components/maken/TaalKiezer";
import { bestaandVan, knopTekst, type VormProps } from "../soorten";

/** Zinnen met een weggelaten woord, tussen dubbele haken getypt. */
export default function Maken(p: VormProps) {
  const bestaand = bestaandVan(p, "fillblank");
  const [titel, setTitel] = useState(bestaand?.title ?? "");
  const [zinnen, setZinnen] = useState(
    () => bestaand?.content.fillBlanks.map((f) => f.textWithBlanks).join("\n") ?? ""
  );

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const bruikbaar = zinnen
      .split("\n")
      .map((zin) => zin.trim())
      .filter((zin) => zin && heeftGat(zin));

    if (bruikbaar.length === 0) {
      p.setFout(
        "Zet het weggelaten woord tussen dubbele haken. Bijvoorbeeld: De hoofdstad van Belgie is [[Brussel]]."
      );
      return;
    }

    const fillBlanks: FillBlankItem[] = bruikbaar.map((zin, index) => ({
      id: `fb-${index}`,
      textWithBlanks: zin,
      // Het eerste antwoord per gat; de speler leest de rest uit de zin zelf.
      answers: gatenVan(zin).map((gat) => gat.antwoorden[0]),
    }));

    p.bewaar([
      {
        ...p.basis(),
        id: `invul-${Date.now()}`,
        title: titel.trim(),
        description: "Vul de ontbrekende woorden aan in de zin.",
        category: "practice",
        didacticGoal: "automate",
        type: "fillblank",
        tags: ["Invuloefening"],
        content: { fillBlanks },
        didacticConfig: {
          showImmediateFeedback: true,
          allowRetryMissed: true,
          enableGamification: false,
          spraakTaal: p.spraakTaal,
        },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Waarover gaat het?" hint="Bijvoorbeeld: Nederlands — werkwoorden in de zin">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </Veld>

      <Veld label="Je zinnen" hint="Eén zin per regel. Zet het weggelaten woord tussen dubbele haken.">
        <textarea
          rows={7}
          value={zinnen}
          onChange={(e) => setZinnen(e.target.value)}
          placeholder={"Ik [[ga]] elke dag naar het werk.\nZij [[woont]] in Antwerpen.\nGisteren [[heb]] ik gekookt."}
          required
          className="w-full p-3 font-mono text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </Veld>

      <InleesKnop taal={p.spraakTaal} huidig={zinnen} onTekst={setZinnen} zinPerRegel />

      <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
        Meerdere goede antwoorden? Zet ze achter elkaar met een rechte streep:{" "}
        <span className="font-mono">Ik [[ga|loop]] naar de winkel.</span> Eén zin mag ook
        meerdere gaten hebben.
      </p>

      <InvulVoorbeeld zinnen={zinnen} />

      <TaalKiezer waarde={p.spraakTaal} onWijzig={p.setSpraakTaal} wat="je zinnen" />

      {p.bestemming}

      <Foutmelding tekst={p.fout} />

      <button
        type="submit"
        disabled={p.bezig}
        className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <span>{p.bezig ? "Bezig met bewaren ..." : knopTekst(p, "Maak mijn invuloefening")}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

/**
 * Toont wat Open E-lab van de zinnen begrijpt, voor de leraar op bewaren klikt. Een gat dat
 * je vergat aan te duiden, zie je zo meteen.
 */
function InvulVoorbeeld({ zinnen }: { zinnen: string }) {
  const regels = zinnen
    .split("\n")
    .map((zin) => zin.trim())
    .filter(Boolean);

  if (regels.length === 0) return null;

  const bruikbaar = regels.filter(heeftGat);
  const zonderGat = regels.length - bruikbaar.length;

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2">
      <p className="text-sm font-bold text-slate-800">Zo krijgen je cursisten het te zien</p>

      {bruikbaar.length === 0 ? (
        <p className="text-xs text-amber-800">
          Nog geen enkele zin heeft een woord tussen dubbele haken staan.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {bruikbaar.slice(0, 4).map((zin, index) => (
            <li key={index} className="text-sm text-slate-700 leading-relaxed">
              {ontleedInvulzin(zin).map((stuk, i) =>
                stuk.soort === "tekst" ? (
                  <span key={i}>{stuk.waarde}</span>
                ) : (
                  <span
                    key={i}
                    className="inline-block mx-1 px-3 py-0.5 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs align-middle"
                  >
                    {stuk.antwoorden.length > 1
                      ? `${stuk.antwoorden.length} goede antwoorden`
                      : "in te vullen"}
                  </span>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        {bruikbaar.length} {bruikbaar.length === 1 ? "zin klaar" : "zinnen klaar"}
        {bruikbaar.length > 4 && `, de eerste 4 staan hierboven`}
        {zonderGat > 0 &&
          `. ${zonderGat} ${zonderGat === 1 ? "regel heeft" : "regels hebben"} geen dubbele haken en ${zonderGat === 1 ? "valt" : "vallen"} weg`}
        .
      </p>
    </div>
  );
}
