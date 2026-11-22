"use client";

import { OrdenenPlayer } from "@/components/players/OrdenenPlayer";
import type { SpelerProps } from "../soorten";

/** Zinnen bouwen en stappen op volgorde: dezelfde speler, een andere weergave. */
export default function OrdenenSpeler({ oefening }: SpelerProps<"zinbouwen" | "volgorde">) {
  return (
    <OrdenenPlayer
      items={oefening.content.ordenItems}
      didacticConfig={oefening.didacticConfig}
      weergave={oefening.type === "zinbouwen" ? "zin" : "stappen"}
    />
  );
}
