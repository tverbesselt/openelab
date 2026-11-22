import dynamic from "next/dynamic";
import { CheckSquare } from "lucide-react";
import { opfrisUitVragen } from "./vragen";
import type { SpelerProps, AfdrukProps, LeraarProps, Werkvorm } from "../soorten";

export const quiz: Werkvorm<"quiz"> = {
  id: "quiz",
  label: "Eenvoudige quiz",
  uitleg:
    "Meerkeuzevragen op eigen tempo, met directe uitleg bij elk antwoord. Geen punten, wel feedback.",
  icon: CheckSquare,
  waar: "cursist",
  eenheid: ["vraag", "vragen"],
  lesfase: "check",
  secondenPerItem: 30,
  // Een dia is geen vraag.
  aantal: (inhoud) => inhoud.questions.filter((v) => v.type !== "dia").length,
  tip:
    "Herkennen is makkelijker dan herinneren. Lukt dit? Lees daarna alleen de vragen en geef het antwoord zonder de keuzes te zien: dat is wat je op een toets moet.",
  opfris: opfrisUitVragen,
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Eenvoudige quiz",
    uitleg: "Meerkeuze met uitleg bij elk antwoord, eventueel met foto, filmpje of audio",
    Vorm: dynamic(() => import("@/components/maken/QuizVorm").then((m) => m.QuizVorm)),
  },
  // Klassikaal heet de quiz een Quizwedstrijd, met een eigen schakelaar in Beheer.
  klassikaal: { parameter: "wedstrijd", functie: "wedstrijd" },
  Speler: dynamic<SpelerProps<"quiz">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"quiz">>(() => import("./VragenAfdruk")),
  Leraar: dynamic<LeraarProps<"quiz">>(() => import("./Overzicht")),
};
