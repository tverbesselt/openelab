"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { firebaseConfigured } from "@/lib/firebase/client";
import { GEEN_MICROFOON, schrijfUit } from "@/lib/inlezen";
import { INVOER } from "./Velden";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";

/*
 * Een tekst inlezen in plaats van typen. De opname gaat via /api/inlezen naar Whisper en
 * komt als tekst terug. Die tekst belandt eerst in een voorbeeldvak: de leraar leest hem
 * na voor hij in de oefening komt, want spraakherkenning maakt fouten.
 */

/** Langer dan dit wordt een tekst te lang om in één keer na te lezen. */
const MAX_SECONDEN = 10 * 60;

type Stand =
  | { soort: "rust" }
  | { soort: "opnemen"; seconden: number }
  | { soort: "uitschrijven" }
  | { soort: "voorbeeld"; tekst: string }
  | { soort: "fout"; melding: string };

/** Zet een doorlopende tekst om naar één zin per regel. */
function perZin(tekst: string): string {
  return tekst
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9"'«(¿¡])/u)
    .map((z) => z.trim())
    .filter(Boolean)
    .join("\n");
}

function tijd(seconden: number): string {
  const m = Math.floor(seconden / 60);
  const s = seconden % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function InleesKnop({
  taal,
  huidig,
  onTekst,
  zinPerRegel = false,
}: {
  /** Taal van de opname, bv. nl-BE; helpt Whisper. */
  taal: string;
  /** Wat er nu al in het veld staat: bepaalt of we "toevoegen" aanbieden. */
  huidig: string;
  onTekst: (tekst: string) => void;
  /** Voor velden met één zin per regel. */
  zinPerRegel?: boolean;
}) {
  const { isAan } = useInstellingen();
  const [stand, setStand] = useState<Stand>({ soort: "rust" });
  const recorder = useRef<MediaRecorder | null>(null);
  const stukken = useRef<Blob[]>([]);
  const klok = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopKlok = () => {
    if (klok.current) clearInterval(klok.current);
    klok.current = null;
  };

  // Weg van de pagina tijdens het opnemen: microfoon los en klok stil.
  useEffect(
    () => () => {
      stopKlok();
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
    },
    []
  );

  // Pas na het laden bekijken, anders verschilt de serverversie van die in de browser.
  const [opnemenKan, setOpnemenKan] = useState(false);
  useEffect(() => {
    setOpnemenKan(typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  if (!firebaseConfigured || !opnemenKan || !isAan("inlezen")) return null;

  const uitschrijven = async (opname: Blob) => {
    setStand({ soort: "uitschrijven" });
    try {
      const tekst = await schrijfUit(opname, taal);
      if (!tekst) throw new Error("Er was niets te verstaan in de opname. Probeer het opnieuw.");
      setStand({ soort: "voorbeeld", tekst: zinPerRegel ? perZin(tekst) : tekst });
    } catch (e) {
      setStand({ soort: "fout", melding: (e as Error).message || "Het uitschrijven lukte niet." });
    }
  };

  const start = async () => {
    let stroom: MediaStream;
    try {
      stroom = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStand({ soort: "fout", melding: GEEN_MICROFOON });
      return;
    }

    const opnemer = new MediaRecorder(stroom);
    stukken.current = [];
    opnemer.ondataavailable = (e) => {
      if (e.data.size > 0) stukken.current.push(e.data);
    };
    opnemer.onstop = () => {
      stopKlok();
      stroom.getTracks().forEach((t) => t.stop());
      const opname = new Blob(stukken.current, { type: opnemer.mimeType || "audio/webm" });
      void uitschrijven(opname);
    };
    recorder.current = opnemer;
    opnemer.start();

    setStand({ soort: "opnemen", seconden: 0 });
    const begin = Date.now();
    klok.current = setInterval(() => {
      const seconden = Math.floor((Date.now() - begin) / 1000);
      if (seconden >= MAX_SECONDEN) {
        stop();
        return;
      }
      setStand({ soort: "opnemen", seconden });
    }, 500);
  };

  const stop = () => {
    stopKlok();
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const gebruik = (tekst: string, toevoegen: boolean) => {
    const schoon = tekst.trim();
    if (toevoegen && huidig.trim()) {
      onTekst(`${huidig.replace(/\s+$/, "")}${zinPerRegel ? "\n" : "\n\n"}${schoon}`);
    } else {
      onTekst(schoon);
    }
    setStand({ soort: "rust" });
  };

  if (stand.soort === "voorbeeld") {
    return (
      <div className="rounded-xl border border-merk-800 bg-merk-50 p-3 space-y-2">
        <p className="text-xs font-bold text-slate-800">
          Dit verstond Open E-lab. Lees het na en verbeter waar nodig.
        </p>
        <textarea
          rows={6}
          value={stand.tekst}
          onChange={(e) => setStand({ soort: "voorbeeld", tekst: e.target.value })}
          aria-label="Uitgeschreven tekst"
          className={INVOER}
        />
        <div className="flex flex-wrap gap-2">
          {huidig.trim() ? (
            <>
              <button
                type="button"
                onClick={() => gebruik(stand.tekst, true)}
                className="px-3 py-2 rounded-lg bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold"
              >
                Achteraan toevoegen
              </button>
              <button
                type="button"
                onClick={() => gebruik(stand.tekst, false)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-merk text-slate-800 text-xs font-bold"
              >
                Vervang wat er staat
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => gebruik(stand.tekst, false)}
              className="px-3 py-2 rounded-lg bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold"
            >
              Gebruiken
            </button>
          )}
          <button
            type="button"
            onClick={() => setStand({ soort: "rust" })}
            className="px-3 py-2 rounded-lg text-slate-600 hover:text-rose-700 text-xs font-bold"
          >
            Weggooien
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stand.soort === "opnemen" ? (
        <button
          type="button"
          onClick={stop}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold"
        >
          <Square className="w-3.5 h-3.5" aria-hidden />
          <span>Stop ({tijd(stand.seconden)})</span>
        </button>
      ) : stand.soort === "uitschrijven" ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          Bezig met uitschrijven ...
        </span>
      ) : (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:border-merk hover:text-merk-900 text-slate-700 text-xs font-bold transition-colors"
        >
          <Mic className="w-3.5 h-3.5" aria-hidden />
          <span>Inlezen</span>
        </button>
      )}
      {stand.soort === "opnemen" && (
        <span className="text-xs text-slate-500">Lees rustig voor. Leestekens hoef je niet uit te spreken.</span>
      )}
      {stand.soort === "rust" && (
        <span className="text-xs text-slate-500">Spreek je tekst in, Open E-lab schrijft hem uit.</span>
      )}
      {stand.soort === "fout" && (
        <span role="alert" className="text-xs font-semibold text-rose-800">
          {stand.melding}
        </span>
      )}
    </div>
  );
}
