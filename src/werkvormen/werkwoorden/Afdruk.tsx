import { Lijn } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"werkwoorden">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">Vervoeg de werkwoorden</h2>
      <div className="space-y-6">
        {oefening.content.werkwoorden.map((werkwoord) => (
          <div key={werkwoord.id} className="afdruk-blad">
            <p className="font-bold mb-2">{werkwoord.infinitief}</p>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
              {werkwoord.vormen.map((vorm, i) => (
                <li key={i} className="text-sm">
                  {vorm.persoon}{" "}
                  {metAntwoorden ? <strong>{vorm.vorm}</strong> : <Lijn breedte="6rem" />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
