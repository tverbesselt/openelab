"use client";

import type { ProjectieProps } from "./Projectiescherm";
import { Projectiekader } from "./Projectiekader";
import { Stembalken } from "./Stembalken";
import { useLiveSessie } from "./useLiveSessie";

/**
 * Een snelle vraag: de leraar stelt ze hardop, het bord toont A tot D. Achteraf duidt de
 * leraar aan wat juist was, zodat de bespreking meteen zichtbaar wordt op het bord.
 */
export default function SnelleVraagProjectie({ sessie: begin, onStop }: ProjectieProps) {
  const lopend = useLiveSessie(begin, onStop);
  const { sessie, antwoorden, stemmen, wijzig } = lopend;

  return (
    <Projectiekader
      lopend={lopend}
      voetnoot="Klik op een balk om aan te duiden welk antwoord juist was."
    >
      <Stembalken
        opties={sessie.opties}
        stemmen={stemmen}
        totaal={antwoorden.length}
        juisteOptie={sessie.juisteOptie}
        alsLetter
        onKies={(idx) => wijzig({ juisteOptie: sessie.juisteOptie === idx ? undefined : idx })}
      />
    </Projectiekader>
  );
}
