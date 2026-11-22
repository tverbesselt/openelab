import dynamic from "next/dynamic";
import { MessageSquareText } from "lucide-react";
import type { SpelerProps, AfdrukProps, LeraarProps, Werkvorm } from "../soorten";

export const exitticket: Werkvorm<"exitticket"> = {
  id: "exitticket",
  label: "Exit ticket",
  uitleg: "Drie korte vragen op het einde van de les. Jij ziet meteen wat nog onduidelijk is.",
  icon: MessageSquareText,
  waar: "cursist",
  eenheid: ["vraag", "vragen"],
  lesfase: "reflect",
  secondenPerItem: 60,
  aantal: (inhoud) => inhoud.exitTicketPrompts.length,
  voorbeelden: () => import("./voorbeelden").then((m) => m.voorbeelden),
  maken: {
    titel: "Exit ticket",
    uitleg: "Een paar korte vragen, met standaardvragen om uit te kiezen",
    Vorm: dynamic(() => import("@/components/maken/ExitTicketVorm").then((m) => m.ExitTicketVorm)),
  },
  Speler: dynamic<SpelerProps<"exitticket">>(() => import("./Speler")),
  Afdruk: dynamic<AfdrukProps<"exitticket">>(() => import("./Afdruk")),
  Leraar: dynamic<LeraarProps<"exitticket">>(() => import("./Inzendingen")),
};
