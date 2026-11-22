"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ImagePlus,
  LayoutGrid,
  Lightbulb,
  Lock,
  Mic,
  Palette,
  Trash2,
} from "lucide-react";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth/AuthProvider";
import { firebaseConfigured, getDb, getFirebaseAuth } from "@/lib/firebase/client";
import { bewaarInstellingen, useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import { MAX_LOGO, normaliseer, type Instellingen } from "@/lib/instellingen/types";
import { FUNCTIEGROEPEN, HANGT_AF_VAN, isExtraFunctie, type FunctieId } from "@/lib/instellingen/functies";
import { KLEURSCHEMAS, contrast, isHex, maakPalet, type Tint } from "@/lib/instellingen/kleur";
import { WERKVORMEN } from "@/lib/labels";

/*
 * Beheer: alles wat deze installatie van Open E-lab eigen maakt.
 * Alleen voor beheerders (beheerders/{e-mail} in Firestore; in demomodus is de demoleraar
 * ook beheerder).
 *
 * Je werkt op een kopie. Pas bij "Bewaren" gaat het naar de opslag en geldt het voor
 * iedereen. De kleur zie je meteen in het voorbeeld; de OpenAI-sleutel bewaar je apart.
 */

const GROEPNAMEN: Record<(typeof FUNCTIEGROEPEN)[number]["id"], string> = {
  inoefenen: "Inoefenen",
  controleren: "Begrip controleren en afsluiten",
  activeren: "Voorkennis activeren",
  live: "Live in de klas",
  klastools: "Klastools",
  cursist: "Voor cursisten",
  spraak: "Spraak (OpenAI)",
};

/** Functies die geen eigen werkvorm zijn, en dus geen label in WERKVORMEN hebben. */
const EXTRA: Record<string, { label: string; uitleg: string }> = {
  snellevraag: {
    label: "Snelle vraag",
    uitleg: "Jij stelt een vraag hardop, cursisten kiezen A tot D op hun toestel.",
  },
  begripsmeter: {
    label: "Begripsmeter",
    uitleg: "Cursisten zetten zichzelf op groen, oranje of rood, de hele les lang.",
  },
  wedstrijd: {
    label: "Quizwedstrijd",
    uitleg: "Een quiz klassikaal spelen, met bijnamen, punten en een podium.",
  },
  bord: { label: "Whiteboard", uitleg: "Leraar en cursisten zetten samen tekst, foto's en meer op één bord." },
  opfrissen: { label: "Opfrissen", uitleg: "Een paar vragen uit vorige lessen, groot op het digibord." },
  digibord: { label: "Digibordscherm", uitleg: "Lesdoelen, opdracht, klok en code op één scherm." },
  herhalen: {
    label: "Gespreid herhalen",
    uitleg: "Aangemelde cursisten krijgen flashcards terug op het juiste moment.",
  },
  afdrukken: { label: "Afdrukken", uitleg: "Oefeningen en een Cornell-notitieblad op papier." },
  inlezen: {
    label: "Inlezen",
    uitleg: "Leraren spreken een tekst in bij lezen, invulzinnen en zinnen bouwen; Whisper schrijft hem uit.",
  },
  audiotekst: {
    label: "Audio naar tekst",
    uitleg: "Klastool: wat de leraar zegt, verschijnt bijna live als tekst.",
  },
};

function functieLabel(id: FunctieId): string {
  return isExtraFunctie(id) ? EXTRA[id].label : WERKVORMEN[id].label;
}

function functieUitleg(id: FunctieId): string {
  return isExtraFunctie(id) ? EXTRA[id].uitleg : WERKVORMEN[id].uitleg;
}

const veldKlasse =
  "w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-merk";

export default function BeheerPagina() {
  const { status, isBeheerder } = useAuth();
  const { instellingen, vervang } = useInstellingen();
  const [concept, setConcept] = useState<Instellingen>(instellingen);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ soort: "ok" | "fout"; tekst: string } | null>(null);

  // Nieuwe instellingen van elders (bijvoorbeeld de eerste keer laden): overnemen.
  useEffect(() => setConcept(instellingen), [instellingen]);

  const gewijzigd = useMemo(
    () => JSON.stringify(normaliseer(concept)) !== JSON.stringify(normaliseer(instellingen)),
    [concept, instellingen]
  );

  if (status === "laden") return <div className="h-64" aria-hidden />;

  if (!isBeheerder) {
    return (
      <div className="max-w-md mx-auto text-center py-16 u-fade">
        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
        <h1 className="text-2xl font-extrabold text-merk-900 tracking-tight mb-2">
          Alleen voor beheerders
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Deze pagina is er voor wie {instellingen.naam} beheert. Denk je dat je beheerder hoort te
          zijn, neem dan contact op met de ICT-coördinator van je school.
        </p>
        <Link
          href="/"
          className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          Naar de startpagina
        </Link>
      </div>
    );
  }

  const wijzig = (verandering: Partial<Instellingen>) => {
    setMelding(null);
    setConcept((c) => ({ ...c, ...verandering }));
  };

  const bewaar = async () => {
    setBezig(true);
    setMelding(null);
    try {
      const schoon = normaliseer(concept);
      await bewaarInstellingen(schoon);
      vervang(schoon);
      setMelding({ soort: "ok", tekst: "Bewaard. De wijzigingen gelden nu voor iedereen." });
    } catch (e) {
      console.error("Instellingen bewaren mislukt", e);
      setMelding({ soort: "fout", tekst: "Bewaren is niet gelukt. Kijk je verbinding na en probeer opnieuw." });
    } finally {
      setBezig(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 u-fade pb-24">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          Beheer
        </h1>
        <p className="text-sm text-slate-600">
          Stel naam, logo, kleuren, toegang, werkvormen, didactische tips en spraak in voor deze
          installatie.
        </p>
        {!firebaseConfigured && (
          <p className="mt-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Demomodus: deze instellingen blijven alleen in deze browser bewaard.
          </p>
        )}
      </div>

      <Huisstijl concept={concept} wijzig={wijzig} />
      <Werkvormen concept={concept} wijzig={wijzig} />
      <Tips concept={concept} wijzig={wijzig} />
      {firebaseConfigured && <Spraak />}
      {firebaseConfigured && <ToegangBlok concept={concept} wijzig={wijzig} />}

      {/* Bewaren blijft altijd in beeld: de pagina is lang. */}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0 text-xs" role="status" aria-live="polite">
            {melding ? (
              <span
                className={`inline-flex items-center gap-1.5 font-semibold ${
                  melding.soort === "ok" ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                {melding.soort === "ok" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {melding.tekst}
              </span>
            ) : gewijzigd ? (
              <span className="text-slate-600">Je hebt wijzigingen die nog niet bewaard zijn.</span>
            ) : null}
          </div>
          {gewijzigd && (
            <button
              onClick={() => {
                setConcept(instellingen);
                setMelding(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              Annuleren
            </button>
          )}
          <button
            onClick={bewaar}
            disabled={bezig || !gewijzigd}
            className="px-5 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
          >
            {bezig ? "Bezig ..." : "Bewaren"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BlokProps {
  concept: Instellingen;
  wijzig: (verandering: Partial<Instellingen>) => void;
}

function Blok({
  icon: Icon,
  titel,
  uitleg,
  children,
}: {
  icon: React.ElementType;
  titel: string;
  uitleg: string;
  children: React.ReactNode;
}) {
  return (
    <section className="u-card p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-merk-50 text-merk-900 flex items-center justify-center border border-merk/20">
          <Icon className="w-4 h-4" />
        </span>
        <div>
          <h2 className="font-extrabold text-lg text-merk-900">{titel}</h2>
          <p className="text-sm text-slate-600">{uitleg}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ── Huisstijl: naam, logo, kleur ──────────────────────────────────────── */

function Huisstijl({ concept, wijzig }: BlokProps) {
  const invoer = useRef<HTMLInputElement>(null);
  const [logoFout, setLogoFout] = useState<string | null>(null);
  const eigenKleur = !KLEURSCHEMAS.some((k) => k.kleur === concept.kleur);
  const palet = maakPalet(concept.kleur);
  const aangepast = contrast(concept.kleur, "#ffffff") < 4.5;

  const kiesLogo = async (bestand: File | undefined) => {
    setLogoFout(null);
    if (!bestand) return;
    if (!bestand.type.startsWith("image/")) {
      setLogoFout("Kies een afbeelding (PNG, JPG, WebP of SVG).");
      return;
    }
    try {
      const url = await verkleinLogo(bestand);
      if (url.length > MAX_LOGO) {
        setLogoFout("Het logo blijft te groot. Probeer een eenvoudiger bestand.");
        return;
      }
      wijzig({ logo: url });
    } catch {
      setLogoFout("Dit logo konden we niet verwerken. Probeer een PNG of JPG.");
    } finally {
      if (invoer.current) invoer.current.value = "";
    }
  };

  return (
    <Blok
      icon={Palette}
      titel="Huisstijl"
      uitleg="Geef de app de naam, het logo en de hoofdkleur van je school of organisatie."
    >
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">Naam van de app</span>
          <input
            value={concept.naam}
            maxLength={40}
            onChange={(e) => wijzig({ naam: e.target.value })}
            className={veldKlasse}
          />
        </label>
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            School of organisatie <span className="font-normal text-slate-500">(optioneel)</span>
          </span>
          <input
            value={concept.organisatie}
            maxLength={80}
            placeholder="bv. Atheneum De Brug"
            onChange={(e) => wijzig({ organisatie: e.target.value })}
            className={veldKlasse}
          />
        </label>
      </div>

      {/* Logo */}
      <div className="mb-6">
        <span className="block text-sm font-bold text-slate-800 mb-1">Logo</span>
        <p className="text-xs text-slate-500 mb-3">
          Verschijnt in de kopbalk, op de aanmeldpagina en als tabbladicoon.
        </p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-1.5">
            {concept.logo ? (
              <img src={concept.logo} alt="Huidig logo" className="w-full h-full object-contain" />
            ) : (
              <ImagePlus className="w-6 h-6 text-slate-400" aria-hidden />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => invoer.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              {concept.logo ? "Logo vervangen" : "Logo uploaden"}
            </button>
            {concept.logo && (
              <button
                type="button"
                onClick={() => wijzig({ logo: null })}
                className="px-3 py-2 rounded-xl text-rose-800 hover:bg-rose-50 font-bold text-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Verwijderen
              </button>
            )}
          </div>
          <input
            ref={invoer}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => kiesLogo(e.target.files?.[0])}
          />
        </div>
        {logoFout && (
          <p role="alert" className="mt-2 text-xs font-semibold text-rose-800">
            {logoFout}
          </p>
        )}
      </div>

      {/* Kleurschema */}
      <div>
        <span className="block text-sm font-bold text-slate-800 mb-1">Kleurschema</span>
        <p className="text-xs text-slate-500 mb-3">
          Kies een basiskleur of vul de hexcode van je school in. Knoppen bewaren automatisch
          voldoende contrast (WCAG AA).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {KLEURSCHEMAS.map((k) => {
            const actief = concept.kleur === k.kleur;
            return (
              <button
                type="button"
                key={k.id}
                onClick={() => wijzig({ kleur: k.kleur })}
                aria-pressed={actief}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  actief ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <span className="w-5 h-5 rounded-full shrink-0" style={{ background: k.kleur }} aria-hidden />
                <span className="flex-1 text-left text-slate-800">{k.label}</span>
                {actief && <Check className="w-4 h-4 text-slate-900" />}
              </button>
            );
          })}
        </div>

        <label
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-bold w-full sm:w-auto sm:inline-flex ${
            eigenKleur ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
          }`}
        >
          <input
            type="color"
            value={isHex(concept.kleur) ? concept.kleur : "#2f6fde"}
            onChange={(e) => wijzig({ kleur: e.target.value.toLowerCase() })}
            className="w-8 h-8 rounded-lg border-0 p-0 bg-transparent cursor-pointer"
          />
          <span className="text-slate-800">Eigen kleur</span>
          <input
            value={concept.kleur}
            onChange={(e) => {
              const w = e.target.value.trim();
              if (/^#?[0-9a-fA-F]{0,6}$/.test(w)) wijzig({ kleur: w.startsWith("#") ? w : `#${w}` });
            }}
            aria-label="Hexcode van de merkkleur"
            className="w-24 px-2 py-1 rounded-lg border border-veldrand font-mono text-xs"
          />
        </label>

        {/* Voorbeeld met de gekozen kleur, los van de rest van de pagina */}
        <div className="mt-4 rounded-2xl border border-slate-200 p-4" style={paletStijl(palet)}>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Voorbeeld</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-2 rounded-xl text-white font-bold text-sm" style={{ background: "var(--merk-800)" }}>
              Knop
            </span>
            <span
              className="px-3 py-1.5 rounded-lg font-semibold text-sm"
              style={{ background: "var(--merk-50)", color: "var(--merk-900)" }}
            >
              Actieve tab
            </span>
            <span className="font-extrabold" style={{ color: "var(--merk-900)" }}>
              {concept.naam}
            </span>
            <span className="flex gap-1" aria-hidden>
              {(["50", "300", "400", "500", "600", "700", "800", "900"] as Tint[]).map((tint) => (
                <span key={tint} className="w-5 h-5 rounded" style={{ background: palet[tint] }} />
              ))}
            </span>
          </div>
          {aangepast && (
            <p className="mt-3 text-xs text-slate-600">
              Deze kleur is vrij licht voor witte tekst; knoppen en titels gebruiken automatisch een
              donkerdere tint voor goed contrast.
            </p>
          )}
        </div>
      </div>
    </Blok>
  );
}

function paletStijl(palet: Record<Tint, string>): React.CSSProperties {
  const stijl: Record<string, string> = {};
  for (const [tint, w] of Object.entries(palet)) stijl[`--merk-${tint}`] = w;
  return stijl as React.CSSProperties;
}

/** Verklein naar hoogstens 256 px en bewaar als webp (of png als de browser geen webp kan). */
async function verkleinLogo(bestand: File): Promise<string> {
  const url = URL.createObjectURL(bestand);
  try {
    const img = await new Promise<HTMLImageElement>((ok, nietOk) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = nietOk;
      i.src = url;
    });
    const max = 256;
    const breedte = img.naturalWidth || max;
    const hoogte = img.naturalHeight || max;
    const schaal = Math.min(1, max / Math.max(breedte, hoogte));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(breedte * schaal));
    canvas.height = Math.max(1, Math.round(hoogte * schaal));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("geen canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.9);
    return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ── Werkvormen en functies ────────────────────────────────────────────── */

function Werkvormen({ concept, wijzig }: BlokProps) {
  const zet = (id: FunctieId, aan: boolean) =>
    wijzig({ uit: aan ? concept.uit.filter((f) => f !== id) : [...concept.uit, id] });
  const zetGroep = (ids: FunctieId[], aan: boolean) =>
    wijzig({
      uit: aan
        ? concept.uit.filter((f) => !ids.includes(f))
        : [...concept.uit.filter((f) => !ids.includes(f)), ...ids],
    });

  return (
    <Blok
      icon={LayoutGrid}
      titel="Werkvormen en functies"
      uitleg="Zet uit wat je school niet aanbiedt. Het verdwijnt uit de menu's; bestaand materiaal blijft bewaard en is terug zodra je het weer aanzet."
    >
      <div className="space-y-6">
        {FUNCTIEGROEPEN.map((groep) => {
          const alleAan = groep.functies.every((f) => !concept.uit.includes(f));
          return (
            <div key={groep.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">
                  {GROEPNAMEN[groep.id]}
                </h3>
                <button
                  onClick={() => zetGroep(groep.functies, !alleAan)}
                  className="text-xs font-bold text-merk-900 hover:underline"
                >
                  {alleAan ? "Alles uit" : "Alles aan"}
                </button>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {groep.functies.map((id) => {
                  const aan = !concept.uit.includes(id);
                  const nodig = HANGT_AF_VAN[id];
                  const geblokkeerd = !!nodig && concept.uit.includes(nodig);
                  return (
                    <div key={id} className="flex items-start gap-3 px-4 py-3">
                      <Schakelaar aan={aan} label={functieLabel(id)} onChange={(w) => zet(id, w)} />
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${aan ? "text-slate-800" : "text-slate-500"}`}>
                          {functieLabel(id)}
                        </p>
                        <p className="text-xs text-slate-500">{functieUitleg(id)}</p>
                        {geblokkeerd && aan && (
                          <p className="text-xs text-amber-800 mt-1">
                            Werkt pas als ook {functieLabel(nodig)} aan staat.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Blok>
  );
}

/* ── Didactische tips ──────────────────────────────────────────────────── */

function Tips({ concept, wijzig }: BlokProps) {
  const rijen: { id: keyof Instellingen["tips"]; label: string; uitleg: string }[] = [
    {
      id: "leraren",
      label: "Tips voor leraren",
      uitleg:
        "Bij het maken van oefeningen, in de klas, en de uitleg bij elke lesfase (waarom het werkt en wat je erbij zegt).",
    },
    {
      id: "cursisten",
      label: "Studeertips voor cursisten",
      uitleg: "Op de startpagina, bij het oefenen en de pagina Slim oefenen.",
    },
  ];
  return (
    <Blok
      icon={Lightbulb}
      titel="Didactische tips"
      uitleg="Korte tips over hoe leren werkt, uit Studeren met succes en ander onderzoek."
    >
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
        {rijen.map((r) => (
          <div key={r.id} className="flex items-start gap-3 px-4 py-3">
            <Schakelaar
              aan={concept.tips[r.id]}
              label={r.label}
              onChange={(w) => wijzig({ tips: { ...concept.tips, [r.id]: w } })}
            />
            <div>
              <p className="text-sm font-bold text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-500">{r.uitleg}</p>
            </div>
          </div>
        ))}
      </div>
    </Blok>
  );
}

/* ── Spraak: de sleutel van OpenAI ─────────────────────────────────────── */

type SpraakStatus = { bron: "beheer" | "omgeving" | null; serverToegang: boolean };

function Spraak() {
  const [stand, setStand] = useState<SpraakStatus | null>(null);
  const [invoer, setInvoer] = useState("");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ soort: "ok" | "fout"; tekst: string } | null>(null);

  const ververs = async () => {
    try {
      const gebruiker = getFirebaseAuth().currentUser;
      if (!gebruiker) return;
      const antwoord = await fetch("/api/inlezen?vers=1", {
        headers: { Authorization: `Bearer ${await gebruiker.getIdToken()}` },
      });
      if (antwoord.ok) setStand((await antwoord.json()) as SpraakStatus);
    } catch {
      // Geen status: het blok blijft "even kijken" tonen, bewaren werkt gewoon.
    }
  };

  useEffect(() => {
    void ververs();
  }, []);

  const bewaar = async () => {
    setMelding(null);
    const sleutel = invoer.trim();
    if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(sleutel)) {
      setMelding({ soort: "fout", tekst: "Dit lijkt geen sleutel van OpenAI. Een sleutel begint met sk-." });
      return;
    }
    setBezig(true);
    try {
      await setDoc(doc(getDb(), "geheimen", "openai"), { sleutel });
      setInvoer("");
      setMelding({ soort: "ok", tekst: "De sleutel is bewaard. Binnen een halve minuut gebruikt inlezen hem." });
      await ververs();
    } catch (e) {
      console.error("Sleutel bewaren mislukt", e);
      setMelding({ soort: "fout", tekst: "Dat is niet gelukt. Kijk je verbinding na en probeer opnieuw." });
    } finally {
      setBezig(false);
    }
  };

  const verwijder = async () => {
    setMelding(null);
    setBezig(true);
    try {
      await deleteDoc(doc(getDb(), "geheimen", "openai"));
      setMelding({ soort: "ok", tekst: "De sleutel uit het beheer is verwijderd." });
      await ververs();
    } catch (e) {
      console.error("Sleutel verwijderen mislukt", e);
      setMelding({ soort: "fout", tekst: "Dat is niet gelukt. Kijk je verbinding na en probeer opnieuw." });
    } finally {
      setBezig(false);
    }
  };

  const statusTekst = !stand
    ? "Even kijken welke sleutel inlezen gebruikt ..."
    : stand.bron === "beheer"
      ? "Inlezen gebruikt de sleutel die hier in het beheer staat."
      : stand.bron === "omgeving"
        ? "Inlezen gebruikt de sleutel uit de serveromgeving (OPENAI_API_KEY). Een sleutel hier gaat daar boven."
        : "Er is geen sleutel. Inlezen en Audio naar tekst werken niet.";

  return (
    <Blok
      icon={Mic}
      titel="Spraak"
      uitleg="Inlezen en Audio naar tekst gebruiken Whisper van OpenAI (ongeveer 0,006 dollar per minuut). Zet hier een eigen sleutel om deze functie in te schakelen."
    >
      <div className="space-y-4">
        <p
          role="status"
          className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${
            stand?.bron ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-700"
          }`}
        >
          {stand?.bron ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          )}
          <span>{statusTekst}</span>
        </p>

        {stand && !stand.serverToegang && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Let op: de server kan de sleutel uit het beheer niet lezen. Zorg voor servertoegang tot
            Firestore (rol Cloud Datastore User of FIREBASE_SERVICE_ACCOUNT), of zet de sleutel
            rechtstreeks in OPENAI_API_KEY.
          </p>
        )}

        <div>
          <label htmlFor="openai-sleutel" className="block text-sm font-bold text-slate-800 mb-1">
            Sleutel van OpenAI
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="openai-sleutel"
              aria-describedby="openai-sleutel-hint"
              type="password"
              value={invoer}
              onChange={(e) => {
                setInvoer(e.target.value);
                setMelding(null);
              }}
              placeholder="sk-..."
              autoComplete="off"
              spellCheck={false}
              className={`${veldKlasse} font-mono`}
            />
            <button
              onClick={bewaar}
              disabled={bezig || !invoer.trim()}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
            >
              Sleutel bewaren
            </button>
          </div>
          <p id="openai-sleutel-hint" className="text-xs text-slate-500 mt-1">
            Maak een sleutel aan op{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-merk-900 underline"
            >
              platform.openai.com
            </a>{" "}
            (API keys). Hij begint met sk-. Niemand kan hem hierna nog via de app teruglezen:
            alleen de server gebruikt hem.
          </p>
        </div>

        {melding && (
          <p
            role={melding.soort === "fout" ? "alert" : "status"}
            className={`text-xs font-semibold ${melding.soort === "ok" ? "text-emerald-800" : "text-rose-800"}`}
          >
            {melding.tekst}
          </p>
        )}

        {stand?.bron === "beheer" && (
          <button
            onClick={verwijder}
            disabled={bezig}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-700 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            Sleutel uit het beheer verwijderen
          </button>
        )}
      </div>
    </Blok>
  );
}

/* ── Toegang ───────────────────────────────────────────────────────────── */

function lijstNaarTekst(l: string[]) {
  return l.join(", ");
}

function tekstNaarLijst(s: string) {
  return s
    .split(/[\s,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

function ToegangBlok({ concept, wijzig }: BlokProps) {
  const { toegang } = concept;
  const [leraren, setLeraren] = useState(lijstNaarTekst(toegang.leraarDomeinen));
  const [cursisten, setCursisten] = useState(lijstNaarTekst(toegang.cursistDomeinen));

  let patroonFout = false;
  try {
    if (toegang.cursistPatroon) new RegExp(toegang.cursistPatroon);
  } catch {
    patroonFout = true;
  }

  return (
    <Blok
      icon={Lock}
      titel="Toegang"
      uitleg="Bepaal welke Google-accounts zich mogen aanmelden als leraar of als cursist. Dezelfde regels gelden in Firestore."
    >
      <div className="space-y-4">
        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            E-maildomeinen van leraren
          </span>
          <input
            value={leraren}
            placeholder="school.be"
            onChange={(e) => {
              setLeraren(e.target.value);
              wijzig({ toegang: { ...toegang, leraarDomeinen: tekstNaarLijst(e.target.value) } });
            }}
            className={`${veldKlasse} font-mono`}
          />
          <span className="block text-xs text-slate-500 mt-1">
            Scheid meerdere domeinen met een komma, zonder @.
          </span>
        </label>

        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            E-maildomeinen van cursisten
          </span>
          <input
            value={cursisten}
            placeholder="leerlingen.school.be"
            onChange={(e) => {
              setCursisten(e.target.value);
              wijzig({ toegang: { ...toegang, cursistDomeinen: tekstNaarLijst(e.target.value) } });
            }}
            className={`${veldKlasse} font-mono`}
          />
          <span className="block text-xs text-slate-500 mt-1">
            Vul <code className="font-mono">*</code> in om elk Google-account als cursist toe te
            laten. Zonder account oefenen via code of QR-code werkt altijd.
          </span>
        </label>

        <label className="block">
          <span className="block text-sm font-bold text-slate-800 mb-1">
            Patroon voor cursistenaccounts{" "}
            <span className="font-normal text-slate-500">(optioneel)</span>
          </span>
          <input
            value={toegang.cursistPatroon}
            placeholder="s[0-9]+@school[.]be"
            onChange={(e) => wijzig({ toegang: { ...toegang, cursistPatroon: e.target.value } })}
            className={`${veldKlasse} font-mono`}
          />
          <span className="block text-xs text-slate-500 mt-1">
            Reguliere expressie op het volledige e-mailadres. Handig als leraren en cursisten op
            hetzelfde domein zitten (bv. leerlingnummers).
          </span>
          {patroonFout && (
            <span role="alert" className="block text-xs font-semibold text-rose-800 mt-1">
              Dit is geen geldige reguliere expressie.
            </span>
          )}
        </label>

        <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
          Beheerders voeg je toe in de Firebase-console in de collectie{" "}
          <code className="font-mono">beheerders</code>, met als document-id het e-mailadres in
          kleine letters.
        </p>
      </div>
    </Blok>
  );
}

/* ── Schakelaar ────────────────────────────────────────────────────────── */

function Schakelaar({
  aan,
  label,
  onChange,
}: {
  aan: boolean;
  label: string;
  onChange: (aan: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={aan}
      aria-label={label}
      onClick={() => onChange(!aan)}
      className={`relative w-10 h-6 shrink-0 rounded-full transition-colors ${
        aan ? "bg-merk-800" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          aan ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
