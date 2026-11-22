import React from "react";

/*
 * Bouwstenen voor een werkblad. Opmaak volgens een heldere schrijfstijl:
 * links uitgelijnd, geen cursief, en invullen op lijntjes in plaats van puntjes.
 */

/** Een invullijn waarop met de hand geschreven wordt. */
export function Lijn({ breedte = "10rem" }: { breedte?: string }) {
  return (
    <span
      className="inline-block border-b border-black align-baseline mx-1"
      style={{ width: breedte, height: "1.1em" }}
    />
  );
}

export function Schrijfruimte({ regels = 3 }: { regels?: number }) {
  return (
    <div className="mt-2 space-y-5">
      {Array.from({ length: regels }, (_, i) => (
        <div key={i} className="border-b border-black" />
      ))}
    </div>
  );
}

/** Kaartjes om uit te knippen: de vraag vooraan, het antwoord achteraan. */
export function Knipblad({ kaarten }: { kaarten: { id: string; voor: string; achter: string }[] }) {
  return (
    <section>
      <h2 className="text-base font-bold mb-1">Knip de kaartjes uit</h2>
      <p className="text-sm mb-5">
        Vouw elk kaartje in twee, zodat de vraag vooraan staat en het antwoord achteraan.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {kaarten.map((kaart) => (
          <div key={kaart.id} className="afdruk-blad border border-black rounded">
            <div className="p-3 min-h-16 flex items-center justify-center text-center font-bold">
              {kaart.voor}
            </div>
            <div className="p-3 min-h-16 flex items-center justify-center text-center border-t border-dashed border-black text-sm">
              {kaart.achter}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
