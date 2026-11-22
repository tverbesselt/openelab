"use client";

import React, { useEffect } from "react";
import { GeenVerbinding, Melding } from "@/components/Melding";
import { isVerbindingsfout } from "@/lib/foutSoort";

/** Vangt een fout in een pagina op; de kop en de voet van de site blijven staan. */
export default function Fout({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Fout in een pagina", error);
  }, [error]);

  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  if (isVerbindingsfout(error, online)) return <GeenVerbinding />;

  return (
    <Melding titel="Er ging iets mis" opnieuw={reset}>
      Dat ligt aan Open E-lab, niet aan jou. Probeer het opnieuw. Lukt het nog niet, ga dan terug
      naar start.
    </Melding>
  );
}
