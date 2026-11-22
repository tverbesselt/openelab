import type { OefeningVan } from "@/lib/types";
import type { OpfrisItem } from "@/lib/opfrissen";

/** De vragen van een quiz of een leestekst, als vraag en antwoord voor Opfrissen. */
export function opfrisUitVragen(ex: OefeningVan<"quiz" | "lezen">): OpfrisItem[] {
  // Een dia is geen vraag: daar valt niets op te frissen.
  return ex.content.questions
    .filter((vraag) => vraag.type !== "dia")
    .map((vraag) => ({
      id: `${ex.id}-${vraag.id}`,
      vraag: vraag.question,
      antwoord:
        vraag.type === "volgorde"
          ? vraag.options.join(" → ")
          : vraag.type === "typ"
            ? (vraag.antwoorden ?? [])[0] ?? ""
            : vraag.correctAnswers
                .map((i) => vraag.options[i])
                .filter(Boolean)
                .join(" · "),
      bron: ex.title,
      toelichting: vraag.explanation,
    }));
}
