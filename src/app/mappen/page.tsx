"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Folder, FolderPlus, ArrowRight, Lock, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { opslag, generateShortCode, useMateriaal } from "@/lib/opslag";
import { Lesmap, OefeningKort } from "@/lib/types";
import { eigenMappen, isEigenMateriaal } from "@/lib/labels";
import { LeraarPoort } from "@/components/LeraarPoort";

export default function MappenPagina() {
  const { isLeraar, isBeheerder, gebruiker } = useAuth();
  const { mappen, orgMappen, oefeningen, laden, setMappen } = useMateriaal();
  const [fout, setFout] = useState("");

  if (laden) return <div className="h-64" aria-hidden />;
  if (!isLeraar) {
    return (
      <LeraarPoort uitleg="Mappen horen bij een leraaraccount. Als cursist oefen je met de code of QR-code die je van je leraar krijgt." />
    );
  }

  const alleMijnMappen = eigenMappen(mappen, gebruiker);
  // Een map in een map vind je in die map; hier staat alleen het hoogste niveau.
  const bestaat = new Set(alleMijnMappen.map((m) => m.id));
  const mijnMappen = alleMijnMappen.filter((m) => !m.bovenMapId || !bestaat.has(m.bovenMapId));
  const mijnOefeningen = oefeningen.filter((ex) => isEigenMateriaal(ex, gebruiker));
  const inEenMap = new Set(alleMijnMappen.flatMap((m) => m.exerciseIds));
  const ongeordend = mijnOefeningen.filter((ex) => !inEenMap.has(ex.id));

  const maakMap = async (titel: string) => {
    if (!gebruiker) return false;
    const nieuw: Lesmap = {
      id: `map-${Date.now()}`,
      title: titel,
      description: "",
      exerciseIds: [],
      creatorName: gebruiker.naam,
      creatorId: gebruiker.id,
      shareCode: generateShortCode(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      await opslag.maakMap(nieuw);
      setMappen([nieuw, ...mappen]);
      setFout("");
      return true;
    } catch {
      setFout("De map bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
      return false;
    }
  };

  // De organisatiemappen, met hun submappen, staan in de bibliotheek.
  const toonOrganisatie = isBeheerder || orgMappen.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-10 u-fade">

      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          Mappen
        </h1>
        <p className="text-sm text-slate-600">
          Orden je materiaal per les of per vak. Een map is van jou; wie je de code van de map
          geeft, krijgt alles wat erin zit in één keer.
        </p>
      </header>

      <NieuweMap
        label="Naam van je nieuwe map"
        voorbeeld="Naam van je nieuwe map, bijvoorbeeld: wiskunde les 1"
        knop="Nieuwe map"
        onMaak={maakMap}
      />

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {mijnMappen.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
          Je hebt nog geen mappen. Maak er een aan met het veld hierboven, of gebruik &quot;In map
          plaatsen&quot; bij een oefening in je bibliotheek.
        </p>
      ) : (
        <MapLijst mappen={mijnMappen} alle={alleMijnMappen} oefeningen={oefeningen} />
      )}

      {ongeordend.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-3">
            Nog in geen enkele map
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            {ongeordend.length}{" "}
            {ongeordend.length === 1 ? "oefening staat" : "oefeningen staan"} nog los.
          </p>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {ongeordend.slice(0, 5).map((ex) => (
              <Link
                key={ex.id}
                href={`/bibliotheek?van=mij&q=${encodeURIComponent(ex.title)}`}
                className="flex items-center gap-3 py-3 group"
              >
                <span className="min-w-0 flex-1 text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                  {ex.title}
                </span>
                <span className="text-xs font-bold text-merk-900 shrink-0">
                  In map plaatsen
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {toonOrganisatie && (
        <Link
          href="/bibliotheek"
          className="flex items-center gap-3 bg-white border border-slate-200 hover:border-merk rounded-2xl p-4 group transition-colors"
        >
          <Building2 className="w-5 h-5 text-merk-900 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-slate-900 group-hover:text-merk-900 transition-colors">
              Organisatiemappen
            </span>
            <span className="block text-xs text-slate-600">
              {isBeheerder
                ? "Die orden je in de bibliotheek, in mappen en submappen per opleiding, vak en niveau."
                : "Het gedeelde materiaal van de school, per opleiding, vak en niveau, vind je in de bibliotheek."}
            </span>
          </span>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-merk group-hover:translate-x-0.5 transition-all shrink-0" />
        </Link>
      )}
    </div>
  );
}

function NieuweMap({
  label,
  voorbeeld,
  knop,
  onMaak,
}: {
  label: string;
  voorbeeld: string;
  knop: string;
  /** Geeft true terug als de map bewaard is; dan maken we het veld leeg. */
  onMaak: (titel: string) => Promise<boolean>;
}) {
  const [naam, setNaam] = useState("");

  const verstuur = async (e: React.FormEvent) => {
    e.preventDefault();
    const titel = naam.trim();
    if (titel && (await onMaak(titel))) setNaam("");
  };

  return (
    <form onSubmit={verstuur} className="flex gap-2">
      <input
        type="text"
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        placeholder={voorbeeld}
        aria-label={label}
        className="flex-1 min-w-0 px-3.5 py-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!naam.trim()}
        className="px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0"
      >
        <FolderPlus className="w-4 h-4" />
        <span className="hidden sm:inline">{knop}</span>
      </button>
    </form>
  );
}

function MapLijst({
  mappen,
  alle,
  oefeningen,
}: {
  mappen: Lesmap[];
  /** Alle eigen mappen, om de submappen te tellen. */
  alle: Lesmap[];
  oefeningen: OefeningKort[];
}) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {mappen.map((map) => {
        const aantalPrive = map.exerciseIds.filter((id) => {
          const ex = oefeningen.find((o) => o.id === id);
          return ex?.visibility === "prive";
        }).length;
        const aantalSubmappen = alle.filter((m) => m.bovenMapId === map.id).length;

        return (
          <Link key={map.id} href={`/mappen/${map.id}`} className="flex items-center gap-3 py-4 group">
            <Folder className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                {map.title}
              </span>
              {map.description && (
                <span className="block text-xs text-slate-600 truncate">{map.description}</span>
              )}
              <span className="block text-xs text-slate-500 flex items-center gap-1.5">
                {aantalSubmappen > 0 &&
                  `${aantalSubmappen} ${aantalSubmappen === 1 ? "submap" : "submappen"} · `}
                {map.exerciseIds.length}{" "}
                {map.exerciseIds.length === 1 ? "oefening" : "oefeningen"}
                {aantalPrive > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <Lock className="w-3 h-3" />
                    {aantalPrive} alleen voor jou
                  </>
                )}
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-merk group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
