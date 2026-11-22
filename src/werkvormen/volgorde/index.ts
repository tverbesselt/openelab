import dynamic from "next/dynamic";
import { ListOrdered } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const volgorde: Werkvorm<"volgorde"> = {
  id: "volgorde",
  label: "Stappen op volgorde",
  uitleg: "Losse stappen van een procedure, die de cursist in de juiste volgorde zet.",
  icon: ListOrdered,
  waar: "cursist",
  eenheid: ["procedure", "procedures"],
  lesfase: "automate",
  secondenPerItem: 60,
  aantal: (inhoud) => inhoud.ordenItems.length,
  opfris: (ex) =>
    ex.content.ordenItems.map((item) => ({
      id: `${ex.id}-${item.id}`,
      vraag: item.opdracht ?? "Zet deze stappen op volgorde",
      antwoord: item.delen.map((stap, i) => `${i + 1}. ${stap}`).join("  "),
      bron: ex.title,
    })),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Stappen op volgorde",
    uitleg: "Een procedure in de juiste volgorde zetten",
    Vorm: dynamic(() => import("@/components/maken/NieuweVormen").then((m) => m.VolgordeVorm)),
  },
  Speler: dynamic<SpelerProps<"volgorde">>(() => import("../gedeeld/OrdenenSpeler")),
  Afdruk: dynamic<AfdrukProps<"volgorde">>(() => import("../gedeeld/OrdenenAfdruk")),
};
