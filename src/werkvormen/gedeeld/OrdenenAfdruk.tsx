import { hussel } from "@/lib/hussel";
import type { AfdrukProps } from "../soorten";

/** Zinnen bouwen en stappen op volgorde, op papier. */
export default function OrdenenAfdruk({
  oefening,
  metAntwoorden,
}: AfdrukProps<"zinbouwen" | "volgorde">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">
        {oefening.type === "zinbouwen"
          ? "Zet de woorden in de juiste volgorde"
          : "Nummer de stappen in de juiste volgorde"}
      </h2>
      <ol className="space-y-6 list-decimal pl-5">
        {oefening.content.ordenItems.map((item) => (
          <li key={item.id} className="afdruk-blad">
            {item.opdracht && <p className="font-bold mb-1">{item.opdracht}</p>}

            {oefening.type === "zinbouwen" ? (
              <>
                <p className="text-sm">{hussel(item.delen).join(" · ")}</p>
                {metAntwoorden ? (
                  <p className="text-sm mt-1">
                    <strong>{item.delen.join(" ")}</strong>
                  </p>
                ) : (
                  <div className="border-b border-black mt-4" />
                )}
              </>
            ) : (
              <ul className="mt-2 space-y-2">
                {(metAntwoorden ? item.delen : hussel(item.delen)).map((stap, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="inline-block w-7 h-7 border border-black text-center leading-7 shrink-0">
                      {metAntwoorden ? i + 1 : ""}
                    </span>
                    <span>{stap}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
