import { Schrijfruimte } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening }: AfdrukProps<"exitticket">) {
  return (
    <section>
      <h2 className="text-base font-bold mb-4">Nog even terugblikken</h2>
      <ol className="space-y-8 list-decimal pl-5">
        {oefening.content.exitTicketPrompts.map((vraag, i) => (
          <li key={i} className="afdruk-blad">
            <p className="font-bold">{vraag}</p>
            <Schrijfruimte regels={3} />
          </li>
        ))}
      </ol>
    </section>
  );
}
