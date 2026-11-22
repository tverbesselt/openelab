import { Dices } from "lucide-react";
import type { Werkvorm } from "../soorten";

export const randomizer: Werkvorm<"randomizer"> = {
  id: "randomizer",
  label: "Naamkiezer",
  uitleg: "Kies willekeurig een cursist, zodat iedereen aan bod komt.",
  icon: Dices,
  waar: "klas",
  eenheid: ["tool", "tools"],
  lesfase: "facilitate",
  secondenPerItem: 0,
  aantal: () => 0,
};
