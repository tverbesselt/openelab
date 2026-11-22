"use client";

import React, { useState } from "react";
import { Building2, FolderPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { opslag, generateShortCode } from "@/lib/opslag";
import { Exercise, Lesmap } from "@/lib/types";
import { pastInOrganisatiemap } from "@/lib/labels";
import { MapKiezer } from "@/components/MapKiezer";
import { OrgMapVerkenner } from "@/components/OrgMapVerkenner";

/**
 * De Organisatiemappen, met hun submappen. Elke leraar bladert erdoor; een
 * beheerder maakt er mappen en submappen bij en plaatst gedeeld materiaal in een map.
 */
export function OrganisatieMappen({
  orgMappen,
  oefeningen,
  setOrgMappen,
}: {
  orgMappen: Lesmap[];
  oefeningen: Exercise[];
  setOrgMappen: (mappen: Lesmap[]) => void;
}) {
  const { isBeheerder, gebruiker } = useAuth();
  const [fout, setFout] = useState("");
  const [orgMapVoor, setOrgMapVoor] = useState<Exercise | null>(null);

  if (!isBeheerder && orgMappen.length === 0) return null;

  // Voor de beheerder: gedeeld materiaal dat nog in geen enkele organisatiemap staat.
  const inEenOrgMap = new Set(orgMappen.flatMap((m) => m.exerciseIds));
  const zonderOrgMap = oefeningen.filter(
    (ex) => pastInOrganisatiemap(ex) && !inEenOrgMap.has(ex.id)
  );

  const maakMap = async (titel: string, bovenMapId: string | null) => {
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
      organisatie: true,
      ...(bovenMapId && { bovenMapId }),
    };
    try {
      await opslag.maakMap(nieuw);
      setOrgMappen([...orgMappen, nieuw]);
      setFout("");
      return true;
    } catch {
      setFout("De map bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
      return false;
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-merk-900 tracking-tight mb-1 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Organisatiemappen
        </h2>
        <p className="text-sm text-slate-600">
          {isBeheerder
            ? "Als beheerder orden je hier het gedeelde materiaal van de school, in mappen en submappen. Elke leraar ziet deze mappen; wie een oefening maakte, blijft er de eigenaar van."
            : "Gedeeld materiaal van collega's, per opleiding, vak en niveau geordend door de beheerders. Klap een map open om te zien wat erin zit."}
        </p>
      </div>

      {isBeheerder && <NieuweOrgMap onMaak={(titel) => maakMap(titel, null)} />}

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {orgMappen.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
          Er zijn nog geen organisatiemappen. Maak de eerste aan met het veld hierboven.
        </p>
      ) : (
        <OrgMapVerkenner
          orgMappen={orgMappen}
          onMaakSubmap={isBeheerder ? (titel, bovenMapId) => maakMap(titel, bovenMapId) : undefined}
        />
      )}

      {isBeheerder && zonderOrgMap.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-bold text-slate-700 hover:text-merk-900 py-1">
            {zonderOrgMap.length}{" "}
            {zonderOrgMap.length === 1 ? "gedeelde oefening staat" : "gedeelde oefeningen staan"}{" "}
            nog in geen enkele organisatiemap
          </summary>
          <div className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
            {zonderOrgMap.slice(0, 8).map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-900 truncate">{ex.title}</span>
                  <span className="block text-xs text-slate-500 truncate">van {ex.creatorName}</span>
                </span>
                <button
                  onClick={() => setOrgMapVoor(ex)}
                  className="text-xs font-bold text-merk-900 hover:underline shrink-0"
                >
                  In organisatiemap plaatsen
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {orgMapVoor && gebruiker && (
        <MapKiezer
          oefening={orgMapVoor}
          eigenaar={gebruiker}
          organisatie
          onSluit={() => setOrgMapVoor(null)}
          onGewijzigd={setOrgMappen}
        />
      )}
    </section>
  );
}

function NieuweOrgMap({ onMaak }: { onMaak: (titel: string) => Promise<boolean> }) {
  const [naam, setNaam] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const titel = naam.trim();
        if (titel && (await onMaak(titel))) setNaam("");
      }}
      className="flex gap-2"
    >
      <input
        type="text"
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        placeholder="Nieuwe map op het hoogste niveau, bijvoorbeeld: Nederlands tweede taal"
        aria-label="Naam van de nieuwe organisatiemap"
        className="flex-1 min-w-0 px-3.5 py-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!naam.trim()}
        className="px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0"
      >
        <FolderPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Nieuwe organisatiemap</span>
      </button>
    </form>
  );
}
