"use client";

import React from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { tipVanDeDag, type TipPlek } from "@/lib/studietips";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";

/*
 * Eén studeertip op een scherm, in dezelfde vorm als de infobanner in de bibliotheek.
 * Ofwel roterend per dag (geef een plek), ofwel vast (geef een tekst).
 */

interface Props {
  /** Roterende tip: elke dag een andere uit de lijst voor dit scherm. */
  plek?: TipPlek;
  /** Vaste tip, voor een moment dat maar één zin verdraagt. */
  tekst?: React.ReactNode;
  /**
   * Voor wie een vaste tip bedoeld is. Een roterende tip weet dat zelf; een vaste tip is
   * standaard voor de cursist. De beheerder zet beide soorten apart aan of uit.
   */
  voor?: "cursist" | "leraar";
  /** Kort label vooraan, bijvoorbeeld "Zeg erbij". */
  kop?: string;
  /** Link naar de overzichtspagina met alle tips. */
  meer?: boolean;
  /**
   * Banner: turkoois, voor een pagina. Toelichting: grijs, voor in een formulier naast de
   * andere uitlegkaders.
   */
  toon?: "banner" | "toelichting";
  className?: string;
}

export function Studietip({ plek, tekst, voor, kop, meer, toon = "banner", className = "" }: Props) {
  const { instellingen } = useInstellingen();
  const tip = plek ? tipVanDeDag(plek) : null;
  const doelgroep = voor ?? tip?.voor ?? "cursist";
  const aan = doelgroep === "leraar" ? instellingen.tips.leraren : instellingen.tips.cursisten;
  // "Meer tips" wijst naar Slim oefenen, en die pagina hoort bij de tips voor cursisten.
  const toonMeer = meer && instellingen.tips.cursisten;
  const inhoud = tekst ?? tip?.tekst;
  const label = kop ?? tip?.kop;

  if (!inhoud || !aan) return null;

  const stijl =
    toon === "banner"
      ? "text-merk-900 bg-merk-50 border border-merk/20"
      : "text-slate-600 bg-slate-50";

  return (
    <p className={`text-xs ${stijl} rounded-xl px-4 py-3 flex items-start gap-2 ${className}`}>
      <Lightbulb className="w-4 h-4 shrink-0 mt-px" aria-hidden />
      <span>
        {label && <strong>{label}: </strong>}
        {inhoud}
        {toonMeer && (
          <>
            {" "}
            <Link href="/slim-oefenen" className="font-bold hover:underline whitespace-nowrap">
              Meer tips
            </Link>
          </>
        )}
      </span>
    </p>
  );
}
