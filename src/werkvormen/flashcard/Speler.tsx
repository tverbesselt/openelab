"use client";

import { FlashcardPlayer } from "@/components/players/FlashcardPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening, onBeoordeeld }: SpelerProps<"flashcard">) {
  return (
    <FlashcardPlayer
      cards={oefening.content.flashcards}
      didacticConfig={oefening.didacticConfig}
      onBeoordeeld={onBeoordeeld}
    />
  );
}
