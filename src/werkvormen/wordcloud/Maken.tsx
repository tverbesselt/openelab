"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Veld, Foutmelding } from "@/components/maken/Velden";
import { bestaandVan, knopTekst, type VormProps } from "../soorten";

/** Eén vraag waarop elke cursist één woord typt. */
export default function Maken(p: VormProps) {
  const [wolkVraag, setWolkVraag] = useState(bestaandVan(p, "wordcloud")?.content.wordCloudPrompt ?? "");

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const vraag = wolkVraag.trim();
    if (!vraag) return;

    p.bewaar([
      {
        ...p.basis(),
        id: `wolk-${Date.now()}`,
        title: vraag,
        description: "Cursisten typen elk een woord. Samen vormen ze een wolk op het digibord.",
        category: "live",
        didacticGoal: "activate",
        type: "wordcloud",
        tags: ["Live", "Voorkennis"],
        content: { wordCloudPrompt: vraag },
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
      <Veld
        label="Je vraag"
        hint="Vraag naar één woord. Zo krijg je een wolk in plaats van losse zinnen."
      >
        <input
          type="text"
          value={wolkVraag}
          onChange={(e) => setWolkVraag(e.target.value)}
          placeholder="Bijvoorbeeld: welk woord past bij veilig werken?"
          required
          className="w-full p-3 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
        />
      </Veld>

      <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
        Cursisten typen elk één woord op hun smartphone. Hoe vaker een woord terugkomt, hoe
        groter het op het digibord verschijnt. Je ziet meteen waar de klas staat, zonder dat
        iemand zich voor de groep moet uitspreken.
      </p>

      {p.bestemming}

      <Foutmelding tekst={p.fout} />

      <button
        type="submit"
        disabled={p.bezig}
        className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <span>{p.bezig ? "Bezig met bewaren ..." : knopTekst(p, "Maak mijn woordwolk")}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
