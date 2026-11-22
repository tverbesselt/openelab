"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { QuizMedia, Tekenopdracht } from "@/lib/types";
import { FotoKiezer } from "./MediaKiezer";
import type { VormProps } from "./NieuweVormen";
import { Veld, Foutmelding, MaakKnop, Toelichting, INVOER } from "./Velden";

const KLEIN_VELD =
  "w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none";

interface NieuweOpdracht {
  /** Vaste sleutel, zodat een rij verwijderen de foto van de volgende niet verschuift. */
  sleutel: string;
  naam: string;
  beeld?: QuizMedia;
}

let volgnummer = 0;
const legeOpdracht = (): NieuweOpdracht => ({ sleutel: `t${++volgnummer}`, naam: "" });

/**
 * Teken uit je geheugen maken: een reeks afbeeldingen, elk met de naam die de cursist te
 * zien krijgt. De foto is het origineel om achteraf mee te vergelijken; die ziet niemand
 * vóór het tekenen.
 */
export function TekenenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [opdrachten, setOpdrachten] = useState<NieuweOpdracht[]>(() => [legeOpdracht(), legeOpdracht(), legeOpdracht()]);
  const [uploads, setUploads] = useState(0);

  const gevuld = opdrachten.filter((o) => o.naam.trim() && o.beeld?.url);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gevuld.length === 0) {
      p.setFout("Geef minstens één afbeelding een naam en een foto van het origineel.");
      return;
    }
    const half = opdrachten.find((o) => Boolean(o.naam.trim()) !== Boolean(o.beeld?.url));
    if (half) {
      p.setFout(
        `Afbeelding ${opdrachten.indexOf(half) + 1} heeft een naam zonder foto, of omgekeerd. Vul ze aan of verwijder ze.`
      );
      return;
    }

    const klaar: Tekenopdracht[] = gevuld.map((o, i) => ({
      id: `teken-${i + 1}`,
      naam: o.naam.trim(),
      beeld: { soort: "afbeelding", url: o.beeld!.url, alt: o.beeld!.alt?.trim() || o.naam.trim() },
    }));

    p.bewaar([
      {
        ...p.basis(),
        id: `tekenen-${Date.now()}`,
        title: titel.trim(),
        description: "Teken het zoals je het je herinnert. Daarna zie je het origineel.",
        category: "media",
        didacticGoal: "activate",
        type: "tekenen",
        tags: ["Tekenen", "Geheugen"],
        content: { tekenopdrachten: klaar },
        didacticConfig: {
          showImmediateFeedback: true,
          allowRetryMissed: true,
          enableGamification: false,
        },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Waarover gaat het?" hint="Bijvoorbeeld: Vlaggen van Europa, Verkeersborden, Bekende logo's">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je reeks"
          required
          className={INVOER}
        />
      </Veld>

      <div className="space-y-4">
        {opdrachten.map((o, index) => (
          <div key={o.sleutel} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">Afbeelding {index + 1}</span>
              {opdrachten.length > 1 && (
                <button
                  type="button"
                  onClick={() => setOpdrachten(opdrachten.filter((x) => x.sleutel !== o.sleutel))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={`Verwijder afbeelding ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={o.naam}
              onChange={(e) =>
                setOpdrachten((huidig) =>
                  huidig.map((x) => (x.sleutel === o.sleutel ? { ...x, naam: e.target.value } : x))
                )
              }
              maxLength={80}
              placeholder="Wat cursisten te zien krijgen, bijvoorbeeld: Vlag van Zweden"
              aria-label={`Naam van afbeelding ${index + 1}`}
              className={KLEIN_VELD}
            />

            <FotoKiezer
              waarde={o.beeld}
              altNodig={false}
              // Functioneel bijwerken: een upload kan klaar zijn terwijl je al verder typt.
              onWijzig={(beeld) =>
                setOpdrachten((huidig) => huidig.map((x) => (x.sleutel === o.sleutel ? { ...x, beeld } : x)))
              }
              onBezig={(b) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)))}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpdrachten([...opdrachten, legeOpdracht()])}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>Nog een afbeelding</span>
      </button>

      <Toelichting>
        Cursisten zien alleen de naam en tekenen het beeld uit hun geheugen. Het origineel
        verschijnt pas daarna, om te vergelijken. Werkt klassikaal (jij stuurt, iedereen tekent
        tegelijk) en alleen, via de code.{" "}
        {gevuld.length > 0 && (
          <strong>
            {gevuld.length} {gevuld.length === 1 ? "afbeelding klaar" : "afbeeldingen klaar"}.
          </strong>
        )}
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} uploads={uploads} label="Maak mijn tekenreeks" />
    </form>
  );
}
