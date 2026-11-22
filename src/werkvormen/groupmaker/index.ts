import { Users } from "lucide-react";
import type { Werkvorm } from "../soorten";

export const groupmaker: Werkvorm<"groupmaker"> = {
  id: "groupmaker",
  label: "Groepenmaker",
  uitleg: "Verdeel de klas in evenwichtige groepjes.",
  icon: Users,
  waar: "klas",
  eenheid: ["tool", "tools"],
  lesfase: "facilitate",
  secondenPerItem: 0,
  aantal: () => 0,
};
