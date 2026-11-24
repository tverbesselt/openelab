"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Opgehaald<T> {
  /** De gegevens, of undefined zolang ze er nog niet zijn. */
  data: T | undefined;
  laden: boolean;
  fout: boolean;
  /** Haal opnieuw op. */
  vernieuw: () => Promise<void>;
  /** Zet het resultaat van een eigen wijziging, zonder op te halen. */
  zet: (data: T) => void;
}

/**
 * Haalt gegevens op zodra het onderdeel verschijnt, en opnieuw als de sleutel verandert.
 * Met `null` als sleutel wacht het onderdeel: handig zolang nog niet bekend is wie er kijkt.
 */
export function useOpgehaald<T>(sleutel: string | null, haal: () => Promise<T>): Opgehaald<T> {
  const haalNu = useRef(haal);
  haalNu.current = haal;
  const [stand, setStand] = useState<{ sleutel: string | null; data?: T; fout: boolean; klaar: boolean }>({
    sleutel,
    fout: false,
    klaar: false,
  });

  const vernieuw = useCallback(async () => {
    if (!sleutel) return;
    try {
      const data = await haalNu.current();
      setStand({ sleutel, data, fout: false, klaar: true });
    } catch {
      setStand({ sleutel, fout: true, klaar: true });
    }
  }, [sleutel]);

  useEffect(() => {
    void vernieuw();
  }, [vernieuw]);

  const zet = useCallback((data: T) => setStand({ sleutel, data, fout: false, klaar: true }), [sleutel]);

  // Wat bij een vorige sleutel hoorde, tonen we niet meer.
  const vanNu = stand.sleutel === sleutel;
  return {
    data: vanNu ? stand.data : undefined,
    laden: sleutel === null || !vanNu || !stand.klaar,
    fout: vanNu && stand.fout,
    vernieuw,
    zet,
  };
}
