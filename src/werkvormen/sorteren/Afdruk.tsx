import { hussel } from "@/lib/hussel";
import { Lijn } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"sorteren">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-1">Sorteer de woorden</h2>
      <p className="text-sm mb-5">
        Schrijf achter elk woord in welk bakje het hoort:{" "}
        {oefening.content.categorieen.map((naam, i) => `${i + 1} = ${naam}`).join(", ")}.
      </p>
      <ol className="grid grid-cols-2 gap-x-8 gap-y-3 list-decimal pl-5">
        {hussel(oefening.content.sorteerItems).map((item) => (
          <li key={item.id} className="text-sm">
            {item.tekst}
            {metAntwoorden ? (
              <strong> — {oefening.content.categorieen[item.categorie]}</strong>
            ) : (
              <Lijn breedte="3rem" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
