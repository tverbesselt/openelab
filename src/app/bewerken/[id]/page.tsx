"use client";

import React, { useEffect, useState, type ComponentType } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { opslag } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import { STANDAARD_TAAL } from "@/lib/spraak";
import type { Exercise, ExerciseType, Zichtbaarheid } from "@/lib/types";
import { WERKVORMEN, isEigenMateriaal } from "@/lib/labels";
import { isBegrippenType } from "@/lib/begrippenBewerken";
import { werkvormVan } from "@/werkvormen/register";
import type { VormProps } from "@/werkvormen/soorten";
import { LeraarPoort } from "@/components/LeraarPoort";
import { Uitgeschakeld } from "@/components/FunctiePoort";
import { GeenVerbinding, KNOP_RAND, KNOP_VOL, Melding } from "@/components/Melding";
import { Bestemming } from "@/components/maken/Bestemming";
import { TaalKiezer } from "@/components/maken/TaalKiezer";

/*
 * Materiaal aanpassen. Het formulier is hetzelfde als bij het maken, maar al ingevuld met
 * wat er nu in staat. Bewaren zet de nieuwe versie in de plaats van de oude: zelfde id,
 * zelfde code en QR-code, in dezelfde mappen. Wat cursisten al instuurden, blijft staan.
 */

/** Flashcards, matching en de woordentrainer pas je aan als begrippenlijst. */
const BegrippenBewerkVorm = dynamic(() => import("@/components/maken/BegrippenBewerkVorm"));

function vormVoor(type: ExerciseType): ComponentType<VormProps> | null {
  if (isBegrippenType(type)) return BegrippenBewerkVorm;
  return werkvormVan({ type } as Exercise).maken?.Vorm ?? null;
}

export default function BewerkPagina() {
  const id = useParams().id as string;
  const { status, isLeraar, gebruiker } = useAuth();
  const { isAan } = useInstellingen();
  const [oefening, setOefening] = useState<Exercise | null>(null);
  const [laden, setLaden] = useState(true);
  const [laadFout, setLaadFout] = useState(false);

  useEffect(() => {
    let actief = true;
    opslag
      .oefening(id)
      .then((gevonden) => actief && setOefening(gevonden))
      .catch(() => actief && setLaadFout(true))
      .finally(() => actief && setLaden(false));
    return () => {
      actief = false;
    };
  }, [id]);

  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");
  const [bewaard, setBewaard] = useState<Exercise | null>(null);
  // Leeg zolang de leraar niets kiest: dan geldt wat er nu bij de oefening staat.
  const [zichtbaarheid, setZichtbaarheid] = useState<Zichtbaarheid | null>(null);
  const [spraakTaal, setSpraakTaal] = useState<string | null>(null);

  if (status === "laden") return <div className="h-64" aria-hidden />;

  if (!isLeraar) {
    return <LeraarPoort uitleg="Materiaal aanpassen kan met een leraaraccount." />;
  }

  if (bewaard) return <Bewaard oefening={bewaard} />;

  if (laden) return <div className="h-64" aria-hidden />;
  if (laadFout) return <GeenVerbinding />;

  if (!oefening) {
    return (
      <Melding titel="Deze oefening bestaat niet" terug={{ href: "/bibliotheek", label: "Naar de bibliotheek" }}>
        Misschien werd ze verwijderd.
      </Melding>
    );
  }

  if (!isEigenMateriaal(oefening, gebruiker)) {
    return (
      <Melding titel="Dit materiaal is van een collega" terug={{ href: "/bibliotheek", label: "Naar de bibliotheek" }}>
        Je kan alleen je eigen materiaal aanpassen. Kopieer het in de bibliotheek naar je eigen
        materiaal: die kopie pas je vrij aan.
      </Melding>
    );
  }

  if (!isAan(oefening.type)) return <Uitgeschakeld />;

  const Vorm = vormVoor(oefening.type);
  const werkvorm = WERKVORMEN[oefening.type];
  const Icon = werkvorm.icon;

  if (!Vorm) {
    return (
      <Melding titel="Hier valt niets aan te passen" terug={{ href: `/oefen/${oefening.id}`, label: "Terug" }}>
        {werkvorm.label} is een klastool zonder eigen inhoud.
      </Melding>
    );
  }

  const huidigeZichtbaarheid = zichtbaarheid ?? oefening.visibility;
  const huidigeTaal = spraakTaal ?? oefening.didacticConfig.spraakTaal ?? STANDAARD_TAAL;

  const bewaar = async (nieuwe: Exercise[]) => {
    const [nieuw] = nieuwe;
    if (bezig || !nieuw) return;
    setBezig(true);
    setFout("");

    // Wat bij de oefening hoort en niet in het formulier staat, blijft: de code, de maker,
    // de datum, de beschrijving, de bron van een import.
    const aangepast = {
      ...oefening,
      title: nieuw.title,
      content: nieuw.content,
      didacticConfig: { ...oefening.didacticConfig, ...nieuw.didacticConfig },
      visibility: huidigeZichtbaarheid,
    } as Exercise;
    // Alleen het quizformulier kiest een omslagfoto; daar kan ze ook weg.
    if (oefening.type === "quiz") {
      if (nieuw.cover) aangepast.cover = nieuw.cover;
      else delete aangepast.cover;
    }

    try {
      await opslag.vervangOefening(aangepast);
      setBewaard(aangepast);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFout("Bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  const vormProps: VormProps = {
    bestaand: oefening,
    basis: () => ({
      creatorName: oefening.creatorName,
      creatorId: oefening.creatorId,
      visibility: huidigeZichtbaarheid,
      shareCode: oefening.shareCode,
      createdAt: oefening.createdAt,
    }),
    bezig,
    fout,
    setFout,
    bewaar,
    // Aanpassen verandert niets aan de mappen: die regel je in de bibliotheek.
    bestemming: (
      <Bestemming
        zichtbaarheid={huidigeZichtbaarheid}
        setZichtbaarheid={setZichtbaarheid}
        mapId=""
        setMapId={() => {}}
        mappen={[]}
      />
    ),
    spraakTaal: huidigeTaal,
    setSpraakTaal,
    taalKiezer: <TaalKiezer waarde={huidigeTaal} onWijzig={setSpraakTaal} wat="je inhoud" />,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 u-fade">
      <div>
        <Link
          href={`/oefen/${oefening.id}`}
          className="inline-flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-lg text-sm font-bold text-merk-900 hover:bg-merk-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug zonder bewaren</span>
        </Link>

        <div className="flex items-center gap-3 mt-3">
          <span className="w-12 h-12 shrink-0 rounded-xl bg-merk-800 text-white flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-1">
              Aanpassen · {werkvorm.label}
            </p>
            <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight leading-tight line-clamp-2">
              {oefening.title}
            </h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          De code <span className="font-mono font-bold">{oefening.shareCode}</span> en de
          QR-code blijven hetzelfde. Wie de oefening al open heeft, ziet je wijzigingen na
          opnieuw openen.
        </p>
      </div>

      <Vorm {...vormProps} />
    </div>
  );
}

/** Na het bewaren: wat nu? */
function Bewaard({ oefening }: { oefening: Exercise }) {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4 u-fade">
      <CheckCircle2 className="w-10 h-10 text-merk mx-auto" />
      <div>
        <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight">
          Je wijzigingen zijn bewaard
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {oefening.title} heeft nog altijd de code{" "}
          <span className="font-mono font-bold">{oefening.shareCode}</span>.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href={`/oefen/${oefening.id}`} className={KNOP_VOL}>
          Bekijk de oefening
        </Link>
        <Link href="/bibliotheek" className={KNOP_RAND}>
          Naar jouw materiaal
        </Link>
      </div>
    </div>
  );
}
