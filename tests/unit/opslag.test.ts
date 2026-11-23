import { beforeEach, describe, expect, it } from "vitest";
import { maakOpslag } from "../../src/lib/opslag/opslag";
import { maakLokaleDatabank, type Zaad } from "../../src/lib/opslag/lokaal";
import type { Opslag } from "../../src/lib/opslag/types";
import type { BordItem, Exercise, Lesmap, LiveAntwoord, LiveSessie, Tekening } from "../../src/lib/types";

/*
 * De opslag bovenop de databank van de demomodus, met een nagebootste localStorage. Dit
 * toetst wat de opslag zelf beslist (wat hoort samen, wat schuift mee) en wat de demo
 * bewaakt in de plaats van de regels. De Firestore-kant draait in tests/rules/opslag.test.ts
 * tegen de emulator.
 */

function geheugen() {
  const inhoud = new Map<string, string>();
  return {
    getItem: (sleutel: string) => inhoud.get(sleutel) ?? null,
    setItem: (sleutel: string, waarde: string) => void inhoud.set(sleutel, waarde),
  };
}

const LERAAR = { id: "leraar-1", naam: "Sofie Peeters" };
const COLLEGA = { id: "leraar-2", naam: "Jan Janssens" };

function oefening(id: string, extra: Partial<Exercise> = {}): Exercise {
  return {
    id,
    title: `Oefening ${id}`,
    description: "",
    category: "quiz",
    didacticGoal: "check",
    type: "quiz",
    creatorName: LERAAR.naam,
    creatorId: LERAAR.id,
    visibility: "organisatie",
    shareCode: `code${id}`,
    content: { questions: [] },
    didacticConfig: { showImmediateFeedback: true, allowRetryMissed: true, enableGamification: false },
    createdAt: "2026-11-21",
    tags: [],
    ...extra,
  } as Exercise;
}

function lesmap(id: string, extra: Partial<Lesmap> = {}): Lesmap {
  return {
    id,
    title: `Map ${id}`,
    description: "",
    exerciseIds: [],
    creatorName: LERAAR.naam,
    creatorId: LERAAR.id,
    shareCode: `map${id}`,
    createdAt: "2026-11-21",
    ...extra,
  };
}

function sessie(extra: Partial<LiveSessie> = {}): LiveSessie {
  return {
    code: "123456",
    hostId: LERAAR.id,
    hostNaam: LERAAR.naam,
    titel: "Stemming",
    type: "poll",
    vraag: "Welke kleur?",
    opties: ["rood", "groen"],
    status: "actief",
    toonResultaten: true,
    gestartOp: "2026-11-21T10:00:00.000Z",
    ...extra,
  };
}

const antwoord = (apparaat: string, optie: number): LiveAntwoord => ({
  apparaat,
  optie,
  op: "2026-11-21T10:01:00.000Z",
});

/** Wacht tot de opslag haar luisteraars heeft bijgewerkt. */
const even = () => new Promise((klaar) => setTimeout(klaar, 0));

let opslag: Opslag;

function nieuweOpslag(zaad?: () => Promise<Zaad>): Opslag {
  const omgeving = { opslagplaats: geheugen(), bus: new EventTarget() };
  return maakOpslag(maakLokaleDatabank(() => omgeving, zaad));
}

beforeEach(() => {
  opslag = nieuweOpslag();
});

describe("materiaal", () => {
  it("bewaart een oefening met haar code, en ruimt beide samen op", async () => {
    await opslag.maakOefeningen([oefening("a")]);
    expect(await opslag.viaCode("codea")).toEqual({ soort: "oefening", id: "a" });
    expect((await opslag.oefening("a"))?.title).toBe("Oefening a");

    await opslag.verwijderOefening("a");
    expect(await opslag.oefening("a")).toBeNull();
    expect(await opslag.viaCode("CODEA")).toBeNull();
  });

  it("toont wat gedeeld is en wat van de kijker zelf is, niet het privémateriaal van een collega", async () => {
    await opslag.maakOefeningen([
      oefening("gedeeld", { createdAt: "2026-11-01" }),
      oefening("eigen", { visibility: "prive", createdAt: "2026-11-03" }),
      oefening("collega", { visibility: "prive", creatorId: COLLEGA.id, creatorName: COLLEGA.naam }),
    ]);

    const voorLeraar = await opslag.zichtbareOefeningen(LERAAR);
    expect(voorLeraar.map((ex) => ex.id)).toEqual(["eigen", "gedeeld"]);
    expect((await opslag.zichtbareOefeningen(null)).map((ex) => ex.id)).toEqual(["gedeeld"]);
  });

  it("vult bij het inlezen de inhoud aan die een oud document mist", async () => {
    await opslag.maakOefeningen([oefening("oud", { content: {} } as Partial<Exercise>)]);
    const gelezen = await opslag.oefening("oud");
    expect(gelezen?.type === "quiz" && gelezen.content.questions).toEqual([]);
  });

  it("wijzigt alleen de velden die je meegeeft", async () => {
    await opslag.maakOefeningen([oefening("a")]);
    await opslag.wijzigOefening("a", { title: "Nieuwe titel" });
    const gelezen = await opslag.oefening("a");
    expect(gelezen?.title).toBe("Nieuwe titel");
    expect(gelezen?.shareCode).toBe("codea");
  });

  it("vervangt een aangepaste oefening: zelfde code, weggehaalde velden verdwijnen", async () => {
    const cover = { soort: "afbeelding" as const, url: "https://voorbeeld.be/a.jpg", alt: "Omslag" };
    await opslag.maakOefeningen([oefening("a", { cover })]);
    const oud = (await opslag.oefening("a"))!;

    const { cover: _weg, ...zonderCover } = oud;
    void _weg;
    await opslag.vervangOefening({
      ...zonderCover,
      title: "Aangepast",
      content: { questions: [{ id: "q-0", question: "Twee plus twee?", options: ["4", "5"], correctAnswers: [0], type: "multiple_choice", explanation: "" }] },
    } as Exercise);

    const gelezen = await opslag.oefening("a");
    expect(gelezen?.title).toBe("Aangepast");
    expect(gelezen?.cover).toBeUndefined();
    expect(await opslag.viaCode("codea")).toEqual({ soort: "oefening", id: "a" });
    // De lijst van de leraar toont de nieuwe versie.
    const [regel] = await opslag.zichtbareOefeningen(LERAAR);
    expect(regel.title).toBe("Aangepast");
  });

  it("weigert een aanpassing die de code zou veranderen of een gewiste oefening terugzet", async () => {
    await opslag.maakOefeningen([oefening("a")]);
    const oud = (await opslag.oefening("a"))!;
    await expect(opslag.vervangOefening({ ...oud, shareCode: "ANDERS" })).rejects.toThrow();
    await opslag.verwijderOefening("a");
    await expect(opslag.vervangOefening(oud)).rejects.toThrow();
    expect(await opslag.oefening("a")).toBeNull();
  });
});

describe("mappen", () => {
  it("houdt persoonlijke mappen en organisatiemappen uit elkaar", async () => {
    await opslag.maakMap(lesmap("mijn"));
    await opslag.maakMap(lesmap("org-b", { organisatie: true, title: "Wiskunde" }));
    await opslag.maakMap(lesmap("org-a", { organisatie: true, title: "Frans" }));

    expect((await opslag.eigenMappen(LERAAR)).map((m) => m.id)).toEqual(["mijn"]);
    expect((await opslag.eigenMappen(null))).toEqual([]);
    expect((await opslag.organisatieMappen()).map((m) => m.title)).toEqual(["Frans", "Wiskunde"]);
    expect(await opslag.viaCode("mapmijn")).toEqual({ soort: "map", id: "mijn" });
  });

  it("schuift de submappen een niveau hoger als een organisatiemap verdwijnt", async () => {
    await opslag.maakMap(lesmap("boven", { organisatie: true }));
    await opslag.maakMap(lesmap("midden", { organisatie: true, bovenMapId: "boven" }));
    await opslag.maakMap(lesmap("onder", { organisatie: true, bovenMapId: "midden" }));

    await opslag.verwijderMap("midden");
    expect(await opslag.map("midden")).toBeNull();
    expect((await opslag.map("onder"))?.bovenMapId).toBe("boven");
    expect(await opslag.viaCode("mapmidden")).toBeNull();

    await opslag.verwijderMap("boven");
    expect((await opslag.map("onder"))).not.toHaveProperty("bovenMapId");
  });

  it("zet een map bovenaan door het veld weg te halen", async () => {
    await opslag.maakMap(lesmap("a", { organisatie: true }));
    await opslag.maakMap(lesmap("b", { organisatie: true }));
    await opslag.verplaatsMap("b", "a");
    expect((await opslag.map("b"))?.bovenMapId).toBe("a");
    await opslag.verplaatsMap("b", null);
    expect(await opslag.map("b")).not.toHaveProperty("bovenMapId");
  });

  it("verplaatst een oefening van de ene map naar de andere, zonder dubbels", async () => {
    await opslag.maakMap(lesmap("van", { exerciseIds: ["x", "y"] }));
    await opslag.maakMap(lesmap("naar", { exerciseIds: ["y"] }));

    await opslag.verplaatsOefening("y", "van", "naar");
    await opslag.verplaatsOefening("x", "van", "naar");
    expect((await opslag.map("van"))?.exerciseIds).toEqual([]);
    expect((await opslag.map("naar"))?.exerciseIds).toEqual(["y", "x"]);
  });
});

describe("live in de klas", () => {
  it("meldt de sessie en elk antwoord aan wie volgt", async () => {
    const gezien: (LiveSessie | null)[] = [];
    const tellingen: number[] = [];
    await opslag.startSessie(sessie());
    const stopSessie = opslag.volgSessie("123456", (s) => gezien.push(s));
    const stopAntwoorden = opslag.volgAntwoorden("123456", (lijst) => tellingen.push(lijst.length));
    await even();

    await opslag.stuurAntwoord("123456", antwoord("toestel-1", 0));
    await opslag.wijzigSessie("123456", { toonResultaten: false });
    await even();

    expect(tellingen).toEqual([0, 1]);
    expect(gezien.at(-1)?.toonResultaten).toBe(false);

    stopSessie();
    stopAntwoorden();
    await opslag.stuurAntwoord("123456", antwoord("toestel-2", 1));
    expect(tellingen).toEqual([0, 1]);
  });

  it("geeft null voor een sessie die niet bestaat", async () => {
    const gezien: (LiveSessie | null)[] = [];
    opslag.volgSessie("000000", (s) => gezien.push(s));
    await even();
    expect(gezien).toEqual([null]);
  });

  it("laat een toestel één keer stemmen, behalve bij de begripsmeter", async () => {
    await opslag.startSessie(sessie());
    await opslag.stuurAntwoord("123456", antwoord("toestel-1", 0));
    await expect(opslag.stuurAntwoord("123456", antwoord("toestel-1", 1))).rejects.toThrow("al geantwoord");

    await opslag.startSessie(sessie({ code: "654321", type: "begripsmeter" }));
    await opslag.stuurAntwoord("654321", antwoord("toestel-1", 0));
    await opslag.stuurAntwoord("654321", antwoord("toestel-1", 2));
    const lijsten: LiveAntwoord[][] = [];
    opslag.volgAntwoorden("654321", (lijst) => lijsten.push(lijst));
    await even();
    expect(lijsten[0]).toEqual([antwoord("toestel-1", 2)]);
  });

  it("weigert een antwoord op een afgesloten sessie", async () => {
    await opslag.startSessie(sessie({ status: "afgesloten" }));
    await expect(opslag.stuurAntwoord("123456", antwoord("toestel-1", 0))).rejects.toThrow("niet (meer) actief");
  });
});

describe("quizwedstrijd", () => {
  const quiz = (fase: "wachtruimte" | "vraag", vraagNr: number) =>
    sessie({ type: "quiz", quiz: { fase, vraagNr, aantalVragen: 3 } as LiveSessie["quiz"] });
  const speler = { apparaat: "toestel-1", bijnaam: "Mila", op: "2026-11-21T10:00:00.000Z" };

  it("laat een toestel één keer meedoen; het bord werkt de punten bij", async () => {
    await opslag.startSessie(quiz("wachtruimte", -1));
    await opslag.meldSpeler("123456", speler);
    await expect(opslag.meldSpeler("123456", speler)).rejects.toThrow("Je doet al mee");

    await opslag.werkSpelersBij("123456", [{ ...speler, punten: 100, plaats: 1 }]);
    const gezien: unknown[] = [];
    opslag.volgSpeler("123456", "toestel-1", (s) => gezien.push(s?.punten ?? null));
    await even();
    expect(gezien).toEqual([100]);

    await opslag.verwijderSpeler("123456", "toestel-1");
    await even();
    expect(gezien).toEqual([100, null]);
  });

  it("neemt één antwoord per vraag aan, en alleen op de vraag die loopt", async () => {
    await opslag.startSessie(quiz("vraag", 0));
    const op = "2026-11-21T10:02:00.000Z";
    await opslag.stuurWedstrijdAntwoord("123456", { apparaat: "toestel-1", vraagNr: 0, keuze: [1], op });
    await expect(
      opslag.stuurWedstrijdAntwoord("123456", { apparaat: "toestel-1", vraagNr: 0, keuze: [0], op })
    ).rejects.toThrow("al geantwoord");
    await expect(
      opslag.stuurWedstrijdAntwoord("123456", { apparaat: "toestel-1", vraagNr: 1, keuze: [0], op })
    ).rejects.toThrow("al afgesloten");

    const perVraag: number[] = [];
    opslag.volgWedstrijdAntwoorden("123456", 0, (lijst) => perVraag.push(lijst.length));
    opslag.volgWedstrijdAntwoorden("123456", 1, (lijst) => perVraag.push(lijst.length));
    await even();
    expect(perVraag).toEqual([1, 0]);
  });
});

describe("whiteboard en tekeningen", () => {
  const bord = (extra: Partial<NonNullable<LiveSessie["bord"]>> = {}) =>
    sessie({
      type: "bord",
      bord: {
        soorten: ["tekst"],
        maxTekens: 280,
        maxSeconden: 60,
        maxPerCursist: 0,
        namen: "anoniem",
        nakijken: true,
        zichtbaar: true,
        kolommen: [],
        open: true,
        ...extra,
      } as LiveSessie["bord"],
    });
  const kaart = (id: string, extra: Partial<BordItem> = {}) =>
    ({ id, soort: "tekst", tekst: "Hallo", status: "wacht", op: "2026-11-21T10:03:00.000Z", ...extra }) as BordItem;

  it("toont een cursist alleen wat zichtbaar is, en niets als het bord niet getoond wordt", async () => {
    await opslag.startSessie(bord());
    await opslag.stuurBordItem("123456", kaart("a"));
    await opslag.stuurBordItem("123456", kaart("b", { status: "zichtbaar" } as Partial<BordItem>));

    const host: number[] = [];
    const cursist: number[] = [];
    opslag.volgBord("123456", true, (items) => host.push(items.length));
    opslag.volgBord("123456", false, (items) => cursist.push(items.length));
    await even();
    expect([host.at(-1), cursist.at(-1)]).toEqual([2, 1]);

    await opslag.wijzigBordItem("123456", "a", { status: "zichtbaar" } as Partial<BordItem>);
    await even();
    expect(cursist.at(-1)).toBe(2);

    await opslag.wijzigSessie("123456", { bord: { ...bord().bord!, zichtbaar: false } });
    await opslag.verwijderBordItem("123456", "b");
    await even();
    expect([host.at(-1), cursist.at(-1)]).toEqual([1, 0]);
  });

  it("weigert wat de leraar niet toeliet, maar niet de leraar zelf", async () => {
    await opslag.startSessie(bord({ open: false }));
    await expect(opslag.stuurBordItem("123456", kaart("a"))).rejects.toThrow("mag nu niet");
    await opslag.stuurBordItem("123456", kaart("b", { leraar: true } as Partial<BordItem>));
  });

  it("neemt één tekening per opdracht aan, niet voor een opdracht die nog moet komen", async () => {
    await opslag.startSessie(
      sessie({ type: "tekenen", tekenen: { nr: 0, aantal: 2, naam: "Vlag", seconden: 0, namen: "anoniem", gestartOp: "" } as LiveSessie["tekenen"] })
    );
    const tekening = (nr: number) =>
      ({ id: `toestel-1_${nr}`, apparaat: "toestel-1", nr, beeld: "data:", op: "" }) as unknown as Tekening;

    await opslag.stuurTekening("123456", tekening(0));
    await expect(opslag.stuurTekening("123456", tekening(0))).rejects.toThrow("Al ingestuurd");
    await expect(opslag.stuurTekening("123456", tekening(1))).rejects.toThrow("nog niet aan de beurt");

    const aantallen: number[] = [];
    opslag.volgTekeningen("123456", (lijst) => aantallen.push(lijst.length));
    await even();
    await opslag.verwijderTekening("123456", "toestel-1_0");
    await even();
    expect(aantallen).toEqual([1, 0]);
  });
});

describe("resultaten en herhalen", () => {
  it("bewaart inzendingen en quizresultaten per oefening, nieuwste eerst", async () => {
    await opslag.stuurInzending("a", ["eerste"]);
    await new Promise((klaar) => setTimeout(klaar, 5));
    await opslag.stuurInzending("a", ["tweede"]);
    await opslag.stuurQuizresultaat("a", ["v1"], 3);

    const inzendingen = await opslag.inzendingen("a");
    expect(inzendingen.map((i) => i.antwoorden[0])).toEqual(["tweede", "eerste"]);
    expect(new Set(inzendingen.map((i) => i.id)).size).toBe(2);
    expect(await opslag.inzendingen("b")).toEqual([]);
    expect(await opslag.quizresultaten("a")).toMatchObject([{ foutVragen: ["v1"], aantalVragen: 3 }]);
  });

  it("houdt één herhaling per kaart bij, per gebruiker", async () => {
    const herhaling = (interval: number) => ({ id: "kaart-1", interval }) as never;
    await opslag.bewaarHerhaling("cursist-1", herhaling(1));
    await opslag.bewaarHerhaling("cursist-1", herhaling(3));
    expect(await opslag.herhalingen("cursist-1")).toEqual([{ id: "kaart-1", interval: 3 }]);
    expect(await opslag.herhalingen("cursist-2")).toEqual([]);
  });
});

describe("het voorbeeldmateriaal van de demo", () => {
  it("staat klaar bij het eerste gebruik, en komt niet terug na verwijderen", async () => {
    let geladen = 0;
    const zaad = async (): Promise<Zaad> => {
      geladen++;
      const ex = oefening("voorbeeld");
      return {
        oefeningen: { voorbeeld: ex as unknown as Record<string, unknown> },
        codes: { CODEVOORBEELD: { soort: "oefening", doelId: "voorbeeld" } },
      };
    };
    const omgeving = { opslagplaats: geheugen(), bus: new EventTarget() };
    const eerste = maakOpslag(maakLokaleDatabank(() => omgeving, zaad));

    expect((await eerste.zichtbareOefeningen(null)).map((ex) => ex.id)).toEqual(["voorbeeld"]);
    expect(await eerste.viaCode("codevoorbeeld")).toEqual({ soort: "oefening", id: "voorbeeld" });
    await eerste.verwijderOefening("voorbeeld");

    // Een nieuw tabblad of een herlaadde pagina: dezelfde browseropslag, een nieuwe databank.
    const tweede = maakOpslag(maakLokaleDatabank(() => omgeving, zaad));
    expect(await tweede.zichtbareOefeningen(null)).toEqual([]);
    expect(geladen).toBe(1);
  });

  it("doet niets op de server, waar geen browseropslag is", async () => {
    const opServer = maakOpslag(maakLokaleDatabank(() => null));
    await opServer.maakOefeningen([oefening("a")]);
    expect(await opServer.oefening("a")).toBeNull();
    expect(await opServer.zichtbareOefeningen(null)).toEqual([]);
  });
});
