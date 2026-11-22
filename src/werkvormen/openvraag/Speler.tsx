"use client";

import { OpenVraagPlayer } from "@/components/players/OpenVraagPlayer";
import type { SpelerProps } from "../soorten";

export default function Speler({ oefening }: SpelerProps<"openvraag">) {
  return (
    <OpenVraagPlayer vragen={oefening.content.openVragen} />
  );
}
