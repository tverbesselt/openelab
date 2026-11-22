"use client";

import { SorteerPlayer } from "@/components/players/SorteerPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"sorteren">) {
  return (
    <SorteerPlayer
      categorieen={oefening.content.categorieen}
      items={oefening.content.sorteerItems}
    />
  );
}
