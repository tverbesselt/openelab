import { Melding } from "@/components/Melding";

export const metadata = { title: "Pagina niet gevonden — Open E-lab" };

/** Een adres dat nergens naartoe leidt. */
export default function NietGevonden() {
  return (
    <Melding titel="Deze pagina bestaat niet">
      Het adres klopt niet of de pagina is verhuisd. Heb je een code van je leraar? Vul ze in op
      de startpagina.
    </Melding>
  );
}
