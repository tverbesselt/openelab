"use client";

import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Film, Mic, Square, Trash2, Upload, Loader2, X, Search } from "lucide-react";
import { QuizMedia } from "@/lib/types";
import {
  MAX_AUDIO_MB,
  MediaFout,
  controleerAudio,
  herkenVideo,
  leesTijd,
  startUitLink,
  toonTijd,
  uploadMedia,
  uploadenGedeeld,
  verkleinAfbeelding,
} from "@/lib/media";
import { useAuth } from "@/lib/auth/AuthProvider";
import { VraagMedia } from "@/components/players/VraagMedia";
import { VrijBeeldZoeker } from "./VrijBeeldZoeker";
import type { VrijBeeld } from "@/lib/beeldbank";

type Soort = QuizMedia["soort"];

const SOORTEN: { soort: Soort; label: string; icon: typeof Film }[] = [
  { soort: "afbeelding", label: "Foto", icon: ImageIcon },
  { soort: "video", label: "Filmpje", icon: Film },
  { soort: "audio", label: "Audiofragment", icon: Mic },
];

const KLEIN_VELD =
  "w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none";

/**
 * Een foto, filmpje of audiofragment bij één quizvraag. Het is altijd optioneel: een
 * vraag zonder media blijft een gewone vraag.
 */
export function MediaKiezer({
  waarde,
  onWijzig,
  onBezig,
  bij = "de vraag",
}: {
  waarde?: QuizMedia;
  onWijzig: (media: QuizMedia | undefined) => void;
  /** Laat het formulier weten dat er nog iets aan het uploaden is. */
  onBezig?: (bezig: boolean) => void;
  /** Waar de media bij hoort, voor het label: "de vraag" of "de opdracht". */
  bij?: string;
}) {
  const [soort, setSoort] = useState<Soort | null>(waarde?.soort ?? null);

  if (!soort) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">Toevoegen bij {bij}:</span>
        {SOORTEN.map(({ soort: s, label, icon: Icon }) => (
          <button
            key={s}
            type="button"
            onClick={() => setSoort(s)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:border-merk hover:text-merk-900"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    );
  }

  const weg = () => {
    onWijzig(undefined);
    setSoort(null);
  };

  const titel = SOORTEN.find((s) => s.soort === soort)!;

  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <titel.icon className="w-3.5 h-3.5" />
          {titel.label} bij {bij}
        </span>
        <button
          type="button"
          onClick={weg}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-700"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Weghalen
        </button>
      </div>

      {soort === "afbeelding" && <FotoKiezer waarde={waarde} onWijzig={onWijzig} onBezig={onBezig} />}
      {soort === "video" && <VideoKiezer waarde={waarde} onWijzig={onWijzig} />}
      {soort === "audio" && <AudioKiezer waarde={waarde} onWijzig={onWijzig} onBezig={onBezig} />}

      {!uploadenGedeeld && soort !== "video" && (
        <p className="text-xs text-slate-500">
          Demomodus: het bestand blijft in deze browser en wordt niet gedeeld.
        </p>
      )}
    </div>
  );
}

/* ── Foto ──────────────────────────────────────────────────────────────── */

export function FotoKiezer({
  waarde,
  onWijzig,
  onBezig,
  altNodig = true,
}: {
  waarde?: QuizMedia;
  onWijzig: (m: QuizMedia | undefined) => void;
  onBezig?: (b: boolean) => void;
  /** Uit als er al een naam bij de foto staat die zegt wat erop staat. */
  altNodig?: boolean;
}) {
  const { upload, bezig, fout } = useUpload(onBezig);
  const [zoeken, setZoeken] = useState(false);
  const heeftFoto = waarde?.soort === "afbeelding" && waarde.url;

  const kies = async (bestand: File | undefined) => {
    if (!bestand) return;
    const url = await upload(async () => verkleinAfbeelding(bestand));
    if (url) onWijzig({ soort: "afbeelding", url, alt: waarde?.alt ?? "" });
  };

  // Een vrij beeld: zelfde weg als een eigen foto, maar met de titel als voorstel voor de
  // beschrijving en de bronvermelding erbij.
  const kiesVrij = async (bestand: Blob, beeld: VrijBeeld) => {
    const url = await upload(async () => verkleinAfbeelding(bestand));
    if (!url) return;
    onWijzig({ soort: "afbeelding", url, alt: beeld.titel || waarde?.alt || "", bron: beeld.bron });
    setZoeken(false);
  };

  return (
    <div className="space-y-2">
      {heeftFoto && <VraagMedia media={waarde} />}
      <div className="flex flex-wrap gap-2">
        <BestandKnop
          accept="image/*"
          label={heeftFoto ? "Andere foto kiezen" : "Kies een foto"}
          bezig={bezig}
          onKies={kies}
        />
        <button
          type="button"
          onClick={() => setZoeken(true)}
          disabled={bezig}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:border-merk disabled:opacity-60"
        >
          <Search className="w-3.5 h-3.5" />
          Zoek een vrije afbeelding
        </button>
      </div>
      {zoeken && <VrijBeeldZoeker onGekozen={kiesVrij} onSluit={() => setZoeken(false)} />}
      {heeftFoto && (
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">
            Wat staat erop? (voor wie de foto niet kan zien{altNodig ? "" : ", mag leeg"})
          </span>
          <input
            type="text"
            value={waarde.alt ?? ""}
            onChange={(e) => onWijzig({ ...waarde, alt: e.target.value })}
            placeholder="Bijvoorbeeld: een zekeringkast met drie groepen"
            required={altNodig}
            maxLength={200}
            className={KLEIN_VELD}
          />
        </label>
      )}
      <UploadFout tekst={fout} />
    </div>
  );
}

/* ── Foto bij een antwoord ─────────────────────────────────────────────── */

/**
 * Een kleine foto naast één antwoordmogelijkheid. Geen eigen beschrijving: de tekst van
 * het antwoord is de beschrijving. Staat in een rij met `flex-wrap`, zodat een foutmelding
 * op een eigen regel komt.
 */
export function OptieFoto({
  waarde,
  onWijzig,
  onBezig,
  label,
}: {
  waarde?: QuizMedia;
  onWijzig: (m: QuizMedia | undefined) => void;
  onBezig?: (b: boolean) => void;
  /** Bij welk antwoord de foto hoort, voor schermlezers: "antwoord 2". */
  label: string;
}) {
  const { upload, bezig, fout } = useUpload(onBezig);
  const [zoeken, setZoeken] = useState(false);

  const kies = async (bestand: File | undefined) => {
    if (!bestand) return;
    const url = await upload(async () => verkleinAfbeelding(bestand));
    if (url) onWijzig({ soort: "afbeelding", url });
  };

  const kiesVrij = async (bestand: Blob, beeld: VrijBeeld) => {
    const url = await upload(async () => verkleinAfbeelding(bestand));
    if (!url) return;
    onWijzig({ soort: "afbeelding", url, bron: beeld.bron });
    setZoeken(false);
  };

  return (
    <>
      {waarde?.url ? (
        <span className="relative shrink-0">
          <img
            src={waarde.url}
            alt=""
            className="w-11 h-11 rounded-lg object-cover border border-slate-200 bg-slate-50"
          />
          <button
            type="button"
            onClick={() => onWijzig(undefined)}
            aria-label={`Foto bij ${label} weghalen`}
            title="Foto weghalen"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-600 hover:text-rose-700 flex items-center justify-center"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ) : (
        <label
          title="Foto toevoegen"
          className={`shrink-0 w-11 h-11 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-merk hover:text-merk-900 flex items-center justify-center cursor-pointer ${
            bezig ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {bezig ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          <span className="sr-only">{bezig ? "Bezig met uploaden" : `Foto bij ${label}`}</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={bezig}
            onChange={(e) => {
              kies(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {!waarde?.url && (
        <button
          type="button"
          onClick={() => setZoeken(true)}
          disabled={bezig}
          title="Zoek een vrije afbeelding"
          aria-label={`Zoek een vrije afbeelding bij ${label}`}
          className="shrink-0 w-11 h-11 rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-merk hover:text-merk-900 flex items-center justify-center disabled:opacity-60"
        >
          <Search className="w-4 h-4" />
        </button>
      )}
      {zoeken && <VrijBeeldZoeker onGekozen={kiesVrij} onSluit={() => setZoeken(false)} />}
      {fout && (
        <p role="alert" className="basis-full text-xs font-semibold text-rose-800">
          {fout}
        </p>
      )}
    </>
  );
}

/* ── Video ─────────────────────────────────────────────────────────────── */

function VideoKiezer({
  waarde,
  onWijzig,
}: {
  waarde?: QuizMedia;
  onWijzig: (m: QuizMedia | undefined) => void;
}) {
  const huidig = waarde?.soort === "video" ? waarde : undefined;
  const [link, setLink] = useState(huidig?.url ?? "");
  const [start, setStart] = useState(toonTijd(huidig?.start));
  const [eind, setEind] = useState(toonTijd(huidig?.eind));

  const bron = link.trim() ? herkenVideo(link) : null;
  const s = leesTijd(start);
  const e = leesTijd(eind);
  const tijdFout = s !== undefined && e !== undefined && e <= s;

  // Alleen een herkende link komt in de vraag terecht.
  useEffect(() => {
    onWijzig(bron && !tijdFout ? { soort: "video", url: link.trim(), start: s, eind: e } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link, start, eind]);

  return (
    <div className="space-y-2">
      <input
        type="url"
        value={link}
        onChange={(ev) => {
          setLink(ev.target.value);
          // Wie op YouTube "delen vanaf 0:45" koos, hoeft dat hier niet opnieuw te typen.
          const t = startUitLink(ev.target.value);
          if (t && !start.trim()) setStart(toonTijd(t));
        }}
        placeholder="Plak een link naar YouTube of Vimeo"
        className={KLEIN_VELD}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">Vanaf (mag leeg)</span>
          <input
            type="text"
            inputMode="numeric"
            value={start}
            onChange={(ev) => setStart(ev.target.value)}
            placeholder="0:45"
            className={KLEIN_VELD}
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">Tot (mag leeg)</span>
          <input
            type="text"
            inputMode="numeric"
            value={eind}
            onChange={(ev) => setEind(ev.target.value)}
            placeholder="1:30"
            className={KLEIN_VELD}
          />
        </label>
      </div>
      {link.trim() && !bron && (
        <UploadFout tekst="Deze link herkennen we niet. Gebruik een link naar een filmpje op YouTube of Vimeo." />
      )}
      {tijdFout && <UploadFout tekst="Het einde moet na het begin liggen." />}
      {huidig && <VraagMedia media={huidig} />}
    </div>
  );
}

/* ── Audio ─────────────────────────────────────────────────────────────── */

function AudioKiezer({
  waarde,
  onWijzig,
  onBezig,
}: {
  waarde?: QuizMedia;
  onWijzig: (m: QuizMedia | undefined) => void;
  onBezig?: (b: boolean) => void;
}) {
  const { upload, bezig, fout, setFout } = useUpload(onBezig);
  const [neemtOp, setNeemtOp] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const heeftAudio = waarde?.soort === "audio" && waarde.url;

  const bewaar = async (blob: Blob) => {
    const url = await upload(async () => {
      controleerAudio(blob);
      return blob;
    });
    if (url) onWijzig({ soort: "audio", url });
  };

  const startOpname = async () => {
    setFout("");
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setFout("Opnemen lukt niet in deze browser. Kies een audiobestand.");
      return;
    }
    try {
      const stroom = await navigator.mediaDevices.getUserMedia({ audio: true });
      const opname = new MediaRecorder(stroom);
      const stukken: Blob[] = [];
      opname.ondataavailable = (ev) => ev.data.size && stukken.push(ev.data);
      opname.onstop = () => {
        stroom.getTracks().forEach((t) => t.stop());
        setNeemtOp(false);
        const type = (opname.mimeType || "audio/webm").split(";")[0];
        bewaar(new Blob(stukken, { type }));
      };
      recorder.current = opname;
      opname.start();
      setNeemtOp(true);
    } catch {
      setFout("We kregen geen toegang tot je microfoon. Kijk de instellingen van je browser na.");
    }
  };

  // Stop een lopende opname als het formulier verdwijnt.
  useEffect(() => () => recorder.current?.state === "recording" ? recorder.current.stop() : undefined, []);

  return (
    <div className="space-y-2">
      {heeftAudio && <VraagMedia media={waarde} />}
      <div className="flex flex-wrap gap-2">
        <BestandKnop
          accept="audio/*"
          label={heeftAudio ? "Ander bestand" : "Kies een audiobestand"}
          bezig={bezig}
          onKies={(b) => b && bewaar(b)}
        />
        {neemtOp ? (
          <button
            type="button"
            onClick={() => recorder.current?.stop()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold"
          >
            <Square className="w-3.5 h-3.5" />
            Stop de opname
          </button>
        ) : (
          <button
            type="button"
            disabled={bezig}
            onClick={startOpname}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:border-merk disabled:opacity-50"
          >
            <Mic className="w-3.5 h-3.5" />
            Zelf opnemen
          </button>
        )}
      </div>
      {neemtOp && <p className="text-xs font-bold text-rose-700">Aan het opnemen ...</p>}
      <p className="text-xs text-slate-500">MP3, M4A, WAV of OGG, tot {MAX_AUDIO_MB} MB.</p>
      <UploadFout tekst={fout} />
    </div>
  );
}

/* ── Gedeeld ───────────────────────────────────────────────────────────── */

function useUpload(onBezig?: (b: boolean) => void) {
  const { gebruiker } = useAuth();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const upload = async (maak: () => Promise<Blob>): Promise<string | null> => {
    setFout("");
    setBezig(true);
    onBezig?.(true);
    try {
      const blob = await maak();
      return await uploadMedia(blob, gebruiker?.id ?? "demo");
    } catch (e) {
      console.error("Media uploaden mislukt", e);
      setFout(
        e instanceof MediaFout
          ? e.message
          : "Uploaden is niet gelukt. Kijk je verbinding na en probeer opnieuw."
      );
      return null;
    } finally {
      setBezig(false);
      onBezig?.(false);
    }
  };

  return { upload, bezig, fout, setFout };
}

function BestandKnop({
  accept,
  label,
  bezig,
  onKies,
}: {
  accept: string;
  label: string;
  bezig: boolean;
  onKies: (bestand: File | undefined) => void;
}) {
  return (
    <label
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:border-merk cursor-pointer ${
        bezig ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {bezig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
      {bezig ? "Bezig met uploaden ..." : label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        disabled={bezig}
        onChange={(e) => {
          onKies(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function UploadFout({ tekst }: { tekst: string }) {
  if (!tekst) return null;
  return (
    <p role="alert" className="text-xs font-semibold text-rose-800">
      {tekst}
    </p>
  );
}
