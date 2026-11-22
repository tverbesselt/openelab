"use client";

import type { ProjectieProps } from "./Projectiescherm";
import { Projectiekader } from "./Projectiekader";
import { Stembalken } from "./Stembalken";
import { useLiveSessie } from "./useLiveSessie";

/** Een live poll: de vraag met haar antwoorden, en per antwoord een balk. */
export default function PollProjectie({ sessie: begin, onStop }: ProjectieProps) {
  const lopend = useLiveSessie(begin, onStop);
  const { sessie, antwoorden, stemmen } = lopend;

  return (
    <Projectiekader lopend={lopend}>
      <Stembalken opties={sessie.opties} stemmen={stemmen} totaal={antwoorden.length} />
    </Projectiekader>
  );
}
