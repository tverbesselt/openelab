import dynamic from "next/dynamic";
import { PenLine } from "lucide-react";
import type { SpelerProps, AfdrukProps, Werkvorm } from "../soorten";

export const openvraag: Werkvorm<"openvraag"> = {
  id: "openvraag",
  label: "Open vraag",
  uitleg: "De cursist antwoordt in eigen woorden en vergelijkt daarna met jouw modelantwoord.",
  icon: PenLine,
  waar: "cursist",
  eenheid: ["vraag", "vragen"],
  lesfase: "check",
  secondenPerItem: 90,
  aantal: (inhoud) => inhoud.openVragen.length,
  opfris: (ex) =>
    ex.content.openVragen.map((vraag) => ({
      id: `${ex.id}-${vraag.id}`,
      vraag: vraag.vraag,
      antwoord: vraag.modelantwoord,
      bron: ex.title,
    })),
  maken: {
    titel: "Open vraag",
    uitleg: "In eigen woorden, met jouw modelantwoord ernaast",
    Vorm: dynamic(() => import("@/components/maken/NieuweVormen").then((m) => m.OpenVraagVorm)),
  },
  Speler: dynamic<SpelerProps<"openvraag">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"openvraag">>(() => import("./Afdruk")),
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
};
