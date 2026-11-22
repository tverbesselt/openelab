import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"quiz" | "lezen">) {
  return (
    <section className="space-y-6">
      {oefening.type === "lezen" && oefening.content.leestekst && (
        <div className="afdruk-blad mb-8">
          <h2 className="text-base font-bold mb-2">De tekst</h2>
          <div className="space-y-2 text-sm">
            {oefening.content.leestekst
              .split(/\n\s*\n|\n/)
              .map((r) => r.trim())
              .filter(Boolean)
              .map((alinea, i) => (
                <p key={i}>{alinea}</p>
              ))}
          </div>
        </div>
      )}

      <h2 className="text-base font-bold">De vragen</h2>
      <ol className="space-y-5 list-decimal pl-5">
        {oefening.content.questions.map((vraag) => (
          <li key={vraag.id} className="afdruk-blad">
            {vraag.media?.soort === "afbeelding" && (

              <img
                src={vraag.media.url}
                alt={vraag.media.alt ?? ""}
                className="block max-h-56 max-w-full w-auto mb-2 border border-black"
              />
            )}
            {vraag.media?.soort === "afbeelding" && vraag.media.bron && (
              <p className="text-[9px] -mt-1.5 mb-2">
                Beeld{vraag.media.bron.maker ? ` van ${vraag.media.bron.maker}` : ""} · {vraag.media.bron.licentie}
                {vraag.media.bron.pagina ? ` · ${vraag.media.bron.pagina}` : ""}
              </p>
            )}
            {(vraag.media?.soort === "video" || vraag.media?.soort === "audio") && (
              <p className="text-xs italic mb-1">
                Bij deze vraag hoort {vraag.media.soort === "video" ? "een filmpje" : "een audiofragment"}.
                Dat bekijk of beluister je online.
              </p>
            )}
            <p className="font-bold">{vraag.question}</p>
            {vraag.type === "dia" ? (
              vraag.explanation && <p className="mt-1 text-sm whitespace-pre-line">{vraag.explanation}</p>
            ) : vraag.type === "volgorde" ? (
              <div className="mt-2 text-sm">
                {metAntwoorden ? (
                  <p>
                    Juiste volgorde: <strong>{vraag.options.join(" → ")}</strong>
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {[...vraag.options].sort((a, b) => a.localeCompare(b, "nl")).map((deel, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="inline-block w-6 h-5 border border-black shrink-0" aria-hidden />
                        <span>{deel}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : vraag.type === "typ" ? (
              <div className="mt-2 text-sm">
                {metAntwoorden ? (
                  <p>
                    Antwoord: <strong>{(vraag.antwoorden ?? [])[0]}</strong>
                  </p>
                ) : (
                  <p className="border-b border-black h-6" aria-hidden />
                )}
              </div>
            ) : (
            <ul className="mt-2 space-y-1.5">
              {vraag.options.map((optie, i) => {
                const isJuist = vraag.correctAnswers.includes(i);
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="inline-block w-4 h-4 border border-black shrink-0 mt-0.5 text-center leading-none text-xs">
                      {metAntwoorden && isJuist ? "×" : ""}
                    </span>
                    <span className={metAntwoorden && isJuist ? "font-bold" : ""}>{optie}</span>
                  </li>
                );
              })}
            </ul>
            )}
            {metAntwoorden && vraag.type !== "dia" && vraag.explanation && (
              <p className="text-sm mt-2">Uitleg: {vraag.explanation}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
