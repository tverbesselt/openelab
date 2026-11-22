import {
  DidacticConfig,
  Exercise,
  FlashcardItem,
  QuizQuestion,
  MatchingPair,
  Zichtbaarheid,
} from "./types";
import { generateShortCode } from "./codes";

/**
 * Didactic Engine: Transformeert ruwe bron-inhoud (bijv. een woordenlijst)
 * automatisch in meerdere didactische oefenvormen (Single Source, Multiple Formats).
 */
export interface MateriaalOpties {
  /** Naam van de leraar, zoals cursisten die zien. */
  creatorName: string;
  /** Firebase-uid; hieraan hangt wie het materiaal mag wijzigen. */
  creatorId?: string;
  zichtbaarheid?: Zichtbaarheid;
  /** Taal van de voorleesknop, bijvoorbeeld "fr-FR". Leeg = Nederlands. */
  spraakTaal?: string;
}

export function generateExercisesFromWordList(
  title: string,
  wordItems: { word: string; translation: string; example?: string }[],
  opties: MateriaalOpties
): { flashcardExercise: Exercise; matchingExercise: Exercise; quizExercise: Exercise } {
  const { creatorName, creatorId, zichtbaarheid = "prive", spraakTaal } = opties;
  const config: DidacticConfig = {
    showImmediateFeedback: true,
    allowRetryMissed: true,
    enableGamification: false,
    spraakTaal,
  };
  const flashcards: FlashcardItem[] = wordItems.map((item, index) => ({
    id: `fc-${index}`,
    front: item.word,
    back: item.translation,
    exampleSentence: item.example,
  }));

  const matchingPairs: MatchingPair[] = wordItems.map((item, index) => ({
    id: `mp-${index}`,
    left: item.word,
    right: item.translation,
  }));

  const questions: QuizQuestion[] = wordItems.map((item, index) => {
    // Genereer 3 afleiders uit de overige vertalingen
    const otherTranslations = wordItems
      .filter((_, idx) => idx !== index)
      .map((i) => i.translation);
    const shuffledDistractors = otherTranslations.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [item.translation, ...shuffledDistractors].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(item.translation);

    return {
      id: `qz-${index}`,
      question: `Wat is de betekenis of vertaling van: "${item.word}"?`,
      options,
      correctAnswers: [correctIndex],
      type: "multiple_choice",
      explanation: `"${item.word}" betekent "${item.translation}".`,
    };
  });

  // Elke werkvorm zijn eigen code van zes tekens: dat is wat de cursist kan intypen.

  const flashcardExercise: Exercise = {
    id: `auto-fc-${Date.now()}`,
    title: `${title} — Flashcards`,
    description: `Actieve ophaalpraktijk (Retrieval Practice) voor ${title}.`,
    category: "language",
    didacticGoal: "automate",
    type: "flashcard",
    creatorName,
    creatorId,
    visibility: zichtbaarheid,
    shareCode: generateShortCode(),
    tags: ["Woordenschat", title],
    content: { flashcards },
    didacticConfig: config,
    createdAt: new Date().toISOString().split("T")[0],
  };

  const matchingExercise: Exercise = {
    id: `auto-mp-${Date.now()}`,
    title: `${title} — Matching & Memory`,
    description: `Koppel de begrippen aan de juiste betekenis.`,
    category: "practice",
    didacticGoal: "automate",
    type: "matching",
    creatorName,
    creatorId,
    visibility: zichtbaarheid,
    shareCode: generateShortCode(),
    tags: ["Matching", title],
    content: { matchingPairs },
    didacticConfig: config,
    createdAt: new Date().toISOString().split("T")[0],
  };

  const quizExercise: Exercise = {
    id: `auto-qz-${Date.now()}`,
    title: `${title} — Kennischeck Quiz`,
    description: `Meerkeuzevragen ter evaluatie van de kennis.`,
    category: "quiz",
    didacticGoal: "check",
    type: "quiz",
    creatorName,
    creatorId,
    visibility: zichtbaarheid,
    shareCode: generateShortCode(),
    tags: ["Quiz", title],
    content: { questions },
    didacticConfig: config,
    createdAt: new Date().toISOString().split("T")[0],
  };

  return { flashcardExercise, matchingExercise, quizExercise };
}
