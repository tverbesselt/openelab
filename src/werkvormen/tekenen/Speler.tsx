"use client";

import { TekenenPlayer } from "@/components/players/TekenenPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"tekenen">) {
  return (
    <TekenenPlayer oefeningId={oefening.id} opdrachten={oefening.content.tekenopdrachten} />
  );
}
