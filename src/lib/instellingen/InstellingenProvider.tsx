"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseConfigured, getDb } from "@/lib/firebase/client";
import { normaliseer, STANDAARD_INSTELLINGEN, type Instellingen } from "./types";
import { HANGT_AF_VAN, type FunctieId } from "./functies";
import { maakPalet, paletVariabelen, pasPaletToe } from "./kleur";
import { THEMA_SLEUTEL } from "./themaScript";

/*
 * De instellingen voor de hele app: naam, logo, kleurschema, werkvormen, tips en toegang.
 *
 * Met Firebase staan ze in Firestore (instellingen/app), zodat iedereen dezelfde app ziet.
 * Zonder Firebase, in demomodus, blijven ze in deze browser bewaard.
 */

const LOKAAL = "openelab_instellingen";
const CACHE = "openelab_instellingen_cache";

function uitCache(): Instellingen | null {
  try {
    const bewaard = localStorage.getItem(firebaseConfigured ? CACHE : LOKAAL);
    return bewaard ? normaliseer(JSON.parse(bewaard)) : null;
  } catch {
    return null;
  }
}

function naarCache(i: Instellingen) {
  try {
    localStorage.setItem(firebaseConfigured ? CACHE : LOKAAL, JSON.stringify(i));
  } catch {
    // Vol of geblokkeerd: dan laden we de volgende keer gewoon opnieuw.
  }
}

async function laadInstellingen(): Promise<Instellingen> {
  if (!firebaseConfigured) return uitCache() ?? STANDAARD_INSTELLINGEN;
  const snap = await getDoc(doc(getDb(), "instellingen", "app"));
  const i = snap.exists() ? normaliseer(snap.data()) : STANDAARD_INSTELLINGEN;
  naarCache(i);
  return i;
}

export async function bewaarInstellingen(i: Instellingen): Promise<void> {
  const schoon = normaliseer(i);
  if (firebaseConfigured) await setDoc(doc(getDb(), "instellingen", "app"), schoon);
  naarCache(schoon);
}

/** Staat deze functie aan in deze instellingen? */
export function functieAan(functie: FunctieId, i: Instellingen): boolean {
  if (i.uit.includes(functie)) return false;
  const nodig = HANGT_AF_VAN[functie];
  return nodig ? functieAan(nodig, i) : true;
}

interface InstellingenContext {
  instellingen: Instellingen;
  /** True zodra de verse instellingen geladen zijn (of het laden mislukte). */
  geladen: boolean;
  isAan: (functie: FunctieId) => boolean;
  /** Na bewaren in het beheer: meteen overal toepassen. */
  vervang: (nieuw: Instellingen) => void;
}

const Ctx = createContext<InstellingenContext | null>(null);

function pasHuisstijlToe(i: Instellingen) {
  const palet = maakPalet(i.kleur);
  pasPaletToe(palet);
  try {
    localStorage.setItem(THEMA_SLEUTEL, JSON.stringify(paletVariabelen(palet)));
  } catch {
    // Niet erg: de volgende keer verschijnt de kleur een fractie later.
  }
  document.title = i.naam;
  zetFavicon(i.logo);
}

function zetFavicon(logo: string | null) {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon'][data-app]");
  if (!logo) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.dataset.app = "1";
    document.head.appendChild(link);
  }
  link.href = logo;
}

export function InstellingenProvider({ children }: { children: React.ReactNode }) {
  const [instellingen, setInstellingen] = useState<Instellingen>(STANDAARD_INSTELLINGEN);
  const [geladen, setGeladen] = useState(false);

  const pasToe = useCallback((i: Instellingen) => {
    setInstellingen(i);
    pasHuisstijlToe(i);
  }, []);

  useEffect(() => {
    const cache = uitCache();
    if (cache) pasToe(cache);
    laadInstellingen()
      .then(pasToe)
      .catch((e) => {
        console.error("Instellingen laden mislukt", e);
        if (!cache) pasToe(STANDAARD_INSTELLINGEN);
      })
      .finally(() => setGeladen(true));
  }, [pasToe]);

  const vervang = useCallback((nieuw: Instellingen) => pasToe(normaliseer(nieuw)), [pasToe]);

  const waarde = useMemo<InstellingenContext>(
    () => ({
      instellingen,
      geladen,
      isAan: (f: FunctieId) => functieAan(f, instellingen),
      vervang,
    }),
    [instellingen, geladen, vervang]
  );

  return <Ctx.Provider value={waarde}>{children}</Ctx.Provider>;
}

export function useInstellingen(): InstellingenContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInstellingen moet binnen <InstellingenProvider> gebruikt worden.");
  return v;
}
