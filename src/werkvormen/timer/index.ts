import { Clock } from "lucide-react";
import type { Werkvorm } from "../soorten";

export const timer: Werkvorm<"timer"> = {
  id: "timer",
  label: "Klastimer",
  uitleg: "Zichtbare aftelklok voor een opdracht of pauze.",
  icon: Clock,
  waar: "klas",
  eenheid: ["tool", "tools"],
  lesfase: "facilitate",
  secondenPerItem: 0,
  aantal: () => 0,
};
