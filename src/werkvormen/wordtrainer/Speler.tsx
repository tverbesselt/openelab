"use client";

import { WordTrainerPlayer } from "@/components/players/WordTrainerPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening, onBeoordeeld }: SpelerProps<"wordtrainer">) {
  return (
    <WordTrainerPlayer
      items={oefening.content.wordTrainerItems}
      title={oefening.title}
      didacticConfig={oefening.didacticConfig}
      onBeoordeeld={onBeoordeeld}
    />
  );
}
