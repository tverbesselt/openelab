"use client";

import React, { useState } from "react";
import { ArrowLeft, Film, ImageIcon, Mic, Pencil, Play, Plus, Type, X } from "lucide-react";
import { BordInstellingen, BordSoort } from "@/lib/types";
import {
  BORD_SOORTEN,
  MAX_KOLOMMEN,
  MAX_KOLOMNAAM,
  MAX_TEKST,
  PER_CURSIST_KEUZES,
  SECONDEN_KEUZES,
  STANDAARD_BORD,
  TEKEN_GRENZEN,
} from "@/lib/bord";

const ICONEN: Record<BordSoort, React.ElementType> = {
  tekst: Type,
  afbeelding: ImageIcon,
  tekening: Pencil,
  video: Film,
  audio: Mic,
};

export const MAX_OPDRACHT = 500;

/** Het whiteboard klaarzetten: de opdracht en wat cursisten mogen toevoegen. */
export function BordOpzet({
  bezig,
  onStart,
  onAnnuleer,
}: {
  bezig: boolean;
  onStart: (opdracht: string, instellingen: BordInstellingen) => void;
  onAnnuleer: () => void;
}) {
  const [opdracht, setOpdracht] = useState("");
  const [inst, setInst] = useState<BordInstellingen>(STANDAARD_BORD);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onStart(opdracht.trim(), schoonInstellingen(inst));
      }}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
    >
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">Whiteboard</p>
        <label className="block">
          <span className="block font-bold text-lg text-merk-900 mb-2">Wat is de opdracht?</span>
          <input
            value={opdracht}
            onChange={(e) => setOpdracht(e.target.value.slice(0, MAX_OPDRACHT))}
            placeholder="Bv. Wat weet je al over de Franse Revolutie?"
            className="w-full px-4 py-3 rounded-xl border border-veldrand bg-white text-base focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
        </label>
        <p className="text-xs text-slate-500 mt-2">
          Cursisten doen mee met de pincode, zonder account. Jij en zij zien het bord live groeien.
        </p>
      </div>

      <BordInstellingenVelden inst={inst} onWijzig={setInst} />

      <button
        type="submit"
        disabled={bezig || inst.soorten.length === 0}
        className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{bezig ? "Bord openen ..." : "Open het bord"}</span>
      </button>

      <button
        type="button"
        onClick={onAnnuleer}
        className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kies iets anders</span>
      </button>
    </form>
  );
}

/**
 * Dubbele spaties eruit en lege kolommen achteraan weg, vóór het naar de databank gaat.
 * Een lege kolom tussenin krijgt een naam in plaats van te verdwijnen: anders schuiven de
 * kaartjes tijdens de les naar de verkeerde kolom.
 */
export function schoonInstellingen(inst: BordInstellingen): BordInstellingen {
  const kolommen = inst.kolommen
    .slice(0, MAX_KOLOMMEN)
    .map((k) => k.replace(/\s+/g, " ").trim().slice(0, MAX_KOLOMNAAM));
  while (kolommen.length && !kolommen[kolommen.length - 1]) kolommen.pop();
  return { ...inst, kolommen: kolommen.map((k, i) => k || `Kolom ${i + 1}`) };
}

/**
 * De keuzes zelf. Dezelfde velden staan bij het openen en tijdens de les, zodat de leraar
 * bv. na tien minuten ook filmpjes kan toelaten of het nakijken kan aanzetten.
 */
export function BordInstellingenVelden({
  inst,
  onWijzig,
  tijdensLes = false,
}: {
  inst: BordInstellingen;
  onWijzig: (inst: BordInstellingen) => void;
  /** Kolommen verwijderen tijdens de les zou kaartjes laten zweven; dan alleen hernoemen en toevoegen. */
  tijdensLes?: boolean;
}) {
  const zet = (wijziging: Partial<BordInstellingen>) => onWijzig({ ...inst, ...wijziging });
  const [eigenGrens, setEigenGrens] = useState(
    inst.maxTekens > 0 && !TEKEN_GRENZEN.includes(inst.maxTekens) ? String(inst.maxTekens) : ""
  );

  const wisselSoort = (soort: BordSoort) =>
    zet({
      soorten: inst.soorten.includes(soort)
        ? inst.soorten.filter((s) => s !== soort)
        : BORD_SOORTEN.map((s) => s.soort).filter((s) => s === soort || inst.soorten.includes(s)),
    });

  return (
    <div className="space-y-6">
      <Groep titel="Wat mogen cursisten toevoegen?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {BORD_SOORTEN.map((s) => {
            const Icon = ICONEN[s.soort];
            const aan = inst.soorten.includes(s.soort);
            return (
              <button
                key={s.soort}
                type="button"
                onClick={() => wisselSoort(s.soort)}
                aria-pressed={aan}
                className={`text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-colors ${
                  aan ? "border-merk-800 bg-merk-50" : "border-slate-200 bg-white hover:border-merk"
                }`}
              >
                <span
                  className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${
                    aan ? "bg-merk-800 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">{s.label}</span>
                  <span className="block text-xs text-slate-600">{s.uitleg}</span>
                </span>
              </button>
            );
          })}
        </div>
        {inst.soorten.length === 0 && (
          <p className="text-xs font-semibold text-rose-800 mt-2">
            Kies minstens één soort. Wil je even niemand laten toevoegen? Zet het bord dan dicht.
          </p>
        )}
      </Groep>

      <Groep titel="Hoe lang mag een tekst zijn?">
        <div className="flex flex-wrap items-center gap-2">
          {TEKEN_GRENZEN.map((n) => (
            <Chip
              key={n}
              actief={inst.maxTekens === n}
              onClick={() => {
                setEigenGrens("");
                zet({ maxTekens: n });
              }}
            >
              {n} tekens
            </Chip>
          ))}
          <Chip
            actief={inst.maxTekens === 0}
            onClick={() => {
              setEigenGrens("");
              zet({ maxTekens: 0 });
            }}
          >
            Geen grens
          </Chip>
          <label className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-700">
            <span>Zelf:</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_TEKST}
              value={eigenGrens}
              onChange={(e) => {
                setEigenGrens(e.target.value);
                const n = Math.round(Number(e.target.value));
                if (n >= 1) zet({ maxTekens: Math.min(n, MAX_TEKST) });
              }}
              placeholder="aantal"
              aria-label="Eigen aantal tekens"
              className={`w-24 px-3 py-2 rounded-xl border text-sm ${
                eigenGrens ? "border-merk-800" : "border-slate-200"
              }`}
            />
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Geldt ook voor het onderschrift bij een foto, tekening, filmpje of opname.
          {inst.maxTekens === 0 && ` Zonder grens is een tekst hoogstens ${MAX_TEKST} tekens.`}
        </p>
      </Groep>

      {inst.soorten.includes("audio") && (
        <Groep titel="Hoe lang mag een opname duren?">
          <div className="flex flex-wrap gap-2">
            {SECONDEN_KEUZES.map((s) => (
              <Chip key={s} actief={inst.maxSeconden === s} onClick={() => zet({ maxSeconden: s })}>
                {s < 60 ? `${s} seconden` : `${s / 60} ${s === 60 ? "minuut" : "minuten"}`}
              </Chip>
            ))}
          </div>
        </Groep>
      )}

      <Groep titel="Hoeveel bijdragen per cursist?">
        <div className="flex flex-wrap gap-2">
          {PER_CURSIST_KEUZES.map((n) => (
            <Chip key={n} actief={inst.maxPerCursist === n} onClick={() => zet({ maxPerCursist: n })}>
              {n}
            </Chip>
          ))}
          <Chip actief={inst.maxPerCursist === 0} onClick={() => zet({ maxPerCursist: 0 })}>
            Onbeperkt
          </Chip>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Eén bijdrage per cursist dwingt tot kiezen: wat is je beste idee?
        </p>
      </Groep>

      <Groep titel="Met naam of anoniem?">
        <div className="flex flex-wrap gap-2">
          <Chip actief={inst.namen === "anoniem"} onClick={() => zet({ namen: "anoniem" })}>
            Anoniem
          </Chip>
          <Chip actief={inst.namen === "naam"} onClick={() => zet({ namen: "naam" })}>
            Met een naam
          </Chip>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Anoniem durft wie twijfelt ook iets te zetten. Met een naam kiest de cursist zelf hoe hij heet.
        </p>
      </Groep>

      <Groep titel="Eerst nakijken?">
        <div className="flex flex-wrap gap-2">
          <Chip actief={!inst.nakijken} onClick={() => zet({ nakijken: false })}>
            Meteen op het bord
          </Chip>
          <Chip actief={inst.nakijken} onClick={() => zet({ nakijken: true })}>
            Ik keur eerst goed
          </Chip>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Bij nakijken zie jij een bijdrage eerst alleen op jouw scherm, tot je ze goedkeurt.
        </p>
      </Groep>

      <Groep titel="Zien cursisten het bord op hun toestel?">
        <div className="flex flex-wrap gap-2">
          <Chip actief={inst.zichtbaar} onClick={() => zet({ zichtbaar: true })}>
            Ja, live
          </Chip>
          <Chip actief={!inst.zichtbaar} onClick={() => zet({ zichtbaar: false })}>
            Nee, alleen vooraan
          </Chip>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Alleen vooraan: iedereen denkt eerst zelf na, zonder af te kijken wat de anderen zetten.
        </p>
      </Groep>

      <Groep titel="Kolommen (mag leeg blijven)">
        <Kolommen
          kolommen={inst.kolommen}
          tijdensLes={tijdensLes}
          onWijzig={(kolommen) => zet({ kolommen })}
        />
      </Groep>
    </div>
  );
}

function Kolommen({
  kolommen,
  tijdensLes,
  onWijzig,
}: {
  kolommen: string[];
  tijdensLes: boolean;
  onWijzig: (kolommen: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {kolommen.map((k, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={k}
            onChange={(e) => onWijzig(kolommen.map((oud, j) => (j === i ? e.target.value.slice(0, MAX_KOLOMNAAM) : oud)))}
            placeholder={`Kolom ${i + 1}`}
            aria-label={`Naam van kolom ${i + 1}`}
            className="flex-1 px-3 py-2 rounded-xl border border-veldrand bg-white text-sm"
          />
          {!tijdensLes && (
            <button
              type="button"
              onClick={() => onWijzig(kolommen.filter((_, j) => j !== i))}
              aria-label={`Kolom ${i + 1} weghalen`}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-rose-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {kolommen.length < MAX_KOLOMMEN && (
        <button
          type="button"
          onClick={() => onWijzig([...kolommen, ""])}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-700 hover:border-merk"
        >
          <Plus className="w-4 h-4" />
          Kolom toevoegen
        </button>
      )}
      <p className="text-xs text-slate-500">
        {kolommen.length === 0
          ? "Bv. “Voordelen” en “Nadelen”, of “Wat ik weet” en “Wat ik wil weten”. Zonder kolommen komt alles op één muur."
          : "Cursisten kiezen zelf een kolom. Jij kan een kaartje nadien verplaatsen."}
      </p>
    </div>
  );
}

function Groep({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="block text-sm font-bold text-slate-800 mb-2">{titel}</legend>
      {children}
    </fieldset>
  );
}

function Chip({
  actief,
  onClick,
  children,
}: {
  actief: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-colors ${
        actief
          ? "bg-merk-800 text-white border-merk-800"
          : "bg-white text-slate-700 border-slate-200 hover:border-merk"
      }`}
    >
      {children}
    </button>
  );
}
