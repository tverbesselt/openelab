"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { WeergaveKnop } from "@/components/Weergave";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import { useAuth } from "@/lib/auth/AuthProvider";

export function Footer() {
  const { instellingen, isAan } = useInstellingen();
  const { isBeheerder } = useAuth();
  const klastools = isAan("timer") || isAan("randomizer") || isAan("groupmaker") || isAan("audiotekst");

  return (
    <footer className="niet-afdrukken mt-16 border-t border-slate-200 bg-white/60 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {instellingen.logo ? (
              <img
                src={instellingen.logo}
                alt={instellingen.organisatie || instellingen.naam}
                className="h-9 w-auto max-w-[10rem] object-contain"
              />
            ) : (
              <span className="w-8 h-8 rounded-xl bg-merk-800 text-white flex items-center justify-center shrink-0">
                <FlaskConical className="w-4 h-4" aria-hidden />
              </span>
            )}
            <div>
              <p className="font-bold text-sm text-merk-900">{instellingen.naam}</p>
              {instellingen.organisatie && (
                <p className="text-xs text-slate-500">{instellingen.organisatie}</p>
              )}
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
            <Link href="/bibliotheek" className="hover:text-merk-900">
              Bibliotheek
            </Link>
            <Link href="/maken" className="hover:text-merk-900">
              Nieuwe oefening
            </Link>
            {klastools && (
              <Link href="/klastools" className="hover:text-merk-900">
                Klastools
              </Link>
            )}
            <Link href="/live" className="hover:text-merk-900">
              Start in de klas
            </Link>
            {instellingen.tips.cursisten && (
              <Link href="/slim-oefenen" className="hover:text-merk-900">
                Slim oefenen
              </Link>
            )}
            {isBeheerder && (
              <Link href="/beheer" className="hover:text-merk-900">
                Beheer
              </Link>
            )}
            <WeergaveKnop />
          </nav>
        </div>

        <p className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            {instellingen.organisatie
              ? `${instellingen.naam} — ${instellingen.organisatie}`
              : `${instellingen.naam} — open-source digitale leeromgeving`}
          </span>
          <a
            href="https://github.com/tverbesselt/openelab"
            target="_blank"
            rel="noreferrer"
            className="hover:text-merk-900 underline"
          >
            Open E-lab op GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
