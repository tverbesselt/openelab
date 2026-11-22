"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { LiveSessie, LiveType } from "@/lib/types";

/** Wat de livepagina aan een projectiescherm meegeeft. */
export interface ProjectieProps {
  sessie: LiveSessie;
  /** De sessie is afgesloten: terug naar het keuzescherm. */
  onStop: () => void;
}

/**
 * De sessietypes die alleen een sessie nodig hebben om te projecteren. Quizwedstrijd,
 * whiteboard en Teken uit je geheugen hebben meer nodig (de quiz, de reeks) en kiest de
 * livepagina zelf.
 */
const PROJECTIES: Partial<Record<LiveType, ComponentType<ProjectieProps>>> = {
  poll: dynamic<ProjectieProps>(() => import("./PollProjectie")),
  wordcloud: dynamic<ProjectieProps>(() => import("./WoordwolkProjectie")),
  snellevraag: dynamic<ProjectieProps>(() => import("./SnelleVraagProjectie")),
  begripsmeter: dynamic<ProjectieProps>(() => import("./BegripsmeterProjectie")),
};

/** Het projectiescherm van een sessie, gekozen op haar type. */
export function Projectiescherm(props: ProjectieProps) {
  const Scherm = PROJECTIES[props.sessie.type];
  return Scherm ? <Scherm {...props} /> : null;
}
