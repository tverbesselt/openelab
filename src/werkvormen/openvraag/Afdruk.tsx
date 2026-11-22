import { Schrijfruimte } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"openvraag">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">Beantwoord in je eigen woorden</h2>
      <ol className="space-y-8 list-decimal pl-5">
        {oefening.content.openVragen.map((vraag) => (
          <li key={vraag.id} className="afdruk-blad">
            <p className="font-bold">{vraag.vraag}</p>
            {metAntwoorden ? (
              <p className="text-sm mt-2">Modelantwoord: {vraag.modelantwoord}</p>
            ) : (
              <Schrijfruimte regels={4} />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
