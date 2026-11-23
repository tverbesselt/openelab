"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { merkTint } from "@/lib/instellingen/kleur";
import { VOLSCHERM_KLASSE, VolledigSchermKnop, useVolledigScherm } from "@/components/VolledigScherm";
import { ArrowRight, CheckCircle2, Shuffle, Square, Trophy, Users, X, RefreshCw } from "lucide-react";
import { opslag, opslagGedeeld, generateShortCode } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Exercise,
  LiveSessie,
  QuizMedia,
  WedstrijdAntwoord,
  WedstrijdSpeler,
  WedstrijdToestand,
} from "@/lib/types";
import {
  TOP,
  type StandRij,
  type WedstrijdVraag,
  antwoordJuist,
  juisteTekstVan,
  telGegeven,
  puntenFactor,
  puntenVoor,
  rangschik,
  reeksBonus,
  spelerRijen,
  stijlVoor,
  teamNaam,
  teamStand,
  tijdVoor,
  verdeelTeams,
  willekeurigeBijnaam,
} from "@/lib/wedstrijd";
import { OptieBronnen, VraagMedia } from "@/components/players/VraagMedia";
import { Opmaak } from "@/components/players/Opmaak";
import { Vorm, VORM_NAAM } from "./Vorm";

/**
 * Het bord van de leraar tijdens een quizwedstrijd. Dit scherm is de scheidsrechter: het
 * opent en sluit elke vraag, meet hoe snel een antwoord binnenkomt en rekent de punten uit.
 * De toestellen sturen alleen hun keuze in.
 */

interface VraagStatistiek {
  antwoorden: number;
  fout: number;
}

export function WedstrijdBord({
  sessie: begin,
  oefening,
  vragen,
  onStop,
}: {
  sessie: LiveSessie;
  oefening: Exercise;
  vragen: WedstrijdVraag[];
  onStop: () => void;
}) {
  const code = begin.code;
  const [sessie, setSessie] = useState<LiveSessie>(begin);
  const [spelers, setSpelers] = useState<WedstrijdSpeler[]>([]);
  const [antwoorden, setAntwoorden] = useState<WedstrijdAntwoord[]>([]);
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);
  const [resterend, setResterend] = useState(0);

  const quiz = sessie.quiz as WedstrijdToestand;
  const inst = quiz.instellingen;
  const huidig = quiz.vraagNr >= 0 ? vragen[quiz.vraagNr] : undefined;
  const isDia = huidig?.bron.type === "dia";
  // De tijd van de vraag die nu loopt: per vraag uit de quiz, of één tijd voor allemaal.
  const limiet = quiz.vraag?.seconden ?? inst.seconden;

  // Wanneer het bord elk antwoord voor het eerst zag. Zo meet het bord de snelheid, niet
  // het toestel van de cursist, en valt er niet te sjoemelen met de klok.
  const gezien = useRef(new Map<string, number>());
  const vraagStart = useRef(0);
  const sluitend = useRef(false);
  const statistiek = useRef<VraagStatistiek[]>(vragen.map(() => ({ antwoorden: 0, fout: 0 })));
  const foutPerSpeler = useRef(new Map<string, string[]>());
  const resultatenGestuurd = useRef(false);

  // De laatste stand, voor de afsluitfunctie die ook vanuit een timer loopt.
  const stand = useRef({ sessie, spelers, antwoorden });
  stand.current = { sessie, spelers, antwoorden };

  useEffect(() => {
    const stopSessie = opslag.volgSessie(code, (s) => s && setSessie(s));
    const stopSpelers = opslag.volgSpelers(code, setSpelers);
    return () => {
      stopSessie();
      stopSpelers();
    };
  }, [code]);

  useEffect(() => {
    if (quiz.vraagNr < 0) return;
    return opslag.volgWedstrijdAntwoorden(code, quiz.vraagNr, (lijst) => {
      const nu = Date.now();
      for (const a of lijst) if (!gezien.current.has(a.apparaat)) gezien.current.set(a.apparaat, nu);
      setAntwoorden(lijst);
    });
  }, [code, quiz.vraagNr]);

  const zetQuiz = useCallback(
    async (nieuw: WedstrijdToestand) => {
      await opslag.wijzigSessie(code, { quiz: nieuw });
      setSessie((s) => ({ ...s, quiz: nieuw }));
    },
    [code]
  );

  const metFoutmelding = async (actie: () => Promise<void>) => {
    if (bezig) return;
    setBezig(true);
    try {
      await actie();
      setFout("");
    } catch (e) {
      console.error("Wedstrijd bijwerken mislukt", e);
      setFout("Dat is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  /* ── Verloop ──────────────────────────────────────────────────────────── */

  const startVraag = (nr: number) =>
    metFoutmelding(async () => {
      const v = vragen[nr];
      gezien.current = new Map();
      sluitend.current = false;
      setAntwoorden([]);
      // Vóór het wegschrijven: een snel toestel kan antwoorden nog voor de schrijfactie klaar is.
      vraagStart.current = Date.now();
      const seconden = tijdVoor(v.bron, inst);
      const factor = puntenFactor(v.bron);
      setResterend(seconden);
      await zetQuiz({
        fase: "vraag",
        vraagNr: nr,
        aantalVragen: vragen.length,
        instellingen: inst,
        vraag: {
          tekst: v.bron.question,
          opties: v.opties,
          meerdere: v.bron.type === "multiple_response",
          seconden,
          ...(v.bron.type === "typ" ? { typen: true } : {}),
          ...(v.bron.type === "volgorde" ? { volgorde: true } : {}),
          ...(v.bron.type === "dia" ? { dia: true, diaTekst: v.bron.explanation ?? "" } : {}),
          ...(v.bron.media ? { media: v.bron.media } : {}),
          ...(v.optieMedia ? { optieMedia: v.optieMedia } : {}),
          ...(factor !== 1 && v.bron.type !== "dia" ? { punten: factor } : {}),
        },
      });
    });

  const sluitVraag = useCallback(async () => {
    if (sluitend.current) return;
    sluitend.current = true;
    setBezig(true);

    const { sessie: s, spelers: alle, antwoorden: binnen } = stand.current;
    const q = s.quiz as WedstrijdToestand;
    const v = vragen[q.vraagNr];
    const limietMs = (q.vraag?.seconden ?? q.instellingen.seconden) * 1000;
    const factor = puntenFactor(v.bron);
    const perToestel = new Map(binnen.map((a) => [a.apparaat, a]));

    const bijgewerkt = alle.map((sp) => {
      const antwoord = perToestel.get(sp.apparaat);
      const juist = antwoordJuist(antwoord, v);
      const reactie = (gezien.current.get(sp.apparaat) ?? Date.now()) - vraagStart.current;
      // Een vraag zonder punten telt niet mee, ook niet voor de reeks.
      const punten = puntenVoor(juist, q.instellingen, reactie, limietMs) * factor;
      const reeks = factor === 0 ? (sp.reeks ?? 0) : juist ? (sp.reeks ?? 0) + 1 : 0;
      const bonus = juist && factor > 0 ? reeksBonus(reeks, q.instellingen) : 0;
      if (antwoord && !juist) {
        const lijst = foutPerSpeler.current.get(sp.apparaat) ?? [];
        foutPerSpeler.current.set(sp.apparaat, [...lijst, v.bron.id]);
      }
      return {
        ...sp,
        punten: (sp.punten ?? 0) + punten + bonus,
        reeks,
        laatste: { vraagNr: q.vraagNr, beantwoord: Boolean(antwoord), juist, punten, bonus },
      };
    });
    // Eerst de plaats van elke speler, dan die van zijn team. Allebei schrijft het bord in
    // het spelersdocument, zodat elk toestel zijn stand ziet zonder de lijst te kennen.
    const gerangschikt = rangschik(bijgewerkt);
    const teamsStand = q.instellingen.teams > 0 ? teamStand(gerangschikt, q.instellingen.teams) : [];
    const metTeam = gerangschikt.map((sp) => {
      const rij = teamsStand.find((t) => t.sleutel === `team-${sp.team}`);
      return rij ? { ...sp, teamPunten: rij.punten, teamPlaats: rij.plaats } : sp;
    });

    const verdeling = v.opties.map(() => 0);
    let aantalFout = 0;
    // Bij een volgorde-vraag zegt een verdeling per optie niets: daar tellen we per optie
    // hoeveel toestellen ze op de juiste plaats zetten.
    const isVolgorde = v.bron.type === "volgorde";
    for (const a of binnen) {
      if (isVolgorde) {
        (a.keuze ?? []).forEach((k, plek) => {
          if (k >= 0 && k < verdeling.length && v.juist[plek] === k) verdeling[k]++;
        });
      } else for (const k of a.keuze ?? []) if (k >= 0 && k < verdeling.length) verdeling[k]++;
      if (!antwoordJuist(a, v)) aantalFout++;
    }
    statistiek.current[q.vraagNr] = { antwoorden: binnen.length, fout: aantalFout };
    // Bij een typvraag toont het bord wat de klas intypte in plaats van een verdeling.
    const isTyp = v.bron.type === "typ";

    try {
      // Eerst de punten, dan de fase: zo ziet een toestel zijn resultaat meteen.
      if (metTeam.length) await opslag.werkSpelersBij(code, metTeam);
      await zetQuiz({
        ...q,
        fase: "uitleg",
        juist: v.juist,
        uitleg: v.bron.explanation,
        verdeling,
        ...(isTyp ? { juisteTekst: juisteTekstVan(v), gegeven: telGegeven(binnen, v) } : {}),
      });
      setFout("");
    } catch (e) {
      console.error("Vraag afsluiten mislukt", e);
      sluitend.current = false;
      setFout("De vraag afsluiten is niet gelukt. Probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  }, [code, vragen, zetQuiz]);

  // De klok: sluit af als de tijd om is, of zodra iedereen geantwoord heeft.
  useEffect(() => {
    if (quiz.fase !== "vraag" || isDia) return;
    const tik = setInterval(() => {
      if (limiet > 0) {
        const over = Math.max(0, limiet - (Date.now() - vraagStart.current) / 1000);
        setResterend(Math.ceil(over));
        if (over <= 0) sluitVraag();
      }
    }, 250);
    return () => clearInterval(tik);
  }, [quiz.fase, limiet, isDia, sluitVraag]);

  const iedereen = spelers.length > 0 && antwoorden.length >= spelers.length;
  useEffect(() => {
    if (quiz.fase !== "vraag" || isDia || !iedereen) return;
    // Heel even wachten, zodat de laatste cursist ziet dat zijn antwoord binnen is.
    const t = setTimeout(sluitVraag, 800);
    return () => clearTimeout(t);
  }, [quiz.fase, isDia, iedereen, sluitVraag]);

  const isLaatste = quiz.vraagNr >= vragen.length - 1;
  const volScherm = useVolledigScherm();
  const metPodium = inst.podium !== false;
  const eindLabel = metPodium ? "Naar het podium" : "Naar het einde";

  const naarPodium = () =>
    metFoutmelding(async () => {
      await zetQuiz({ ...quiz, fase: "podium" });
      stuurResultaten();
    });

  const volgende = () => {
    // Na een dia volgt meteen de volgende vraag: er valt niets uit te leggen of te tellen.
    if (quiz.fase === "vraag" && isDia) return isLaatste ? naarPodium() : startVraag(quiz.vraagNr + 1);
    if (quiz.fase === "uitleg" && inst.tussenstand === "elkeVraag" && !isLaatste) {
      return metFoutmelding(() => zetQuiz({ ...quiz, fase: "tussenstand" }));
    }
    return isLaatste ? naarPodium() : startVraag(quiz.vraagNr + 1);
  };

  /**
   * Welke vragen fout gingen, per toestel en zonder naam, zoals bij de Eenvoudige quiz.
   * Zo ziet de maker later welke vraag het moeilijkst was.
   */
  const stuurResultaten = () => {
    if (resultatenGestuurd.current) return;
    resultatenGestuurd.current = true;
    const gespeeld = Math.max(1, quiz.vraagNr + 1);
    for (const sp of stand.current.spelers) {
      if (!sp.laatste) continue;
      opslag
        .stuurQuizresultaat(oefening.id, foutPerSpeler.current.get(sp.apparaat) ?? [], gespeeld)
        .catch(() => {});
    }
  };

  const sluitAf = () =>
    metFoutmelding(async () => {
      await opslag.wijzigSessie(code, { status: "afgesloten" });
      onStop();
    });

  /* ── Weergave ─────────────────────────────────────────────────────────── */

  // Wat het bord toont in de tussenstand en op het podium: de teams of de spelers.
  const rijen = useMemo(
    () => (inst.teams > 0 ? teamStand(spelers, inst.teams) : spelerRijen(spelers)),
    [spelers, inst.teams]
  );

  return (
    <div
      ref={volScherm.ref}
      className={volScherm.actief ? `${VOLSCHERM_KLASSE} space-y-4` : "max-w-5xl mx-auto space-y-4 u-fade"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={sluitAf}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        >
          <Square className="w-3.5 h-3.5" />
          <span>Wedstrijd stoppen</span>
        </button>
        <span className="text-xs font-bold text-slate-500">
          {inst.spelvorm === "rustig" ? "Rustig" : "Klassiek"} ·{" "}
          {inst.tijdUitQuiz
            ? "tijd per vraag zoals in de quiz"
            : inst.seconden
              ? `${inst.seconden} s per vraag`
              : "je sluit zelf af"}{" "}
          · reeksbonus{" "}
          {inst.reeksbonus ? "aan" : "uit"}
          {inst.teams > 0 && ` · ${inst.teams} teams`}
        </span>
        <VolledigSchermKnop
          actief={volScherm.actief}
          onClick={volScherm.wissel}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        />
      </div>

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      <div className="bg-merk-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg min-h-[28rem]">
        {quiz.fase === "wachtruimte" && (
          <Wachtruimte
            code={code}
            titel={oefening.title}
            spelers={spelers}
            teams={inst.teams}
            onVerwijder={(a) => opslag.verwijderSpeler(code, a).catch(() => setFout("Verwijderen is niet gelukt."))}
            onVerdeel={() =>
              opslag
                .werkSpelersBij(code, verdeelTeams(spelers, inst.teams))
                .catch(() => setFout("De teams verdelen is niet gelukt."))
            }
          />
        )}

        {quiz.fase === "vraag" && huidig && (
          <VraagScherm
            nr={quiz.vraagNr}
            totaal={vragen.length}
            vraag={huidig}
            resterend={limiet && !isDia ? resterend : null}
            binnen={antwoorden.length}
            spelers={spelers.length}
            code={code}
          />
        )}

        {quiz.fase === "uitleg" && huidig && (
          <UitlegScherm
            vraag={huidig}
            verdeling={quiz.verdeling ?? []}
            binnen={antwoorden.length}
            gegeven={quiz.gegeven}
          />
        )}

        {quiz.fase === "tussenstand" && (
          <Tussenstand rijen={rijen} nr={quiz.vraagNr} totaal={vragen.length} teams={inst.teams > 0} />
        )}

        {quiz.fase === "podium" &&
          (metPodium ? (
            <Podium rijen={rijen} teams={inst.teams > 0} />
          ) : (
            <Einde spelers={spelers.length} />
          ))}
      </div>

      {/* De knop die het verloop verder zet: altijd op dezelfde plek. */}
      {quiz.fase === "wachtruimte" && (
        <Hoofdknop onClick={() => startVraag(0)} bezig={bezig}>
          {spelers.length === 0 ? "Start toch, zonder deelnemers" : `Start de wedstrijd met ${spelers.length}`}
        </Hoofdknop>
      )}
      {quiz.fase === "vraag" && isDia && (
        <Hoofdknop onClick={volgende} bezig={bezig}>
          {isLaatste ? eindLabel : "Volgende vraag"}
        </Hoofdknop>
      )}
      {quiz.fase === "vraag" && !isDia && (
        <Hoofdknop onClick={sluitVraag} bezig={bezig} rustig>
          Sluit de vraag nu af
        </Hoofdknop>
      )}
      {(quiz.fase === "uitleg" || quiz.fase === "tussenstand") && (
        <Hoofdknop onClick={volgende} bezig={bezig}>
          {quiz.fase === "uitleg" && inst.tussenstand === "elkeVraag" && !isLaatste
            ? "Toon de tussenstand"
            : isLaatste
              ? eindLabel
              : "Volgende vraag"}
        </Hoofdknop>
      )}

      {quiz.fase === "podium" && (
        <Afsluiter
          oefening={oefening}
          vragen={vragen}
          statistiek={statistiek.current}
          onSluit={sluitAf}
        />
      )}

      {!opslagGedeeld && (
        <DemoSpelers code={code} quiz={quiz} spelers={spelers} antwoorden={antwoorden} />
      )}
    </div>
  );
}

/* ── Onderdelen van het bord ────────────────────────────────────────────── */

function Hoofdknop({
  onClick,
  bezig,
  rustig,
  children,
}: {
  onClick: () => void;
  bezig: boolean;
  rustig?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={bezig}
      className={`w-full py-4 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
        rustig
          ? "bg-white border border-slate-300 text-slate-800 hover:border-merk"
          : "bg-merk-800 hover:bg-merk-900 text-white"
      }`}
    >
      <span>{children}</span>
      {!rustig && <ArrowRight className="w-5 h-5" />}
    </button>
  );
}

function usePincode(code: string) {
  const [qr, setQr] = useState("");
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = `${window.location.origin}/live/join?code=${code}`;
    setUrl(u);
    QRCode.toDataURL(u, { width: 280, margin: 2, color: { dark: merkTint("900"), light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code]);
  return { qr, url, pincode: `${code.slice(0, 3)} ${code.slice(3)}` };
}

function Wachtruimte({
  code,
  titel,
  spelers,
  teams,
  onVerwijder,
  onVerdeel,
}: {
  code: string;
  titel: string;
  spelers: WedstrijdSpeler[];
  teams: number;
  onVerwijder: (apparaat: string) => void;
  onVerdeel: () => void;
}) {
  const { qr, url, pincode } = usePincode(code);
  const gesorteerd = [...spelers].sort((a, b) => a.op.localeCompare(b.op));

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-white/20">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-white/70 block mb-2">
            Quizwedstrijd · scan de code en kies een bijnaam
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-3">{titel}</h1>
          <p className="text-white/80 text-sm sm:text-base">
            Surf naar <strong className="text-white">{url.replace(/^https?:\/\//, "").replace(/\?.*$/, "")}</strong>{" "}
            en vul de pincode in.
          </p>
        </div>
        <div className="bg-white text-merk-900 p-4 rounded-2xl flex flex-col items-center shrink-0">
          { }
          {qr && <img src={qr} alt="QR-code om mee te doen" className="w-40 h-40 rounded-lg mb-2" />}
          <span className="text-[11px] font-semibold text-slate-500">Pincode</span>
          <span className="font-mono text-3xl font-black tracking-widest">{pincode}</span>
        </div>
      </div>

      <div className="pt-5">
        <p className="flex items-center gap-2 text-sm font-bold mb-4">
          <Users className="w-4 h-4" />
          {spelers.length === 0
            ? "Wachten op de eerste deelnemers ..."
            : `${spelers.length} ${spelers.length === 1 ? "deelnemer" : "deelnemers"}`}
        </p>
        {teams > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: teams }, (_, t) => (
                <div key={t} className="rounded-2xl bg-white/10 p-3">
                  <p className="text-sm font-black mb-2">
                    {teamNaam(t)}{" "}
                    <span className="font-bold text-white/60">
                      ({gesorteerd.filter((s) => s.team === t).length})
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {gesorteerd
                      .filter((s) => s.team === t)
                      .map((s) => (
                        <Naamkaartje key={s.apparaat} speler={s} onVerwijder={onVerwijder} />
                      ))}
                  </ul>
                </div>
              ))}
            </div>

            {gesorteerd.some((s) => s.team === undefined) && (
              <div>
                <p className="text-sm font-bold text-white/70 mb-2">Nog geen team gekozen</p>
                <ul className="flex flex-wrap gap-2">
                  {gesorteerd
                    .filter((s) => s.team === undefined)
                    .map((s) => (
                      <Naamkaartje key={s.apparaat} speler={s} onVerwijder={onVerwijder} />
                    ))}
                </ul>
              </div>
            )}

            {spelers.length > 1 && (
              <button
                onClick={onVerdeel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold"
              >
                <Shuffle className="w-4 h-4" />
                Verdeel de teams gelijk
              </button>
            )}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {gesorteerd.map((s) => (
              <Naamkaartje key={s.apparaat} speler={s} onVerwijder={onVerwijder} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Eén bijnaam in de wachtruimte, met het kruisje om ze weg te halen. */
function Naamkaartje({
  speler,
  onVerwijder,
}: {
  speler: WedstrijdSpeler;
  onVerwijder: (apparaat: string) => void;
}) {
  return (
    <li className="u-pop inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-white/15 text-sm font-bold">
      {speler.bijnaam}
      <button
        onClick={() => onVerwijder(speler.apparaat)}
        className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/20"
        aria-label={`Verwijder ${speler.bijnaam}`}
        title="Verwijder deze bijnaam"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}

function VraagScherm({
  nr,
  totaal,
  vraag,
  resterend,
  binnen,
  spelers,
  code,
}: {
  nr: number;
  totaal: number;
  vraag: WedstrijdVraag;
  resterend: number | null;
  binnen: number;
  spelers: number;
  code: string;
}) {
  const bijna = resterend !== null && resterend <= 5;
  if (vraag.bron.type === "dia") return <DiaScherm vraag={vraag} nr={nr} totaal={totaal} />;
  const factor = puntenFactor(vraag.bron);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 text-sm font-bold text-white/80">
        <span className="flex items-center gap-2">
          Vraag {nr + 1} van {totaal}
          {factor !== 1 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-merk-900 text-xs font-black">
              {factor === 2 ? "Dubbele punten" : "Geen punten"}
            </span>
          )}
        </span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {binnen} van {spelers} antwoordden
          </span>
          {resterend !== null && (
            <span
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black tabular-nums ${
                bijna ? "bg-amber-400 text-merk-900" : "bg-white/15 text-white"
              }`}
              aria-label={`Nog ${resterend} seconden`}
            >
              {resterend}
            </span>
          )}
        </span>
      </div>

      {vraag.bron.media && (
        <div className="bg-white/5 rounded-2xl p-2">
          <VraagMedia media={vraag.bron.media} groot />
        </div>
      )}

      <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-center">
          <Opmaak tekst={vraag.bron.question} />
        </h1>
      {vraag.bron.type === "multiple_response" && (
        <p className="text-center text-sm font-bold text-white/70 -mt-3">Meerdere antwoorden zijn juist</p>
      )}

      {vraag.bron.type === "typ" ? (
        <p className="text-center text-lg sm:text-2xl font-bold text-white/80">
          Typ je antwoord op je toestel.
        </p>
      ) : vraag.bron.type === "volgorde" ? (
        <>
          <p className="text-center text-lg sm:text-2xl font-bold text-white/80 -mt-2">
            Zet de delen in de juiste volgorde op je toestel.
          </p>
          <ul className="flex flex-wrap justify-center gap-3">
            {vraag.opties.map((deel, i) => (
              <li key={i} className="px-4 py-3 rounded-2xl bg-white/15 text-lg sm:text-2xl font-bold">
                {deel}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <OptieRaster opties={vraag.opties} media={vraag.optieMedia} />
          <OptieBronnen media={vraag.optieMedia} licht />
        </>
      )}

      <p className="text-xs text-white/60 text-center">
        Later binnen? Pincode <span className="font-mono font-bold">{code.slice(0, 3)} {code.slice(3)}</span>
      </p>
    </div>
  );
}

function OptieRaster({
  opties,
  media,
  juist,
  verdeling,
  totaal,
}: {
  opties: string[];
  media?: (QuizMedia | null)[];
  juist?: number[];
  verdeling?: number[];
  totaal?: number;
}) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {opties.map((optie, i) => {
        const stijl = stijlVoor(i);
        const isJuisteOptie = juist?.includes(i);
        const gedimd = juist && !isJuisteOptie;
        const n = verdeling?.[i] ?? 0;
        const pct = totaal ? Math.round((n / totaal) * 100) : 0;
        return (
          <li
            key={i}
            className={`relative overflow-hidden rounded-2xl ${stijl.vlak} text-white flex items-center gap-4 p-4 sm:p-5 min-h-20 transition-opacity ${
              gedimd ? "opacity-40" : ""
            }`}
          >
            <Vorm vorm={stijl.vorm} className="w-8 h-8 shrink-0" />
            <span className="sr-only">{VORM_NAAM[stijl.vorm]}:</span>
            {media?.[i] ? (
              <span className="flex-1 flex items-center gap-3 min-w-0">
                <img
                  src={media[i]!.url}
                  alt={media[i]!.alt || optie}
                  className="h-24 sm:h-32 max-w-[60%] object-contain rounded-xl bg-white"
                />
                {optie && optie !== media[i]!.alt && (
                  <span className="text-lg sm:text-xl font-bold leading-snug">{optie}</span>
                )}
              </span>
            ) : (
              <span className="text-lg sm:text-2xl font-bold leading-snug flex-1">
                <Opmaak tekst={optie} />
              </span>
            )}
            {isJuisteOptie && <CheckCircle2 className="w-8 h-8 shrink-0" aria-label="juist" />}
            {verdeling && (
              <span className="font-mono text-lg font-black shrink-0" title={`${pct}%`}>
                {n}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function UitlegScherm({
  vraag,
  verdeling,
  binnen,
  gegeven,
}: {
  vraag: WedstrijdVraag;
  verdeling: number[];
  binnen: number;
  gegeven?: { tekst: string; aantal: number; juist: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-center">
        <Opmaak tekst={vraag.bron.question} />
      </h1>
      {vraag.bron.type === "typ" ? (
        <GetypteAntwoorden vraag={vraag} gegeven={gegeven ?? []} />
      ) : vraag.bron.type === "volgorde" ? (
        <JuisteVolgorde vraag={vraag} verdeling={verdeling} binnen={binnen} />
      ) : (
        <OptieRaster
          opties={vraag.opties}
          media={vraag.optieMedia}
          juist={vraag.juist}
          verdeling={verdeling}
          totaal={binnen}
        />
      )}
      {vraag.bron.explanation && (
        <div className="bg-white text-merk-900 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-merk-700 mb-1">Waarom</p>
          <p className="text-base sm:text-lg leading-relaxed">
            <Opmaak tekst={vraag.bron.explanation} />
          </p>
        </div>
      )}
    </div>
  );
}

/** Een dia: titel, beeld en tekst. Niemand antwoordt; de leraar gaat verder als de klas klaar is. */
function DiaScherm({ vraag, nr, totaal }: { vraag: WedstrijdVraag; nr: number; totaal: number }) {
  const regels = (vraag.bron.explanation ?? "").split("\n").map((r) => r.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-5">
      <span className="text-sm font-bold text-white/80">
        {nr + 1} van {totaal} · Uitleg
      </span>
      {vraag.bron.question && (
        <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-center">
          <Opmaak tekst={vraag.bron.question} />
        </h1>
      )}
      {vraag.bron.media && (
        <div className="bg-white/5 rounded-2xl p-2">
          <VraagMedia media={vraag.bron.media} groot />
        </div>
      )}
      {regels.length > 1 ? (
        <ul className="space-y-2 text-lg sm:text-2xl leading-relaxed list-disc pl-8">
          {regels.map((r, i) => (
            <li key={i}>
              <Opmaak tekst={r.replace(/^[-•]\s*/, "")} />
            </li>
          ))}
        </ul>
      ) : (
        regels[0] && (
          <p className="text-lg sm:text-2xl leading-relaxed text-center">
            <Opmaak tekst={regels[0]} />
          </p>
        )
      )}
    </div>
  );
}

/** Bij een volgorde-vraag: de juiste volgorde, en per deel hoeveel toestellen het goed plaatsten. */
function JuisteVolgorde({
  vraag,
  verdeling,
  binnen,
}: {
  vraag: WedstrijdVraag;
  verdeling: number[];
  binnen: number;
}) {
  return (
    <div className="space-y-3">
      <ol className="flex flex-wrap justify-center gap-3">
        {vraag.juist.map((optie, plek) => (
          <li key={plek} className="px-4 py-3 rounded-2xl bg-emerald-600 text-lg sm:text-2xl font-bold flex items-center gap-2">
            <span className="text-sm font-black text-white/70">{plek + 1}</span>
            {vraag.opties[optie]}
            {binnen > 0 && (
              <span className="font-mono text-sm text-white/80" title="op de juiste plaats">
                {verdeling[optie] ?? 0}/{binnen}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Bij een typvraag: het juiste antwoord groot, daaronder wat de klas typte. */
function GetypteAntwoorden({
  vraag,
  gegeven,
}: {
  vraag: WedstrijdVraag;
  gegeven: { tekst: string; aantal: number; juist: boolean }[];
}) {
  const juist = juisteTekstVan(vraag);
  const andere = (vraag.bron.antwoorden ?? []).slice(1);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-emerald-600 text-white p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1">Het juiste antwoord</p>
        <p className="text-2xl sm:text-4xl font-extrabold break-words">{juist}</p>
        {andere.length > 0 && (
          <p className="text-sm text-white/80 mt-2">Ook goed: {andere.join(", ")}</p>
        )}
      </div>

      {gegeven.length > 0 && (
        <div>
          <p className="text-sm font-bold text-white/70 mb-2">Wat de klas typte</p>
          <ul className="flex flex-wrap gap-2">
            {gegeven.map((g) => (
              <li
                key={g.tekst}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                  g.juist ? "bg-emerald-500/30 text-emerald-100" : "bg-white/10 text-white/80"
                }`}
              >
                {g.juist && <CheckCircle2 className="w-4 h-4" />}
                <span className="break-words">{g.tekst}</span>
                {g.aantal > 1 && <span className="font-mono text-white/60">{g.aantal}×</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Tussenstand({
  rijen,
  nr,
  totaal,
  teams,
}: {
  rijen: (StandRij & { plaats: number })[];
  nr: number;
  totaal: number;
  teams: boolean;
}) {
  const top = rijen.slice(0, TOP);
  return (
    <div>
      <p className="text-sm font-bold text-white/70 mb-1">
        Na vraag {nr + 1} van {totaal}
      </p>
      <h1 className="text-2xl sm:text-4xl font-extrabold mb-6">Tussenstand</h1>
      {top.length === 0 ? (
        <p className="text-white/70">Nog geen deelnemers.</p>
      ) : (
        <ol className="space-y-2">
          {top.map((r) => (
            <li
              key={r.sleutel}
              className="u-rise flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-3 text-lg sm:text-xl"
            >
              <span className="w-8 font-black text-white/70 tabular-nums">{r.plaats}</span>
              <span className="flex-1 font-bold truncate">
                {r.naam}
                {r.leden !== undefined && (
                  <span className="ml-2 text-sm font-bold text-white/60">
                    {r.leden} {r.leden === 1 ? "speler" : "spelers"}
                  </span>
                )}
              </span>
              {r.winst !== undefined && r.winst > 0 && (
                <span className="text-sm font-bold text-emerald-300">+{r.winst}</span>
              )}
              <span className="font-mono font-black tabular-nums">{r.punten}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-5 text-sm text-white/70">
        {teams
          ? "De teamscore is het gemiddelde van de leden. Je eigen punten staan op je toestel."
          : "Je eigen plaats staat op je toestel."}
      </p>
    </div>
  );
}

/** Het einde zonder podium: geen namen, geen rangschikking. */
function Einde({ spelers }: { spelers: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 min-h-[24rem]">
      <Trophy className="w-14 h-14 text-amber-300" />
      <h1 className="text-3xl sm:text-5xl font-extrabold">Dat was de laatste vraag</h1>
      <p className="text-lg text-white/80">
        {spelers === 1 ? "1 deelnemer deed mee" : `${spelers} deelnemers deden mee`}. Iedereen ziet zijn punten
        op zijn toestel.
      </p>
    </div>
  );
}

function Podium({ rijen, teams }: { rijen: (StandRij & { plaats: number })[]; teams: boolean }) {
  // Rustige confetti, één keer, en niet voor wie minder beweging wil.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    import("canvas-confetti")
      .then(({ default: confetti }) =>
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.35 }, disableForReducedMotion: true })
      )
      .catch(() => {});
  }, []);

  const [eerste, tweede, derde] = rijen;
  const blokken = [
    { s: tweede, hoogte: "h-28", plek: 2 },
    { s: eerste, hoogte: "h-40", plek: 1 },
    { s: derde, hoogte: "h-20", plek: 3 },
  ];

  return (
    <div className="text-center">
      <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-300" />
      <h1 className="text-2xl sm:text-4xl font-extrabold mb-2">Het podium</h1>
      <p className="text-sm text-white/70 mb-6">
        {teams ? "Per team, met het gemiddelde van de leden" : "Op punten"}
      </p>
      {rijen.length === 0 ? (
        <p className="text-white/70">Er deed niemand mee.</p>
      ) : (
        <div className="flex items-end justify-center gap-3 sm:gap-6">
          {blokken.map(({ s, hoogte, plek }) => (
            <div key={plek} className="w-28 sm:w-44 flex flex-col items-center">
              {s ? (
                <>
                  <span className="font-bold text-base sm:text-xl leading-tight mb-1 break-words">{s.naam}</span>
                  <span className="font-mono text-sm text-white/80 mb-2">{s.punten}</span>
                </>
              ) : (
                <span className="mb-2 text-white/40">—</span>
              )}
              <div
                className={`w-full ${hoogte} rounded-t-2xl flex items-start justify-center pt-2 text-3xl font-black ${
                  plek === 1 ? "bg-amber-300 text-merk-900" : "bg-white/20"
                }`}
              >
                {s ? s.plaats : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Na het podium, alleen voor de leraar: waar de klas struikelde, en die vragen meteen
 * meegeven als Eenvoudige quiz om rustig te herhalen.
 */
function Afsluiter({
  oefening,
  vragen,
  statistiek,
  onSluit,
}: {
  oefening: Exercise;
  vragen: WedstrijdVraag[];
  statistiek: VraagStatistiek[];
  onSluit: () => void;
}) {
  const { gebruiker } = useAuth();
  const [herhaal, setHerhaal] = useState<Exercise | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  const moeilijkst = vragen
    .map((v, i) => ({ v, ...statistiek[i] }))
    .filter((r) => r.fout > 0 && r.antwoorden > 0)
    .sort((a, b) => b.fout / b.antwoorden - a.fout / a.antwoorden)
    .slice(0, 3);

  const maakHerhaling = async () => {
    if (bezig || moeilijkst.length === 0) return;
    setBezig(true);
    setFout("");
    const nieuw: Exercise = {
      id: `quiz-${Date.now()}`,
      title: `Herhaling: ${oefening.title}`.slice(0, 200),
      description: "De vragen die in de quizwedstrijd het vaakst fout gingen, om op eigen tempo te herhalen.",
      category: "quiz",
      didacticGoal: "check",
      type: "quiz",
      creatorName: gebruiker?.naam ?? "Onbekend",
      creatorId: gebruiker?.id,
      visibility: "prive",
      shareCode: generateShortCode(),
      tags: ["Quiz", "Herhaling"],
      content: { questions: moeilijkst.map((r) => r.v.bron) },
      didacticConfig: { ...oefening.didacticConfig, showImmediateFeedback: true, allowRetryMissed: true },
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      await opslag.maakOefeningen([nieuw]);
      setHerhaal(nieuw);
    } catch (e) {
      console.error("Herhaalquiz maken mislukt", e);
      setFout("De herhaalquiz maken is niet gelukt. Probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 mb-1">Alleen voor jou</p>
        <h2 className="text-lg font-extrabold text-merk-900">Waar de klas struikelde</h2>
      </div>

      {moeilijkst.length === 0 ? (
        <p className="text-sm text-slate-600">Geen enkele vraag ging fout. Mooi zo.</p>
      ) : (
        <ol className="space-y-2">
          {moeilijkst.map((r) => (
            <li key={r.v.bron.id} className="flex items-start gap-3 text-sm">
              <span className="font-mono font-bold text-rose-700 shrink-0 w-12">
                {Math.round((r.fout / r.antwoorden) * 100)}%
              </span>
              <span className="text-slate-800">{r.v.bron.question}</span>
            </li>
          ))}
        </ol>
      )}
      {moeilijkst.length > 0 && <p className="text-xs text-slate-500">Percentage = deel van de antwoorden dat fout was.</p>}

      {herhaal ? (
        <div className="rounded-xl bg-merk-50 border border-merk/30 p-4 text-sm text-merk-900">
          <p className="font-bold mb-1">De herhaalquiz staat klaar in je bibliotheek</p>
          <p>
            Cursisten openen hem met de code <span className="font-mono font-black">{herhaal.shareCode}</span>, of via{" "}
            <Link href={`/oefen/${herhaal.id}`} className="underline font-bold">
              deze link
            </Link>
            .
          </p>
        </div>
      ) : (
        moeilijkst.length > 0 && (
          <button
            onClick={maakHerhaling}
            disabled={bezig}
            className="w-full py-3 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {bezig ? "Bezig ..." : `Geef deze ${moeilijkst.length === 1 ? "vraag" : `${moeilijkst.length} vragen`} mee als Eenvoudige quiz`}
          </button>
        )
      )}
      {fout && <p role="alert" className="text-xs font-semibold text-rose-800">{fout}</p>}

      <button
        onClick={onSluit}
        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm"
      >
        Wedstrijd afsluiten
      </button>
    </div>
  );
}

/** In demomodus: deelnemers en antwoorden nabootsen zonder tweede toestel. */
function DemoSpelers({
  code,
  quiz,
  spelers,
  antwoorden,
}: {
  code: string;
  quiz: WedstrijdToestand;
  spelers: WedstrijdSpeler[];
  antwoorden: WedstrijdAntwoord[];
}) {
  const voegToe = () => {
    const apparaat = `demo-${Math.random().toString(36).slice(2, 8)}`;
    const teams = quiz.instellingen.teams;
    opslag
      .meldSpeler(code, {
        apparaat,
        bijnaam: willekeurigeBijnaam(spelers.map((s) => s.bijnaam)),
        op: new Date().toISOString(),
        ...(teams > 0 ? { team: Math.floor(Math.random() * teams) } : {}),
      })
      .catch(() => {});
  };

  const laatAntwoorden = () => {
    const aantal = quiz.vraag?.opties.length ?? 0;
    const typen = quiz.vraag?.typen;
    if (quiz.vraag?.dia) return;
    const ordenen = quiz.vraag?.volgorde;
    for (const s of spelers) {
      if (!s.apparaat.startsWith("demo-") || antwoorden.some((a) => a.apparaat === s.apparaat)) continue;
      opslag
        .stuurWedstrijdAntwoord(code, {
          apparaat: s.apparaat,
          vraagNr: quiz.vraagNr,
          ...(typen
            ? { tekst: ["iets", "een gok", "geen idee"][Math.floor(Math.random() * 3)] }
            : ordenen
              ? { keuze: [...Array(aantal).keys()].sort(() => Math.random() - 0.5) }
              : { keuze: [Math.floor(Math.random() * aantal)] }),
          op: new Date().toISOString(),
        })
        .catch(() => {});
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
      <span className="text-xs font-bold text-slate-500 block">Demo: simuleer deelnemers</span>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={voegToe} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-merk-50 text-slate-700 font-semibold text-xs">
          + deelnemer
        </button>
        {quiz.fase === "vraag" && (
          <button onClick={laatAntwoorden} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-merk-50 text-slate-700 font-semibold text-xs">
            Laat de demodeelnemers antwoorden
          </button>
        )}
      </div>
    </div>
  );
}
