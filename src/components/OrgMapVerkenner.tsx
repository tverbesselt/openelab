"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Building2,
  Folder,
  FolderOpen,
  FolderPlus,
  Search,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { Lesmap } from "@/lib/types";
import { mapPadTekst, submappen } from "@/lib/labels";

const OPSLAG_OPEN = "openelab_orgmappen_open";

/** Welke mappen je openklapte, onthoud je in deze browser. Lukt dat niet, dan niet. */
function leesOpen(): Set<string> {
  try {
    const ruw = localStorage.getItem(OPSLAG_OPEN);
    return new Set(ruw ? (JSON.parse(ruw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function bewaarOpen(open: Set<string>) {
  try {
    localStorage.setItem(OPSLAG_OPEN, JSON.stringify([...open]));
  } catch {
    // Privévenster of geblokkeerde opslag: de boom werkt gewoon, alleen zonder geheugen.
  }
}

interface OrgMapVerkennerProps {
  orgMappen: Lesmap[];
  /** Alleen voor beheerders: een submap maken, rechtstreeks vanuit de boom. */
  onMaakSubmap?: (titel: string, bovenMapId: string) => Promise<boolean>;
}

/**
 * De organisatiemappen als een boom: klap een opleiding open om haar vakken en niveaus te
 * zien, of zoek een map op naam. Elke map opent haar eigen pagina.
 */
export function OrgMapVerkenner({ orgMappen, onMaakSubmap }: OrgMapVerkennerProps) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [zoek, setZoek] = useState("");
  const [submapVoor, setSubmapVoor] = useState<string | null>(null);

  useEffect(() => setOpen(leesOpen()), []);

  const wijzigOpen = (nieuw: Set<string>) => {
    setOpen(nieuw);
    bewaarOpen(nieuw);
  };

  const wissel = (id: string) => {
    const nieuw = new Set(open);
    if (nieuw.has(id)) nieuw.delete(id);
    else nieuw.add(id);
    wijzigOpen(nieuw);
  };

  const metSubmappen = useMemo(
    () => orgMappen.filter((m) => submappen(orgMappen, m.id).length > 0).map((m) => m.id),
    [orgMappen]
  );
  const allesOpen = metSubmappen.length > 0 && metSubmappen.every((id) => open.has(id));

  const q = zoek.trim().toLowerCase();
  const gevonden = useMemo(
    () =>
      q
        ? orgMappen
            .filter((m) => m.title.toLowerCase().includes(q))
            .map((m) => ({ map: m, pad: mapPadTekst(orgMappen, m.id) }))
            .sort((a, b) => a.pad.localeCompare(b.pad, "nl"))
        : [],
    [orgMappen, q]
  );

  const rij = (map: Lesmap, diepte: number): React.ReactNode => {
    const kinderen = submappen(orgMappen, map.id);
    const isOpen = open.has(map.id);
    const Icoon = diepte === 0 ? Building2 : isOpen ? FolderOpen : Folder;

    return (
      <li key={map.id}>
        <div className="flex items-center gap-1 py-2 pr-1 group">
          {kinderen.length > 0 ? (
            <button
              onClick={() => wissel(map.id)}
              aria-expanded={isOpen}
              aria-label={`${isOpen ? "Dichtklappen" : "Openklappen"}: ${map.title}`}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-merk-900 transition-colors shrink-0"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </button>
          ) : (
            <span className="w-7 shrink-0" aria-hidden />
          )}

          <Link href={`/mappen/${map.id}`} className="min-w-0 flex-1 flex items-center gap-2.5 py-0.5">
            <Icoon className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                {map.title}
              </span>
              <span className="block text-xs text-slate-500">{inhoudTekst(map, kinderen.length)}</span>
            </span>
          </Link>

          {onMaakSubmap && (
            <button
              onClick={() => setSubmapVoor(submapVoor === map.id ? null : map.id)}
              aria-expanded={submapVoor === map.id}
              title="Submap maken"
              aria-label={`Submap maken in ${map.title}`}
              className="p-2 rounded-lg text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors shrink-0 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}
        </div>

        {submapVoor === map.id && onMaakSubmap && (
          <div className="pb-3 pr-1 pl-8">
            <SubmapVeld
              bovenTitel={map.title}
              onAnnuleer={() => setSubmapVoor(null)}
              onMaak={async (titel) => {
                const gelukt = await onMaakSubmap(titel, map.id);
                if (gelukt) {
                  setSubmapVoor(null);
                  // Toon meteen waar de nieuwe map terechtkwam.
                  if (!open.has(map.id)) wijzigOpen(new Set(open).add(map.id));
                }
                return gelukt;
              }}
            />
          </div>
        )}

        {isOpen && kinderen.length > 0 && (
          <ul className="ml-3.5 pl-2 border-l border-slate-200">
            {kinderen.map((kind) => rij(kind, diepte + 1))}
          </ul>
        )}
      </li>
    );
  };

  const hoogste = submappen(orgMappen, null);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label className="relative block flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek een map, bijvoorbeeld: richtgraad 2"
            aria-label="Zoek een organisatiemap"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
          />
        </label>
        {!q && metSubmappen.length > 0 && (
          <button
            onClick={() => wijzigOpen(allesOpen ? new Set() : new Set(metSubmappen))}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-merk hover:text-merk-900 transition-colors flex items-center gap-1.5 shrink-0"
          >
            {allesOpen ? <ChevronsDownUp className="w-4 h-4" /> : <ChevronsUpDown className="w-4 h-4" />}
            <span className="hidden sm:inline">{allesOpen ? "Alles dichtklappen" : "Alles openklappen"}</span>
          </button>
        )}
      </div>

      {q ? (
        gevonden.length === 0 ? (
          <p className="text-sm text-slate-600 py-3">
            Geen organisatiemap gevonden voor &ldquo;{zoek.trim()}&rdquo;.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {gevonden.map(({ map, pad }) => (
              <li key={map.id}>
                <Link href={`/mappen/${map.id}`} className="flex items-center gap-3 py-3 group">
                  <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                      {map.title}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">{pad}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {hoogste.map((map) => rij(map, 0))}
        </ul>
      )}
    </div>
  );
}

function inhoudTekst(map: Lesmap, aantalSubmappen: number): string {
  const delen: string[] = [];
  if (aantalSubmappen > 0) {
    delen.push(`${aantalSubmappen} ${aantalSubmappen === 1 ? "submap" : "submappen"}`);
  }
  const n = map.exerciseIds.length;
  if (n > 0 || aantalSubmappen === 0) delen.push(`${n} ${n === 1 ? "oefening" : "oefeningen"}`);
  return delen.join(" · ");
}

/** Een klein veld om een submap te maken. Geeft de beheerder meteen de plek terug. */
export function SubmapVeld({
  bovenTitel,
  onMaak,
  onAnnuleer,
}: {
  bovenTitel: string;
  onMaak: (titel: string) => Promise<boolean>;
  onAnnuleer?: () => void;
}) {
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
        onKeyDown={(e) => e.key === "Escape" && onAnnuleer?.()}
        placeholder={`Nieuwe submap in ${bovenTitel}`}
        aria-label={`Naam van de nieuwe submap in ${bovenTitel}`}
        autoFocus={!!onAnnuleer}
        className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!naam.trim()}
        className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
      >
        <FolderPlus className="w-4 h-4" />
        <span>Maak submap</span>
      </button>
    </form>
  );
}
