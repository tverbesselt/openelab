"use client";

import type { AfdrukProps, LeraarProps, SpelerProps } from "./soorten";
import type { ExerciseType } from "@/lib/types";
import { werkvormVan } from "./register";

/*
 * De schermen van een werkvorm, gekozen uit het register. De pagina's weten niet welke
 * werkvormen er bestaan: ze geven de oefening door en krijgen het juiste scherm terug.
 * Een werkvorm zonder dat scherm (een klastool heeft geen speler) toont niets.
 */

/** De speler op de oefenpagina. */
export function WerkvormSpeler(props: SpelerProps<ExerciseType>) {
  const Speler = werkvormVan(props.oefening).Speler;
  return Speler ? <Speler {...props} /> : null;
}

/** Het werkblad op de afdrukpagina. */
export function WerkvormAfdruk(props: AfdrukProps<ExerciseType>) {
  const Afdruk = werkvormVan(props.oefening).Afdruk;
  return Afdruk ? <Afdruk {...props} /> : null;
}

/** Wat alleen de maker onder de speler ziet. */
export function WerkvormLeraar(props: LeraarProps<ExerciseType>) {
  const Leraar = werkvormVan(props.oefening).Leraar;
  return Leraar ? <Leraar {...props} /> : null;
}
