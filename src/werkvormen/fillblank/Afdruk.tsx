import { ontleedInvulzin } from "@/lib/invulzin";
import { Lijn } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"fillblank">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">Vul de ontbrekende woorden aan</h2>
      <ol className="space-y-5 list-decimal pl-5">
        {oefening.content.fillBlanks.map((zin) => (
          <li key={zin.id} className="afdruk-blad">
            {ontleedInvulzin(zin.textWithBlanks).map((stuk, i) =>
              stuk.soort === "tekst" ? (
                <span key={i}>{stuk.waarde}</span>
              ) : metAntwoorden ? (
                <strong key={i} className="underline"> {stuk.antwoorden[0]} </strong>
              ) : (
                <Lijn key={i} breedte="7rem" />
              )
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
