"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { opslag } from "@/lib/opslag";
import { EvenGeduld, GeenVerbinding, Melding } from "@/components/Melding";

/** Korte link uit het deelvenster: /code/MARKT1 opent meteen de juiste oefening. */
export default function CodePagina() {
  const params = useParams();
  const router = useRouter();
  const [toestand, setToestand] = useState<"zoekt" | "niet-gevonden" | "fout">("zoekt");

  const code = String(params.code ?? "").toUpperCase();

  useEffect(() => {
    let actief = true;
    // Een code hoort bij één oefening of bij een hele map.
    opslag
      .viaCode(code)
      .then((doel) => {
        if (!actief) return;
        if (doel?.soort === "oefening") router.replace(`/oefen/${doel.id}`);
        else if (doel?.soort === "map") router.replace(`/mappen/${doel.id}`);
        else setToestand("niet-gevonden");
      })
      .catch(() => actief && setToestand("fout"));
    return () => {
      actief = false;
    };
  }, [code, router]);

  if (toestand === "zoekt") return <EvenGeduld />;
  if (toestand === "fout") return <GeenVerbinding />;

  return (
    <Melding titel="Deze code bestaat niet">
      We vinden niets met code <strong className="font-mono">{code}</strong>. Kijk de code na of
      vraag ze opnieuw aan je leraar.
    </Melding>
  );
}
