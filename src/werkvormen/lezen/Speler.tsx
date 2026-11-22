"use client";

import { LeesPlayer } from "@/components/players/LeesPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening, onQuizKlaar }: SpelerProps<"lezen">) {
  return (
    <LeesPlayer
      tekst={oefening.content.leestekst}
      vragen={oefening.content.questions}
      didacticConfig={oefening.didacticConfig}
      onKlaar={onQuizKlaar}
    />
  );
}
