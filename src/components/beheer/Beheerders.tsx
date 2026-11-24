"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { opslag, opslagGedeeld, useMateriaal } from "@/lib/opslag";
import { useOpgehaald } from "@/lib/opgehaald";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Beheerder } from "@/lib/types";
import { WERKVORMEN } from "@/lib/labels";

/** Hetzelfde patroon als in firestore.rules: een e-mailadres in kleine letters. */
const ADRES = /^[^@/\s]+@[^@/\s]+\.[^@/\s]+$/;

function Kaart({
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

/**
 * Wie de app mee beheert. Een beheerder zet werkvormen aan en uit, ordent de
 * organisatiemappen en kan gedeeld materiaal van collega's aanpassen of weghalen.
 */
export function Beheerders() {
  const { gebruiker } = useAuth();
  const { data, laden, fout, zet } = useOpgehaald<Beheerder[]>("beheerders:", () => opslag.beheerders());
  const [adres, setAdres] = useState("");
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ soort: "ok" | "fout"; tekst: string } | null>(null);

  const lijst = data ?? [];
  const ik = gebruiker?.email.toLowerCase() ?? "";

  const voegToe = async (e: React.FormEvent) => {
    e.preventDefault();
    const nieuw = adres.trim().toLowerCase();
    if (!ADRES.test(nieuw)) {
      setMelding({ soort: "fout", tekst: "Geef het e-mailadres waarmee je collega zich aanmeldt, zoals voornaam.naam@school.be." });
      return;
    }
    if (lijst.some((b) => b.adres === nieuw)) {
      setMelding({ soort: "fout", tekst: `${nieuw} is al beheerder.` });
      return;
    }
    setBezig(true);
    try {
      await opslag.voegBeheerderToe(nieuw, ik);
      zet([...lijst, { adres: nieuw, toegevoegdDoor: ik, op: new Date().toISOString() }].sort((a, b) => a.adres.localeCompare(b.adres)));
      setAdres("");
      setMelding({ soort: "ok", tekst: `${nieuw} is nu beheerder. Dat geldt zodra die collega zich opnieuw aanmeldt.` });
    } catch {
      setMelding({ soort: "fout", tekst: "Toevoegen is niet gelukt. Kijk je verbinding na en probeer opnieuw." });
    } finally {
      setBezig(false);
    }
  };

  const verwijder = async (beheerder: Beheerder) => {
    if (!confirm(`${beheerder.adres} is dan geen beheerder meer. Doorgaan?`)) return;
    setBezig(true);
    try {
      await opslag.verwijderBeheerder(beheerder.adres);
      zet(lijst.filter((b) => b.adres !== beheerder.adres));
      setMelding({ soort: "ok", tekst: `${beheerder.adres} is geen beheerder meer.` });
    } catch {
      setMelding({ soort: "fout", tekst: "Weghalen is niet gelukt. Kijk je verbinding na en probeer opnieuw." });
    } finally {
      setBezig(false);
    }
  };

  return (
    <Kaart
      icon={ShieldCheck}
      titel="Beheerders"
      uitleg="Wie deze pagina ziet, de organisatiemappen ordent en gedeeld materiaal van collega's kan aanpassen, overnemen of weghalen."
    >
      {!opslagGedeeld && (
        <p className="mb-4 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Demomodus: in de demo is de leraar altijd beheerder. Deze lijst blijft alleen in deze
          browser bewaard.
        </p>
      )}

      {laden ? (
        <div className="h-16" aria-hidden />
      ) : fout ? (
        <p role="alert" className="text-xs font-semibold text-rose-800">
          We konden de lijst niet laden. Kijk je verbinding na en probeer opnieuw.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl mb-4">
          {lijst.length === 0 && <li className="px-4 py-3 text-sm text-slate-600">Nog niemand in de lijst.</li>}
          {lijst.map((b) => (
            <li key={b.adres} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-800 truncate">{b.adres}</span>
                {b.adres === ik ? (
                  <span className="block text-xs text-slate-500">Dat ben jij. Jezelf weghalen kan niet: zo blijft er altijd een beheerder.</span>
                ) : (
                  b.toegevoegdDoor && <span className="block text-xs text-slate-500">Toegevoegd door {b.toegevoegdDoor}</span>
                )}
              </span>
              {b.adres !== ik && (
                <button
                  onClick={() => verwijder(b)}
                  disabled={bezig}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                  title="Geen beheerder meer"
                  aria-label={`${b.adres} weghalen als beheerder`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={voegToe} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={adres}
          onChange={(e) => {
            setAdres(e.target.value);
            setMelding(null);
          }}
          placeholder="voornaam.naam@school.be"
          aria-label="E-mailadres van de nieuwe beheerder"
          autoComplete="off"
          className="w-full px-3 py-2.5 rounded-xl border border-veldrand bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-merk"
        />
        <button
          type="submit"
          disabled={bezig || !adres.trim()}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          Beheerder toevoegen
        </button>
      </form>

      {melding && (
        <p
          role={melding.soort === "fout" ? "alert" : "status"}
          className={`mt-3 text-xs font-semibold ${melding.soort === "ok" ? "text-emerald-800" : "text-rose-800"}`}
        >
          {melding.tekst}
        </p>
      )}
    </Kaart>
  );
}

/** Wat er in de gedeelde bibliotheek staat, in een paar cijfers. */
export function Gebruik() {
  const { oefeningen, orgMappen, laden } = useMateriaal();

  const cijfers = useMemo(() => {
    const gedeeld = oefeningen.filter((ex) => ex.visibility === "organisatie");
    const makers = new Set(gedeeld.map((ex) => ex.creatorId ?? ex.creatorName));
    const perWerkvorm = new Map<string, number>();
    for (const ex of gedeeld) {
      const label = WERKVORMEN[ex.type].label;
      perWerkvorm.set(label, (perWerkvorm.get(label) ?? 0) + 1);
    }
    const inMap = new Set(orgMappen.flatMap((m) => m.exerciseIds));
    return {
      gedeeld: gedeeld.length,
      makers: makers.size,
      zonderVak: gedeeld.filter((ex) => !ex.vak).length,
      zonderMap: gedeeld.filter((ex) => !inMap.has(ex.id)).length,
      perWerkvorm: [...perWerkvorm.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [oefeningen, orgMappen]);

  if (laden) return null;
  const hoogste = cijfers.perWerkvorm[0]?.[1] ?? 1;

  return (
    <Kaart
      icon={BarChart3}
      titel="Gedeeld materiaal in cijfers"
      uitleg="Wat leraren met de hele school deelden. Privé materiaal telt niet mee: dat ziet alleen de maker."
    >
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "oefeningen gedeeld", waarde: cijfers.gedeeld },
          { label: "leraren die deelden", waarde: cijfers.makers },
          { label: "zonder vak", waarde: cijfers.zonderVak },
          { label: "in geen organisatiemap", waarde: cijfers.zonderMap },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 px-3 py-2.5">
            <dd className="text-xl font-extrabold text-merk-900 tabular-nums">{c.waarde}</dd>
            <dt className="text-xs text-slate-600">{c.label}</dt>
          </div>
        ))}
      </dl>

      {cijfers.perWerkvorm.length > 0 && (
        <ul className="space-y-2">
          {cijfers.perWerkvorm.map(([label, aantal]) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-slate-800">{label}</span>
              <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-merk-800"
                  style={{ width: `${Math.max(2, Math.round((aantal / hoogste) * 100))}%` }}
                />
              </span>
              <span className="w-10 text-right text-xs font-bold text-slate-600 tabular-nums">{aantal}</span>
            </li>
          ))}
        </ul>
      )}
    </Kaart>
  );
}
