import { describe, expect, it } from "vitest";
import {
  leesProcedures,
  leesWerkwoorden,
  leesZinnen,
  schrijfProcedures,
  schrijfWerkwoorden,
  schrijfZinnen,
} from "@/lib/invoer";
import { leesBegrippen, schrijfBegrippen } from "@/lib/begrippen";
import { begrippenVan, inhoudMetBegrippen } from "@/lib/begrippenBewerken";
import type { OefeningVan } from "@/lib/types";
import { kanAanpassen } from "@/werkvormen/register";

/*
 * Materiaal aanpassen: het formulier start met de bestaande inhoud als tekst. Wat we zo
 * terugschrijven, moet bij het bewaren weer dezelfde inhoud opleveren.
 */

describe("terugschrijven naar het invulveld", () => {
  it("zinnen", () => {
    const tekst = "Ik ga naar huis.\nZij woont in Antwerpen.";
    expect(schrijfZinnen(leesZinnen(tekst))).toBe(tekst);
  });

  it("procedures, met de opdracht vooraan", () => {
    const tekst = "Hoe was je je handen? > nat maken > inzepen > afspoelen";
    const items = leesProcedures(tekst);
    expect(items[0].opdracht).toBe("Hoe was je je handen?");
    expect(schrijfProcedures(items)).toBe(tekst);
    expect(leesProcedures(schrijfProcedures(items))).toEqual(items);
  });

  it("werkwoorden", () => {
    const tekst = "parler; je=parle; nous=parlons\nfinir; je=finis";
    expect(schrijfWerkwoorden(leesWerkwoorden(tekst))).toBe(tekst);
  });

  it("begrippen", () => {
    const begrippen = [
      { word: "maison", translation: "het huis" },
      { word: "pomme", translation: "appel, de" },
    ];
    expect(leesBegrippen(schrijfBegrippen(begrippen)).begrippen).toEqual(begrippen);
  });
});

describe("een begrippenlijst aanpassen", () => {
  const kaarten: OefeningVan<"flashcard"> = {
    id: "fc",
    title: "Frans",
    description: "",
    category: "language",
    didacticGoal: "automate",
    type: "flashcard",
    creatorName: "Sofie",
    visibility: "prive",
    shareCode: "ABC123",
    createdAt: "2026-11-23",
    tags: [],
    didacticConfig: { showImmediateFeedback: true, allowRetryMissed: true, enableGamification: false },
    content: {
      flashcards: [
        { id: "fc-0", front: "maison", back: "huis", exampleSentence: "La maison est grande." },
        { id: "fc-1", front: "chat", back: "kat" },
      ],
    },
  };

  it("leest de begrippen uit de kaarten", () => {
    expect(begrippenVan(kaarten)).toEqual([
      { word: "maison", translation: "huis" },
      { word: "chat", translation: "kat" },
    ]);
  });

  it("houdt id en voorbeeldzin bij een gebleven begrip, en geeft een nieuw begrip een vrij id", () => {
    const { flashcards } = inhoudMetBegrippen(kaarten, [
      { word: "chien", translation: "hond" },
      { word: "maison", translation: "het huis" },
    ]) as OefeningVan<"flashcard">["content"];

    expect(flashcards[1]).toEqual({
      id: "fc-0",
      front: "maison",
      back: "het huis",
      exampleSentence: "La maison est grande.",
    });
    // "fc-0" is bezet door maison; ook het id van het geschrapte "chat" geven we niet opnieuw uit.
    expect(flashcards[0].front).toBe("chien");
    expect(["fc-0", "fc-1"]).not.toContain(flashcards[0].id);
  });
});

describe("wat je kan aanpassen", () => {
  it("werkvormen met een formulier en uit een begrippenlijst, geen klastools", () => {
    expect(kanAanpassen("quiz")).toBe(true);
    expect(kanAanpassen("flashcard")).toBe(true);
    expect(kanAanpassen("wordtrainer")).toBe(true);
    expect(kanAanpassen("timer")).toBe(false);
    expect(kanAanpassen("groupmaker")).toBe(false);
  });
});
