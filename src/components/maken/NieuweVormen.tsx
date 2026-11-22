"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { QuizQuestion, Rekensoort } from "@/lib/types";
import { leesProcedures, leesSorteerItems, leesWerkwoorden, leesZinnen } from "@/lib/invoer";
import { REKENTYPES } from "@/lib/rekenen";
import { Veld, Foutmelding, MaakKnop, Toelichting, FeedbackKiezer, INVOER, INVOER_MONO } from "./Velden";
import { InleesKnop } from "./InleesKnop";
import type { VormProps } from "@/werkvormen/soorten";

/**
 * De maakformulieren van de werkvormen uit ronde 3. Ze delen allemaal dezelfde vorm:
 * titel, inhoud, bestemming, knop. Zo hoeft een leraar maar één keer te leren hoe het werkt.
 */
export type { VormProps } from "@/werkvormen/soorten";

const OEFEN_CONFIG = {
  showImmediateFeedback: true,
  allowRetryMissed: true,
  enableGamification: false,
};

/* ── Zinnen bouwen ───────────────────────────────────────────────────────── */

export function ZinbouwenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [zinnen, setZinnen] = useState("");

  const gelezen = leesZinnen(zinnen);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gelezen.length === 0) {
      p.setFout("Elke regel heeft minstens twee woorden nodig om te kunnen husselen.");
      return;
    }
    p.bewaar([
      {
        ...p.basis(),
        id: `zin-${Date.now()}`,
        title: titel.trim(),
        description: "Zet de woorden in de juiste volgorde.",
        category: "language",
        didacticGoal: "automate",
        type: "zinbouwen",
        tags: ["Zinsbouw"],
        content: { ordenItems: gelezen },
        didacticConfig: { ...OEFEN_CONFIG, spraakTaal: p.spraakTaal },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Waarover gaat het?" hint="Bijvoorbeeld: NT2 — woordvolgorde in de hoofdzin">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className={INVOER}
        />
      </Veld>

      <Veld label="Je zinnen" hint="Eén zin per regel, gewoon zoals ze hoort te staan.">
        <textarea
          rows={6}
          value={zinnen}
          onChange={(e) => setZinnen(e.target.value)}
          placeholder={"Morgen ga ik naar de dokter.\nZij werkt elke zaterdag in de winkel.\nWij hebben gisteren samen gekookt."}
          required
          className={INVOER_MONO}
        />
      </Veld>

      <InleesKnop taal={p.spraakTaal} huidig={zinnen} onTekst={setZinnen} zinPerRegel />

      <Toelichting>
        Open E-lab haalt de woorden door elkaar. De cursist tikt ze in de juiste volgorde aan, dus
        er valt niets te slepen: dat werkt ook op een smartphone.{" "}
        {gelezen.length > 0 && (
          <strong>
            {gelezen.length} {gelezen.length === 1 ? "zin klaar" : "zinnen klaar"}.
          </strong>
        )}
      </Toelichting>

      {p.taalKiezer}
      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label="Maak mijn zinnenoefening" />
    </form>
  );
}

/* ── Stappen op volgorde ─────────────────────────────────────────────────── */

export function VolgordeVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [procedures, setProcedures] = useState("");

  const gelezen = leesProcedures(procedures);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gelezen.length === 0) {
      p.setFout(
        "Zet de opdracht en de stappen op één regel, gescheiden door het teken >. Minstens twee stappen per procedure."
      );
      return;
    }
    p.bewaar([
      {
        ...p.basis(),
        id: `volg-${Date.now()}`,
        title: titel.trim(),
        description: "Zet de stappen in de juiste volgorde.",
        category: "practice",
        didacticGoal: "automate",
        type: "volgorde",
        tags: ["Procedure"],
        content: { ordenItems: gelezen },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Waarover gaat het?" hint="Bijvoorbeeld: Zorg — handelingen stap voor stap">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label="Je procedures"
        hint="Eén per regel. Eerst de opdracht, dan de stappen, telkens met > ertussen."
      >
        <textarea
          rows={6}
          value={procedures}
          onChange={(e) => setProcedures(e.target.value)}
          placeholder={
            "Een wonde verzorgen > handen wassen > wonde spoelen > ontsmetten > verband aanbrengen\n" +
            "Een stopcontact vervangen > spanning afzetten > oude contactdoos losschroeven > draden aansluiten > vastschroeven > spanning terugzetten"
          }
          required
          className={INVOER_MONO}
        />
      </Veld>

      <Toelichting>
        De stappen verschijnen door elkaar; de cursist zet ze op volgorde.{" "}
        {gelezen.length > 0 && (
          <strong>
            {gelezen.length} {gelezen.length === 1 ? "procedure klaar" : "procedures klaar"}.
          </strong>
        )}
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label="Maak mijn volgorde-oefening" />
    </form>
  );
}

/* ── Sorteren ────────────────────────────────────────────────────────────── */

export function SorterenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [bakjes, setBakjes] = useState([
    { naam: "", items: "" },
    { naam: "", items: "" },
  ]);

  const wijzig = (index: number, veld: "naam" | "items", waarde: string) =>
    setBakjes(bakjes.map((b, i) => (i === index ? { ...b, [veld]: waarde } : b)));

  const gevuld = bakjes.filter((b) => b.naam.trim() && b.items.trim());

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gevuld.length < 2) {
      p.setFout("Vul minstens twee bakjes in, elk met een naam en één item per regel.");
      return;
    }

    const categorieen = gevuld.map((b) => b.naam.trim());
    let teller = 0;
    const sorteerItems = gevuld.flatMap((bakje, index) => {
      const items = leesSorteerItems([bakje.items], index, teller);
      teller += items.length;
      return items;
    });

    if (sorteerItems.length === 0) {
      p.setFout("Er staat nog geen enkel item in je bakjes.");
      return;
    }

    p.bewaar([
      {
        ...p.basis(),
        id: `sort-${Date.now()}`,
        title: titel.trim(),
        description: "Verdeel de items over de juiste bakjes.",
        category: "practice",
        didacticGoal: "automate",
        type: "sorteren",
        tags: ["Sorteren"],
        content: { categorieen, sorteerItems },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Waarover gaat het?" hint="Bijvoorbeeld: NT2 — de of het">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className={INVOER}
        />
      </Veld>

      <div className="space-y-4">
        {bakjes.map((bakje, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">Bakje {index + 1}</span>
              {bakjes.length > 2 && (
                <button
                  type="button"
                  onClick={() => setBakjes(bakjes.filter((_, i) => i !== index))}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={`Verwijder bakje ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <input
              type="text"
              value={bakje.naam}
              onChange={(e) => wijzig(index, "naam", e.target.value)}
              placeholder={index === 0 ? "de" : index === 1 ? "het" : "Naam van dit bakje"}
              aria-label={`Naam van bakje ${index + 1}`}
              className={INVOER}
            />

            <textarea
              rows={4}
              value={bakje.items}
              onChange={(e) => wijzig(index, "items", e.target.value)}
              placeholder={
                index === 0 ? "tafel\nstoel\nfiets" : index === 1 ? "huis\nboek\nraam" : "Eén item per regel"
              }
              aria-label={`Items van bakje ${index + 1}`}
              className={INVOER_MONO}
            />
          </div>
        ))}
      </div>

      {bakjes.length < 4 && (
        <button
          type="button"
          onClick={() => setBakjes([...bakjes, { naam: "", items: "" }])}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nog een bakje</span>
        </button>
      )}

      <Toelichting>
        De cursist krijgt de items één voor één te zien en kiest het juiste bakje. Twee tot vier
        bakjes werkt het best; meer wordt onoverzichtelijk op een smartphone.
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label="Maak mijn sorteeroefening" />
    </form>
  );
}

/* ── Open vraag ──────────────────────────────────────────────────────────── */

interface NieuweOpenVraag {
  vraag: string;
  modelantwoord: string;
}

const LEEG_OPEN: NieuweOpenVraag = { vraag: "", modelantwoord: "" };

export function OpenVraagVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [vragen, setVragen] = useState<NieuweOpenVraag[]>([{ ...LEEG_OPEN }]);

  const wijzig = (index: number, veld: keyof NieuweOpenVraag, waarde: string) =>
    setVragen(vragen.map((v, i) => (i === index ? { ...v, [veld]: waarde } : v)));

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const bruikbaar = vragen.filter((v) => v.vraag.trim() && v.modelantwoord.trim());
    if (bruikbaar.length === 0) {
      p.setFout("Elke vraag heeft ook een modelantwoord nodig.");
      return;
    }

    p.bewaar([
      {
        ...p.basis(),
        id: `open-${Date.now()}`,
        title: titel.trim(),
        description: "Antwoord in eigen woorden en vergelijk met het modelantwoord.",
        category: "practice",
        didacticGoal: "check",
        type: "openvraag",
        tags: ["Open vraag"],
        content: {
          openVragen: bruikbaar.map((v, index) => ({
            id: `ov-${index}`,
            vraag: v.vraag.trim(),
            modelantwoord: v.modelantwoord.trim(),
          })),
        },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Titel van je oefening" hint="Bijvoorbeeld: Zorg — waarom handhygiëne telt">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className={INVOER}
        />
      </Veld>

      {vragen.map((vraag, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Vraag {index + 1}</span>
            {vragen.length > 1 && (
              <button
                type="button"
                onClick={() => setVragen(vragen.filter((_, i) => i !== index))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                aria-label={`Verwijder vraag ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            type="text"
            value={vraag.vraag}
            onChange={(e) => wijzig(index, "vraag", e.target.value)}
            placeholder="Je vraag"
            required
            className={INVOER}
          />

          <textarea
            rows={3}
            value={vraag.modelantwoord}
            onChange={(e) => wijzig(index, "modelantwoord", e.target.value)}
            placeholder="Het antwoord waar de cursist het zijne mee vergelijkt"
            required
            aria-label={`Modelantwoord bij vraag ${index + 1}`}
            className={INVOER}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setVragen([...vragen, { ...LEEG_OPEN }])}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>Nog een vraag</span>
      </button>

      <Toelichting>
        Er wordt niets automatisch nagekeken. De cursist schrijft eerst zelf, ziet dan jouw
        antwoord en beoordeelt zichzelf. Dat zelf formuleren is precies wat blijft hangen.
        Schrijf je modelantwoord daarom voluit, met de tussenstappen: voor een cursist met
        weinig voorkennis is een uitgewerkt voorbeeld de beste start.
      </Toelichting>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label="Maak mijn open vragen" />
    </form>
  );
}

/* ── Lezen met vragen ────────────────────────────────────────────────────── */

interface NieuweLeesVraag {
  vraag: string;
  juist: string;
  fout1: string;
  fout2: string;
  uitleg: string;
}

const LEEG_LEES: NieuweLeesVraag = { vraag: "", juist: "", fout1: "", fout2: "", uitleg: "" };

export function LezenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [tekst, setTekst] = useState("");
  const [vragen, setVragen] = useState<NieuweLeesVraag[]>([{ ...LEEG_LEES }]);
  const [tweedeKans, setTweedeKans] = useState(true);

  const wijzig = (index: number, veld: keyof NieuweLeesVraag, waarde: string) =>
    setVragen(vragen.map((v, i) => (i === index ? { ...v, [veld]: waarde } : v)));

  const woorden = tekst.trim() ? tekst.trim().split(/\s+/).length : 0;

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    const bruikbaar = vragen.filter((v) => v.vraag.trim() && v.juist.trim());
    if (!tekst.trim() || bruikbaar.length === 0) {
      p.setFout("Je hebt een tekst nodig en minstens één vraag met een juist antwoord.");
      return;
    }

    const questions: QuizQuestion[] = bruikbaar.map((v, index) => {
      const opties = [v.juist, v.fout1, v.fout2].map((o) => o.trim()).filter(Boolean);
      return {
        id: `lv-${index}`,
        question: v.vraag.trim(),
        options: opties,
        correctAnswers: [0],
        type: "multiple_choice",
        explanation: v.uitleg.trim() || `Het juiste antwoord is "${v.juist.trim()}".`,
      };
    });

    p.bewaar([
      {
        ...p.basis(),
        id: `lees-${Date.now()}`,
        title: titel.trim(),
        description: "Lees de tekst en beantwoord de vragen ernaast.",
        category: "language",
        didacticGoal: "check",
        type: "lezen",
        tags: ["Lezen", "Begrijpend lezen"],
        content: { leestekst: tekst.trim(), questions },
        didacticConfig: { ...OEFEN_CONFIG, spraakTaal: p.spraakTaal, tweedeKans },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Titel van je oefening" hint="Bijvoorbeeld: NT2 — een afspraak bij de dokter">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label="De tekst"
        hint="Plak hier je tekst. Een lege regel maakt een nieuwe alinea. Hou het kort genoeg om in één keer te lezen."
      >
        <textarea
          rows={8}
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Je leest een korte tekst en beantwoordt daarna de vragen ..."
          required
          className={INVOER}
        />
      </Veld>

      <InleesKnop taal={p.spraakTaal} huidig={tekst} onTekst={setTekst} />

      {woorden > 0 && (
        <Toelichting>
          {woorden} {woorden === 1 ? "woord" : "woorden"}.
          {woorden > 400 && " Dat is aan de lange kant voor één scherm; overweeg te splitsen."}
          {" "}De tekst blijft naast de vragen staan, zodat de cursist niet heen en weer moet.
        </Toelichting>
      )}

      {vragen.map((vraag, index) => (
        <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Vraag {index + 1}</span>
            {vragen.length > 1 && (
              <button
                type="button"
                onClick={() => setVragen(vragen.filter((_, i) => i !== index))}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                aria-label={`Verwijder vraag ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            type="text"
            value={vraag.vraag}
            onChange={(e) => wijzig(index, "vraag", e.target.value)}
            placeholder="Je vraag over de tekst"
            required
            className={INVOER}
          />
          <input
            type="text"
            value={vraag.juist}
            onChange={(e) => wijzig(index, "juist", e.target.value)}
            placeholder="Juist antwoord"
            required
            className="w-full p-2.5 text-sm rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold focus:border-emerald-400 focus:outline-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={vraag.fout1}
              onChange={(e) => wijzig(index, "fout1", e.target.value)}
              placeholder="Fout antwoord"
              required
              className={INVOER}
            />
            <input
              type="text"
              value={vraag.fout2}
              onChange={(e) => wijzig(index, "fout2", e.target.value)}
              placeholder="Nog een fout antwoord (mag leeg)"
              className={INVOER}
            />
          </div>
          <input
            type="text"
            value={vraag.uitleg}
            onChange={(e) => wijzig(index, "uitleg", e.target.value)}
            placeholder="Uitleg na het antwoord, bijvoorbeeld waar het in de tekst staat (mag leeg)"
            className={INVOER}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setVragen([...vragen, { ...LEEG_LEES }])}
        className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        <span>Nog een vraag</span>
      </button>

      <FeedbackKiezer tweedeKans={tweedeKans} onWijzig={setTweedeKans} />
      {p.taalKiezer}
      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label="Maak mijn leesoefening" />
    </form>
  );
}

/* ── Werkwoorden ─────────────────────────────────────────────────────────── */

export function WerkwoordenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [regels, setRegels] = useState("");

  const gelezen = leesWerkwoorden(regels);
  const aantalVormen = gelezen.reduce((som, w) => som + w.vormen.length, 0);

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    if (gelezen.length === 0) {
      p.setFout(
        "Zet per regel het werkwoord en de vormen: parler; je=parle; tu=parles; nous=parlons"
      );
      return;
    }
    p.bewaar([
      {
        ...p.basis(),
        id: `ww-${Date.now()}`,
        title: titel.trim(),
        description: "Vervoegingen inoefenen, door elkaar.",
        category: "language",
        didacticGoal: "automate",
        type: "werkwoorden",
        tags: ["Werkwoorden", "Grammatica"],
        content: { werkwoorden: gelezen },
        didacticConfig: { ...OEFEN_CONFIG, spraakTaal: p.spraakTaal },
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld label="Waarover gaat het?" hint="Bijvoorbeeld: Frans — werkwoorden op -ER in de tegenwoordige tijd">
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel van je oefening"
          required
          className={INVOER}
        />
      </Veld>

      <Veld
        label="Je werkwoorden"
        hint="Eén werkwoord per regel. Eerst de infinitief, dan de vormen als persoon=vorm, met een puntkomma ertussen."
      >
        <textarea
          rows={6}
          value={regels}
          onChange={(e) => setRegels(e.target.value)}
          placeholder={
            "parler; je=parle; tu=parles; il=parle; nous=parlons; vous=parlez; ils=parlent\n" +
            "habiter; j'=habite; tu=habites; nous=habitons"
          }
          required
          className={INVOER_MONO}
        />
      </Veld>

      <Toelichting>
        De vormen komen door elkaar aan bod, niet als rijtje. Dat voelt lastiger, maar zo moet
        een cursist telkens kiezen welke regel geldt, en dat is wat blijft hangen.{" "}
        {gelezen.length > 0 && (
          <strong>
            {gelezen.length} {gelezen.length === 1 ? "werkwoord" : "werkwoorden"} met {aantalVormen}{" "}
            {aantalVormen === 1 ? "vorm" : "vormen"}.
          </strong>
        )}
      </Toelichting>

      {p.taalKiezer}
      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label="Maak mijn werkwoordenoefening" />
    </form>
  );
}

/* ── Rekenen ─────────────────────────────────────────────────────────────── */

export function RekenenVorm(p: VormProps) {
  const [titel, setTitel] = useState("");
  const [soort, setSoort] = useState<Rekensoort>("procent");
  const [aantal, setAantal] = useState(10);

  const gekozen = REKENTYPES.find((t) => t.soort === soort) ?? REKENTYPES[0];

  const maak = (e: React.FormEvent) => {
    e.preventDefault();
    p.bewaar([
      {
        ...p.basis(),
        id: `reken-${Date.now()}`,
        title: titel.trim() || gekozen.label,
        description: `${gekozen.uitleg} Elke ronde nieuwe getallen.`,
        category: "practice",
        didacticGoal: "automate",
        type: "rekenen",
        tags: ["Rekenen", gekozen.label],
        content: { rekenopdracht: { soort, aantal } },
        didacticConfig: OEFEN_CONFIG,
      },
    ]);
  };

  return (
    <form onSubmit={maak} className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 space-y-5">
      <Veld
        label="Titel van je oefening"
        hint="Laat leeg om de naam van het rekentype te gebruiken."
      >
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder={`Bijvoorbeeld: ${gekozen.label} oefenen`}
          className={INVOER}
        />
      </Veld>

      <div>
        <span className="block text-sm font-bold text-slate-800 mb-1">Wat wil je oefenen?</span>
        <span className="block text-xs text-slate-500 mb-2">
          Open E-lab maakt de opgaven; jij typt geen enkele som.
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REKENTYPES.map((type) => (
            <button
              key={type.soort}
              type="button"
              onClick={() => setSoort(type.soort)}
              aria-pressed={soort === type.soort}
              className={`text-left p-3 rounded-xl border transition-colors ${
                soort === type.soort
                  ? "bg-merk-50 border-merk"
                  : "bg-white border-slate-200 hover:border-merk"
              }`}
            >
              <span className="block text-sm font-bold text-slate-900">{type.label}</span>
              <span className="block text-xs text-slate-600 mt-0.5">{type.uitleg}</span>
            </button>
          ))}
        </div>
      </div>

      <Toelichting>
        Voorbeeld van een opgave: <strong>{gekozen.voorbeeld}</strong>. Maak ook een oefening
        met een verwant rekentype en zet ze samen in een map: door elkaar oefenen leert meer dan
        één type na elkaar.
      </Toelichting>

      <div>
        <span className="block text-sm font-bold text-slate-800 mb-2">Hoeveel opgaven per ronde?</span>
        <div className="flex gap-2">
          {[5, 10, 15, 20].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAantal(n)}
              aria-pressed={aantal === n}
              className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-colors ${
                aantal === n
                  ? "bg-merk-800 text-white border-merk-800"
                  : "bg-white text-slate-700 border-slate-200 hover:border-merk"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {p.bestemming}
      <Foutmelding tekst={p.fout} />
      <MaakKnop bezig={p.bezig} label="Maak mijn rekenoefening" />
    </form>
  );
}
