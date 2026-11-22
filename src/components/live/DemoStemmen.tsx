"use client";

import React, { useState } from "react";
import { opslag } from "@/lib/opslag";
import type { LiveAntwoord, LiveSessie } from "@/lib/types";

/** In demomodus: antwoorden nabootsen zonder tweede toestel. */
export function DemoStemmen({ sessie }: { sessie: LiveSessie }) {
  const [woord, setWoord] = useState("");

  const stuur = (antwoord: Partial<LiveAntwoord>) =>
    opslag
      .stuurAntwoord(sessie.code, {
        apparaat: `demo-${Math.random().toString(36).slice(2, 8)}`,
        op: new Date().toISOString(),
        ...antwoord,
      })
      .catch(() => {});

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
      <span className="text-xs font-bold text-slate-500 block">Demo: simuleer antwoorden van cursisten</span>
      {sessie.type === "wordcloud" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (woord.trim()) stuur({ woord: woord.trim() });
            setWoord("");
          }}
          className="flex gap-2 justify-center"
        >
          <input
            value={woord}
            onChange={(e) => setWoord(e.target.value)}
            placeholder="Een woord"
            className="px-3 py-1.5 text-sm rounded-xl bg-slate-50 border border-slate-200"
          />
          <button className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs">
            Stuur
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap justify-center gap-2">
          {sessie.opties.map((optie, idx) => (
            <button
              key={idx}
              onClick={() => stuur({ optie: idx })}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-merk-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              + {optie}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
