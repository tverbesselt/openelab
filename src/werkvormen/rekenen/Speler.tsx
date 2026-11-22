"use client";

import { RekenPlayer } from "@/components/players/RekenPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"rekenen">) {
  return (
    <RekenPlayer opdracht={oefening.content.rekenopdracht} />
  );
}
