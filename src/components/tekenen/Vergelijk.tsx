"use client";

import React, { useState } from "react";
import { Columns2, Layers } from "lucide-react";

/**
 * Een tekening uit het geheugen naast het echte beeld, of erover gelegd. Over elkaar
 * zie je meteen wat klopte en wat niet; met de schuifregelaar kies je hoeveel van de
 * tekening je ziet.
 */
export function Vergelijk({
  tekening,
  origineel,
  alt,
  groot = false,
}: {
  tekening: string;
  origineel: string;
  alt?: string;
  groot?: boolean;
}) {
  const [modus, setModus] = useState<"naast" | "over">("naast");
  const [dekking, setDekking] = useState(60);

  const knop = (actief: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
      actief
        ? "bg-merk-800 border-merk-800 text-white"
        : "bg-white border-slate-200 text-slate-700 hover:border-merk"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setModus("naast")} aria-pressed={modus === "naast"} className={knop(modus === "naast")}>
          <Columns2 className="w-3.5 h-3.5" />
          Naast elkaar
        </button>
        <button type="button" onClick={() => setModus("over")} aria-pressed={modus === "over"} className={knop(modus === "over")}>
          <Layers className="w-3.5 h-3.5" />
          Over elkaar
        </button>
        {modus === "over" && (
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600 ml-auto">
            Origineel
            <input
              type="range"
              min={0}
              max={100}
              value={dekking}
              onChange={(e) => setDekking(Number(e.target.value))}
              aria-label="Hoeveel van de tekening je ziet"
              className="w-28 accent-merk-800"
            />
            Tekening
          </label>
        )}
      </div>

      {modus === "naast" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Vak label="Uit het geheugen" groot={groot}>
            { }
            <img src={tekening} alt="De tekening uit het geheugen" className="w-full h-full object-contain" />
          </Vak>
          <Vak label="Het origineel" groot={groot}>
            { }
            <img src={origineel} alt={alt || "Het origineel"} className="w-full h-full object-contain" />
          </Vak>
        </div>
      ) : (
        <Vak label="Tekening over het origineel" groot={groot}>
          <div className="relative w-full h-full">
            { }
            <img src={origineel} alt={alt || "Het origineel"} className="absolute inset-0 w-full h-full object-contain" />
            { }
            <img
              src={tekening}
              alt="De tekening uit het geheugen"
              className="absolute inset-0 w-full h-full object-contain mix-blend-multiply"
              style={{ opacity: dekking / 100 }}
            />
          </div>
        </Vak>
      )}
    </div>
  );
}

function Vak({ label, groot, children }: { label: string; groot: boolean; children: React.ReactNode }) {
  return (
    <figure className="bg-white rounded-xl border border-slate-200 p-2">
      <div className={`aspect-[4/3] w-full ${groot ? "max-h-[60vh]" : ""}`}>{children}</div>
      <figcaption className="text-xs font-bold text-slate-500 text-center mt-1.5">{label}</figcaption>
    </figure>
  );
}
