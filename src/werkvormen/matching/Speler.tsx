"use client";

import { MatchingPlayer } from "@/components/players/MatchingPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"matching">) {
  return (
    <MatchingPlayer pairs={oefening.content.matchingPairs} />
  );
}
