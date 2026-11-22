import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening, metAntwoorden }: AfdrukProps<"tekenen">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-1">Teken uit je geheugen</h2>
      <p className="text-sm mb-5">
        {metAntwoorden
          ? "De originelen, om je tekeningen mee te vergelijken."
          : "Teken in elk kader wat je je herinnert. Niet opzoeken: vergelijken doe je achteraf."}
      </p>
      <ol className="grid grid-cols-2 gap-6 list-none">
        {oefening.content.tekenopdrachten.map((o, i) => (
          <li key={o.id} className="afdruk-blad text-sm">
            <p className="font-bold mb-2">
              {i + 1}. {o.naam}
            </p>
            {metAntwoorden ? (

              <img src={o.beeld.url} alt={o.beeld.alt ?? o.naam} className="w-full aspect-[4/3] object-contain border border-black" />
            ) : (
              <div className="w-full aspect-[4/3] border border-black" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
