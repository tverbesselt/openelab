"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { STANDAARD_TAAL } from "@/lib/spraak";
import { opslag, generateShortCode, useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, Zichtbaarheid } from "@/lib/types";
import { eigenMappen } from "@/lib/labels";
import { LeraarPoort } from "@/components/LeraarPoort";
import { ALLE_VORMEN, KEUZES, OUDE_NAMEN } from "@/components/maken/keuzes";
import { Keuzescherm } from "@/components/maken/Keuzescherm";
import { Resultaat } from "@/components/maken/Resultaat";
import { Bestemming } from "@/components/maken/Bestemming";
import { VindbaarheidVelden } from "@/components/maken/VindbaarheidVelden";
import { LEGE_VINDBAARHEID, bekendeVakken, metVindbaarheid } from "@/lib/vindbaarheid";
import { TaalKiezer } from "@/components/maken/TaalKiezer";
import { Stap } from "@/components/maken/Stap";
import type { VormProps } from "@/werkvormen/soorten";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";

/*
 * De maakpagina kiest de werkvorm en regelt de bestemming: wie mag het zien, in welke map.
 * Elk formulier is een eigen component met zijn eigen staat; het komt uit het register
 * (src/werkvormen), de begrippenlijst uit src/components/maken.
 */

export default function MakenPagina() {
  const { status, isLeraar, gebruiker } = useAuth();
  const { isAan } = useInstellingen();
  const zichtbareKeuzes = KEUZES.map((groep) => ({
    ...groep,
    vormen: groep.vormen.filter((v) => v.werkvormen.some(isAan)),
  })).filter((groep) => groep.vormen.length > 0);
  // Nog niets gekozen = stap 1 (kiezen). Een gekozen werkvorm = stap 2 (invullen).
  const [modus, setModus] = useState<string | null>(null);

  // De keuze staat ook in de URL (/maken?vorm=quiz): zo werkt de terugknop van de browser
  // zoals je verwacht, en kan een link meteen het juiste formulier openen.
  useEffect(() => {
    const lees = () => {
      const gevraagd = new URLSearchParams(window.location.search).get("vorm");
      const vorm = gevraagd ? (OUDE_NAMEN[gevraagd] ?? gevraagd) : null;
      setModus(ALLE_VORMEN.some((v) => v.id === vorm) ? vorm : null);
    };
    lees();
    window.addEventListener("popstate", lees);
    return () => window.removeEventListener("popstate", lees);
  }, []);

  const kies = (nieuw: string | null) => {
    window.history.pushState(null, "", nieuw ? `/maken?vorm=${nieuw}` : "/maken");
    setModus(nieuw);
    setFout("");
    window.scrollTo({ top: 0 });
  };
  const [resultaat, setResultaat] = useState<Exercise[] | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState("");

  // Waar het resultaat terechtkomt: standaard privé, want niet alles hoeft gedeeld.
  const [zichtbaarheid, setZichtbaarheid] = useState<Zichtbaarheid>("prive");
  const [mapId, setMapId] = useState("");
  const { mappen, setMappen, oefeningen } = useMateriaal();
  // Vak, trefwoorden en beschrijving: waarmee collega's het terugvinden.
  const [vindbaarheid, setVindbaarheid] = useState(LEGE_VINDBAARHEID);

  // Taal van de voorleesknop. Alleen zinvol bij materiaal dat voorgelezen wordt.
  const [spraakTaal, setSpraakTaal] = useState(STANDAARD_TAAL);

  /** Velden die elke nieuwe oefening deelt. */
  const basis = () => ({
    creatorName: gebruiker?.naam ?? "Onbekend",
    creatorId: gebruiker?.id,
    visibility: zichtbaarheid,
    shareCode: generateShortCode(),
    createdAt: new Date().toISOString().split("T")[0],
  });

  const bewaar = async (uitFormulier: Exercise[]) => {
    if (bezig) return;
    setBezig(true);
    setFout("");
    const nieuwe = uitFormulier.map((ex) => metVindbaarheid(ex, vindbaarheid, false));
    try {
      await opslag.maakOefeningen(nieuwe);

      const map = mapId ? mappen.find((m) => m.id === mapId) : undefined;
      if (map) {
        const exerciseIds = [...map.exerciseIds, ...nieuwe.map((n) => n.id)];
        await opslag.wijzigMap(map.id, { exerciseIds });
        setMappen(mappen.map((m) => (m.id === map.id ? { ...m, exerciseIds } : m)));
      }

      setResultaat(nieuwe);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFout("Bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    } finally {
      setBezig(false);
    }
  };

  /* ── Alleen leraren maken materiaal ───────────────────────────────────── */
  if (status === "laden") {
    return <div className="h-64" aria-hidden />;
  }

  if (!isLeraar) {
    return (
      <LeraarPoort uitleg="Oefeningen maken kan met een leraaraccount. Als cursist oefen je met de code of QR-code die je van je leraar krijgt." />
    );
  }

  /* ── Resultaat: wat is er precies gemaakt? ────────────────────────────── */
  if (resultaat) {
    return (
      <Resultaat
        oefeningen={resultaat}
        onOpnieuw={() => {
          setResultaat(null);
          setFout("");
        }}
      />
    );
  }

  /* ── Wat elke werkvorm deelt: zichtbaarheid, map, taal ─────────────────── */
  const bestemming = (
    <>
      <VindbaarheidVelden
        waarde={vindbaarheid}
        onWijzig={setVindbaarheid}
        vakken={bekendeVakken(oefeningen)}
      />
      <Bestemming
        zichtbaarheid={zichtbaarheid}
        setZichtbaarheid={setZichtbaarheid}
        mapId={mapId}
        setMapId={setMapId}
        mappen={eigenMappen(mappen, gebruiker)}
      />
    </>
  );

  const vormProps: VormProps = {
    basis,
    bezig,
    fout,
    setFout,
    bewaar,
    bestemming,
    spraakTaal,
    setSpraakTaal,
    taalKiezer: <TaalKiezer waarde={spraakTaal} onWijzig={setSpraakTaal} wat="je inhoud" />,
  };

  /* ── Stap 1: wat wil je maken? ────────────────────────────────────────── */
  if (!modus) {
    return <Keuzescherm groepen={zichtbareKeuzes} onKies={kies} />;
  }

  /* ── Stap 2: inhoud invullen ──────────────────────────────────────────── */
  const gekozen = ALLE_VORMEN.find((v) => v.id === modus)!;
  const GekozenIcon = gekozen.icon;
  // Het formulier van de gekozen werkvorm, met zijn eigen staat.
  const GekozenVorm = gekozen.Vorm;

  return (
    <div className="max-w-2xl mx-auto space-y-5 u-fade">
      <div>
        <button
          onClick={() => kies(null)}
          className="inline-flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-lg text-sm font-bold text-merk-900 hover:bg-merk-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Andere werkvorm kiezen</span>
        </button>

        <div className="flex items-center gap-3 mt-3">
          <span className="w-12 h-12 shrink-0 rounded-xl bg-merk-800 text-white flex items-center justify-center">
            <GekozenIcon className="w-6 h-6" />
          </span>
          <div className="min-w-0">
            <Stap nummer={2} />
            <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight leading-tight">
              {gekozen.titel}
            </h1>
            <p className="text-sm text-slate-700">{gekozen.uitleg}</p>
          </div>
        </div>
      </div>

      <GekozenVorm {...vormProps} />
    </div>
  );
}
