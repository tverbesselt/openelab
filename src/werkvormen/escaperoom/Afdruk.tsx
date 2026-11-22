import { Lijn } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"escaperoom">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-1">Open de sloten</h2>
      <p className="text-sm mb-5">
        Los de opdrachten op in volgorde. Schrijf bij elk slot het antwoord dat het opent.
      </p>
      {oefening.content.escaperoom.verhaal && (
        <p className="text-sm mb-6 whitespace-pre-line">{oefening.content.escaperoom.verhaal}</p>
      )}
      <ol className="space-y-6 list-decimal pl-5">
        {oefening.content.escaperoom.sloten.map((slot) => (
          <li key={slot.id} className="afdruk-blad text-sm">
            <p className="font-bold whitespace-pre-line">{slot.opdracht}</p>
            {slot.media?.soort === "afbeelding" && (

              <img
                src={slot.media.url}
                alt={slot.media.alt ?? ""}
                className="mt-2 max-h-48 w-auto"
              />
            )}
            {slot.media && slot.media.soort !== "afbeelding" && (
              <p className="mt-1">Bij deze opdracht hoort een fragment: open ze online.</p>
            )}
            {slot.hint && !metAntwoorden && <p className="mt-1">Hint: {slot.hint}</p>}
            {metAntwoorden ? (
              <p className="mt-2">
                <strong>{slot.antwoorden.join(" / ")}</strong>
              </p>
            ) : (
              <p className="mt-2">
                Antwoord: <Lijn breedte="12rem" />
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
