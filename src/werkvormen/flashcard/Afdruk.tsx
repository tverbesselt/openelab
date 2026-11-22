import { Knipblad } from "../gedeeld/afdruk";
import type { AfdrukProps } from "../soorten";

export default function Afdruk({ oefening }: AfdrukProps<"flashcard">) {
  return (
    <Knipblad
      kaarten={oefening.content.flashcards.map((k) => ({ id: k.id, voor: k.front, achter: k.back }))}
    />
  );
}
