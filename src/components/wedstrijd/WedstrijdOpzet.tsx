"use client";

import React, { useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { OefeningVan, WedstrijdInstellingen } from "@/lib/types";
import { MAX_TEAMS, STANDAARD_INSTELLINGEN, heeftEigenTijden } from "@/lib/wedstrijd";

const TIJDEN = [10, 20, 30, 60, 90, 120];

/**
 * De keuzes voor één wedstrijd. De standaard is bewust rustig: punten voor een juist
 * antwoord, zonder snelheidsbonus (zie docs/WETENSCHAPPELIJKE_BASIS.md).
 */
export function WedstrijdOpzet({
  oefening,
  bezig,
  onStart,
  onAnnuleer,
}: {
  oefening: OefeningVan<"quiz">;
  bezig: boolean;
  onStart: (instellingen: WedstrijdInstellingen) => void;
  onAnnuleer: () => void;
}) {
  // Een quiz met een eigen tijd per vraag (bv. uit Kahoot) speelt standaard met die tijden.
  const eigenTijden = heeftEigenTijden(oefening.content.questions);
  const [inst, setInst] = useState<WedstrijdInstellingen>(
    eigenTijden ? { ...STANDAARD_INSTELLINGEN, tijdUitQuiz: true } : STANDAARD_INSTELLINGEN
  );
  const zet = (wijziging: Partial<WedstrijdInstellingen>) => setInst((i) => ({ ...i, ...wijziging }));
  const vragen = oefening.content.questions;
  const aantal = vragen.filter((v) => v.type !== "dia").length;
  const dias = vragen.length - aantal;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onStart(inst);
      }}
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6"
    >
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">Quizwedstrijd</p>
        <h2 className="font-bold text-lg text-merk-900">{oefening.title}</h2>
        <p className="text-sm text-slate-600">
          {aantal} {aantal === 1 ? "vraag" : "vragen"}
          {dias > 0 && ` en ${dias} ${dias === 1 ? "dia" : "dia's"}`}. Cursisten doen mee met een bijnaam, zonder
          account.
        </p>
      </div>

      <Groep titel="Spelvorm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Keuzekaart
            actief={inst.spelvorm === "rustig"}
            onClick={() => zet({ spelvorm: "rustig" })}
            titel="Rustig"
            label="Aanbevolen"
            uitleg="1000 punten voor elk juist antwoord. Snelheid telt niet, dus nadenken loont."
          />
          <Keuzekaart
            actief={inst.spelvorm === "klassiek"}
            onClick={() => zet({ spelvorm: "klassiek", seconden: inst.seconden || 30 })}
            titel="Klassiek"
            uitleg="Zoals Kahoot: wie sneller juist antwoordt, krijgt meer punten (500 tot 1000)."
          />
        </div>
      </Groep>

      <Groep titel="Tijd per vraag">
        <div className="flex flex-wrap gap-2">
          {eigenTijden && (
            <Chip actief={Boolean(inst.tijdUitQuiz)} onClick={() => zet({ tijdUitQuiz: true })}>
              Zoals in de quiz
            </Chip>
          )}
          {TIJDEN.map((s) => (
            <Chip
              key={s}
              actief={!inst.tijdUitQuiz && inst.seconden === s}
              onClick={() => zet({ seconden: s, tijdUitQuiz: false })}
            >
              {s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${s % 60} s` : ""}`}
            </Chip>
          ))}
          {inst.spelvorm === "rustig" && (
            <Chip
              actief={!inst.tijdUitQuiz && inst.seconden === 0}
              onClick={() => zet({ seconden: 0, tijdUitQuiz: false })}
            >
              Ik sluit zelf af
            </Chip>
          )}
        </div>
        {inst.tijdUitQuiz && (
          <p className="text-xs text-slate-500 mt-2">
            Elke vraag krijgt de tijd die de maker koos. Een vraag zonder eigen tijd krijgt {inst.seconden || 30} s.
          </p>
        )}
        {inst.spelvorm === "klassiek" && (
          <p className="text-xs text-slate-500 mt-2">Bij klassiek is een tijdslimiet nodig om de snelheid te meten.</p>
        )}
      </Groep>

      <Groep titel="Bonus voor een reeks">
        <div className="flex flex-wrap gap-2">
          <Chip actief={inst.reeksbonus} onClick={() => zet({ reeksbonus: true })}>
            Aan
          </Chip>
          <Chip actief={!inst.reeksbonus} onClick={() => zet({ reeksbonus: false })}>
            Uit
          </Chip>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Wie meerdere vragen op rij juist heeft, krijgt extra: +100 bij het tweede, tot +500.
        </p>
      </Groep>

      <Groep titel="Teams">
        <div className="flex flex-wrap gap-2">
          <Chip actief={inst.teams === 0} onClick={() => zet({ teams: 0 })}>
            Ieder voor zich
          </Chip>
          {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map((n) => (
            <Chip key={n} actief={inst.teams === n} onClick={() => zet({ teams: n })}>
              {n} teams
            </Chip>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          De teamscore is het gemiddelde van de leden, dus een groter team heeft geen voordeel.
          Cursisten kiezen zelf hun team; jij kan de teams met één klik gelijk verdelen.
        </p>
      </Groep>

      <Groep titel="Scorebord">
        <div className="space-y-2">
          <Vinkje
            aan={inst.tussenstand === "elkeVraag"}
            onWijzig={(aan) => zet({ tussenstand: aan ? "elkeVraag" : "einde" })}
            titel="Scorebord na elke vraag"
            uitleg="Na de uitleg toont het bord de top 5. Elke cursist ziet zijn eigen plaats op zijn toestel."
          />
          <Vinkje
            aan={inst.podium !== false}
            onWijzig={(aan) => zet({ podium: aan })}
            titel="Podium op het einde"
            uitleg="Uit: geen rangschikking. Iedereen ziet alleen zijn eigen punten, zonder te weten wie won."
          />
        </div>
      </Groep>

      <button
        type="submit"
        disabled={bezig || aantal === 0}
        className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-base transition-colors flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{bezig ? "Wachtruimte openen ..." : "Open de wachtruimte"}</span>
      </button>

      <button
        type="button"
        onClick={onAnnuleer}
        className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1 mx-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kies een andere quiz</span>
      </button>
    </form>
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

function Vinkje({
  aan,
  onWijzig,
  titel,
  uitleg,
}: {
  aan: boolean;
  onWijzig: (aan: boolean) => void;
  titel: string;
  uitleg: string;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-merk cursor-pointer">
      <input
        type="checkbox"
        checked={aan}
        onChange={(e) => onWijzig(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-merk-800 shrink-0"
      />
      <span>
        <span className="block text-sm font-bold text-slate-800">{titel}</span>
        <span className="block text-xs text-slate-500 mt-0.5">{uitleg}</span>
      </span>
    </label>
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

function Keuzekaart({
  actief,
  onClick,
  titel,
  label,
  uitleg,
}: {
  actief: boolean;
  onClick: () => void;
  titel: string;
  label?: string;
  uitleg: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      className={`text-left p-4 rounded-xl border-2 transition-colors ${
        actief ? "border-merk-800 bg-merk-50" : "border-slate-200 bg-white hover:border-merk"
      }`}
    >
      <span className="flex items-center gap-2 mb-1">
        <span className="font-bold text-slate-900">{titel}</span>
        {label && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-merk-800 text-white">
            {label}
          </span>
        )}
      </span>
      <span className="block text-xs text-slate-600 leading-relaxed">{uitleg}</span>
    </button>
  );
}
