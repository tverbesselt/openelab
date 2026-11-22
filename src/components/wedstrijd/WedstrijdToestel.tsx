"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Dices, Clock, Trophy, Eye, Undo2 } from "lucide-react";
import { opslag, apparaatId } from "@/lib/opslag";
import { LiveSessie, WedstrijdSpeler, WedstrijdToestand } from "@/lib/types";
import {
  MAX_BIJNAAM,
  schoneBijnaam,
  stijlVoor,
  teamNaam,
  willekeurigeBijnaam,
} from "@/lib/wedstrijd";
import { MAX_TYPANTWOORD } from "@/lib/typantwoord";
import { VraagMedia } from "@/components/players/VraagMedia";
import { Opmaak } from "@/components/players/Opmaak";
import { Vorm } from "./Vorm";

/**
 * De cursist tijdens een quizwedstrijd: een bijnaam kiezen, antwoorden en daarna zien hoe
 * het afliep. Alles wat telt, rekent het bord uit; dit scherm toont alleen de eigen stand.
 */
export function WedstrijdToestel({ code, sessie }: { code: string; sessie: LiveSessie }) {
  const apparaat = useRef(apparaatId()).current;
  const [speler, setSpeler] = useState<WedstrijdSpeler | null | undefined>(undefined);
  // Was dit toestel al binnen? Dan betekent "geen speler" dat de leraar de bijnaam weghaalde.
  const wasBinnen = useRef(false);

  useEffect(() => opslag.volgSpeler(code, apparaat, setSpeler), [code, apparaat]);
  useEffect(() => {
    if (speler) wasBinnen.current = true;
  }, [speler]);

  const quiz = sessie.quiz as WedstrijdToestand;

  if (sessie.status === "afgesloten") {
    return (
      <Kader>
        <Trophy className="w-10 h-10 text-merk mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">De wedstrijd is afgelopen</h1>
        {speler?.plaats && (
          <p className="text-sm text-slate-700 mb-1">
            Je eindigde op plaats <strong>{speler.plaats}</strong> met {speler.punten ?? 0} punten.
          </p>
        )}
        <p className="text-sm text-slate-600">Bedankt om mee te doen. Je kan dit scherm sluiten.</p>
      </Kader>
    );
  }

  if (speler === undefined) {
    return <p className="text-center py-20 text-sm text-slate-500">Verbinden met de wedstrijd ...</p>;
  }

  if (speler === null) {
    return (
      <BijnaamKiezen
        code={code}
        apparaat={apparaat}
        weggehaald={wasBinnen.current}
        teams={quiz.instellingen.teams}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto py-4 u-fade">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 px-1">
        <span className="truncate">
          {speler.bijnaam}
          {speler.team !== undefined && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {teamNaam(speler.team)}
            </span>
          )}
        </span>
        <span className="tabular-nums">{speler.punten ?? 0} punten</span>
      </div>

      {quiz.fase === "wachtruimte" && (
        <Kader>
          <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-merk-900 mb-1">Je doet mee</h1>
          <p className="text-sm text-slate-600">
            Kijk naar het bord vooraan. Zodra je naam daar staat, ben je binnen. De wedstrijd begint zo.
          </p>
        </Kader>
      )}

      {quiz.fase === "vraag" && <Antwoorden key={quiz.vraagNr} code={code} apparaat={apparaat} quiz={quiz} />}

      {quiz.fase === "uitleg" && <Resultaat speler={speler} quiz={quiz} />}

      {quiz.fase === "tussenstand" && (
        <Kader>
          <p className="text-xs font-bold text-slate-500 mb-2">
            Na vraag {quiz.vraagNr + 1} van {quiz.aantalVragen}
          </p>
          {speler.team !== undefined ? (
            <>
              <p className="text-5xl font-black text-merk-900 mb-1 tabular-nums">
                {speler.teamPlaats ?? "–"}
              </p>
              <p className="text-sm text-slate-700 mb-3">
                Daar staat {teamNaam(speler.team)}, met {speler.teamPunten ?? 0} punten gemiddeld.
                Jij bracht er {speler.punten ?? 0} aan bij.
              </p>
            </>
          ) : (
            <>
              <p className="text-5xl font-black text-merk-900 mb-1 tabular-nums">
                {speler.plaats ?? "–"}
              </p>
              <p className="text-sm text-slate-700 mb-3">
                {speler.plaats === 1 ? "Je staat op kop" : "Dat is je plaats"} met {speler.punten ?? 0} punten.
              </p>
            </>
          )}
          <p className="text-xs text-slate-500">Kijk naar het bord voor de top 5.</p>
        </Kader>
      )}

      {quiz.fase === "podium" && quiz.instellingen.podium === false && (
        <Kader>
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-merk-900 mb-1">Klaar</h1>
          <p className="text-sm text-slate-700">
            Je haalde {speler.punten ?? 0} punten. Bedankt om mee te doen.
          </p>
        </Kader>
      )}

      {quiz.fase === "podium" && quiz.instellingen.podium !== false && (
        <Kader>
          <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          {speler.team !== undefined ? (
            <>
              <h1 className="text-xl font-extrabold text-merk-900 mb-1">
                {speler.teamPlaats === 1
                  ? `${teamNaam(speler.team)} heeft gewonnen`
                  : `${teamNaam(speler.team)} eindigde op plaats ${speler.teamPlaats ?? "–"}`}
              </h1>
              <p className="text-sm text-slate-700">
                Jij haalde {speler.punten ?? 0} punten. Bedankt om mee te doen.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-extrabold text-merk-900 mb-1">
                {speler.plaats === 1 ? "Je hebt gewonnen" : `Je eindigde op plaats ${speler.plaats ?? "–"}`}
              </h1>
              <p className="text-sm text-slate-700">Met {speler.punten ?? 0} punten. Bedankt om mee te doen.</p>
            </>
          )}
        </Kader>
      )}
    </div>
  );
}

/* ── Bijnaam ────────────────────────────────────────────────────────────── */

function BijnaamKiezen({
  code,
  apparaat,
  weggehaald,
  teams,
}: {
  code: string;
  apparaat: string;
  weggehaald: boolean;
  teams: number;
}) {
  const [bijnaam, setBijnaam] = useState("");
  const [team, setTeam] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const doeMee = async (e: React.FormEvent) => {
    e.preventDefault();
    const naam = schoneBijnaam(bijnaam);
    if (!naam || bezig || (teams > 0 && team === null)) return;
    setBezig(true);
    setFout("");
    try {
      await opslag.meldSpeler(code, {
        apparaat,
        bijnaam: naam,
        op: new Date().toISOString(),
        ...(team !== null ? { team } : {}),
      });
    } catch {
      setFout("Meedoen is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-8 u-fade">
      <form onSubmit={doeMee} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-merk-900 mb-1">Kies een bijnaam</h1>
          <p className="text-sm text-slate-600">
            Die komt op het bord te staan. Je echte naam is niet nodig.
          </p>
        </div>

        {weggehaald && (
          <p role="alert" className="text-sm font-semibold text-amber-900 bg-amber-50 rounded-xl px-3 py-2.5">
            Je leraar haalde je bijnaam weg. Kies een andere.
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={bijnaam}
            onChange={(e) => setBijnaam(e.target.value)}
            maxLength={MAX_BIJNAAM}
            placeholder="Jouw bijnaam"
            autoComplete="off"
            aria-label="Bijnaam"
            autoFocus
            className="flex-1 min-w-0 px-4 py-3 text-lg font-bold rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setBijnaam(willekeurigeBijnaam())}
            className="px-3 rounded-xl border border-slate-300 text-slate-700 hover:border-merk"
            aria-label="Verzin een bijnaam voor mij"
            title="Verzin een bijnaam voor mij"
          >
            <Dices className="w-5 h-5" />
          </button>
        </div>

        {teams > 0 && (
          <fieldset>
            <legend className="block text-sm font-bold text-slate-800 mb-2">In welk team zit je?</legend>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: teams }, (_, t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTeam(t)}
                  aria-pressed={team === t}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-colors ${
                    team === t
                      ? "bg-merk-800 text-white border-merk-800"
                      : "bg-white text-slate-700 border-slate-200 hover:border-merk"
                  }`}
                >
                  {teamNaam(t)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Je leraar kan de teams achteraf nog gelijk verdelen.
            </p>
          </fieldset>
        )}

        {fout && (
          <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
            {fout}
          </p>
        )}

        <button
          type="submit"
          disabled={!schoneBijnaam(bijnaam) || bezig || (teams > 0 && team === null)}
          className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
        >
          {bezig ? "Even geduld ..." : "Doe mee"}
        </button>
      </form>
    </div>
  );
}

/* ── Antwoorden ─────────────────────────────────────────────────────────── */

function Antwoorden({
  code,
  apparaat,
  quiz,
}: {
  code: string;
  apparaat: string;
  quiz: WedstrijdToestand;
}) {
  const vraag = quiz.vraag!;
  const sleutel = `openelab_wedstrijd_${code}_${quiz.vraagNr}`;
  const [gekozen, setGekozen] = useState<number[]>([]);
  const [toestand, setToestand] = useState<"open" | "bezig" | "binnen">(() => {
    try {
      return sessionStorage.getItem(sleutel) ? "binnen" : "open";
    } catch {
      return "open";
    }
  });
  const [fout, setFout] = useState("");

  // De klok op het toestel is alleen een hulp: het bord sluit de vraag af.
  const seconden = vraag.dia ? 0 : (vraag.seconden ?? quiz.instellingen.seconden);
  const [over, setOver] = useState(seconden);
  useEffect(() => {
    if (!seconden) return;
    const begin = Date.now();
    const tik = setInterval(() => setOver(Math.max(0, Math.ceil(seconden - (Date.now() - begin) / 1000))), 250);
    return () => clearInterval(tik);
  }, [seconden]);

  const [getypt, setGetypt] = useState("");

  const stuur = async (inhoud: { keuze?: number[]; tekst?: string }) => {
    if (toestand !== "open") return;
    if (!inhoud.keuze?.length && !inhoud.tekst?.trim()) return;
    setToestand("bezig");
    setFout("");
    try {
      await opslag.stuurWedstrijdAntwoord(code, {
        apparaat,
        vraagNr: quiz.vraagNr,
        ...inhoud,
        op: new Date().toISOString(),
      });
      try {
        sessionStorage.setItem(sleutel, "1");
      } catch {
        // Niet erg: de opslagregels weigeren een tweede antwoord toch.
      }
      if (inhoud.keuze) setGekozen(inhoud.keuze);
      setToestand("binnen");
    } catch {
      setToestand("open");
      setFout("Je antwoord kwam niet aan. Misschien was de tijd al om.");
    }
  };

  if (vraag.dia) {
    return (
      <Kader>
        <Eye className="w-12 h-12 text-merk mx-auto mb-3" />
        {vraag.tekst && <h1 className="text-xl font-extrabold text-merk-900 mb-1">{vraag.tekst}</h1>}
        <p className="text-sm text-slate-600">Kijk naar het bord. De volgende vraag komt zo.</p>
      </Kader>
    );
  }

  if (toestand === "binnen") {
    return (
      <Kader>
        <CheckCircle2 className="w-12 h-12 text-merk mx-auto mb-3" />
        <h1 className="text-xl font-extrabold text-merk-900 mb-1">Je antwoord is binnen</h1>
        {gekozen.length > 0 && (
          <p className="text-sm text-slate-700 mb-1">
            {vraag.volgorde ? "Jouw volgorde" : "Je koos"}:{" "}
            {gekozen.map((i) => vraag.opties[i] || vraag.optieMedia?.[i]?.alt || `optie ${i + 1}`).join(vraag.volgorde ? " → " : ", ")}
          </p>
        )}
        {getypt.trim() && <p className="text-sm text-slate-700 mb-1">Je typte: {getypt.trim()}</p>}
        <p className="text-sm text-slate-600">Even wachten op de anderen.</p>
      </Kader>
    );
  }

  const tijdOm = seconden > 0 && over === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
        <span className="flex items-center gap-2">
          Vraag {quiz.vraagNr + 1} van {quiz.aantalVragen}
          {vraag.punten === 2 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Dubbele punten</span>}
          {vraag.punten === 0 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Geen punten</span>}
        </span>
        {seconden > 0 && (
          <span className={`flex items-center gap-1 tabular-nums ${over <= 5 ? "text-amber-700" : ""}`}>
            <Clock className="w-3.5 h-3.5" />
            {over} s
          </span>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        {vraag.media?.soort === "afbeelding" && (
          <div className="mb-3">
            <VraagMedia media={vraag.media} />
          </div>
        )}
        {(vraag.media?.soort === "video" || vraag.media?.soort === "audio") && (
          <p className="text-xs font-bold text-slate-500 mb-2">
            {vraag.media.soort === "video" ? "Kijk naar het filmpje op het bord." : "Luister naar het fragment op het bord."}
          </p>
        )}
        <h1 className="text-lg font-extrabold text-merk-900 leading-snug">
          <Opmaak tekst={vraag.tekst} />
        </h1>
        {vraag.meerdere && <p className="text-xs font-bold text-slate-500 mt-1">Duid alle juiste antwoorden aan.</p>}
        {vraag.volgorde && (
          <p className="text-xs font-bold text-slate-500 mt-1">Tik de delen aan in de juiste volgorde.</p>
        )}
      </div>

      {vraag.volgorde ? (
        <Ordenen
          opties={vraag.opties}
          uit={toestand === "bezig" || tijdOm}
          onStuur={(volgorde) => stuur({ keuze: volgorde })}
        />
      ) : vraag.typen ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            stuur({ tekst: getypt.trim().slice(0, MAX_TYPANTWOORD) });
          }}
          className="space-y-2.5"
        >
          <input
            type="text"
            value={getypt}
            onChange={(e) => setGetypt(e.target.value)}
            maxLength={MAX_TYPANTWOORD}
            placeholder="Typ je antwoord"
            aria-label="Je antwoord"
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            disabled={toestand === "bezig" || tijdOm}
            className="w-full px-4 py-4 text-lg font-bold rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
          <p className="text-xs text-slate-500">
            Hoofdletters, accenten en extra spaties maken niet uit.
          </p>
          <button
            type="submit"
            disabled={!getypt.trim() || toestand === "bezig" || tijdOm}
            className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm"
          >
            Stuur mijn antwoord
          </button>
        </form>
      ) : (
      <div className="grid grid-cols-1 gap-2.5">
        {vraag.opties.map((optie, i) => {
          const stijl = stijlVoor(i);
          const aan = gekozen.includes(i);
          return (
            <button
              key={i}
              disabled={toestand === "bezig" || tijdOm}
              aria-pressed={vraag.meerdere ? aan : undefined}
              onClick={() =>
                vraag.meerdere
                  ? setGekozen((g) => (g.includes(i) ? g.filter((x) => x !== i) : [...g, i]))
                  : stuur({ keuze: [i] })
              }
              className={`w-full min-h-16 rounded-2xl text-white text-left flex items-center gap-3 px-4 py-3 font-bold text-base transition-transform active:scale-[0.98] disabled:opacity-60 ${
                stijl.vlak
              } ${vraag.meerdere && aan ? "ring-4 ring-offset-2 ring-merk-900" : ""}`}
            >
              <Vorm vorm={stijl.vorm} className="w-7 h-7 shrink-0" />
              {vraag.optieMedia?.[i] ? (
                <span className="flex-1 flex items-center gap-3 min-w-0">
                  <img
                    src={vraag.optieMedia[i]!.url}
                    alt={vraag.optieMedia[i]!.alt || optie}
                    className="h-20 max-w-[55%] object-contain rounded-lg bg-white"
                  />
                  {optie && optie !== vraag.optieMedia[i]!.alt && <span className="leading-snug">{optie}</span>}
                </span>
              ) : (
                <span className="flex-1 leading-snug">
                  <Opmaak tekst={optie} />
                </span>
              )}
              {vraag.meerdere && aan && <CheckCircle2 className="w-6 h-6 shrink-0" />}
            </button>
          );
        })}
      </div>
      )}

      {vraag.meerdere && (
        <button
          onClick={() => stuur({ keuze: gekozen })}
          disabled={gekozen.length === 0 || toestand === "bezig" || tijdOm}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm"
        >
          Bevestig mijn antwoord
        </button>
      )}

      {tijdOm && <p className="text-sm font-bold text-center text-slate-600">De tijd is om.</p>}

      {fout && (
        <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 rounded-xl px-3 py-2.5">
          {fout}
        </p>
      )}
    </div>
  );
}

/**
 * Ordenen op een klein scherm: tik de delen aan in de juiste volgorde. Slepen werkt slecht
 * op een gsm en is lastig met een schermlezer; tikken lukt overal.
 */
function Ordenen({
  opties,
  uit,
  onStuur,
}: {
  opties: string[];
  uit: boolean;
  onStuur: (volgorde: number[]) => void;
}) {
  const [rij, setRij] = useState<number[]>([]);
  const klaar = rij.length === opties.length;
  return (
    <div className="space-y-3">
      <div className="min-h-16 rounded-2xl border-2 border-dashed border-merk/40 bg-white p-3 flex flex-wrap gap-2" aria-live="polite">
        {rij.length === 0 ? (
          <span className="text-sm text-slate-500">Jouw volgorde verschijnt hier.</span>
        ) : (
          rij.map((i, plek) => (
            <span key={i} className="px-3 py-2 rounded-xl bg-merk-800 text-white font-bold text-sm">
              <span className="text-white/70 mr-1">{plek + 1}</span>
              {opties[i]}
            </span>
          ))
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {opties.map((deel, i) => {
          const gebruikt = rij.includes(i);
          const stijl = stijlVoor(i);
          return (
            <button
              key={i}
              disabled={uit || gebruikt}
              onClick={() => setRij((r) => [...r, i])}
              className={`min-h-14 rounded-2xl text-white font-bold text-base px-3 py-2 ${stijl.vlak} disabled:opacity-30`}
            >
              {deel}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRij((r) => r.slice(0, -1))}
          disabled={uit || rij.length === 0}
          className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          <Undo2 className="w-4 h-4" />
          Terug
        </button>
        <button
          onClick={() => onStuur(rij)}
          disabled={uit || !klaar}
          className="flex-1 py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm"
        >
          Stuur mijn volgorde
        </button>
      </div>
    </div>
  );
}

/* ── Resultaat na een vraag ─────────────────────────────────────────────── */

function Resultaat({ speler, quiz }: { speler: WedstrijdSpeler; quiz: WedstrijdToestand }) {
  const laatste = speler.laatste?.vraagNr === quiz.vraagNr ? speler.laatste : undefined;
  const juisteTekst =
    quiz.juisteTekst ??
    (quiz.juist ?? [])
      .map((i) => quiz.vraag?.opties[i] || quiz.vraag?.optieMedia?.[i]?.alt)
      .filter(Boolean)
      .join(quiz.vraag?.volgorde ? " → " : ", ");

  if (!laatste) {
    return (
      <Kader>
        <p className="text-sm text-slate-600">Even rekenen ...</p>
      </Kader>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-2xl p-6 text-center u-pop ${
          laatste.juist ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
        }`}
      >
        {laatste.juist ? (
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
        ) : (
          <XCircle className="w-12 h-12 mx-auto mb-2 text-rose-600" />
        )}
        <h1 className="text-2xl font-extrabold mb-1">
          {laatste.juist ? "Juist" : laatste.beantwoord ? "Niet juist" : "Geen antwoord"}
        </h1>
        {laatste.juist ? (
          <p className="text-lg font-bold tabular-nums">
            +{laatste.punten}
            {laatste.bonus > 0 && <span className="text-sm font-bold"> en +{laatste.bonus} voor je reeks</span>}
          </p>
        ) : (
          <p className="text-sm">
            Het juiste antwoord: <strong>{juisteTekst}</strong>
          </p>
        )}
      </div>

      {quiz.uitleg && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-500 mb-1">Waarom</p>
          <p className="text-sm text-slate-800 leading-relaxed">
            <Opmaak tekst={quiz.uitleg} />
          </p>
        </div>
      )}
    </div>
  );
}

function Kader({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center u-fade">{children}</div>;
}
