import { describe, expect, it } from "vitest";
import { vanType, vulInhoudAan } from "../../src/lib/oefeningInhoud";
import type { Exercise } from "../../src/lib/types";

/** Een document zoals het uit Firestore kan komen: de inhoud is niet nagekeken. */
function ruw(type: string, content: unknown): Exercise {
  return {
    id: "x",
    title: "Test",
    description: "",
    category: "quiz",
    didacticGoal: "check",
    type,
    creatorName: "Test",
    visibility: "prive",
    shareCode: "ABC123",
    content,
    didacticConfig: { showImmediateFeedback: true, allowRetryMissed: true, enableGamification: false },
    createdAt: "2026-01-01",
    tags: [],
  } as unknown as Exercise;
}

describe("vulInhoudAan", () => {
  it("laat een volledige oefening zoals ze is", () => {
    const vragen = [{ id: "v1", question: "?", options: ["a"], correctAnswers: [0], type: "multiple_choice", explanation: "" }];
    const ex = vulInhoudAan(ruw("quiz", { questions: vragen }));
    expect(ex.content).toEqual({ questions: vragen });
  });

  it("zet een lege lijst waar een veld ontbreekt", () => {
    expect(vulInhoudAan(ruw("quiz", {})).content).toEqual({ questions: [] });
    expect(vulInhoudAan(ruw("sorteren", { categorieen: ["a"] })).content).toEqual({
      categorieen: ["a"],
      sorteerItems: [],
    });
    expect(vulInhoudAan(ruw("lezen", { questions: null })).content).toEqual({ leestekst: "", questions: [] });
  });

  it("overleeft een document zonder content", () => {
    expect(vulInhoudAan(ruw("flashcard", undefined)).content).toEqual({ flashcards: [] });
    expect(vulInhoudAan(ruw("timer", undefined)).content).toEqual({});
  });

  it("geeft een escaperoom altijd een lijst van sloten", () => {
    expect(vulInhoudAan(ruw("escaperoom", {})).content).toEqual({ escaperoom: { sloten: [] } });
    expect(vulInhoudAan(ruw("escaperoom", { escaperoom: { verhaal: "Start" } })).content).toEqual({
      escaperoom: { verhaal: "Start", sloten: [] },
    });
  });

  it("houdt velden die niet bij de werkvorm horen, zodat opslaan niets wist", () => {
    const ex = vulInhoudAan(ruw("wordtrainer", { wordTrainerItems: [], flashcards: [{ id: "f1" }] }));
    expect(ex.content).toEqual({ wordTrainerItems: [], flashcards: [{ id: "f1" }] });
  });

  it("laat een onbekende werkvorm ongemoeid", () => {
    const vreemd = ruw("kruiswoord", { rooster: [] });
    expect(vulInhoudAan(vreemd)).toBe(vreemd);
  });

  it("deelt geen lege lijsten tussen oefeningen", () => {
    const a = vulInhoudAan(ruw("quiz", {}));
    const b = vulInhoudAan(ruw("quiz", {}));
    expect(a.content).not.toBe(b.content);
  });
});

describe("vanType", () => {
  it("filtert op een of meer werkvormen", () => {
    const lijst = [ruw("quiz", {}), ruw("lezen", {}), ruw("poll", {})].map(vulInhoudAan);
    expect(lijst.filter(vanType("quiz"))).toHaveLength(1);
    expect(lijst.filter(vanType("quiz", "lezen"))).toHaveLength(2);
  });
});
