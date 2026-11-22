"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Expand,
  Eye,
  EyeOff,
  Images,
  Printer,
  QrCode,
  Shrink,
  Square,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { opslag, opslagGedeeld } from "@/lib/opslag";
import { LiveSessie, OefeningVan, TekenToestand, Tekening, Tekenopdracht } from "@/lib/types";
import { bestandsnaam, downloadAlsPng, klok, perOpdracht, resterend } from "@/lib/tekenen";
import { Pincode } from "@/components/bord/BordLeraar";
import { Vergelijk } from "./Vergelijk";

/**
 * Teken uit je geheugen, zoals de leraar het projecteert. Groot in beeld staat alleen de
 * naam van de huidige afbeelding, nooit het beeld zelf. Het origineel verschijnt pas als
 * de leraar er bewust op drukt. De leraar stuurt de klas met Vorige en Volgende; alle
 * toestellen volgen.
 */
export function TekenenBord({
  sessie: begin,
  oefening,
  onStop,
}: {
  sessie: LiveSessie;
  oefening: OefeningVan<"tekenen">;
  onStop: () => void;
}) {
  const code = begin.code;
  const opdrachten = useMemo(() => oefening.content.tekenopdrachten, [oefening]);
  const [sessie, setSessie] = useState<LiveSessie>(begin);
  const [tekeningen, setTekeningen] = useState<Tekening[]>([]);
  const [weergave, setWeergave] = useState<"les" | "resultaten">("les");
  const [toonHuidige, setToonHuidige] = useState(false);
  const [groot, setGroot] = useState<string | null>(null);
  const [vol, setVol] = useState(false);
  const [toonCode, setToonCode] = useState(true);
  const [fout, setFout] = useState("");
  const [nu, setNu] = useState(() => Date.now());

  const t = sessie.tekenen as TekenToestand;
  const afgesloten = sessie.status === "afgesloten";
  const opdracht = opdrachten[t.nr];
  const groepen = useMemo(() => perOpdracht(tekeningen, opdrachten.length), [tekeningen, opdrachten.length]);
  const binnen = groepen[t.nr]?.length ?? 0;
  const over = resterend(t, nu);

  useEffect(() => {
    const stopSessie = opslag.volgSessie(code, (s) => s && setSessie(s));
    const stopTekeningen = opslag.volgTekeningen(code, setTekeningen, () =>
      setFout("De tekeningen volgen lukt niet meer. Laad de pagina opnieuw.")
    );
    return () => {
      stopSessie();
      stopTekeningen();
    };
  }, [code]);

  // De klok tikt alleen als er een tekentijd loopt.
  useEffect(() => {
    if (!t.seconden || afgesloten) return;
    const tik = window.setInterval(() => setNu(Date.now()), 500);
    return () => window.clearInterval(tik);
  }, [t.seconden, t.gestartOp, afgesloten]);

  const metFout = async (actie: () => Promise<void>) => {
    try {
      await actie();
      setFout("");
    } catch (e) {
      console.error("Tekensessie bijwerken mislukt", e);
      setFout("Dat is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  const zet = (nieuw: TekenToestand) =>
    metFout(async () => {
      await opslag.wijzigSessie(code, { tekenen: nieuw });
      setSessie((s) => ({ ...s, tekenen: nieuw }));
    });

  /** Naar een andere afbeelding: de naam wisselt, de klok start opnieuw, het origineel verdwijnt. */
  const ga = (nr: number) => {
    if (nr < 0 || nr >= opdrachten.length || afgesloten) return;
    setToonHuidige(false);
    setNu(Date.now());
    zet({
      nr,
      aantal: t.aantal,
      naam: opdrachten[nr].naam,
      seconden: t.seconden,
      namen: t.namen,
      gestartOp: new Date().toISOString(),
    });
  };

  const origineelGetoond = Boolean(t.origineel);
  const wisselOrigineel = () => {
    if (!opdracht) return;
    const zonder: TekenToestand = { ...t };
    delete zonder.origineel;
    delete zonder.origineelAlt;
    zet(
      origineelGetoond
        ? zonder
        : { ...zonder, origineel: opdracht.beeld.url, origineelAlt: opdracht.beeld.alt || opdracht.naam }
    );
  };

  const sluitAf = () => {
    if (!window.confirm("De sessie afsluiten? Wie nog tekent, kan daarna niets meer insturen.")) return;
    return metFout(async () => {
      await opslag.wijzigSessie(code, { status: "afgesloten" });
      setSessie((s) => ({ ...s, status: "afgesloten" }));
      setWeergave("resultaten");
    });
  };

  const verwijder = (id: string) => {
    if (!window.confirm("Deze tekening verwijderen? Dat kan je niet ongedaan maken.")) return;
    setGroot(null);
    metFout(() => opslag.verwijderTekening(code, id));
  };

  /**
   * Mag het origineel van deze afbeelding al op het scherm? Pas als de klas ze getekend
   * heeft: een vorige afbeelding, de huidige na "Toon origineel", of alles na afloop.
   */
  const origineelVrij = (nr: number) => afgesloten || nr < t.nr || (nr === t.nr && origineelGetoond);

  // Pijltjes en een presentatieklikker sturen de klas, behalve als er een tekening open staat.
  useEffect(() => {
    const op = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "Escape") {
        if (groot) setGroot(null);
        else if (vol) setVol(false);
        return;
      }
      if (groot || weergave !== "les") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") ga(t.nr + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") ga(t.nr - 1);
    };
    window.addEventListener("keydown", op);
    return () => window.removeEventListener("keydown", op);
  });

  const grootTekening = groot ? tekeningen.find((x) => x.id === groot) : undefined;

  const knop = "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors disabled:opacity-40";
  const knopRustig = `${knop} bg-white border-slate-200 text-slate-700 hover:border-merk`;
  const knopHoofd = `${knop} bg-merk-800 border-merk-800 text-white hover:bg-merk-900`;

  return (
    <div
      className={
        vol ? "fixed inset-0 z-50 overflow-y-auto bg-[var(--achtergrond)] p-4 sm:p-6" : "max-w-7xl mx-auto u-fade"
      }
    >
      {/* Bediening */}
      <div className="flex flex-wrap items-center gap-2 mb-4 niet-afdrukken">
        {afgesloten ? (
          <button onClick={onStop} className={knopRustig}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Terug naar Start in de klas
          </button>
        ) : (
          <button onClick={sluitAf} className={knopRustig}>
            <Square className="w-3.5 h-3.5" />
            Afsluiten
          </button>
        )}
        {!afgesloten && (
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5">
            {(["les", "resultaten"] as const).map((w) => (
              <button
                key={w}
                onClick={() => setWeergave(w)}
                aria-pressed={weergave === w}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  weergave === w ? "bg-merk-800 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {w === "les" ? "Opdracht" : `Alle tekeningen (${tekeningen.length})`}
              </button>
            ))}
          </div>
        )}
        <span className="flex-1" />
        {weergave === "les" && !afgesloten && (
          <button onClick={() => setToonCode((c) => !c)} aria-pressed={toonCode} className={knopRustig}>
            <QrCode className="w-3.5 h-3.5" />
            {toonCode ? "Verberg pincode" : "Toon pincode"}
          </button>
        )}
        {weergave === "resultaten" && (
          <button onClick={() => window.print()} className={knopRustig} title="Afdrukken of als pdf bewaren">
            <Printer className="w-3.5 h-3.5" />
            Afdrukken of pdf
          </button>
        )}
        <button onClick={() => setVol((v) => !v)} className={knopRustig}>
          {vol ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
          {vol ? "Kleiner" : "Volledig scherm"}
        </button>
      </div>

      {fout && (
        <p role="alert" className="mb-4 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 niet-afdrukken">
          {fout}
        </p>
      )}

      {!opslagGedeeld && !vol && !afgesloten && (
        <p className="mb-4 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 niet-afdrukken">
          <strong>Demo:</strong> open de deelnamepagina in een tweede tabblad van deze browser om als cursist mee te tekenen.
        </p>
      )}

      {weergave === "les" && !afgesloten ? (
        <>
          <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase font-bold tracking-widest text-merk-800 mb-2">
                Teken uit je geheugen · afbeelding {t.nr + 1} van {opdrachten.length}
              </p>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-merk-900 leading-tight break-words">
                {t.naam}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-merk-50 border border-merk/30 text-sm font-bold text-merk-900 tabular-nums">
                  <Images className="w-4 h-4" />
                  {binnen} {binnen === 1 ? "tekening" : "tekeningen"} binnen
                </span>
                {over !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold tabular-nums ${
                      over === 0
                        ? "bg-amber-100 border-amber-400 text-amber-900"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                    aria-live="polite"
                  >
                    <Timer className="w-4 h-4" />
                    {over === 0 ? "Tijd om" : klok(over)}
                  </span>
                )}
              </div>
            </div>
            {toonCode && <Pincode code={code} />}
          </header>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button onClick={() => ga(t.nr - 1)} disabled={t.nr === 0} className={knopRustig}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Vorige
            </button>
            <button onClick={wisselOrigineel} className={origineelGetoond ? knopRustig : `${knop} bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500`}>
              {origineelGetoond ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {origineelGetoond ? "Verberg origineel" : "Toon origineel"}
            </button>
            <button
              onClick={() => setToonHuidige((v) => !v)}
              aria-pressed={toonHuidige}
              disabled={binnen === 0}
              className={knopRustig}
            >
              <Images className="w-3.5 h-3.5" />
              {toonHuidige ? "Verberg tekeningen" : "Toon tekeningen"}
            </button>
            <span className="flex-1" />
            {t.nr + 1 < opdrachten.length ? (
              <button onClick={() => ga(t.nr + 1)} className={knopHoofd}>
                Volgende afbeelding
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              // De sessie blijft open: wie nog tekent, kan nog insturen.
              <button onClick={() => setWeergave("resultaten")} className={knopHoofd}>
                Naar alle tekeningen
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {origineelGetoond && t.origineel && (
            <figure className="mb-6 bg-white rounded-2xl border border-slate-200 p-4 u-pop">
              { }
              <img src={t.origineel} alt={t.origineelAlt ?? ""} className="mx-auto max-h-[55vh] object-contain" />
              <figcaption className="text-center text-sm font-bold text-slate-600 mt-2">Het origineel</figcaption>
            </figure>
          )}

          {toonHuidige && (
            <Raster tekeningen={groepen[t.nr] ?? []} onOpen={setGroot} />
          )}
        </>
      ) : (
        <Resultaten
          titel={oefening.title}
          opdrachten={opdrachten}
          groepen={groepen}
          zichtbaar={(nr) => afgesloten || nr <= t.nr}
          origineelVrij={origineelVrij}
          onOpen={setGroot}
        />
      )}

      {grootTekening && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-4 sm:p-10 niet-afdrukken"
          onClick={() => setGroot(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Tekening groot"
        >
          <div
            className="w-full max-w-5xl max-h-full overflow-y-auto bg-white rounded-2xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-500">
                  {opdrachten[grootTekening.nr]?.naam}
                  {grootTekening.auteur && ` · ${grootTekening.auteur}`} · {grootTekening.seconden} sec
                </p>
              </div>
              <button
                onClick={() =>
                  downloadAlsPng(
                    grootTekening.beeld,
                    bestandsnaam(opdrachten[grootTekening.nr]?.naam ?? "tekening", grootTekening.auteur ?? grootTekening.id.slice(-6))
                  )
                }
                className={knopRustig}
              >
                <Download className="w-3.5 h-3.5" />
                PNG
              </button>
              <button onClick={() => verwijder(grootTekening.id)} className={`${knop} bg-white border-rose-200 text-rose-700 hover:border-rose-400`}>
                <Trash2 className="w-3.5 h-3.5" />
                Verwijderen
              </button>
              <button onClick={() => setGroot(null)} className={knopRustig} aria-label="Sluiten">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {origineelVrij(grootTekening.nr) && opdrachten[grootTekening.nr] ? (
              <Vergelijk
                tekening={grootTekening.beeld}
                origineel={opdrachten[grootTekening.nr].beeld.url}
                alt={opdrachten[grootTekening.nr].beeld.alt}
                groot
              />
            ) : (
              <>
                { }
                <img src={grootTekening.beeld} alt="Tekening" className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-200" />
                <p className="text-xs text-slate-500 mt-2">
                  Het origineel kan je hier pas naast leggen als je het aan de klas getoond hebt.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Raster({ tekeningen, onOpen }: { tekeningen: Tekening[]; onOpen: (id: string) => void }) {
  if (tekeningen.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
        Nog geen tekeningen.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {tekeningen.map((x) => (
        <li key={x.id} className="break-inside-avoid">
          <button
            onClick={() => onOpen(x.id)}
            className="block w-full bg-white rounded-xl border border-slate-200 hover:border-merk p-1.5 transition-colors"
          >
            { }
            <img src={x.beeld} alt={x.auteur ? `Tekening van ${x.auteur}` : "Tekening"} className="w-full aspect-[4/3] object-contain" />
            {x.auteur && <span className="block text-xs font-bold text-slate-600 truncate mt-1">{x.auteur}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Alle tekeningen per afbeelding, met het origineel erbij zodra dat getoond mag worden. */
function Resultaten({
  titel,
  opdrachten,
  groepen,
  zichtbaar,
  origineelVrij,
  onOpen,
}: {
  titel: string;
  opdrachten: Tekenopdracht[];
  groepen: Tekening[][];
  zichtbaar: (nr: number) => boolean;
  origineelVrij: (nr: number) => boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase font-bold tracking-widest text-merk-800 mb-1">Teken uit je geheugen</p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-merk-900 leading-tight">{titel}</h1>
      </header>
      {opdrachten.map((o, nr) =>
        zichtbaar(nr) ? (
          <section key={o.id} className="break-inside-avoid-page">
            <div className="flex items-end gap-4 mb-3">
              {origineelVrij(nr) && (
                 
                <img src={o.beeld.url} alt={o.beeld.alt ?? o.naam} className="w-24 h-20 object-contain bg-white rounded-xl border border-slate-200 p-1 shrink-0" />
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold text-merk-900">
                  {nr + 1}. {o.naam}
                </h2>
                <p className="text-xs text-slate-500">
                  {groepen[nr].length} {groepen[nr].length === 1 ? "tekening" : "tekeningen"}
                  {!origineelVrij(nr) && " · origineel nog niet getoond"}
                </p>
              </div>
            </div>
            <Raster tekeningen={groepen[nr]} onOpen={onOpen} />
          </section>
        ) : null
      )}
    </div>
  );
}
