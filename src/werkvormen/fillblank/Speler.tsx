"use client";

import { FillBlankPlayer } from "@/components/players/FillBlankPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"fillblank">) {
  return (
    <FillBlankPlayer items={oefening.content.fillBlanks} didacticConfig={oefening.didacticConfig} />
  );
}
