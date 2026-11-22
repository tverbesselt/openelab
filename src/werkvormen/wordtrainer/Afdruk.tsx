import { Knipblad } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening }: AfdrukProps<"wordtrainer">) {
  return (
    <Knipblad
      kaarten={oefening.content.wordTrainerItems.map((w) => ({
        id: w.id,
        voor: w.word,
        achter: w.translation,
      }))}
    />
  );
}
