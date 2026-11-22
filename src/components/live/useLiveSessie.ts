"use client";

import { useEffect, useMemo, useState } from "react";
import { opslag } from "@/lib/opslag";
import type { LiveAntwoord, LiveSessie } from "@/lib/types";

/** Wat elk projectiescherm van een lopende sessie nodig heeft. */
export interface LopendeSessie {
  sessie: LiveSessie;
  antwoorden: LiveAntwoord[];
  /** Het aantal stemmen per antwoordmogelijkheid, in de volgorde van `sessie.opties`. */
  stemmen: number[];
  fout: string;
  wijzig: (wijziging: Partial<LiveSessie>) => Promise<void>;
  /** Sluit de sessie af voor de toestellen en gaat terug naar het keuzescherm. */
  sluitAf: () => Promise<void>;
}

/**
 * Volgt een sessie en haar antwoorden zolang het projectiescherm open staat. De schermen
 * voor poll, woordwolk, snelle vraag en begripsmeter delen dit; ze verschillen alleen in
 * wat ze met de antwoorden tonen.
 */
export function useLiveSessie(begin: LiveSessie, onStop: () => void): LopendeSessie {
  const [sessie, setSessie] = useState<LiveSessie>(begin);
  const [antwoorden, setAntwoorden] = useState<LiveAntwoord[]>([]);
  const [fout, setFout] = useState("");

  useEffect(() => {
    const stopSessie = opslag.volgSessie(begin.code, (s) => s && setSessie(s));
    const stopAntwoorden = opslag.volgAntwoorden(begin.code, setAntwoorden);
    return () => {
      stopSessie();
      stopAntwoorden();
    };
  }, [begin.code]);

  const wijzig = async (wijziging: Partial<LiveSessie>) => {
    try {
      await opslag.wijzigSessie(sessie.code, wijziging);
      setSessie({ ...sessie, ...wijziging });
      setFout("");
    } catch {
      setFout("Dat is niet gelukt. Kijk je verbinding na en probeer opnieuw.");
    }
  };

  const sluitAf = async () => {
    await wijzig({ status: "afgesloten" });
    onStop();
  };

  const stemmen = useMemo(() => {
    const telling = new Array(sessie.opties.length).fill(0) as number[];
    for (const a of antwoorden) {
      if (typeof a.optie === "number" && a.optie >= 0 && a.optie < telling.length) telling[a.optie]++;
    }
    return telling;
  }, [antwoorden, sessie.opties.length]);

  return { sessie, antwoorden, stemmen, fout, wijzig, sluitAf };
}
