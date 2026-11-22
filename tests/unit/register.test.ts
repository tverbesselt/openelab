import { describe, expect, it } from "vitest";
import { WERKVORMEN, WERKVORM_LIJST, aantalItems, klassikaleStart } from "../../src/werkvormen/register";
import { ALLE_VORMEN, KEUZES } from "../../src/components/maken/keuzes";
import { LESFASES, geschatteDuur, inhoudSamenvatting } from "../../src/lib/labels";
import { FUNCTIEGROEPEN } from "../../src/lib/instellingen/functies";
import { INITIAL_MAPPEN, voorbeeldOefeningen, voorbeeldmateriaal } from "../../src/lib/mockData";
import { opfrisItemsVan } from "../../src/lib/opfrissen";

// Het voorbeeldmateriaal laadt lui; de tests halen het één keer op.
const INITIAL_EXERCISES = await voorbeeldOefeningen();

/*
 * Het register voedt de lijsten die vroeger elk apart bijgehouden werden. Deze tests leggen
 * vast wat de leraar te zien krijgt, zodat een nieuwe werkvorm of een andere volgorde in
 * het register niet ongemerkt een lesfase of een groep in Beheer verandert.
 */

describe("het register", () => {
  it("heeft elke werkvorm onder haar eigen type", () => {
    for (const [sleutel, werkvorm] of Object.entries(WERKVORMEN)) {
      expect(werkvorm.id).toBe(sleutel);
    }
    expect(WERKVORM_LIJST).toHaveLength(20);
  });

  it("geeft elke werkvorm voor cursisten een speler en een werkblad", () => {
    const zonder = WERKVORM_LIJST.filter(
      (w) => w.lesfase !== "facilitate" && (!w.Speler || !w.Afdruk)
    ).map((w) => w.id);
    expect(zonder).toEqual([]);
  });

  it("houdt de lesfases zoals de leraar ze kent", () => {
    expect(LESFASES.map((f) => [f.id, f.werkvormen])).toEqual([
      ["activate", ["poll", "wordcloud", "tekenen"]],
      [
        "automate",
        [
          "flashcard",
          "wordtrainer",
          "matching",
          "fillblank",
          "zinbouwen",
          "volgorde",
          "sorteren",
          "werkwoorden",
          "rekenen",
        ],
      ],
      ["check", ["quiz", "lezen", "openvraag", "escaperoom"]],
      ["reflect", ["exitticket"]],
    ]);
  });

  it("houdt de groepen in Beheer zoals ze waren", () => {
    const groep = (id: string) => FUNCTIEGROEPEN.find((g) => g.id === id)?.functies;
    expect(groep("inoefenen")).toEqual(LESFASES[1].werkvormen);
    expect(groep("controleren")).toEqual(["quiz", "lezen", "openvraag", "escaperoom", "exitticket"]);
    expect(groep("activeren")).toEqual(["poll", "wordcloud", "tekenen"]);
    expect(groep("klastools")).toEqual(["timer", "randomizer", "groupmaker", "opfrissen", "digibord"]);
  });

  it("zegt wat je kunt maken", () => {
    const maakbaar = WERKVORM_LIJST.filter((w) => w.maken).map((w) => w.id);
    expect(maakbaar).toEqual([
      "poll",
      "wordcloud",
      "tekenen",
      "fillblank",
      "zinbouwen",
      "volgorde",
      "sorteren",
      "werkwoorden",
      "rekenen",
      "quiz",
      "lezen",
      "openvraag",
      "escaperoom",
      "exitticket",
    ]);
  });
});

describe("het voorbeeldmateriaal", () => {
  it("komt uit de mappen van de werkvormen", () => {
    expect(INITIAL_EXERCISES).toHaveLength(14);
    expect(new Set(INITIAL_EXERCISES.map((ex) => ex.id)).size).toBe(14);
  });

  it("staat onder het juiste type", async () => {
    for (const werkvorm of WERKVORM_LIJST) {
      for (const voorbeeld of (await werkvorm.voorbeelden?.()) ?? []) {
        expect(voorbeeld.type).toBe(werkvorm.id);
      }
    }
  });

  it("vult de voorbeeldmappen met oefeningen die bestaan", () => {
    const ids = new Set(INITIAL_EXERCISES.map((ex) => ex.id));
    for (const map of INITIAL_MAPPEN) {
      for (const id of map.exerciseIds) expect(ids.has(id), `${map.title}: ${id}`).toBe(true);
    }
  });

  it("zet voor de demo ook de codes en de maker klaar", async () => {
    const zaad = await voorbeeldmateriaal();
    expect(Object.keys(zaad.oefeningen)).toHaveLength(14);
    expect(zaad.codes.NT2SET).toMatchObject({ soort: "map", doelId: "set-nt2-pakket" });
    for (const ex of INITIAL_EXERCISES) {
      expect(zaad.codes[ex.shareCode.toUpperCase()], ex.id).toMatchObject({ soort: "oefening", doelId: ex.id });
    }
    // De map van de demoleraar is ook op id van haar, niet alleen op naam.
    expect(zaad.mappen["set-nt2-pakket"].creatorId).toBe("leraar@voorbeeld.school");
  });

  it("telt, schat en frist op via de werkvorm", () => {
    const quiz = INITIAL_EXERCISES.find((ex) => ex.type === "quiz")!;
    expect(aantalItems(quiz)).toBe(3);
    expect(inhoudSamenvatting(quiz)).toBe("3 vragen");
    expect(geschatteDuur(quiz)).toBe("± 2 min");
    expect(opfrisItemsVan(quiz)).toHaveLength(3);
    expect(opfrisItemsVan(quiz)[0].bron).toBe(quiz.title);

    const poll = INITIAL_EXERCISES.find((ex) => ex.type === "poll")!;
    expect(opfrisItemsVan(poll)).toEqual([]);
  });
});

describe("klassikaal starten", () => {
  const voorbeeld = (type: string) => INITIAL_EXERCISES.find((ex) => ex.type === type)!;

  it("stuurt een poll en een woordwolk naar de livepagina", () => {
    const poll = voorbeeld("poll");
    expect(klassikaleStart(poll)).toEqual({ href: `/live?oefening=${poll.id}`, functie: "poll" });
    expect(klassikaleStart(voorbeeld("wordcloud"))?.functie).toBe("wordcloud");
  });

  it("speelt een quiz als Quizwedstrijd, met de eigen schakelaar", () => {
    const quiz = voorbeeld("quiz");
    expect(klassikaleStart(quiz)).toEqual({ href: `/live?wedstrijd=${quiz.id}`, functie: "wedstrijd" });
  });

  it("heeft een eigen ingang voor Teken uit je geheugen", () => {
    const tekenen = voorbeeld("tekenen");
    expect(klassikaleStart(tekenen)?.href).toBe(`/live?tekenen=${tekenen.id}`);
  });

  it("geeft niets voor een werkvorm die alleen de cursist speelt", () => {
    expect(klassikaleStart(voorbeeld("matching"))).toBeNull();
  });
});

describe("de keuzes op de maakpagina", () => {
  it("houdt de groepen en hun volgorde", () => {
    expect(KEUZES.map((groep) => [groep.titel, groep.vormen.map((v) => v.id)])).toEqual([
      ["Inoefenen", ["begrippen", "fillblank", "zinbouwen", "volgorde", "sorteren", "werkwoorden", "rekenen"]],
      ["Begrip controleren", ["quiz", "lezen", "openvraag", "escaperoom"]],
      ["Afsluiten en reflecteren", ["exitticket"]],
      ["Klassikaal op het digibord", ["poll", "wordcloud", "tekenen"]],
    ]);
  });

  it("geeft elke keuze een formulier", () => {
    expect(ALLE_VORMEN.filter((v) => !v.Vorm).map((v) => v.id)).toEqual([]);
  });
});
