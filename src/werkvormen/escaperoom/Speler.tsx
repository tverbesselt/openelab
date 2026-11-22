"use client";

import { EscaperoomPlayer } from "@/components/players/EscaperoomPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"escaperoom">) {
  return (
    <EscaperoomPlayer escaperoom={oefening.content.escaperoom} />
  );
}
