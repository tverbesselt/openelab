"use client";

import { WerkwoordPlayer } from "@/components/players/WerkwoordPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"werkwoorden">) {
  return (
    <WerkwoordPlayer items={oefening.content.werkwoorden} didacticConfig={oefening.didacticConfig} />
  );
}
