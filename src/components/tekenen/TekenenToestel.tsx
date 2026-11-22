"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Send, Timer } from "lucide-react";
import { opslag, apparaatId } from "@/lib/opslag";
import { LiveSessie, TekenToestand } from "@/lib/types";
import { bewaardeNaam, bewaarNaam } from "@/lib/bord";
import {
  MAX_NAAM,
  ingestuurd,
  klok,
  onthoudIngestuurd,
  resterend,
  tekeningAlsData,
  tekeningId,
} from "@/lib/tekenen";
import { TekenBlad } from "@/components/TekenBlad";
import { Vergelijk } from "./Vergelijk";

/**
 * Teken uit je geheugen op het toestel van de cursist. Groot de naam, daaronder het
 * tekenblad, nooit een voorbeeld. Het toestel volgt de leraar: gaat die verder, is de
 * tijd om of toont hij het origineel, dan gaat wat er getekend is vanzelf in.
 */
export function TekenenToestel({ code, sessie }: { code: string; sessie: LiveSessie }) {
  const t = sessie.tekenen as TekenToestand;
  const [naam, setNaam] = useState("");
  const [naamKlaar, setNaamKlaar] = useState(false);
  const [actiefNr, setActiefNr] = useState(t.nr);
  const [leeg, setLeeg] = useState(true);
  const [klaar, setKlaar] = useState<number[]>([]);
  const [eigen, setEigen] = useState<Record<number, string>>({});
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [nu, setNu] = useState(() => Date.now());
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const binnenOp = useRef(Date.now());
  const bezigRef = useRef(false);

  useEffect(() => {
    setNaam(bewaardeNaam().slice(0, MAX_NAAM));
    setKlaar(ingestuurd(code));
  }, [code]);

  const over = actiefNr === t.nr ? resterend(t, nu) : null;
  const tijdOm = over === 0;
  const origineelNu = actiefNr === t.nr && Boolean(t.origineel);
  const ingestuurdNu = klaar.includes(actiefNr);

  useEffect(() => {
    if (!t.seconden || sessie.status !== "actief") return;
    const tik = window.setInterval(() => setNu(Date.now()), 500);
    return () => window.clearInterval(tik);
  }, [t.seconden, t.gestartOp, sessie.status]);

  /** Stuur de tekening voor opdracht nr in. Met data = al vastgelegd, voor het blad wisselde. */
  const stuur = useCallback(
    async (nr: number, data?: string) => {
      if (bezigRef.current) return;
      bezigRef.current = true;
      setBezig(true);
      setFout("");
      try {
        const beeld = data ?? (await tekeningAlsData(canvas.current));
        const begin = Math.max(new Date(t.gestartOp).getTime(), binnenOp.current);
        await opslag.stuurTekening(code, {
          id: tekeningId(apparaatId(), nr),
          apparaat: apparaatId(),
          nr,
          ...(t.namen === "naam" && naam.trim() ? { auteur: naam.trim().slice(0, MAX_NAAM) } : {}),
          beeld,
          seconden: Math.min(86400, Math.max(0, Math.round((Date.now() - begin) / 1000))),
          op: new Date().toISOString(),
        });
        onthoudIngestuurd(code, nr);
        setKlaar((k) => [...new Set([...k, nr])]);
        setEigen((e) => ({ ...e, [nr]: beeld }));
      } catch (e) {
        console.error("Tekening insturen mislukt", e);
        setFout("Je tekening kwam niet aan. Kijk je verbinding na en probeer opnieuw.");
      } finally {
        bezigRef.current = false;
        setBezig(false);
      }
    },
    [code, naam, t.gestartOp, t.namen]
  );

  // De leraar ging naar een andere afbeelding: eerst inleveren wat er staat, dan een nieuw blad.
  useEffect(() => {
    if (t.nr === actiefNr) return;
    const oud = actiefNr;
    // Terug naar een vorige afbeelding: de regels nemen geen tekening aan voor een latere.
    const moetIn = !leeg && !klaar.includes(oud) && t.nr > oud;
    if (!moetIn) {
      setActiefNr(t.nr);
      setLeeg(true);
      return;
    }
    let weg = false;
    tekeningAlsData(canvas.current)
      .then((data) => {
        if (weg) return;
        setActiefNr(t.nr);
        setLeeg(true);
        stuur(oud, data);
      })
      .catch(() => {
        setActiefNr(t.nr);
        setLeeg(true);
      });
    return () => {
      weg = true;
    };
    // Alleen reageren op een andere afbeelding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.nr]);

  // Tijd om of het origineel staat vooraan: wat er getekend is, gaat vanzelf in.
  useEffect(() => {
    if ((tijdOm || origineelNu) && !leeg && !ingestuurdNu && actiefNr === t.nr) stuur(actiefNr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tijdOm, origineelNu]);

  if (sessie.status === "afgesloten") {
    return (
      <div className="max-w-sm mx-auto text-center py-16 u-fade">
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">Klaar met tekenen</h1>
        <p className="text-sm text-slate-600">Bedankt voor het meedoen. Je kan dit scherm sluiten.</p>
      </div>
    );
  }

  if (t.namen === "naam" && !naamKlaar) {
    return (
      <div className="max-w-sm mx-auto py-8 u-fade">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!naam.trim()) return;
            bewaarNaam(naam.trim());
            setNaamKlaar(true);
          }}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
        >
          <div>
            <h1 className="text-xl font-extrabold text-merk-900 mb-1">Teken uit je geheugen</h1>
            <p className="text-sm text-slate-600">Je leraar ziet deze naam bij je tekeningen.</p>
          </div>
          <input
            type="text"
            value={naam}
            onChange={(e) => setNaam(e.target.value.slice(0, MAX_NAAM))}
            placeholder="Je naam of bijnaam"
            autoFocus
            className="w-full px-4 py-3 text-base rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!naam.trim()}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            Doe mee
          </button>
        </form>
      </div>
    );
  }

  const geblokt = tijdOm || origineelNu;
  // Het blad blijft staan tot de tekening binnen is: zo kan een mislukte inzending opnieuw.
  const toonBlad = !ingestuurdNu && !(origineelNu && leeg);

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-4 u-fade">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-merk-800">
          Afbeelding {t.nr + 1} van {t.aantal}
        </p>
        {over !== null && toonBlad && !geblokt && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-800 tabular-nums">
            <Timer className="w-4 h-4" />
            {klok(over)}
          </span>
        )}
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-merk-900 leading-tight break-words">{t.naam}</h1>

      {toonBlad ? (
        <>
          <p className={`text-sm ${geblokt ? "font-bold text-amber-900" : "text-slate-600"}`}>
            {!geblokt
              ? "Teken het zoals jij het je herinnert. Niet opzoeken!"
              : leeg
                ? "De tijd is om. Wacht tot je leraar de volgende afbeelding toont."
                : "Stop met tekenen: je tekening gaat nu naar je leraar."}
          </p>
          <div className={geblokt ? "pointer-events-none opacity-60" : ""} aria-disabled={geblokt}>
            <TekenBlad key={actiefNr} canvasRef={canvas} onLeeg={setLeeg} />
          </div>
          <button
            onClick={() => stuur(actiefNr)}
            disabled={leeg || bezig}
            className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-base transition-colors inline-flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {bezig ? "Bezig met insturen ..." : fout ? "Opnieuw insturen" : "Insturen"}
          </button>
        </>
      ) : origineelNu && t.origineel && eigen[actiefNr] ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <Vergelijk tekening={eigen[actiefNr]} origineel={t.origineel} alt={t.origineelAlt} />
        </div>
      ) : origineelNu && t.origineel ? (
        <figure className="bg-white rounded-2xl border border-slate-200 p-4">
          { }
          <img src={t.origineel} alt={t.origineelAlt ?? ""} className="mx-auto max-h-[50vh] object-contain" />
          <figcaption className="text-center text-xs font-bold text-slate-500 mt-2">Het origineel</figcaption>
        </figure>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
          <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-2" />
          <p className="font-bold text-base text-merk-900">Je tekening is binnen</p>
          <p className="text-sm text-slate-600 mb-4">Kijk naar het scherm vooraan. Je leraar toont straks het origineel.</p>
          {eigen[actiefNr] && (
             
            <img src={eigen[actiefNr]} alt="Jouw tekening" className="mx-auto max-h-56 object-contain rounded-xl border border-slate-200" />
          )}
        </div>
      )}

      {fout && (
        <div role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
          <span>{fout}</span>
        </div>
      )}
    </div>
  );
}
