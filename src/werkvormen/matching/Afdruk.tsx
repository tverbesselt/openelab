import { hussel } from "@/lib/hussel";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"matching">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-1">Verbind wat bij elkaar hoort</h2>
      <p className="text-sm mb-5">Trek een lijn van links naar rechts.</p>
      <div className="grid grid-cols-2 gap-x-10 gap-y-3">
        <ol className="space-y-3 list-decimal pl-5">
          {oefening.content.matchingPairs.map((paar) => (
            <li key={paar.id} className="text-sm">
              {paar.left}
              {metAntwoorden && <strong> — {paar.right}</strong>}
            </li>
          ))}
        </ol>
        {!metAntwoorden && (
          <ul className="space-y-3">
            {hussel(oefening.content.matchingPairs).map((paar) => (
              <li key={paar.id} className="text-sm">
                {paar.right}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
