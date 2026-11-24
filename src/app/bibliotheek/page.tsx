"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, PlusCircle, Info, CheckSquare, X, FolderPlus, Building2, Lock, Trash2 } from "lucide-react";
import { ShareModal } from "@/components/ShareModal";
import { MateriaalKaart } from "@/components/MateriaalKaart";
import { MapKiezer } from "@/components/MapKiezer";
import { OrganisatieMappen } from "@/components/OrganisatieMappen";
import { Prullenbak } from "@/components/Prullenbak";
import { opslag, generateShortCode, useMateriaal } from "@/lib/opslag";
import { PRULLENBAK_DAGEN } from "@/lib/opslag/opslag";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Exercise, DidacticGoal, ExerciseType, OefeningKort, Zichtbaarheid } from "@/lib/types";
import {
  LESFASES,
  LESFASE_BY_ID,
  WERKVORMEN,
  eigenMappen,
  isEigenMateriaal,
  magMateriaalBeheren,
  zichtbaarVoor,
  mappenVanOefening,
} from "@/lib/labels";
import { bekendeVakken } from "@/lib/vindbaarheid";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";

/** Hoeveel kaarten een werkvorm eerst toont; "Toon meer" doet er telkens zoveel bij. */
const PER_STAP = 12;

type Bereik = "alles" | "mij" | "prullenbak";
type Volgorde = "nieuw" | "titel";

const veldKlasse =
  "px-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-merk focus:outline-none text-slate-800";

function BibliotheekInhoud() {
  const searchParams = useSearchParams();

  const { gebruiker, isLeraar, isBeheerder } = useAuth();
  const { isAan, instellingen } = useInstellingen();
  const {
    oefeningen: exercises,
    mappen,
    orgMappen,
    laden,
    fout,
    vernieuw,
    setOefeningen: setExercises,
    setMappen,
    setOrgMappen,
  } = useMateriaal();
  const [mapVoor, setMapVoor] = useState<Exercise | null>(null);
  const [orgMapVoor, setOrgMapVoor] = useState<Exercise | null>(null);
  const [zoek, setZoek] = useState(searchParams.get("q") ?? "");
  const [fase, setFase] = useState<DidacticGoal | "alle">(
    (searchParams.get("fase") as DidacticGoal) ?? "alle"
  );
  const [bereik, setBereik] = useState<Bereik>(
    searchParams.get("toon") === "prullenbak"
      ? "prullenbak"
      : searchParams.get("van") === "mij"
        ? "mij"
        : "alles"
  );
  const [werkvorm, setWerkvorm] = useState<ExerciseType | "alle">("alle");
  const [vak, setVak] = useState("");
  const [volgorde, setVolgorde] = useState<Volgorde>("nieuw");
  /** Hoeveel kaarten elke werkvorm toont, voor wie op "Toon meer" drukte. */
  const [getoond, setGetoond] = useState<Partial<Record<ExerciseType, number>>>({});
  const [selectedShare, setSelectedShare] = useState<OefeningKort | null>(null);
  const [melding, setMelding] = useState("");
  const [foutMelding, setFoutMelding] = useState("");
  /** null = geen selectiemodus. */
  const [selectie, setSelectie] = useState<Set<string> | null>(null);
  const [bulkMapId, setBulkMapId] = useState("");
  const [bulkBezig, setBulkBezig] = useState(false);

  const enkelVanMij = bereik === "mij";

  const zichtbaar = useMemo(() => zichtbaarVoor(exercises, gebruiker), [exercises, gebruiker]);
  const vakken = useMemo(() => bekendeVakken(zichtbaar), [zichtbaar]);
  const werkvormen = useMemo(
    () =>
      [...new Set(zichtbaar.map((ex) => ex.type))].sort((a, b) =>
        WERKVORMEN[a].label.localeCompare(WERKVORMEN[b].label, "nl")
      ),
    [zichtbaar]
  );

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    // Privé materiaal van collega's hoort hier niet thuis.
    const lijst = zichtbaar.filter((ex) => {
      const matchZoek =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q) ||
        (ex.vak ?? "").toLowerCase().includes(q) ||
        ex.creatorName.toLowerCase().includes(q) ||
        ex.tags.some((t) => t.toLowerCase().includes(q)) ||
        WERKVORMEN[ex.type].label.toLowerCase().includes(q);

      const matchFase = fase === "alle" || ex.didacticGoal === fase;
      const matchEigenaar = !enkelVanMij || isEigenMateriaal(ex, gebruiker);
      const matchWerkvorm = werkvorm === "alle" || ex.type === werkvorm;
      const matchVak = !vak || (ex.vak ?? "").toLowerCase() === vak.toLowerCase();

      return matchZoek && matchFase && matchEigenaar && matchWerkvorm && matchVak;
    });
    // Het overzicht komt nieuwste eerst binnen; op titel sorteren we zelf.
    return volgorde === "titel"
      ? [...lijst].sort((a, b) => a.title.localeCompare(b.title, "nl", { numeric: true }))
      : lijst;
  }, [zichtbaar, zoek, fase, enkelVanMij, werkvorm, vak, volgorde, gebruiker]);

  /** Materiaal gegroepeerd per werkvorm, zodat meteen duidelijk is wát er is. */
  const perWerkvorm = useMemo(() => {
    const groepen = new Map<ExerciseType, Exercise[]>();
    for (const ex of gefilterd) {
      const lijst = groepen.get(ex.type) ?? [];
      lijst.push(ex);
      groepen.set(ex.type, lijst);
    }
    return [...groepen.entries()];
  }, [gefilterd]);

  const magBeheren = (ex: OefeningKort) => magMateriaalBeheren(ex, gebruiker, isBeheerder);

  const toonMelding = (tekst: string) => {
    setFoutMelding("");
    setMelding(tekst);
  };
  const mislukt = (wat: string) => {
    setMelding("");
    setFoutMelding(`${wat} is niet gelukt. Kijk je verbinding na en probeer opnieuw.`);
  };

  const handleKopieer = async (ex: Exercise) => {
    // Een kopie is nieuw materiaal van jou: eigen code, standaard alleen voor jou.
    const kopie: Exercise = {
      ...ex,
      id: `kopie-${Date.now()}`,
      title: `${ex.title} (kopie)`,
      creatorName: gebruiker?.naam ?? "Onbekend",
      creatorId: gebruiker?.id,
      visibility: "prive",
      shareCode: generateShortCode(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      await opslag.maakOefeningen([kopie]);
      setExercises([kopie, ...exercises]);
      toonMelding(`"${ex.title}" staat nu bij jouw materiaal. Je kan het vrij aanpassen.`);
    } catch {
      mislukt("Kopiëren");
    }
  };

  /** Privé of gedeeld met de hele school — één klik heen en terug. */
  const handleZichtbaarheid = async (ex: Exercise) => {
    const nieuw = ex.visibility === "prive" ? ("organisatie" as const) : ("prive" as const);
    const eigen = isEigenMateriaal(ex, gebruiker);
    if (
      !eigen &&
      !confirm(
        `"${ex.title}" uit de bibliotheek halen?\n\nHet staat dan weer alleen bij ${ex.creatorName}. Cursisten met de code kunnen blijven oefenen.`
      )
    ) {
      return;
    }
    try {
      await opslag.wijzigOefening(ex.id, { visibility: nieuw });
      setExercises(exercises.map((o) => (o.id === ex.id ? { ...o, visibility: nieuw } : o)));
      toonMelding(
        nieuw === "organisatie"
          ? `"${ex.title}" staat nu in de schoolbibliotheek.`
          : eigen
            ? `"${ex.title}" staat weer alleen bij jou. Cursisten met de code kunnen nog altijd oefenen.`
            : `"${ex.title}" staat weer alleen bij ${ex.creatorName}.`
      );
    } catch {
      mislukt("Zichtbaarheid aanpassen");
    }
  };

  /** Een beheerder wordt zelf de maker, bijvoorbeeld van materiaal van wie vertrok. */
  const handleOvernemen = async (ex: OefeningKort) => {
    if (!gebruiker?.id) return;
    if (
      !confirm(
        `"${ex.title}" overnemen van ${ex.creatorName}?\n\nJij wordt de maker: het staat bij jouw materiaal en jij ziet wat cursisten instuurden. ${ex.creatorName} kan het dan niet meer aanpassen.`
      )
    ) {
      return;
    }
    try {
      const wijziging = { creatorId: gebruiker.id, creatorName: gebruiker.naam };
      await opslag.wijzigOefening(ex.id, wijziging);
      setExercises(exercises.map((o) => (o.id === ex.id ? { ...o, ...wijziging } : o)));
      toonMelding(`"${ex.title}" is nu van jou.`);
    } catch {
      mislukt("Overnemen");
    }
  };

  /** Wat de leraar moet weten voor iets naar de prullenbak gaat. */
  const gevolgen = (lijst: OefeningKort[]): string => {
    const delen: string[] = [];
    if (lijst.length === 1) {
      delen.push(`Cursisten kunnen ze met de code ${lijst[0].shareCode} niet meer openen.`);
    } else {
      delen.push("Cursisten kunnen ze met hun code niet meer openen.");
    }
    const inMappen = new Set(
      lijst.flatMap((ex) => mappenVanOefening([...mappen, ...orgMappen], ex.id).map((m) => m.title))
    );
    if (inMappen.size > 0) delen.push(`In gebruik in: ${[...inMappen].slice(0, 5).join(", ")}${inMappen.size > 5 ? ", ..." : ""}.`);
    if (lijst.some((ex) => ex.visibility === "organisatie")) {
      delen.push("Collega's vinden ze niet meer in de bibliotheek.");
    }
    const vanCollegas = lijst.filter((ex) => !isEigenMateriaal(ex, gebruiker));
    if (lijst.length === 1 && vanCollegas.length === 1) {
      delen.push(`Dit is materiaal van ${lijst[0].creatorName}, niet van jou.`);
    } else if (vanCollegas.length > 0) {
      delen.push(`${vanCollegas.length} ervan ${vanCollegas.length === 1 ? "is" : "zijn"} van een collega, niet van jou.`);
    }
    delen.push(`Je kan ze ${PRULLENBAK_DAGEN} dagen lang terugzetten uit de prullenbak.`);
    return delen.join("\n");
  };

  const handleVerwijder = async (id: string) => {
    const ex = exercises.find((o) => o.id === id);
    if (!ex) return;
    if (!confirm(`"${ex.title}" naar de prullenbak?\n\n${gevolgen([ex])}`)) return;
    try {
      await opslag.verwijderOefening(id);
      setExercises(exercises.filter((o) => o.id !== id));
      toonMelding(`"${ex.title}" zit in de prullenbak.`);
    } catch {
      mislukt("Verwijderen");
    }
  };

  /* ── Meerdere tegelijk ─────────────────────────────────────────────────── */

  const gekozen = useMemo(
    () => (selectie ? exercises.filter((ex) => selectie.has(ex.id)) : []),
    [selectie, exercises]
  );
  const wisselSelectie = (ex: OefeningKort) => {
    if (!selectie) return;
    const nieuw = new Set(selectie);
    if (nieuw.has(ex.id)) nieuw.delete(ex.id);
    else nieuw.add(ex.id);
    setSelectie(nieuw);
  };
  const stopSelectie = () => {
    setSelectie(null);
    setBulkMapId("");
  };
  const mijnMappen = eigenMappen(mappen, gebruiker);

  /** Voer één actie uit op alles wat gekozen is; wat lukte, toont de lijst meteen. */
  const voorElk = async (
    lijst: OefeningKort[],
    doe: (ex: OefeningKort) => Promise<void>
  ): Promise<Set<string>> => {
    const gelukt = new Set<string>();
    for (const ex of lijst) {
      try {
        await doe(ex);
        gelukt.add(ex.id);
      } catch {
        // De rest gaat door; de melding zegt hoeveel er lukten.
      }
    }
    return gelukt;
  };

  const bulkResultaat = (gelukt: number, totaal: number, wat: string) => {
    if (gelukt === totaal) toonMelding(`${gelukt} ${gelukt === 1 ? "oefening" : "oefeningen"} ${wat}.`);
    else {
      setMelding("");
      setFoutMelding(`${gelukt} van ${totaal} ${wat}. Bij de rest is het niet gelukt; probeer die opnieuw.`);
    }
  };

  const bulkZichtbaarheid = async (nieuw: Zichtbaarheid) => {
    const lijst = gekozen.filter((ex) => ex.visibility !== nieuw);
    if (lijst.length === 0) {
      toonMelding(nieuw === "organisatie" ? "Alles wat je koos, is al gedeeld." : "Alles wat je koos, is al privé.");
      return;
    }
    // Wat van een collega is en privé wordt, verdwijnt ook voor de beheerder zelf.
    const vanCollegas = lijst.filter((ex) => !isEigenMateriaal(ex, gebruiker)).length;
    if (
      nieuw === "prive" &&
      vanCollegas > 0 &&
      !confirm(
        `${vanCollegas} ${vanCollegas === 1 ? "oefening is" : "oefeningen zijn"} van een collega. Die ${vanCollegas === 1 ? "verdwijnt" : "verdwijnen"} uit de bibliotheek en ${vanCollegas === 1 ? "staat" : "staan"} dan weer alleen bij de maker. Doorgaan?`
      )
    ) {
      return;
    }
    setBulkBezig(true);
    const gelukt = await voorElk(lijst, (ex) => opslag.wijzigOefening(ex.id, { visibility: nieuw }));
    setExercises(exercises.map((o) => (gelukt.has(o.id) ? { ...o, visibility: nieuw } : o)));
    bulkResultaat(
      gelukt.size,
      lijst.length,
      nieuw === "organisatie" ? "gedeeld met de hele school" : "teruggezet op privé"
    );
    setBulkBezig(false);
    stopSelectie();
  };

  const bulkInMap = async () => {
    const map = mijnMappen.find((m) => m.id === bulkMapId);
    if (!map) return;
    // In een persoonlijke map zit alleen eigen materiaal.
    const eigen = gekozen.filter((ex) => isEigenMateriaal(ex, gebruiker));
    const erbij = eigen.filter((ex) => !map.exerciseIds.includes(ex.id)).map((ex) => ex.id);
    setBulkBezig(true);
    try {
      const exerciseIds = [...map.exerciseIds, ...erbij];
      if (erbij.length > 0) {
        await opslag.wijzigMap(map.id, { exerciseIds });
        setMappen(mappen.map((m) => (m.id === map.id ? { ...m, exerciseIds } : m)));
      }
      const overgeslagen = gekozen.length - eigen.length;
      toonMelding(
        `${erbij.length} ${erbij.length === 1 ? "oefening" : "oefeningen"} in "${map.title}" gezet.` +
          (overgeslagen > 0 ? ` ${overgeslagen} van collega's overgeslagen: kopieer die eerst.` : "")
      );
      stopSelectie();
    } catch {
      mislukt("In de map plaatsen");
    } finally {
      setBulkBezig(false);
    }
  };

  const bulkVerwijder = async () => {
    if (gekozen.length === 0) return;
    if (!confirm(`${gekozen.length} ${gekozen.length === 1 ? "oefening" : "oefeningen"} naar de prullenbak?\n\n${gevolgen(gekozen)}`)) return;
    setBulkBezig(true);
    const gelukt = await voorElk(gekozen, (ex) => opslag.verwijderOefening(ex.id));
    setExercises(exercises.filter((o) => !gelukt.has(o.id)));
    bulkResultaat(gelukt.size, gekozen.length, "naar de prullenbak verplaatst");
    setBulkBezig(false);
    stopSelectie();
  };

  const actieveFase = fase !== "alle" ? LESFASE_BY_ID[fase] : undefined;

  const bereikKnop = (id: Bereik, label: string) => (
    <button
      onClick={() => {
        setBereik(id);
        stopSelectie();
      }}
      aria-pressed={bereik === id}
      className={`px-3 py-1.5 rounded-lg transition-colors ${
        bereik === id ? "bg-white text-merk-900 shadow-xs" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`space-y-6 u-fade ${selectie ? "pb-28" : ""}`}>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
            Bibliotheek
          </h1>
          <p className="text-sm text-slate-600">
            Wat collega&apos;s deelden met de organisatie, plus je eigen materiaal. Geordend per
            werkvorm; kopieer wat je kan gebruiken en pas het aan.
          </p>
        </div>

        {isLeraar && (
          <Link
            href="/maken"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nieuwe oefening maken</span>
          </Link>
        )}
      </div>

      {isLeraar && bereik === "alles" && !laden && (
        <OrganisatieMappen
          orgMappen={orgMappen}
          oefeningen={exercises}
          setOrgMappen={setOrgMappen}
        />
      )}

      {/* Filters: zoeken, eigenaar, werkvorm, vak, volgorde, lesfase */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={zoek}
              onChange={(e) => setZoek(e.target.value)}
              placeholder="Zoek op titel, vak, trefwoord, maker of werkvorm"
              aria-label="Zoek in de bibliotheek"
              disabled={bereik === "prullenbak"}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-merk focus:outline-none text-slate-800 placeholder-slate-400 disabled:opacity-50"
            />
          </div>

          {isLeraar && (
            <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-bold shrink-0">
              {bereikKnop("alles", "Alles")}
              {bereikKnop("mij", "Van mij")}
              {bereikKnop("prullenbak", "Prullenbak")}
            </div>
          )}
        </div>

        {bereik !== "prullenbak" && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={werkvorm}
                onChange={(e) => setWerkvorm(e.target.value as ExerciseType | "alle")}
                aria-label="Werkvorm"
                className={veldKlasse}
              >
                <option value="alle">Alle werkvormen</option>
                {werkvormen.map((type) => (
                  <option key={type} value={type}>
                    {WERKVORMEN[type].label}
                  </option>
                ))}
              </select>

              {vakken.length > 0 && (
                <select value={vak} onChange={(e) => setVak(e.target.value)} aria-label="Vak of opleiding" className={veldKlasse}>
                  <option value="">Alle vakken</option>
                  {vakken.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={volgorde}
                onChange={(e) => setVolgorde(e.target.value as Volgorde)}
                aria-label="Volgorde"
                className={veldKlasse}
              >
                <option value="nieuw">Nieuwste eerst</option>
                <option value="titel">Op titel</option>
              </select>

              {isLeraar && !selectie && gefilterd.some(magBeheren) && (
                <button
                  onClick={() => setSelectie(new Set())}
                  className="ml-auto px-3 py-2 rounded-xl text-xs font-bold text-merk-900 hover:bg-merk-50 transition-colors flex items-center gap-1.5"
                >
                  <CheckSquare className="w-4 h-4" />
                  Meerdere kiezen
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <FaseKnop actief={fase === "alle"} onClick={() => setFase("alle")}>
                Alle lesfases
              </FaseKnop>
              {LESFASES.filter((f) => f.werkvormen.some(isAan)).map((f) => (
                <FaseKnop key={f.id} actief={fase === f.id} onClick={() => setFase(f.id)}>
                  {f.nummer}. {f.label}
                </FaseKnop>
              ))}
            </div>
          </>
        )}
      </div>

      {actieveFase && bereik !== "prullenbak" && (
        <p className="text-xs text-merk-900 bg-merk-50 border border-merk/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          <span>
            <strong>{actieveFase.label}:</strong> {actieveFase.wanneer}
            {instellingen.tips.leraren && <> {actieveFase.waarom}</>}
            {isLeraar && instellingen.tips.leraren && (
              <>
                {" "}
                <strong>Zeg erbij:</strong> &ldquo;{actieveFase.zegErbij}&rdquo;
              </>
            )}
          </span>
        </p>
      )}

      {melding && (
        <p role="status" className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          {melding}
        </p>
      )}

      {(foutMelding || fout) && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {foutMelding || fout}
        </p>
      )}

      {/* Resultaten, gegroepeerd per werkvorm */}
      {bereik === "prullenbak" ? (
        gebruiker && <Prullenbak kijker={gebruiker} isBeheerder={isBeheerder} onTeruggezet={vernieuw} />
      ) : laden ? (
        <div className="h-40" aria-hidden />
      ) : perWerkvorm.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-sm text-slate-600 mb-4">
            {enkelVanMij && !zoek && fase === "alle" && werkvorm === "alle" && !vak
              ? "Je hebt hier nog geen eigen materiaal staan."
              : "Geen materiaal gevonden voor deze filters."}
          </p>
          {isLeraar && (
            <Link
              href="/maken"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Maak je eerste oefening</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {perWerkvorm.map(([type, lijst]) => {
            const soort = WERKVORMEN[type];
            const Icon = soort.icon;
            const aantal = getoond[type] ?? PER_STAP;
            const zichtbareLijst = lijst.slice(0, aantal);
            const rest = lijst.length - zichtbareLijst.length;

            return (
              <section key={type}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
                    <Icon className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h2 className="font-bold text-base text-merk-900 leading-tight">
                      {soort.label}{" "}
                      <span className="font-semibold text-slate-500">({lijst.length})</span>
                    </h2>
                    <p className="text-xs text-slate-600 max-w-2xl">{soort.uitleg}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zichtbareLijst.map((ex) => (
                    <MateriaalKaart
                      key={ex.id}
                      ex={ex}
                      isLeraar={isLeraar}
                      isEigen={isEigenMateriaal(ex, gebruiker)}
                      magBeheren={magBeheren(ex)}
                      onDelen={setSelectedShare}
                      mapNamen={mappenVanOefening([...mappen, ...orgMappen], ex.id).map(
                        (m) => m.title
                      )}
                      onKopieer={isLeraar ? handleKopieer : undefined}
                      onVerwijder={isLeraar ? handleVerwijder : undefined}
                      onInMap={isLeraar ? setMapVoor : undefined}
                      onInOrganisatiemap={isBeheerder ? setOrgMapVoor : undefined}
                      onZichtbaarheid={isLeraar ? handleZichtbaarheid : undefined}
                      onOvernemen={isBeheerder ? handleOvernemen : undefined}
                      onSelecteer={selectie && magBeheren(ex) ? wisselSelectie : undefined}
                      geselecteerd={selectie?.has(ex.id)}
                    />
                  ))}
                </div>

                {rest > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setGetoond({ ...getoond, [type]: aantal + PER_STAP * 2 })}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-merk-800 text-sm font-bold text-merk-900 transition-colors"
                    >
                      Toon meer ({rest} verborgen)
                    </button>
                    {selectie && (
                      <button
                        onClick={() => setGetoond({ ...getoond, [type]: lijst.length })}
                        className="text-xs font-bold text-slate-600 hover:underline"
                      >
                        Toon alle {lijst.length}
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Meerdere tegelijk: de balk blijft onderaan in beeld */}
      {selectie && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900 mr-2" role="status" aria-live="polite">
              {gekozen.length} gekozen
            </span>
            <button
              onClick={() => setSelectie(new Set(gefilterd.filter(magBeheren).map((ex) => ex.id)))}
              className="text-xs font-bold text-merk-900 hover:underline mr-auto"
            >
              Kies alles in deze lijst ({gefilterd.filter(magBeheren).length})
            </button>

            {mijnMappen.length > 0 && (
              <span className="flex items-center gap-1">
                <select
                  value={bulkMapId}
                  onChange={(e) => setBulkMapId(e.target.value)}
                  aria-label="Map"
                  className={veldKlasse}
                >
                  <option value="">Kies een map</option>
                  {mijnMappen.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <BulkKnop icon={FolderPlus} onClick={bulkInMap} uit={bulkBezig || !bulkMapId || gekozen.length === 0}>
                  In map
                </BulkKnop>
              </span>
            )}
            <BulkKnop icon={Building2} onClick={() => bulkZichtbaarheid("organisatie")} uit={bulkBezig || gekozen.length === 0}>
              Delen
            </BulkKnop>
            <BulkKnop icon={Lock} onClick={() => bulkZichtbaarheid("prive")} uit={bulkBezig || gekozen.length === 0}>
              Privé
            </BulkKnop>
            <BulkKnop icon={Trash2} onClick={bulkVerwijder} uit={bulkBezig || gekozen.length === 0} gevaarlijk>
              Prullenbak
            </BulkKnop>
            <button
              onClick={stopSelectie}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Stop met kiezen"
              title="Stop met kiezen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {mapVoor && gebruiker && (
        <MapKiezer
          oefening={mapVoor}
          eigenaar={gebruiker}
          onSluit={() => setMapVoor(null)}
          onGewijzigd={setMappen}
        />
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

      {selectedShare && (
        <ShareModal
          isOpen={!!selectedShare}
          onClose={() => setSelectedShare(null)}
          title={selectedShare.title}
          shareCode={selectedShare.shareCode}
          id={selectedShare.id}
        />
      )}
    </div>
  );
}

function BulkKnop({
  icon: Icon,
  onClick,
  uit,
  gevaarlijk,
  children,
}: {
  icon: React.ElementType;
  onClick: () => void;
  uit: boolean;
  gevaarlijk?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={uit}
      className={`px-3 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40 ${
        gevaarlijk
          ? "text-rose-700 border border-rose-200 hover:bg-rose-50"
          : "text-merk-900 border border-merk/40 hover:bg-merk-50"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{children}</span>
    </button>
  );
}

function FaseKnop({
  actief,
  onClick,
  children,
}: {
  actief: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
        actief
          ? "bg-merk-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-merk-50 hover:text-merk-900"
      }`}
    >
      {children}
    </button>
  );
}

export default function BibliotheekPagina() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <BibliotheekInhoud />
    </Suspense>
  );
}
