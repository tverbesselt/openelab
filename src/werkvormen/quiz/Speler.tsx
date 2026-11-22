"use client";

import { QuizPlayer } from "@/components/players/QuizPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening, onQuizKlaar }: SpelerProps<"quiz">) {
  return (
    <QuizPlayer
      questions={oefening.content.questions}
      didacticConfig={oefening.didacticConfig}
      onKlaar={onQuizKlaar}
    />
  );
}
