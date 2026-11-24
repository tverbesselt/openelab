"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  CalendarClock,
  Printer,
  Trophy,
  Presentation,
  Pencil,
} from "lucide-react";
import { opslag } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, Herhaling } from "@/lib/types";
import { WERKVORMEN, inhoudSamenvatting, isKlassikaal, magMateriaalBeheren } from "@/lib/labels";
import { kanAanpassen, klassikaleStart } from "@/werkvormen/register";
import { plan, sleutel, datumInWoorden, type Zelfoordeel } from "@/lib/herhalen";
import { WerkvormLeraar, WerkvormSpeler } from "@/werkvormen/Weergave";
import { ShareModal } from "@/components/ShareModal";
import { Studietip } from "@/components/Studietip";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import { Uitgeschakeld } from "@/components/FunctiePoort";
import { GeenVerbinding, Melding } from "@/components/Melding";
import { VOLSCHERM_KLASSE, VolledigSchermKnop, useVolledigScherm } from "@/components/VolledigScherm";

export default function OefenPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { gebruiker, isLeraar, isBeheerder } = useAuth();
  const { isAan } = useInstellingen();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [toestand, setToestand] = useState<"laden" | "klaar" | "niet-gevonden" | "fout">("laden");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [volgendeKeer, setVolgendeKeer] = useState<string | null>(null);
  // De speler alleen op het scherm: rustiger oefenen, of groot op het digibord.
  const volScherm = useVolledigScherm();

  useEffect(() => {
    let actief = true;
    opslag
      .oefening(id)
      .then((gevonden) => {
        if (!actief) return;
        setExercise(gevonden);
        setToestand(gevonden ? "klaar" : "niet-gevonden");
      })
      .catch(() => actief && setToestand("fout"));
    return () => {
      actief = false;
    };
  }, [id]);

  /*
   * De herhaalplanning van deze persoon, één keer opgehaald. Elk zelfoordeel werkt ze
   * hier bij, zodat de kaart op het juiste moment terugkomt (gespreid herhalen).
   */
  const planning = useRef<Map<string, Herhaling>>(new Map());
  const gebruikerId = gebruiker?.id;

  useEffect(() => {
    if (!gebruikerId) return;
    let actief = true;
    opslag
      .herhalingen(gebruikerId)
      .then((lijst) => {
        if (actief) planning.current = new Map(lijst.map((h) => [h.id, h]));
      })
      .catch(() => {
        // Zonder planning oefent de cursist gewoon verder; alleen het spreiden valt weg.
      });
    return () => {
      actief = false;
    };
  }, [gebruikerId]);

  const onthoud = useCallback(
    (kaartId: string, oordeel: Zelfoordeel) => {
      if (!gebruikerId) return;
      const nieuw = plan(id, kaartId, oordeel, planning.current.get(sleutel(id, kaartId)));
      planning.current.set(nieuw.id, nieuw);
      setVolgendeKeer(nieuw.volgende);
      opslag.bewaarHerhaling(gebruikerId, nieuw).catch(() => {});
    },
    [gebruikerId, id]
  );

  const meldQuizresultaat = useCallback(
    (foutVragen: string[], aantalVragen: number) => {
      opslag.stuurQuizresultaat(id, foutVragen, aantalVragen).catch(() => {});
    },
    [id]
  );

  if (toestand === "laden") {
    return <div className="h-64" aria-hidden />;
  }

  if (toestand === "fout") return <GeenVerbinding />;

  if (!exercise) {
    return (
      <Melding titel="Deze oefening bestaat niet">
        Misschien werd ze verwijderd. Vraag je leraar om een nieuwe code.
      </Melding>
    );
  }

  // De maker, of een beheerder bij gedeeld materiaal: zij passen aan en zien wat er instuurde.
  const isEigenaar = isLeraar && magMateriaalBeheren(exercise, gebruiker, isBeheerder);

  if (exercise.verwijderdOp) {
    return isEigenaar ? (
      <Melding titel="Deze oefening zit in de prullenbak" terug={{ href: "/bibliotheek?toon=prullenbak", label: "Naar de prullenbak" }}>
        Cursisten kunnen ze nu niet openen. Zet ze terug in de prullenbak van je bibliotheek; de
        code blijft dezelfde.
      </Melding>
    ) : (
      <Melding titel="Deze oefening bestaat niet meer">
        Je leraar heeft ze weggehaald. Vraag om een nieuwe code.
      </Melding>
    );
  }

  // Bestaand materiaal van een werkvorm die uit staat, blijft bewaard maar opent niet.
  if (!isAan(exercise.type)) return <Uitgeschakeld />;
  // Een werkvorm voor cursisten die ook klassikaal kan: de leraar krijgt er een knop voor.
  const start = klassikaleStart(exercise);
  const speelKlassikaal =
    isLeraar && start && !isKlassikaal(exercise) && isAan(start.functie) ? start.href : null;
  const metKaarten = exercise.type === "flashcard" || exercise.type === "wordtrainer";
  // Eén zin onder de speler: waarom je het zo doet.
  const tip = WERKVORMEN[exercise.type].tip;

  return (
    <div className="space-y-6 u-fade">

      {/* Kopbalk */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug</span>
        </button>

        <div className="text-center min-w-0">
          <p className="text-xs font-semibold text-slate-500">
            {WERKVORMEN[exercise.type].label} · {inhoudSamenvatting(exercise)}
          </p>
          <h1 className="font-extrabold text-lg sm:text-xl text-merk-900 leading-tight line-clamp-1">
            {exercise.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {speelKlassikaal && exercise.type === "quiz" && (
            <Link
              href={speelKlassikaal}
              className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              title="Speel deze quiz klassikaal: jij projecteert, cursisten antwoorden op hun gsm"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speel klassikaal</span>
              <span className="sm:hidden">Klassikaal</span>
            </Link>
          )}
          {speelKlassikaal && exercise.type !== "quiz" && (
            <Link
              href={speelKlassikaal}
              className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
              title="Speel klassikaal: jij stuurt, de klas tekent"
              aria-label="Speel klassikaal: jij stuurt, de klas tekent"
            >
              <Presentation className="w-4 h-4" />
            </Link>
          )}
          <VolledigSchermKnop
            actief={volScherm.actief}
            onClick={volScherm.wissel}
            alleenIcoon
            className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
          />
          {isEigenaar && kanAanpassen(exercise.type) && (
            <Link
              href={`/bewerken/${exercise.id}`}
              className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
              title="Aanpassen"
              aria-label="Aanpassen"
            >
              <Pencil className="w-4 h-4" />
            </Link>
          )}
          {isAan("afdrukken") && (
            <Link
              href={`/afdrukken/${exercise.id}`}
              className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
              title="Afdrukken op papier"
            >
              <Printer className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setIsShareOpen(true)}
            className="p-2 rounded-xl bg-merk-50 text-merk-900 hover:bg-merk/20 transition-colors"
            title="Deel met cursisten"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* De juiste speler voor deze werkvorm */}
      <div ref={volScherm.ref} className={volScherm.actief ? `${VOLSCHERM_KLASSE} flex flex-col` : "py-4"}>
        {volScherm.actief && (
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200">
            <p className="font-extrabold text-merk-900 line-clamp-1 min-w-0">{exercise.title}</p>
            <VolledigSchermKnop
              actief
              onClick={volScherm.sluit}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-white border-slate-200 text-slate-700 hover:border-merk text-xs font-bold transition-colors"
            />
          </div>
        )}
        {/* my-auto: op een groot scherm staat de speler in het midden, niet bovenaan */}
        <div className={volScherm.actief ? "my-auto w-full py-6" : undefined}>
          <WerkvormSpeler
            oefening={exercise}
            isLeraar={isLeraar}
            onBeoordeeld={onthoud}
            onQuizKlaar={meldQuizresultaat}
          />
        </div>
      </div>

      {/* Gespreid herhalen: alleen zinvol als er iets aan je account hangt */}
      {metKaarten && gebruikerId && (
        <p className="max-w-lg mx-auto text-xs text-slate-500 flex items-start gap-2">
          <CalendarClock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {volgendeKeer
              ? `We onthouden wat je wist. Deze kaart komt ${datumInWoorden(volgendeKeer)} terug op je startpagina. Een kaart die je drie keer in aparte beurten wist, komt pas na weken terug.`
              : "We onthouden wat je wist, zodat je kaarten op het juiste moment terugkomen op je startpagina: wat je niet wist morgen al, wat je wist pas na dagen."}
          </span>
        </p>
      )}

      {!isEigenaar && tip && <Studietip tekst={tip} className="max-w-lg mx-auto" />}

      {isEigenaar && <WerkvormLeraar oefening={exercise} />}

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={exercise.title}
        shareCode={exercise.shareCode}
        id={exercise.id}
      />

    </div>
  );
}
