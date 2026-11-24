"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Presentation, Zap, Gauge, Trophy, LayoutDashboard, Brush } from "lucide-react";
import { opslag, opslagGedeeld, useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { BordInstellingen, Exercise, LiveSessie, OefeningVan, WedstrijdInstellingen } from "@/lib/types";
import { vanType } from "@/lib/oefeningInhoud";
import { WERKVORMEN, isKlassikaal } from "@/lib/labels";
import { LeraarPoort } from "@/components/LeraarPoort";
import { Studietip } from "@/components/Studietip";
import { WedstrijdOpzet } from "@/components/wedstrijd/WedstrijdOpzet";
import { WedstrijdBord } from "@/components/wedstrijd/WedstrijdBord";
import { maakWedstrijdVragen, type WedstrijdVraag } from "@/lib/wedstrijd";
import { BordOpzet } from "@/components/bord/BordOpzet";
import { BordLeraar } from "@/components/bord/BordLeraar";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import { TekenenOpzet, type TekenenKeuzes } from "@/components/tekenen/TekenenOpzet";
import { TekenenBord } from "@/components/tekenen/TekenenBord";
import { BEGRIPSMETER_OPTIES, LETTERS, nieuweSessie, vraagVan } from "@/components/live/sessie";
import { MateriaalOpzet, MateriaalSectie, SnelStartKnop } from "@/components/live/Keuzes";
import { SnelleVraagOpzet } from "@/components/live/SnelleVraagOpzet";
import { Projectiescherm } from "@/components/live/Projectiescherm";
import { EerdereSessies } from "@/components/live/EerdereSessies";

/*
 * De livepagina kiest wat er start en houdt bij welke sessie loopt. Elk sessietype heeft
 * zijn eigen opzet en zijn eigen projectiescherm, in src/components (live, wedstrijd, bord,
 * tekenen).
 */

function LiveInhoud() {
  const searchParams = useSearchParams();
  const oefeningId = searchParams.get("oefening");
  const wedstrijdId = searchParams.get("wedstrijd");
  const tekenenId = searchParams.get("tekenen");
  const { gebruiker, isLeraar } = useAuth();
  const { isAan } = useInstellingen();
  const { oefeningen: exercises, laden } = useMateriaal();

  const [gekozen, setGekozen] = useState<Exercise | null>(null);
  const [opzet, setOpzet] = useState<"snellevraag" | "bord" | null>(null);
  const [sessie, setSessie] = useState<LiveSessie | null>(null);
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);
  // Quizwedstrijd: eerst een quiz kiezen en instellen, dan loopt ze met gehusselde vragen.
  const [wedstrijdKeuze, setWedstrijdKeuze] = useState<OefeningVan<"quiz"> | null>(null);
  const [wedstrijd, setWedstrijd] = useState<{ oefening: OefeningVan<"quiz">; vragen: WedstrijdVraag[] } | null>(null);
  // Teken uit je geheugen: eerst een reeks kiezen en instellen.
  const [tekenKeuze, setTekenKeuze] = useState<OefeningVan<"tekenen"> | null>(null);
  const [tekenReeks, setTekenReeks] = useState<OefeningVan<"tekenen"> | null>(null);

  useEffect(() => {
    if (oefeningId && !gekozen) {
      setGekozen(exercises.find((ex) => ex.id === oefeningId) ?? null);
    }
  }, [oefeningId, exercises, gekozen]);

  // /live?wedstrijd=<id> opent meteen de instellingen voor die quiz.
  useEffect(() => {
    if (wedstrijdId && !wedstrijdKeuze && isAan("wedstrijd")) {
      setWedstrijdKeuze(exercises.filter(vanType("quiz")).find((ex) => ex.id === wedstrijdId) ?? null);
    }
    // isAan volgt uit de instellingen; de URL is wat telt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wedstrijdId, exercises, wedstrijdKeuze]);

  // /live?tekenen=<id> opent meteen de instellingen voor die reeks.
  useEffect(() => {
    if (tekenenId && !tekenKeuze && isAan("tekenen")) {
      setTekenKeuze(exercises.filter(vanType("tekenen")).find((ex) => ex.id === tekenenId) ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tekenenId, exercises, tekenKeuze]);

  const klassikaal = exercises.filter(isKlassikaal);
  const tekenreeksen = exercises
    .filter(vanType("tekenen"))
    .filter((ex) => ex.content.tekenopdrachten.length > 0);
  const quizzen = exercises.filter(vanType("quiz")).filter((ex) => ex.content.questions.length > 0);

  const start = async (nieuw: LiveSessie) => {
    if (bezig) return;
    setBezig(true);
    setFout("");
    try {
      await opslag.startSessie(nieuw);
      setSessie(nieuw);
    } catch {
      setFout("De sessie starten is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  const startMateriaal = (ex: Exercise) => {
    if (!gebruiker) return;
    start(
      nieuweSessie(gebruiker, ex.type === "wordcloud" ? "wordcloud" : "poll", {
        oefeningId: ex.id,
        titel: ex.title,
        vraag: vraagVan(ex),
        opties: ex.type === "poll" ? ex.content.pollOptions : [],
      })
    );
  };

  const startSnelleVraag = (vraag: string, aantal: number) => {
    if (!gebruiker) return;
    start(
      nieuweSessie(gebruiker, "snellevraag", {
        titel: "Snelle vraag",
        vraag: vraag.trim() || "Kijk naar het bord",
        opties: LETTERS.slice(0, aantal),
      })
    );
  };

  const startWedstrijd = async (instellingen: WedstrijdInstellingen) => {
    if (!gebruiker || !wedstrijdKeuze) return;
    const vragen = maakWedstrijdVragen(wedstrijdKeuze.content.questions);
    setWedstrijd({ oefening: wedstrijdKeuze, vragen });
    await start(
      nieuweSessie(gebruiker, "quiz", {
        oefeningId: wedstrijdKeuze.id,
        titel: wedstrijdKeuze.title,
        vraag: wedstrijdKeuze.title,
        quiz: { fase: "wachtruimte", vraagNr: -1, aantalVragen: vragen.length, instellingen },
      })
    );
  };

  const startBord = (opdracht: string, instellingen: BordInstellingen) => {
    if (!gebruiker) return;
    start(
      nieuweSessie(gebruiker, "bord", {
        titel: "Whiteboard",
        vraag: opdracht,
        bord: instellingen,
      })
    );
  };

  const startTekenen = async (keuzes: TekenenKeuzes) => {
    const opdrachten = tekenKeuze?.content.tekenopdrachten ?? [];
    if (!gebruiker || !tekenKeuze || opdrachten.length === 0) return;
    setTekenReeks(tekenKeuze);
    // Alleen de naam gaat naar de toestellen; het beeld blijft op het bord van de leraar.
    await start(
      nieuweSessie(gebruiker, "tekenen", {
        oefeningId: tekenKeuze.id,
        titel: tekenKeuze.title,
        vraag: tekenKeuze.title,
        tekenen: {
          nr: 0,
          aantal: opdrachten.length,
          naam: opdrachten[0].naam,
          seconden: keuzes.seconden,
          namen: keuzes.namen,
          gestartOp: new Date().toISOString(),
        },
      })
    );
  };

  /** Een sessie van eerder opnieuw op het bord, om het resultaat te tonen of te bewaren. */
  const heropen = async (eerder: LiveSessie) => {
    setFout("");
    if (eerder.type === "tekenen") {
      // De tekeningen horen bij de reeks: zonder de reeks valt er niets te vergelijken.
      const ex = eerder.oefeningId ? await opslag.oefening(eerder.oefeningId).catch(() => null) : null;
      if (ex?.type !== "tekenen") {
        setFout("De reeks van deze sessie bestaat niet meer.");
        return;
      }
      setTekenReeks(ex);
    }
    setSessie(eerder);
  };

  const startBegripsmeter = () => {
    if (!gebruiker) return;
    start(
      nieuweSessie(gebruiker, "begripsmeter", {
        titel: "Begripsmeter",
        vraag: "Hoe goed volg je op dit moment?",
        opties: BEGRIPSMETER_OPTIES,
      })
    );
  };

  if (laden) return <div className="h-64" aria-hidden />;

  if (!isLeraar) {
    return (
      <LeraarPoort uitleg="Projecteren doet de leraar. Als cursist doe je mee via de pincode op het digibord." />
    );
  }

  if (sessie?.type === "quiz" && wedstrijd) {
    return (
      <WedstrijdBord
        sessie={sessie}
        oefening={wedstrijd.oefening}
        vragen={wedstrijd.vragen}
        onStop={() => {
          setSessie(null);
          setWedstrijd(null);
          setWedstrijdKeuze(null);
        }}
      />
    );
  }

  if (sessie?.type === "tekenen" && tekenReeks) {
    return (
      <TekenenBord
        sessie={sessie}
        oefening={tekenReeks}
        onStop={() => {
          setSessie(null);
          setTekenReeks(null);
          setTekenKeuze(null);
        }}
      />
    );
  }

  if (sessie?.type === "bord") {
    return (
      <BordLeraar
        sessie={sessie}
        onStop={() => {
          setSessie(null);
          setOpzet(null);
        }}
      />
    );
  }

  if (sessie) {
    return (
      <Projectiescherm
        sessie={sessie}
        onStop={() => {
          // Terug naar het keuzescherm, niet naar het opzetformulier van daarnet.
          setSessie(null);
          setOpzet(null);
          setGekozen(null);
        }}
      />
    );
  }

  /* ── Keuzescherm ──────────────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto space-y-8 u-fade">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          Start in de klas
        </h1>
        <p className="text-sm text-slate-600">
          Jij projecteert op het digibord. Cursisten antwoorden anoniem met hun smartphone. Ze
          hoeven niet in te loggen.
        </p>
      </div>

      <Studietip plek="live" />

      {!opslagGedeeld && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <strong>Demo:</strong> zonder Firebase-project werkt een sessie alleen tussen tabbladen
          van deze browser. Open de deelnamepagina in een tweede tabblad om het te proberen.
        </p>
      )}

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {tekenKeuze ? (
        <TekenenOpzet
          oefening={tekenKeuze}
          bezig={bezig}
          onStart={startTekenen}
          onAnnuleer={() => setTekenKeuze(null)}
        />
      ) : wedstrijdKeuze ? (
        <WedstrijdOpzet
          oefening={wedstrijdKeuze}
          bezig={bezig}
          onStart={startWedstrijd}
          onAnnuleer={() => setWedstrijdKeuze(null)}
        />
      ) : gekozen ? (
        <MateriaalOpzet
          oefening={gekozen}
          bezig={bezig}
          onStart={() => startMateriaal(gekozen)}
          onAnnuleer={() => setGekozen(null)}
        />
      ) : (
        <>
          {/* Zonder voorbereiding: het meest gebruikte deel, dus bovenaan */}
          {(isAan("snellevraag") || isAan("begripsmeter") || isAan("bord")) && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-1">
              Nu meteen, zonder voorbereiding
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Je hoeft niets klaar te zetten. Start, laat de pincode staan en ga door met je les.
            </p>

            {opzet === "snellevraag" ? (
              <SnelleVraagOpzet
                bezig={bezig}
                onStart={startSnelleVraag}
                onAnnuleer={() => setOpzet(null)}
              />
            ) : opzet === "bord" ? (
              <BordOpzet bezig={bezig} onStart={startBord} onAnnuleer={() => setOpzet(null)} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {isAan("snellevraag") && (
                  <SnelStartKnop
                    icon={Zap}
                    titel="Snelle vraag"
                    uitleg="Jij stelt de vraag hardop, cursisten kiezen A tot D. Je ziet de verdeling, niet wie wat koos."
                    onClick={() => setOpzet("snellevraag")}
                  />
                )}
                {isAan("begripsmeter") && (
                  <SnelStartKnop
                    icon={Gauge}
                    titel="Begripsmeter"
                    uitleg="Iedereen zet zichzelf op groen, oranje of rood. Ze mogen dat de hele les bijstellen."
                    onClick={startBegripsmeter}
                    bezig={bezig}
                  />
                )}
                {isAan("bord") && (
                  <SnelStartKnop
                    icon={LayoutDashboard}
                    titel="Whiteboard"
                    uitleg="Jij en je cursisten zetten tekst, foto's, tekeningen, filmpjes of ingesproken audio op één bord. Jij kiest wat mag."
                    onClick={() => setOpzet("bord")}
                  />
                )}
              </div>
            )}
          </section>
          )}

          {/* Quizwedstrijd: een Eenvoudige quiz, maar klassikaal en met punten */}
          {isAan("wedstrijd") && (
            <MateriaalSectie
              titel="Quizwedstrijd"
              uitleg="Speel een quiz klassikaal, met bijnamen, punten en een podium. Standaard zonder tijdsdruk, en na elke vraag eerst de uitleg. Handig om een les te openen of af te sluiten."
              oefeningen={quizzen}
              icon={Trophy}
              regel={(ex) => `${ex.content.questions.length} vragen`}
              leeg={{
                tekst: "Je hebt nog geen quiz om mee te spelen.",
                knop: "Maak een quiz",
                href: "/maken?vorm=quiz",
              }}
              onKies={setWedstrijdKeuze}
            />
          )}

          {/* Teken uit je geheugen: een reeks afbeeldingen, de leraar bepaalt het tempo */}
          {isAan("tekenen") && (
            <MateriaalSectie
              titel="Teken uit je geheugen"
              uitleg="De klas krijgt alleen een naam, bijvoorbeeld een logo of een vlag, en tekent het uit het geheugen. Daarna toon jij het origineel en vergelijken jullie samen."
              oefeningen={tekenreeksen}
              icon={Brush}
              regel={(ex) => `${ex.content.tekenopdrachten.length} afbeeldingen`}
              leeg={{
                tekst: "Je hebt nog geen reeks om te tekenen.",
                knop: "Maak een tekenreeks",
                href: "/maken?vorm=tekenen",
              }}
              onKies={setTekenKeuze}
            />
          )}

          <MateriaalSectie
            titel="Uit je materiaal"
            oefeningen={klassikaal}
            einde={Presentation}
            regel={(ex) => WERKVORMEN[ex.type].label}
            leeg={{
              tekst: "Je hebt nog geen live poll of woordwolk klaarstaan.",
              knop: "Nieuwe oefening maken",
              href: "/maken",
            }}
            onKies={setGekozen}
          />

          {gebruiker && <EerdereSessies hostId={gebruiker.id} onOpen={heropen} />}
        </>
      )}
    </div>
  );
}

export default function LivePagina() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <LiveInhoud />
    </Suspense>
  );
}
