"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Play,
  Plus,
  X,
  Trash2,
  Pencil,
  Check,
  Lock,
  Building2,
  FolderInput,
  Folder,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";
import { opslag, generateShortCode, useMateriaal } from "@/lib/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, Lesmap } from "@/lib/types";
import {
  WERKVORMEN,
  inhoudSamenvatting,
  isEigenMateriaal,
  isEigenMap,
  lesfaseLabel,
  mapPad,
  mapPadTekst,
  onderliggendeMapIds,
  pastInOrganisatiemap,
  submappen,
} from "@/lib/labels";
import { ShareModal } from "@/components/ShareModal";
import { Studietip } from "@/components/Studietip";
import { SubmapVeld } from "@/components/OrgMapVerkenner";
import { GeenVerbinding, Melding } from "@/components/Melding";

export default function MapPagina() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { gebruiker, isLeraar, isBeheerder } = useAuth();

  // De map zelf en haar inhoud haal je op id op: zo werkt de code van een map ook voor
  // cursisten, en ook voor privé materiaal dat erin zit.
  const [map, setMap] = useState<Lesmap | null>(null);
  const [inhoudPerId, setInhoudPerId] = useState<Record<string, Exercise>>({});
  const [geladen, setGeladen] = useState(false);
  const [fout, setFout] = useState("");
  /** De map zelf raakte niet geladen: dat is iets anders dan een map die niet bestaat. */
  const [laadFout, setLaadFout] = useState(false);
  const [delenOpen, setDelenOpen] = useState(false);
  const [voegToe, setVoegToe] = useState(false);
  const [wijzigNaam, setWijzigNaam] = useState<string | null>(null);
  const [wijzigBeschrijving, setWijzigBeschrijving] = useState("");
  const [zoek, setZoek] = useState("");
  const [verplaatsVoor, setVerplaatsVoor] = useState<string | null>(null);
  const [doelMapId, setDoelMapId] = useState("");
  const [melding, setMelding] = useState<{ tekst: string; mapId: string } | null>(null);

  // Materiaal om toe te voegen, en de andere mappen om naar te verplaatsen.
  const { oefeningen, mappen, orgMappen, setOrgMappen, setMappen } = useMateriaal();
  const [verplaatsMap, setVerplaatsMap] = useState(false);

  useEffect(() => {
    let actief = true;
    (async () => {
      try {
        const gevonden = await opslag.map(id);
        if (!actief) return;
        setMap(gevonden);
        if (gevonden) {
          const items = await Promise.all(gevonden.exerciseIds.map((exId) => opslag.oefening(exId)));
          if (!actief) return;
          const perId: Record<string, Exercise> = {};
          for (const ex of items) if (ex) perId[ex.id] = ex;
          setInhoudPerId(perId);
        }
      } catch {
        if (actief) setLaadFout(true);
      } finally {
        if (actief) setGeladen(true);
      }
    })();
    return () => {
      actief = false;
    };
  }, [id]);

  const isOrgMap = !!map?.organisatie;
  // Een persoonlijke map beheert haar eigenaar; een organisatiemap elke beheerder.
  const magBeheren =
    !!map && isLeraar && (isOrgMap ? isBeheerder : isEigenMap(map, gebruiker));

  /** Behoud de volgorde van de map, niet die van de bibliotheek. */
  const inhoud = useMemo(() => {
    if (!map) return [];
    return map.exerciseIds
      .map((exId) => inhoudPerId[exId])
      .filter((e): e is Exercise => !!e)
      // Wat in de prullenbak zit, is er voor niemand.
      .filter((ex) => !ex.verwijderdOp)
      // Werd iets in een organisatiemap later terug privé gezet, dan is het niet meer
      // voor collega's bedoeld. De beheerder ziet het wel, om het op te ruimen.
      .filter((ex) => !isOrgMap || magBeheren || pastInOrganisatiemap(ex));
  }, [map, inhoudPerId, isOrgMap, magBeheren]);

  const toevoegbaar = useMemo(() => {
    if (!map) return [];
    const q = zoek.trim().toLowerCase();
    return oefeningen.filter(
      (ex) =>
        (isOrgMap ? pastInOrganisatiemap(ex) : isEigenMateriaal(ex, gebruiker)) &&
        !map.exerciseIds.includes(ex.id) &&
        (!q ||
          ex.title.toLowerCase().includes(q) ||
          ex.creatorName.toLowerCase().includes(q) ||
          ex.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [map, oefeningen, gebruiker, isOrgMap, zoek]);

  /**
   * De mappen van dezelfde soort als deze: de organisatiemappen, of de persoonlijke mappen
   * van wie kijkt. Wie een persoonlijke map van een ander opent (met de code), krijgt hier
   * niets en ziet dus alleen wat er rechtstreeks in zit.
   */
  const soortMappen = useMemo(
    () => (isOrgMap ? orgMappen : mappen.filter((m) => !m.organisatie)),
    [isOrgMap, orgMappen, mappen]
  );
  const zetSoortMappen = (nieuw: Lesmap[]) => (isOrgMap ? setOrgMappen(nieuw) : setMappen(nieuw));
  /** Submappen ziet elke leraar bij de organisatie; bij een persoonlijke map alleen de eigenaar. */
  const kentBoom = isOrgMap ? isLeraar : magBeheren;

  /** Waar een oefening uit deze map naartoe kan: een andere map van dezelfde soort. */
  const andereMappen = useMemo(() => {
    if (!map) return [];
    return soortMappen.filter((m) => m.id !== map.id);
  }, [map, soortMappen]);

  /** Een map herken je in een keuzelijst aan haar volledige pad. */
  const mapNaam = (m: Lesmap) => mapPadTekst(soortMappen, m.id) || m.title;

  /* ── Mappen in mappen ────────────────────────────────────────────────── */

  const pad = useMemo(
    () => (map && kentBoom ? mapPad(soortMappen, map.id).slice(0, -1) : []),
    [map, kentBoom, soortMappen]
  );
  const kinderen = useMemo(
    () => (map && kentBoom ? submappen(soortMappen, map.id) : []),
    [map, kentBoom, soortMappen]
  );
  /** Waar deze map naartoe kan: overal, behalve in zichzelf of in een van haar submappen. */
  const mogelijkeBovenmappen = useMemo(() => {
    if (!map || !kentBoom) return [];
    const eronder = onderliggendeMapIds(soortMappen, map.id);
    return soortMappen
      .filter((m) => m.id !== map.id && !eronder.has(m.id))
      .map((m) => ({ id: m.id, naam: mapPadTekst(soortMappen, m.id) }))
      .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  }, [map, kentBoom, soortMappen]);

  const maakSubmap = async (titel: string) => {
    if (!map || !gebruiker) return false;
    const nieuw: Lesmap = {
      id: `map-${Date.now()}`,
      title: titel,
      description: "",
      exerciseIds: [],
      creatorName: gebruiker.naam,
      creatorId: gebruiker.id,
      shareCode: generateShortCode(),
      createdAt: new Date().toISOString().split("T")[0],
      ...(isOrgMap && { organisatie: true }),
      bovenMapId: map.id,
    };
    try {
      await opslag.maakMap(nieuw);
      zetSoortMappen([...(isOrgMap ? orgMappen : mappen), nieuw]);
      setFout("");
      return true;
    } catch {
      setFout("De submap bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
      return false;
    }
  };

  const zetBovenmap = async (bovenMapId: string | null) => {
    if (!map) return;
    try {
      await opslag.verplaatsMap(map.id, bovenMapId);
      const verplaatst = { ...map, bovenMapId: bovenMapId ?? undefined };
      setMap(verplaatst);
      zetSoortMappen((isOrgMap ? orgMappen : mappen).map((m) => (m.id === map.id ? verplaatst : m)));
      setVerplaatsMap(false);
      setFout("");
    } catch {
      setFout("Verplaatsen is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  const verplaats = async (ex: Exercise) => {
    if (!map) return;
    const doel = andereMappen.find((m) => m.id === doelMapId);
    if (!doel) return;
    try {
      await opslag.verplaatsOefening(ex.id, map.id, doel.id);
      setMap({ ...map, exerciseIds: map.exerciseIds.filter((i) => i !== ex.id) });
      setMelding({ tekst: `"${ex.title}" staat nu in ${mapNaam(doel)}.`, mapId: doel.id });
      setVerplaatsVoor(null);
      setDoelMapId("");
      setFout("");
    } catch {
      setFout("Verplaatsen is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  const wijzigMap = async (verandering: Partial<Lesmap>) => {
    if (!map) return;
    try {
      await opslag.wijzigMap(map.id, verandering);
      setMap({ ...map, ...verandering });
      if (verandering.exerciseIds) {
        // Nieuw toegevoegde oefeningen kennen we al uit het eigen materiaal.
        const perId = { ...inhoudPerId };
        for (const ex of oefeningen) if (verandering.exerciseIds.includes(ex.id)) perId[ex.id] = ex;
        setInhoudPerId(perId);
      }
      // Ook de lijsten elders (mappenpagina, keuzelijsten) kennen de nieuwe naam meteen.
      const gewijzigd = { ...map, ...verandering };
      zetSoortMappen((isOrgMap ? orgMappen : mappen).map((m) => (m.id === map.id ? gewijzigd : m)));
      setFout("");
    } catch {
      setFout("De wijziging bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  /**
   * Schuif een oefening een plaats op. We wisselen met de buur die je ziet, niet met wat er
   * in de lijst naast staat: een oefening die verborgen of weg is, telt niet mee.
   */
  const schuif = (exId: string, stap: -1 | 1) => {
    if (!map) return;
    const zichtbaar = inhoud.map((ex) => ex.id);
    const buur = zichtbaar[zichtbaar.indexOf(exId) + stap];
    if (!buur) return;
    const exerciseIds = [...map.exerciseIds];
    const a = exerciseIds.indexOf(exId);
    const b = exerciseIds.indexOf(buur);
    [exerciseIds[a], exerciseIds[b]] = [exerciseIds[b], exerciseIds[a]];
    void wijzigMap({ exerciseIds });
  };

  const verwijderMap = async () => {
    if (!map) return;
    const bovenMapId = map.bovenMapId ?? null;
    const boven = bovenMapId ? soortMappen.find((m) => m.id === bovenMapId) : undefined;
    const naarBoven =
      kinderen.length === 0
        ? ""
        : ` ${kinderen.length === 1 ? "De submap schuift" : `De ${kinderen.length} submappen schuiven`} een niveau hoger, naar ${boven ? boven.title : "het hoogste niveau"}.`;
    const vraag = isOrgMap
      ? `Organisatiemap "${map.title}" verwijderen? De oefeningen blijven bestaan bij wie ze maakte.${naarBoven}`
      : `Map "${map.title}" verwijderen? Je oefeningen blijven bestaan. De code ${map.shareCode} van de map werkt daarna niet meer.${naarBoven}`;
    if (!confirm(vraag)) return;
    try {
      // De opslag schuift de submappen in dezelfde beweging een niveau hoger.
      await opslag.verwijderMap(map.id);
      zetSoortMappen(
        (isOrgMap ? orgMappen : mappen)
          .filter((m) => m.id !== map.id)
          .map((m) => (m.bovenMapId === map.id ? { ...m, bovenMapId: bovenMapId ?? undefined } : m))
      );
      router.push(boven ? `/mappen/${boven.id}` : isOrgMap ? "/bibliotheek" : "/mappen");
    } catch {
      setFout("Verwijderen is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  if (!geladen) return <div className="h-64" aria-hidden />;

  if (laadFout) return <GeenVerbinding terug={{ href: "/mappen", label: "Naar mijn mappen" }} />;

  if (!map) {
    return (
      <Melding titel="Deze map bestaat niet" terug={{ href: "/mappen", label: "Naar mijn mappen" }}>
        We vinden deze map niet terug. Misschien werd ze verwijderd.
      </Melding>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 u-fade">

      <div className="flex items-center justify-between gap-4">
        {isLeraar && isOrgMap ? (
          <nav aria-label="Waar deze map staat" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-bold text-slate-600">
              <li>
                <Link href="/bibliotheek" className="flex items-center gap-1 hover:text-merk-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Bibliotheek</span>
                </Link>
              </li>
              {pad.map((m) => (
                <li key={m.id} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <Link
                    href={`/mappen/${m.id}`}
                    className="truncate max-w-[12rem] hover:text-merk-900 transition-colors"
                  >
                    {m.title}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <Link
            href={pad.length > 0 ? `/mappen/${pad[pad.length - 1].id}` : isLeraar ? "/mappen" : "/"}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-merk-900 transition-colors min-w-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">{pad.length > 0 ? pad[pad.length - 1].title : "Terug"}</span>
          </Link>
        )}

        <div className="flex items-center gap-1">
          {magBeheren && (
            <button
              onClick={verwijderMap}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Map verwijderen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setDelenOpen(true)}
            className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Deel de map</span>
          </button>
        </div>
      </div>

      <header>
        {wijzigNaam !== null ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (wijzigNaam.trim()) {
                wijzigMap({ title: wijzigNaam.trim(), description: wijzigBeschrijving.trim() });
              }
              setWijzigNaam(null);
            }}
            className="space-y-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={wijzigNaam}
                onChange={(e) => setWijzigNaam(e.target.value)}
                aria-label="Naam van de map"
                maxLength={200}
                autoFocus
                className="flex-1 min-w-0 px-3 py-2 text-lg font-bold rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white transition-colors"
                aria-label="Naam en beschrijving bewaren"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setWijzigNaam(null)}
                className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Annuleer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={wijzigBeschrijving}
              onChange={(e) => setWijzigBeschrijving(e.target.value)}
              aria-label="Beschrijving van de map"
              placeholder="Beschrijving: waar dient deze map voor? (mag leeg blijven)"
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
            />
          </form>
        ) : (
          <div className="flex items-start gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight leading-snug">
              {map.title}
            </h1>
            {magBeheren && (
              <button
                onClick={() => {
                  setWijzigNaam(map.title);
                  setWijzigBeschrijving(map.description ?? "");
                }}
                className="p-1.5 mt-1 rounded-lg text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors shrink-0"
                title="Naam en beschrijving aanpassen"
                aria-label="Naam en beschrijving aanpassen"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
          {isOrgMap && <Building2 className="w-3.5 h-3.5 shrink-0" />}
          {inhoud.length} {inhoud.length === 1 ? "oefening" : "oefeningen"} · map van{" "}
          {isOrgMap ? "de organisatie" : map.creatorName}
        </p>
        {map.description && wijzigNaam === null && (
          <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{map.description}</p>
        )}

        {magBeheren && (isOrgMap || mogelijkeBovenmappen.length > 0) && (
          verplaatsMap ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const keuze = new FormData(e.currentTarget).get("boven") as string;
                zetBovenmap(keuze || null);
              }}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <label htmlFor="bovenmap" className="text-xs font-bold text-slate-700">
                Deze map staat in
              </label>
              <select
                id="bovenmap"
                name="boven"
                defaultValue={map.bovenMapId ?? ""}
                autoFocus
                className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
              >
                <option value="">Het hoogste niveau</option>
                {mogelijkeBovenmappen.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.naam}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-xs transition-colors"
              >
                Verplaats
              </button>
              <button
                type="button"
                onClick={() => setVerplaatsMap(false)}
                className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
              >
                Annuleer
              </button>
            </form>
          ) : (
            <button
              onClick={() => setVerplaatsMap(true)}
              className="mt-2 text-xs font-bold text-merk-900 hover:underline flex items-center gap-1.5"
            >
              <FolderInput className="w-3.5 h-3.5" />
              Map verplaatsen
            </button>
          )
        )}
      </header>

      {kentBoom && (kinderen.length > 0 || magBeheren) && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
            Submappen
          </h2>
          {kinderen.length > 0 && (
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {kinderen.map((kind) => {
                const kleinkinderen = submappen(soortMappen, kind.id).length;
                return (
                  <Link key={kind.id} href={`/mappen/${kind.id}`} className="flex items-center gap-3 py-3 group">
                    <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                        {kind.title}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {kleinkinderen > 0 &&
                          `${kleinkinderen} ${kleinkinderen === 1 ? "submap" : "submappen"} · `}
                        {kind.exerciseIds.length}{" "}
                        {kind.exerciseIds.length === 1 ? "oefening" : "oefeningen"}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-merk group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
          {magBeheren && <SubmapVeld bovenTitel={map.title} onMaak={maakSubmap} />}
        </section>
      )}

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      {melding && (
        <p role="status" className="text-xs font-semibold text-merk-900 bg-merk-50 border border-merk/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span>{melding.tekst}</span>
          <Link href={`/mappen/${melding.mapId}`} className="font-bold underline shrink-0">
            Naar die map
          </Link>
        </p>
      )}

      {!magBeheren && inhoud.length > 1 && (
        <Studietip
          tekst={
            inhoud.some((ex) => ex.type === "flashcard") &&
            inhoud.some((ex) => ex.type === "quiz" || ex.type === "matching")
              ? "Begin met de flashcards. De quiz en de matching zijn de controle achteraf: herkennen is makkelijker dan herinneren."
              : "Je hoeft niet alles vandaag te doen. Kies één oefening, en kom morgen terug voor de volgende."
          }
        />
      )}

      {inhoud.length === 0 ? (
        <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-2xl p-8 text-center">
          {kinderen.length > 0
            ? "Er staan geen oefeningen rechtstreeks in deze map. Kijk in de submappen hierboven."
            : "Deze map is nog leeg."}
        </p>
      ) : (
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {inhoud.map((ex, index) => {
            const Icon = WERKVORMEN[ex.type].icon;
            return (
              <div key={ex.id} className="py-3.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 shrink-0 rounded-full bg-merk-50 text-merk-900 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>

                <Link href={`/oefen/${ex.id}`} className="min-w-0 flex-1 group">
                  <span className="block text-sm font-bold text-slate-900 truncate group-hover:text-merk-900 transition-colors">
                    {ex.title}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {WERKVORMEN[ex.type].label} · {inhoudSamenvatting(ex)} ·{" "}
                    {lesfaseLabel(ex.didacticGoal).toLowerCase()}
                    {ex.visibility === "prive" && (
                      <Lock className="w-3 h-3 text-amber-600" aria-label="Alleen ik" />
                    )}
                  </span>
                </Link>

                <Link
                  href={`/oefen/${ex.id}`}
                  className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </Link>

                {magBeheren && inhoud.length > 1 && (
                  <span className="flex flex-col shrink-0">
                    <button
                      onClick={() => schuif(ex.id, -1)}
                      disabled={index === 0}
                      className="p-0.5 rounded text-slate-500 hover:text-merk-900 hover:bg-slate-100 disabled:opacity-25 transition-colors"
                      title="Een plaats omhoog"
                      aria-label={`${ex.title} een plaats omhoog`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => schuif(ex.id, 1)}
                      disabled={index === inhoud.length - 1}
                      className="p-0.5 rounded text-slate-500 hover:text-merk-900 hover:bg-slate-100 disabled:opacity-25 transition-colors"
                      title="Een plaats omlaag"
                      aria-label={`${ex.title} een plaats omlaag`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </span>
                )}

                {magBeheren && andereMappen.length > 0 && (
                  <button
                    onClick={() => {
                      setVerplaatsVoor(verplaatsVoor === ex.id ? null : ex.id);
                      setDoelMapId("");
                    }}
                    aria-expanded={verplaatsVoor === ex.id}
                    className="p-2 rounded-lg text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors shrink-0"
                    title="Naar een andere map verplaatsen"
                  >
                    <FolderInput className="w-4 h-4" />
                  </button>
                )}

                {magBeheren && (
                  <button
                    onClick={() =>
                      wijzigMap({ exerciseIds: map.exerciseIds.filter((i) => i !== ex.id) })
                    }
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                    title="Uit de map halen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {verplaatsVoor === ex.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    verplaats(ex);
                  }}
                  className="mt-3 ml-10 flex flex-wrap items-center gap-2"
                >
                  <label htmlFor={`doel-${ex.id}`} className="text-xs font-bold text-slate-700">
                    Verplaatsen naar
                  </label>
                  <select
                    id={`doel-${ex.id}`}
                    value={doelMapId}
                    onChange={(e) => setDoelMapId(e.target.value)}
                    autoFocus
                    className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                  >
                    <option value="">Kies een map</option>
                    {andereMappen
                      .map((m) => ({ id: m.id, naam: mapNaam(m) }))
                      .sort((a, b) => a.naam.localeCompare(b.naam, "nl"))
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.naam}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!doelMapId}
                    className="px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                  >
                    Verplaats
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerplaatsVoor(null)}
                    className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                  >
                    Annuleer
                  </button>
                </form>
              )}
              </div>
            );
          })}
        </div>
      )}

      {magBeheren && (
        <section>
          {!voegToe ? (
            <button
              onClick={() => setVoegToe(true)}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-merk hover:text-merk-900 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Materiaal toevoegen</span>
            </button>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  {isOrgMap ? "Uit het gedeelde materiaal" : "Uit jouw materiaal"}
                </h2>
                <button
                  onClick={() => {
                    setVoegToe(false);
                    setZoek("");
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Sluiten"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="relative block mb-3">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={zoek}
                  onChange={(e) => setZoek(e.target.value)}
                  placeholder={isOrgMap ? "Zoek op titel, maker of trefwoord" : "Zoek in je materiaal"}
                  aria-label="Zoek materiaal om toe te voegen"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-veldrand text-slate-900 placeholder-slate-500 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
                />
              </label>

              {toevoegbaar.length === 0 && zoek.trim() ? (
                <p className="text-sm text-slate-600">Niets gevonden voor &ldquo;{zoek.trim()}&rdquo;.</p>
              ) : toevoegbaar.length === 0 && isOrgMap ? (
                <p className="text-sm text-slate-600">
                  Al het gedeelde materiaal zit al in deze map. Privé materiaal van collega&apos;s
                  kan hier niet in: dat moet de maker eerst delen met de hele school.
                </p>
              ) : toevoegbaar.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Al je materiaal zit al in deze map.{" "}
                  <Link href="/maken" className="font-bold text-merk-900 hover:underline">
                    Maak iets nieuws
                  </Link>
                  .
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {toevoegbaar.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() =>
                        wijzigMap({ exerciseIds: [...map.exerciseIds, ex.id] })
                      }
                      className="w-full flex items-center gap-3 py-2.5 text-left group"
                    >
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-merk shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900 truncate">
                          {ex.title}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">
                          {WERKVORMEN[ex.type].label} · {inhoudSamenvatting(ex)}
                          {isOrgMap && ` · van ${ex.creatorName}`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <ShareModal
        isOpen={delenOpen}
        onClose={() => setDelenOpen(false)}
        title={map.title}
        shareCode={map.shareCode}
        id={map.id}
        isSet
      />
    </div>
  );
}
