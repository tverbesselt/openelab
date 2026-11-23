"use client";

import React, { useState } from "react";
import { Plus, Trash2, Timer, Image as ImageIcon } from "lucide-react";
import { Exercise, QuizMedia, QuizQuestion } from "@/lib/types";
import { FotoKiezer, MediaKiezer, OptieFoto } from "./MediaKiezer";
import type { VormProps } from "./NieuweVormen";
import { bestaandVan, knopTekst } from "@/werkvormen/soorten";
import { Veld, Foutmelding, MaakKnop, FeedbackKiezer, INVOER } from "./Velden";

const KLEIN_VELD =
  "w-full p-2.5 text-sm rounded-lg bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none";

const MAX_OPTIES = 6;
const MIN_DELEN = 2;
const MAX_DELEN = 8;

/** De tijden die je per vraag kunt kiezen, zoals in Kahoot. */
const TIJDEN = [5, 10, 20, 30, 45, 60, 90, 120, 180, 240];

const PUNTEN: { waarde: 0 | 1 | 2; label: string }[] = [
  { waarde: 1, label: "Gewone punten" },
  { waarde: 2, label: "Dubbele punten" },
  { waarde: 0, label: "Geen punten" },
];

type Soort = "keuze" | "typ" | "volgorde" | "dia";

const SOORTEN: [Soort, string][] = [
  ["keuze", "Kiezen uit antwoorden"],
  ["typ", "Antwoord intypen"],
  ["volgorde", "Op volgorde zetten"],
  ["dia", "Dia met uitleg"],
];

interface NieuweOptie {
  /** Vaste sleutel, zodat een antwoord verwijderen de foto van het volgende niet verschuift. */
  sleutel: string;
  tekst: string;
  juist: boolean;
  beeld?: QuizMedia;
}

interface NieuweVraag {
  /** Vaste sleutel, zodat een vraag verwijderen de media van de volgende niet verschuift. */
  sleutel: string;
  /**
   * Bij aanpassen: het id van de bestaande vraag. Dat blijft, zodat de struikelvragen en de
   * herhaling van cursisten bij dezelfde vraag blijven horen.
   */
  id?: string;
  /** Bij aanpassen: dit was een waar-of-niet-waarvraag. Zo blijft ze dat, zolang het kan. */
  waarOfNiet?: boolean;
  soort: Soort;
  /** De vraag, de opdracht (volgorde) of de titel (dia). */
  vraag: string;
  /** Kiezen: de antwoordmogelijkheden, met wat juist is. */
  opties: NieuweOptie[];
  /** Intypen: het antwoord dat we tonen. */
  juist: string;
  /** Intypen: andere schrijfwijzen die ook goed zijn, één per regel. */
  andere: string;
  /** Volgorde: de delen, in de juiste volgorde. */
  delen: string[];
  /** De uitleg bij het antwoord, of de tekst van een dia. */
  uitleg: string;
  media?: QuizMedia;
  /** Leeg = de tijd die de leraar kiest bij de start van de wedstrijd. */
  seconden?: number;
  punten: 0 | 1 | 2;
}

let volgnummer = 0;
const sleutel = (voor: string) => `${voor}${++volgnummer}`;

const legeOptie = (juist = false): NieuweOptie => ({ sleutel: sleutel("o"), tekst: "", juist });

const legeVraag = (): NieuweVraag => ({
  sleutel: sleutel("v"),
  soort: "keuze",
  vraag: "",
  opties: [legeOptie(true), legeOptie(), legeOptie()],
  juist: "",
  andere: "",
  delen: ["", "", ""],
  uitleg: "",
  punten: 1,
});

/** Een bestaande quizvraag terug in de velden van het formulier. */
function alsNieuweVraag(q: QuizQuestion): NieuweVraag {
  const basis: NieuweVraag = {
    ...legeVraag(),
    id: q.id,
    vraag: q.question,
    uitleg: q.explanation ?? "",
    media: q.media,
    seconden: q.seconden,
    punten: q.punten ?? 1,
  };

  if (q.type === "dia") return { ...basis, soort: "dia" };

  if (q.type === "typ") {
    const antwoorden = q.antwoorden ?? [];
    const juist = antwoorden[0] ?? "";
    return {
      ...basis,
      soort: "typ",
      juist,
      andere: antwoorden.slice(1).join("\n"),
      // De uitleg die we zelf invulden als de leraar niets typte, komt bij het bewaren vanzelf terug.
      uitleg: basis.uitleg === `Het juiste antwoord is "${juist}".` ? "" : basis.uitleg,
    };
  }

  if (q.type === "volgorde") {
    const delen = [...q.options];
    while (delen.length < MIN_DELEN) delen.push("");
    return {
      ...basis,
      soort: "volgorde",
      delen,
      uitleg: basis.uitleg === `De juiste volgorde is: ${q.options.join(" → ")}.` ? "" : basis.uitleg,
    };
  }

  const juisteTeksten = q.correctAnswers.map((i) => `"${q.options[i]}"`);
  const zelfIngevuld =
    juisteTeksten.length > 1
      ? `De juiste antwoorden zijn ${juisteTeksten.join(", ")}.`
      : `Het juiste antwoord is ${juisteTeksten[0]}.`;
  return {
    ...basis,
    soort: "keuze",
    waarOfNiet: q.type === "true_false",
    opties: q.options.map((tekst, i) => ({
      ...legeOptie(q.correctAnswers.includes(i)),
      tekst,
      beeld: q.optieMedia?.[i] ?? undefined,
    })),
    uitleg: basis.uitleg === zelfIngevuld ? "" : basis.uitleg,
  };
}

function toonTijd(s: number): string {
  if (s < 60) return `${s} seconden`;
  const min = s / 60;
  return `${String(min).replace(".", ",")} ${min === 1 ? "minuut" : "minuten"}`;
}

/** Media zonder lege velden: Firestore weigert undefined. */
function schoneMedia(m: QuizMedia, alt = m.alt): QuizMedia {
  const beschrijving = alt?.trim();
  return {
    soort: m.soort,
    url: m.url,
    ...(beschrijving && { alt: beschrijving }),
    ...(m.start !== undefined && { start: m.start }),
    ...(m.eind !== undefined && { eind: m.eind }),
    // De licentie van een vrije afbeelding vraagt dat de maker vermeld blijft.
    ...(m.bron && { bron: m.bron }),
  };
}

/** Is er in deze vraag al iets ingevuld? Een volledig leeg blok slaan we gewoon over. */
function heeftInhoud(v: NieuweVraag): boolean {
  if (v.vraag.trim() || v.uitleg.trim() || v.media) return true;
  if (v.soort === "keuze") return v.opties.some((o) => o.tekst.trim() || o.beeld);
  if (v.soort === "typ") return !!(v.juist.trim() || v.andere.trim());
  if (v.soort === "volgorde") return v.delen.some((d) => d.trim());
  return false;
}

/**
 * Zet de ingevulde vragen om in quizvragen. Geeft een foutmelding terug als er iets
 * ontbreekt, met het nummer van de vraag erbij.
 */
function bouwVragen(vragen: NieuweVraag[]): { fout: string } | { questions: QuizQuestion[] } {
  const ingevuld = vragen.filter(heeftInhoud);
  if (ingevuld.length === 0) return { fout: "Vul minstens één vraag in." };

  // Een bestaande vraag houdt haar id; een nieuwe krijgt er een dat nog vrij is.
  const bezet = new Set(ingevuld.flatMap((v) => (v.id ? [v.id] : [])));
  const nieuwId = () => {
    let n = 0;
    while (bezet.has(`q-${n}`)) n++;
    bezet.add(`q-${n}`);
    return `q-${n}`;
  };

  const questions: QuizQuestion[] = [];
  for (const v of ingevuld) {
    const nr = vragen.indexOf(v) + 1;
    const vraag = v.vraag.trim();
    const uitleg = v.uitleg.trim();
    const extra = {
      ...(v.media && { media: schoneMedia(v.media) }),
      ...(v.seconden !== undefined && { seconden: v.seconden }),
      ...(v.punten !== 1 && v.soort !== "dia" && { punten: v.punten }),
    };
    const id = v.id ?? nieuwId();

    if (v.soort === "dia") {
      if (!vraag) return { fout: `Dia ${nr} heeft een titel nodig.` };
      questions.push({
        id,
        question: vraag,
        options: [],
        correctAnswers: [],
        type: "dia",
        explanation: uitleg,
        ...extra,
      });
      continue;
    }

    if (!vraag) return { fout: `Vraag ${nr} heeft nog geen vraag.` };

    if (v.soort === "typ") {
      // Elke regel is een schrijfwijze die goed gerekend wordt; de eerste tonen we.
      const antwoorden = [v.juist, ...v.andere.split(/\r?\n|,/)].map((a) => a.trim()).filter(Boolean);
      if (!v.juist.trim()) return { fout: `Vraag ${nr} heeft nog geen juist antwoord.` };
      questions.push({
        id,
        question: vraag,
        options: [],
        correctAnswers: [],
        type: "typ",
        antwoorden,
        explanation: uitleg || `Het juiste antwoord is "${antwoorden[0]}".`,
        ...extra,
      });
      continue;
    }

    if (v.soort === "volgorde") {
      const delen = v.delen.map((d) => d.trim()).filter(Boolean);
      if (delen.length < MIN_DELEN) {
        return { fout: `Vraag ${nr} heeft minstens ${MIN_DELEN} delen nodig om op volgorde te zetten.` };
      }
      questions.push({
        id,
        question: vraag,
        options: delen,
        correctAnswers: [],
        type: "volgorde",
        explanation: uitleg || `De juiste volgorde is: ${delen.join(" → ")}.`,
        ...extra,
      });
      continue;
    }

    // Kiezen: lege antwoorden vallen weg, de juiste schuiven mee.
    const opties = v.opties.filter((o) => o.tekst.trim() || o.beeld);
    const zonderBeschrijving = opties.findIndex((o) => o.beeld && !o.tekst.trim());
    if (zonderBeschrijving >= 0) {
      return {
        fout: `Bij vraag ${nr} staat een foto zonder beschrijving. Typ naast de foto wat erop staat, voor wie de foto niet kan zien.`,
      };
    }
    if (opties.length < 2) return { fout: `Vraag ${nr} heeft minstens twee antwoorden nodig.` };
    const juist = opties.flatMap((o, i) => (o.juist ? [i] : []));
    if (juist.length === 0) return { fout: `Duid bij vraag ${nr} aan welk antwoord juist is.` };
    if (juist.length === opties.length) {
      return { fout: `Bij vraag ${nr} zijn alle antwoorden juist. Maak er minstens één fout.` };
    }

    const teksten = opties.map((o) => o.tekst.trim());
    const juisteTeksten = juist.map((i) => `"${teksten[i]}"`);
    questions.push({
      id,
      question: vraag,
      options: teksten,
      correctAnswers: juist,
      type:
        juist.length > 1
          ? "multiple_response"
          : v.waarOfNiet && opties.length === 2
            ? "true_false"
            : "multiple_choice",
      ...(opties.some((o) => o.beeld) && {
        optieMedia: opties.map((o, i) => (o.beeld ? schoneMedia(o.beeld, teksten[i]) : null)),
      }),
      explanation:
        uitleg ||
        (juist.length > 1
          ? `De juiste antwoorden zijn ${juisteTeksten.join(", ")}.`
          : `Het juiste antwoord is ${juisteTeksten[0]}.`),
      ...extra,
    });
  }
  return { questions };
}

/**
 * Eenvoudige quiz maken: vragen om uit te kiezen, in te typen of op volgorde te zetten,
 * en dia's met uitleg tussendoor. Tijd en punten per vraag zijn er alleen voor de
 * Quizwedstrijd; daarom staan ze ingeklapt.
 */
export function QuizVorm(p: VormProps) {
  const bestaand = bestaandVan(p, "quiz");
  const [titel, setTitel] = useState(bestaand?.title ?? "");
  const [cover, setCover] = useState<QuizMedia | undefined>(bestaand?.cover);
  const [metCover, setMetCover] = useState(false);
  // Nieuw: standaard een tweede poging. Bestaand zonder keuze: meteen het antwoord, zoals vroeger.
  const [tweedeKans, setTweedeKans] = useState(bestaand ? bestaand.didacticConfig.tweedeKans === true : true);
  const [vragen, setVragen] = useState<NieuweVraag[]>(() =>
    bestaand?.content.questions.length ? bestaand.content.questions.map(alsNieuweVraag) : [legeVraag()]
  );
  // Hoeveel foto's of fragmenten nog aan het uploaden zijn: zolang dat loopt, wacht bewaren.
  const [uploads, setUploads] = useState(0);
  const onBezig = (b: boolean) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)));

  // Functioneel bijwerken: een upload kan klaar zijn terwijl je al verder typt.
  const wijzig = (s: string, aanpassing: Partial<NieuweVraag> | ((v: NieuweVraag) => Partial<NieuweVraag>)) =>
    setVragen((huidig) =>
      huidig.map((v) =>
        v.sleutel === s ? { ...v, ...(typeof aanpassing === "function" ? aanpassing(v) : aanpassing) } : v
      )
    );

  const wijzigOptie = (s: string, optie: string, aanpassing: Partial<NieuweOptie>) =>
    wijzig(s, (v) => ({
      opties: v.opties.map((o) => (o.sleutel === optie ? { ...o, ...aanpassing } : o)),
    }));

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const gebouwd = bouwVragen(vragen);
    if ("fout" in gebouwd) {
      p.setFout(gebouwd.fout);
      return;
    }
    p.setFout("");

    const quiz: Exercise = {
      ...p.basis(),
      id: `quiz-${Date.now()}`,
      title: titel.trim(),
      description: tweedeKans
        ? "Korte quiz. Bij een fout antwoord probeer je het eerst nog een keer."
        : "Korte quiz met directe uitleg bij elk antwoord.",
      category: "quiz",
      didacticGoal: "check",
      type: "quiz",
      tags: ["Quiz"],
      ...(cover && { cover: schoneMedia(cover) }),
      content: { questions: gebouwd.questions },
      didacticConfig: {
        showImmediateFeedback: true,
        allowRetryMissed: true,
        enableGamification: false,
        tweedeKans,
      },
    };

    p.bewaar([quiz]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Titel van je quiz">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Bijvoorbeeld: kennischeck elektriciteit"
          required
          className={INVOER}
        />
      </Veld>

      {metCover || cover ? (
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ImageIcon className="w-3.5 h-3.5" />
              Omslagfoto van de quiz
            </span>
            <button
              type="button"
              onClick={() => {
                setCover(undefined);
                setMetCover(false);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Weghalen
            </button>
          </div>
          <FotoKiezer waarde={cover} onWijzig={setCover} onBezig={onBezig} altNodig={false} />
          <p className="text-xs text-slate-500">
            Staat op de kaart in de bibliotheek en bij de start van de quiz.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMetCover(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:border-merk hover:text-merk-900"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Omslagfoto toevoegen (mag leeg)
        </button>
      )}

      {vragen.map((vraag, index) => {
        const nr = index + 1;
        const isDia = vraag.soort === "dia";
        return (
          <div key={vraag.sleutel} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {isDia ? "Dia" : "Vraag"} {nr}
              </span>
              {vragen.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVragen((huidig) => huidig.filter((v) => v.sleutel !== vraag.sleutel))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={`Verwijder ${isDia ? "dia" : "vraag"} ${nr}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Soort van vraag ${nr}`}>
              {SOORTEN.map(([soort, label]) => (
                <button
                  key={soort}
                  type="button"
                  aria-pressed={vraag.soort === soort}
                  onClick={() => wijzig(vraag.sleutel, { soort })}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    vraag.soort === soort
                      ? "bg-merk-800 text-white border-merk-800"
                      : "bg-white text-slate-700 border-slate-200 hover:border-merk"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={vraag.vraag}
              onChange={(e) => wijzig(vraag.sleutel, { vraag: e.target.value })}
              placeholder={
                isDia
                  ? "Titel van de dia"
                  : vraag.soort === "volgorde"
                    ? "De opdracht, bijvoorbeeld: Zet de stappen van een wondzorg op volgorde"
                    : "Je vraag"
              }
              aria-label={isDia ? `Titel van dia ${nr}` : `Vraag ${nr}`}
              required
              className={KLEIN_VELD}
            />

            <MediaKiezer
              waarde={vraag.media}
              bij={isDia ? "de dia" : "de vraag"}
              onWijzig={(media) => wijzig(vraag.sleutel, { media })}
              onBezig={onBezig}
            />

            {vraag.soort === "keuze" && (
              <Opties
                vraag={vraag}
                nr={nr}
                onBezig={onBezig}
                wijzigOptie={(optie, aanpassing) => wijzigOptie(vraag.sleutel, optie, aanpassing)}
                wijzigOpties={(opties) => wijzig(vraag.sleutel, { opties })}
              />
            )}

            {vraag.soort === "typ" && (
              <>
                <input
                  type="text"
                  value={vraag.juist}
                  onChange={(e) => wijzig(vraag.sleutel, { juist: e.target.value })}
                  placeholder="Juist antwoord"
                  aria-label={`Juist antwoord bij vraag ${nr}`}
                  required
                  className="w-full p-2.5 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold focus:border-emerald-400 focus:outline-none"
                />
                <div>
                  <textarea
                    value={vraag.andere}
                    onChange={(e) => wijzig(vraag.sleutel, { andere: e.target.value })}
                    placeholder="Andere schrijfwijzen die ook goed zijn, één per regel (mag leeg)"
                    aria-label={`Andere goede schrijfwijzen bij vraag ${nr}`}
                    rows={2}
                    className={KLEIN_VELD}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Hoofdletters, accenten en extra spaties maken niet uit. Een cursist die
                    &quot;Cafe&quot; typt, heeft &quot;café&quot; juist.
                  </p>
                </div>
              </>
            )}

            {vraag.soort === "volgorde" && (
              <Delen
                delen={vraag.delen}
                nr={nr}
                onWijzig={(delen) => wijzig(vraag.sleutel, { delen })}
              />
            )}

            {isDia ? (
              <textarea
                rows={4}
                value={vraag.uitleg}
                onChange={(e) => wijzig(vraag.sleutel, { uitleg: e.target.value })}
                placeholder="De tekst van de dia (mag leeg). Een dia is geen vraag: ze telt niet mee voor de score."
                aria-label={`Tekst van dia ${nr}`}
                className={KLEIN_VELD}
              />
            ) : (
              <input
                type="text"
                value={vraag.uitleg}
                onChange={(e) => wijzig(vraag.sleutel, { uitleg: e.target.value })}
                placeholder="Waarom het juiste antwoord juist is (mag leeg, maar dit is de leerwinst)"
                aria-label={`Uitleg bij vraag ${nr}`}
                className={KLEIN_VELD}
              />
            )}

            <TijdEnPunten
              vraag={vraag}
              nr={nr}
              onWijzig={(aanpassing) => wijzig(vraag.sleutel, aanpassing)}
            />
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => setVragen((huidig) => [...huidig, legeVraag()])}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>Nog een vraag</span>
      </button>

      <FeedbackKiezer tweedeKans={tweedeKans} onWijzig={setTweedeKans} />

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} uploads={uploads} label={knopTekst(p, "Maak mijn quiz")} />
    </form>
  );
}

/* ── Antwoorden om uit te kiezen ─────────────────────────────────────────── */

function Opties({
  vraag,
  nr,
  onBezig,
  wijzigOptie,
  wijzigOpties,
}: {
  vraag: NieuweVraag;
  nr: number;
  onBezig: (b: boolean) => void;
  wijzigOptie: (optie: string, aanpassing: Partial<NieuweOptie>) => void;
  wijzigOpties: (opties: NieuweOptie[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs text-slate-500 mb-1">
        Vink aan wat juist is. Meer dan één juist antwoord mag: dan duidt de cursist ze allemaal
        aan. Een foto bij een antwoord kan ook.
      </legend>
      {vraag.opties.map((optie, i) => {
        const label = `antwoord ${i + 1} van vraag ${nr}`;
        return (
          <div key={optie.sleutel} className="flex flex-wrap items-center gap-2">
            <label
              className={`shrink-0 inline-flex items-center gap-1.5 px-2 h-11 rounded-lg border text-xs font-bold cursor-pointer ${
                optie.juist
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-white border-slate-200 text-slate-500"
              }`}
            >
              <input
                type="checkbox"
                checked={optie.juist}
                onChange={(e) => wijzigOptie(optie.sleutel, { juist: e.target.checked })}
                aria-label={`${label[0].toUpperCase()}${label.slice(1)} is juist`}
                className="w-4 h-4 accent-emerald-700"
              />
              <span aria-hidden>Juist</span>
            </label>
            <input
              type="text"
              value={optie.tekst}
              onChange={(e) => wijzigOptie(optie.sleutel, { tekst: e.target.value })}
              placeholder={
                optie.beeld
                  ? "Wat staat er op de foto? (verplicht)"
                  : optie.juist
                    ? "Juist antwoord"
                    : i < 2
                      ? "Fout antwoord"
                      : "Nog een antwoord (mag leeg)"
              }
              aria-label={optie.beeld ? `Beschrijving van de foto bij ${label}` : `Tekst van ${label}`}
              required={!!optie.beeld}
              className={`flex-1 min-w-0 p-2.5 text-sm rounded-lg border focus:ring-2 focus:outline-none ${
                optie.juist
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold focus:border-emerald-400 focus:ring-emerald-200"
                  : "bg-white border-veldrand text-slate-900 focus:border-merk-800 focus:ring-merk/40"
              }`}
            />
            <OptieFoto
              waarde={optie.beeld}
              label={label}
              onBezig={onBezig}
              onWijzig={(beeld) => wijzigOptie(optie.sleutel, { beeld })}
            />
            {vraag.opties.length > 2 && (
              <button
                type="button"
                onClick={() => wijzigOpties(vraag.opties.filter((o) => o.sleutel !== optie.sleutel))}
                className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                aria-label={`Verwijder ${label}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
      {vraag.opties.length < MAX_OPTIES && (
        <button
          type="button"
          onClick={() => wijzigOpties([...vraag.opties, legeOptie()])}
          className="inline-flex items-center gap-1 text-xs font-bold text-merk-900 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Nog een antwoord
        </button>
      )}
    </fieldset>
  );
}

/* ── Delen om op volgorde te zetten ──────────────────────────────────────── */

function Delen({
  delen,
  nr,
  onWijzig,
}: {
  delen: string[];
  nr: number;
  onWijzig: (delen: string[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs text-slate-500 mb-1">
        Typ de delen in de juiste volgorde, van {MIN_DELEN} tot {MAX_DELEN}. De cursist krijgt ze
        door elkaar.
      </legend>
      {delen.map((deel, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="shrink-0 w-6 text-center text-xs font-bold text-slate-500" aria-hidden>
            {i + 1}
          </span>
          <input
            type="text"
            value={deel}
            onChange={(e) => onWijzig(delen.map((d, j) => (j === i ? e.target.value : d)))}
            placeholder={i < MIN_DELEN ? `Deel ${i + 1}` : `Deel ${i + 1} (mag leeg)`}
            aria-label={`Deel ${i + 1} van vraag ${nr}`}
            className={`flex-1 min-w-0 ${KLEIN_VELD}`}
          />
          {delen.length > MIN_DELEN && (
            <button
              type="button"
              onClick={() => onWijzig(delen.filter((_, j) => j !== i))}
              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              aria-label={`Verwijder deel ${i + 1} van vraag ${nr}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {delen.length < MAX_DELEN && (
        <button
          type="button"
          onClick={() => onWijzig([...delen, ""])}
          className="inline-flex items-center gap-1 text-xs font-bold text-merk-900 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          Nog een deel
        </button>
      )}
    </fieldset>
  );
}

/* ── Tijd en punten in de Quizwedstrijd ──────────────────────────────────── */

function TijdEnPunten({
  vraag,
  nr,
  onWijzig,
}: {
  vraag: NieuweVraag;
  nr: number;
  onWijzig: (aanpassing: Partial<NieuweVraag>) => void;
}) {
  const isDia = vraag.soort === "dia";
  const tijd = vraag.seconden === undefined ? "tijd zoals bij de start" : toonTijd(vraag.seconden);
  const punten = PUNTEN.find((pt) => pt.waarde === vraag.punten)!.label.toLowerCase();

  return (
    <details>
      <summary className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-merk-900 cursor-pointer select-none">
        <Timer className="w-3.5 h-3.5" />
        Quizwedstrijd: {tijd}
        {!isDia && `, ${punten}`}
      </summary>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-xs font-bold text-slate-700 mb-1">Tijd</span>
          <select
            value={vraag.seconden ?? ""}
            onChange={(e) =>
              onWijzig({ seconden: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            aria-label={`Tijd voor ${isDia ? "dia" : "vraag"} ${nr} in de Quizwedstrijd`}
            className={KLEIN_VELD}
          >
            <option value="">Zoals bij de start gekozen</option>
            {TIJDEN.map((s) => (
              <option key={s} value={s}>
                {toonTijd(s)}
              </option>
            ))}
          </select>
        </label>
        {!isDia && (
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">Punten</span>
            <select
              value={vraag.punten}
              onChange={(e) => onWijzig({ punten: Number(e.target.value) as 0 | 1 | 2 })}
              aria-label={`Punten voor vraag ${nr} in de Quizwedstrijd`}
              className={KLEIN_VELD}
            >
              {PUNTEN.map((pt) => (
                <option key={pt.waarde} value={pt.waarde}>
                  {pt.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Alleen voor de Quizwedstrijd. De tijd geldt als je bij de start kiest voor de tijd uit
        de quiz.
      </p>
    </details>
  );
}
