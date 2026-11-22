"use client";

import React from "react";
import Link from "next/link";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import type { FunctieId } from "@/lib/instellingen/functies";

/** Getoond wanneer iemand een werkvorm of functie opent die de beheerder uitzette. */
export function Uitgeschakeld() {
  return (
    <div className="max-w-sm mx-auto text-center py-20 u-fade">
      <h1 className="text-xl font-extrabold text-merk-900 mb-2">Niet beschikbaar</h1>
      <p className="text-sm text-slate-600 mb-5">
        Deze werkvorm of functie staat uit in Open E-lab. Bestaand materiaal blijft bewaard en is
        terug zodra een beheerder ze weer aanzet.
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

/**
 * Toont de pagina alleen als de functie aan staat. Een aparte laag rond de pagina, zodat de
 * pagina zelf haar hooks altijd in dezelfde volgorde blijft aanroepen.
 */
export function FunctiePoort({
  functie,
  tips,
  children,
}: {
  functie?: FunctieId;
  /** In plaats van een functie: alleen tonen als deze soort tips aan staat. */
  tips?: "cursisten" | "leraren";
  children: React.ReactNode;
}) {
  const { isAan, instellingen } = useInstellingen();
  const aan = (functie ? isAan(functie) : true) && (tips ? instellingen.tips[tips] : true);
  return aan ? <>{children}</> : <Uitgeschakeld />;
}
