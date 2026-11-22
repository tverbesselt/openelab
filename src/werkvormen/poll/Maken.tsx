"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Veld, Foutmelding } from "@/components/maken/Velden";
import type { VormProps } from "../soorten";

/** Een stemvraag met vaste antwoorden, voor het digibord. */
export default function Maken(p: VormProps) {
  const [vraag, setVraag] = useState("");
  const [opties, setOpties] = useState(["", "", "", ""]);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const ingevuld = opties.map((o) => o.trim()).filter(Boolean);
    if (!vraag.trim() || ingevuld.length < 2) return;

    p.bewaar([
      {
        ...p.basis(),
        id: `poll-${Date.now()}`,
        title: vraag.trim(),
        description: "Live poll om bij de start van de les de voorkennis te peilen.",
        category: "live",
        didacticGoal: "activate",
        type: "poll",
        tags: ["Live", "Voorkennis"],
        content: { pollQuestion: vraag.trim(), pollOptions: ingevuld },
        didacticConfig: {
          showImmediateFeedback: false,
          allowRetryMissed: false,
          enableGamification: false,
        },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Je vraag" hint="Cursisten zien deze vraag op het digibord en stemmen anoniem.">
        <input
          type="text"
          value={vraag}
          onChange={(e) => setVraag(e.target.value)}
          placeholder="Bijvoorbeeld: hoe vaak werk je al met een digitaal dossier?"
          required
          className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </Veld>

      <Veld label="Antwoordmogelijkheden" hint="Vul er minstens twee in. Lege vakjes verdwijnen.">
        <div className="space-y-2">
          {opties.map((optie, index) => (
            <input
              key={index}
              type="text"
              value={optie}
              onChange={(e) => setOpties(opties.map((o, i) => (i === index ? e.target.value : o)))}
              placeholder={`Antwoord ${index + 1}`}
              aria-label={`Antwoord ${index + 1}`}
              className="w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          ))}
        </div>
      </Veld>

      {p.bestemming}

      <Foutmelding tekst={p.fout} />

      <button
        type="submit"
        disabled={p.bezig}
        className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <span>{p.bezig ? "Bezig met bewaren ..." : "Maak mijn poll"}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
