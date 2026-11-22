"use client";

import { useMemo } from "react";
import { maakRonde, toonAntwoord } from "@/lib/rekenen";
import { Lijn } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"rekenen">) {
  // De opgaven worden gegenereerd; voor een werkblad zetten we ze één keer vast.
  const { soort, aantal } = oefening.content.rekenopdracht;
  const rekenronde = useMemo(() => maakRonde(soort, aantal), [soort, aantal]);

  return (
    <section>
      <h2 className="text-base font-bold mb-1">Reken uit</h2>
      <p className="text-sm mb-5">
        Elke afdruk geeft nieuwe getallen. Druk gerust nog eens af voor een tweede reeks.
      </p>
      <ol className="space-y-5 list-decimal pl-5">
        {rekenronde.map((opgave) => (
          <li key={opgave.id} className="afdruk-blad text-sm">
            <p>{opgave.vraag}</p>
            {metAntwoorden ? (
              <p className="mt-1">
                <strong>{toonAntwoord(opgave)}</strong> — {opgave.uitleg}
              </p>
            ) : (
              <p className="mt-2">
                Antwoord: <Lijn breedte="9rem" />
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
