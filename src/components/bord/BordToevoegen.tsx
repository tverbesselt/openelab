"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, Film, ImageIcon, Mic, Pencil, Send, Square, Type } from "lucide-react";
import { BordItem, BordSoort } from "@/lib/types";
import { MediaFout } from "@/lib/media";
import {
  BORD_SOORTEN,
  MAX_TEKST,
  audioVoorBord,
  beeldVoorBord,
  videoVoorBord,
} from "@/lib/bord";
import { BordKaart } from "./BordKaart";
import { TekenBlad, tekeningAlsBlob } from "@/components/TekenBlad";

/** Wat het formulier oplevert; wie het instuurt, vult apparaat, status en tijd aan. */
export type NieuwKaartje = Pick<BordItem, "soort" | "tekst" | "url" | "alt" | "kolom">;

const ICONEN: Record<BordSoort, React.ElementType> = {
  tekst: Type,
  afbeelding: ImageIcon,
  tekening: Pencil,
  video: Film,
  audio: Mic,
};

/**
 * Iets op het bord zetten. Alleen de soorten die de leraar toelaat, verschijnen; bij één
 * soort vallen de tabs weg. Foto's en opnames worden hier al verkleind, zodat de cursist
 * ziet of het lukt vóór hij op "Zet op het bord" drukt.
 */
export function BordToevoegen({
  soorten,
  maxTekens,
  maxSeconden,
  kolommen,
  onVerstuur,
  knopTekst = "Zet op het bord",
}: {
  soorten: BordSoort[];
  /** De grens voor tekst en onderschrift. */
  maxTekens: number;
  maxSeconden: number;
  kolommen: string[];
  onVerstuur: (kaartje: NieuwKaartje) => Promise<void>;
  knopTekst?: string;
}) {
  const toegelaten = BORD_SOORTEN.filter((s) => soorten.includes(s.soort));
  const [soort, setSoort] = useState<BordSoort>(toegelaten[0]?.soort ?? "tekst");
  const [tekst, setTekst] = useState("");
  const [url, setUrl] = useState("");
  const [link, setLink] = useState("");
  const [kolom, setKolom] = useState(0);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [tekenVersie, setTekenVersie] = useState(0);
  const tekenblad = useRef<HTMLCanvasElement | null>(null);
  const [tekenLeeg, setTekenLeeg] = useState(true);

  // Zet de leraar de gekozen soort tussendoor uit, dan springt het formulier mee.
  useEffect(() => {
    if (!soorten.includes(soort) && toegelaten[0]) wissel(toegelaten[0].soort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soorten.join(",")]);

  useEffect(() => {
    if (kolom >= kolommen.length) setKolom(0);
  }, [kolommen.length, kolom]);

  const grens = Math.min(maxTekens, MAX_TEKST);

  function wissel(nieuw: BordSoort) {
    setSoort(nieuw);
    setUrl("");
    setLink("");
    setFout("");
  }

  const leeg = () => {
    setTekst("");
    setUrl("");
    setLink("");
    setTekenLeeg(true);
    setTekenVersie((v) => v + 1);
  };

  const video = soort === "video" ? videoVoorBord(link) : null;

  const klaar =
    soort === "tekst"
      ? tekst.trim().length > 0
      : soort === "tekening"
        ? !tekenLeeg
        : soort === "video"
          ? Boolean(video)
          : Boolean(url);

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!klaar || bezig) return;
    setBezig(true);
    setFout("");
    try {
      let inhoud = url;
      if (soort === "tekening") {
        const blob = await tekeningAlsBlob(tekenblad.current);
        inhoud = await beeldVoorBord(blob);
      }
      if (soort === "video") inhoud = video ?? "";
      const schoon = tekst.trim().slice(0, grens);
      await onVerstuur({
        soort,
        ...(schoon ? { tekst: schoon } : {}),
        ...(soort !== "tekst" ? { url: inhoud } : {}),
        ...(kolommen.length > 0 ? { kolom } : {}),
      });
      leeg();
    } catch (err) {
      console.error("Op het bord zetten mislukt", err);
      setFout(
        err instanceof MediaFout
          ? err.message
          : "Dat kwam niet op het bord. Kijk je verbinding na en probeer opnieuw."
      );
    } finally {
      setBezig(false);
    }
  };

  if (toegelaten.length === 0) {
    return <p className="text-sm text-slate-600">Je leraar heeft nog niets opengezet om toe te voegen.</p>;
  }

  return (
    <form onSubmit={verstuur} className="space-y-3">
      {toegelaten.length > 1 && (
        <div role="tablist" aria-label="Wat wil je toevoegen?" className="flex flex-wrap gap-1.5">
          {toegelaten.map((s) => {
            const Icon = ICONEN[s.soort];
            const actief = s.soort === soort;
            return (
              <button
                key={s.soort}
                type="button"
                role="tab"
                aria-selected={actief}
                onClick={() => wissel(s.soort)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-colors ${
                  actief
                    ? "bg-merk-800 text-white border-merk-800"
                    : "bg-white text-slate-700 border-slate-200 hover:border-merk"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {soort === "afbeelding" && (
        <FotoKiezer
          url={url}
          onUrl={setUrl}
          onFout={setFout}
          onBezig={setBezig}
        />
      )}

      {soort === "tekening" && (
        <TekenBlad key={tekenVersie} canvasRef={tekenblad} onLeeg={setTekenLeeg} />
      )}

      {soort === "video" && (
        <div className="space-y-2">
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">Link naar YouTube of Vimeo</span>
            <input
              type="url"
              inputMode="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-sm focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </label>
          {link.trim() && !video && (
            <p className="text-xs font-semibold text-rose-800">
              Dit is geen link naar YouTube of Vimeo. Andere links kunnen niet op het bord.
            </p>
          )}
          {video && (
            <div className="max-w-sm">
              <BordKaart item={{ id: "voorbeeld", apparaat: "", soort: "video", url: video, status: "zichtbaar", op: "" }} />
            </div>
          )}
        </div>
      )}

      {soort === "audio" && (
        <Opname maxSeconden={maxSeconden} url={url} onUrl={setUrl} onFout={setFout} />
      )}

      <label className="block">
        <span className="flex items-baseline justify-between text-xs font-bold text-slate-700 mb-1">
          <span>{soort === "tekst" ? "Jouw tekst" : "Onderschrift (mag leeg blijven)"}</span>
          <span className={`font-semibold tabular-nums ${tekst.length >= grens ? "text-rose-700" : "text-slate-500"}`}>
            {tekst.length} / {grens}
          </span>
        </span>
        <textarea
          value={tekst}
          onChange={(e) => setTekst(e.target.value.slice(0, grens))}
          maxLength={grens}
          rows={soort === "tekst" ? (grens > 140 ? 4 : 2) : 2}
          placeholder={soort === "tekst" ? "Schrijf hier ..." : "Wat wil je erbij zeggen?"}
          className="w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-base focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none resize-y"
        />
      </label>

      {kolommen.length > 0 && (
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">In welke kolom?</span>
          <select
            value={kolom}
            onChange={(e) => setKolom(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-sm font-semibold"
          >
            {kolommen.map((k, i) => (
              <option key={i} value={i}>
                {k}
              </option>
            ))}
          </select>
        </label>
      )}

      {fout && (
        <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
          {fout}
        </p>
      )}

      <button
        type="submit"
        disabled={!klaar || bezig}
        className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        <span>{bezig ? "Bezig ..." : knopTekst}</span>
      </button>
    </form>
  );
}

/* ── Foto ──────────────────────────────────────────────────────────────── */

function FotoKiezer({
  url,
  onUrl,
  onFout,
  onBezig,
}: {
  url: string;
  onUrl: (url: string) => void;
  onFout: (fout: string) => void;
  onBezig: (bezig: boolean) => void;
}) {
  const [verwerken, setVerwerken] = useState(false);

  const kies = async (bestand?: File | null) => {
    if (!bestand) return;
    onFout("");
    setVerwerken(true);
    onBezig(true);
    try {
      onUrl(await beeldVoorBord(bestand));
    } catch (e) {
      onFout(e instanceof MediaFout ? e.message : "Deze foto kunnen we niet openen. Probeer een andere.");
    } finally {
      setVerwerken(false);
      onBezig(false);
    }
  };

  return (
    <div className="space-y-2">
      {url && (
         
        <img src={url} alt="Voorbeeld van je foto" className="max-h-60 rounded-xl border border-slate-200 bg-slate-50" />
      )}
      <div className="flex flex-wrap gap-2">
        <BestandKnop accept="image/*" onKies={kies} bezig={verwerken}>
          <ImageIcon className="w-4 h-4" />
          {url ? "Andere foto" : "Kies een foto"}
        </BestandKnop>
        {/* Op een gsm opent dit meteen de camera. */}
        <BestandKnop accept="image/*" capture="environment" onKies={kies} bezig={verwerken}>
          <Camera className="w-4 h-4" />
          Neem een foto
        </BestandKnop>
      </div>
      {verwerken && <p className="text-xs text-slate-500">Foto verkleinen ...</p>}
    </div>
  );
}

function BestandKnop({
  accept,
  capture,
  onKies,
  bezig,
  children,
}: {
  accept: string;
  capture?: "environment" | "user";
  onKies: (bestand?: File | null) => void;
  bezig: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:border-merk cursor-pointer focus-within:ring-2 focus-within:ring-merk/40 ${
        bezig ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      {children}
      <input
        type="file"
        accept={accept}
        capture={capture}
        className="sr-only"
        onChange={(e) => {
          onKies(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

/* ── Inspreken ─────────────────────────────────────────────────────────── */

function Opname({
  maxSeconden,
  url,
  onUrl,
  onFout,
}: {
  maxSeconden: number;
  url: string;
  onUrl: (url: string) => void;
  onFout: (fout: string) => void;
}) {
  const [seconden, setSeconden] = useState<number | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const klok = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (klok.current) clearInterval(klok.current);
    klok.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  // Stop een lopende opname als het formulier verdwijnt.
  useEffect(() => stop, []);

  const start = async () => {
    onFout("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onFout("Inspreken lukt niet in deze browser. Probeer Chrome, Edge of Safari.");
      return;
    }
    try {
      const stroom = await navigator.mediaDevices.getUserMedia({ audio: true });
      let opname: MediaRecorder;
      try {
        // Spraak heeft niet meer nodig; zo past een minuut ruim in één kaartje.
        opname = new MediaRecorder(stroom, { audioBitsPerSecond: 32_000 });
      } catch {
        opname = new MediaRecorder(stroom);
      }
      const stukken: Blob[] = [];
      opname.ondataavailable = (ev) => ev.data.size && stukken.push(ev.data);
      opname.onstop = async () => {
        stroom.getTracks().forEach((t) => t.stop());
        setSeconden(null);
        const type = (opname.mimeType || "audio/webm").split(";")[0];
        try {
          onUrl(await audioVoorBord(new Blob(stukken, { type })));
        } catch (e) {
          onFout(e instanceof MediaFout ? e.message : "De opname kon niet bewaard worden.");
        }
      };
      recorder.current = opname;
      opname.start();
      setSeconden(0);
      const begin = Date.now();
      klok.current = setInterval(() => {
        const verstreken = Math.floor((Date.now() - begin) / 1000);
        setSeconden(verstreken);
        if (verstreken >= maxSeconden) stop();
      }, 250);
    } catch {
      onFout("We kregen geen toegang tot je microfoon. Kijk de instellingen van je browser na.");
    }
  };

  const neemtOp = seconden !== null;

  return (
    <div className="space-y-2">
      {url && !neemtOp && (
        <audio controls src={url} className="w-full">
          Je browser kan dit fragment niet afspelen.
        </audio>
      )}
      {neemtOp ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-bold"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </button>
          <span className="text-sm font-bold text-rose-800 tabular-nums" aria-live="polite">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 mr-1.5 animate-pulse" aria-hidden />
            {toonSeconden(seconden)} / {toonSeconden(maxSeconden)}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:border-merk"
        >
          <Mic className="w-4 h-4" />
          {url ? "Opnieuw inspreken" : "Start met inspreken"}
        </button>
      )}
      <p className="text-xs text-slate-500">Hoogstens {toonSeconden(maxSeconden)}. De opname stopt vanzelf.</p>
    </div>
  );
}

function toonSeconden(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
