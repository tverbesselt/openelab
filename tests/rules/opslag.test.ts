/*
 * De opslag van de app zelf, bovenop de Firestore-databank, tegen de emulator en door de
 * echte regels. De andere regeltests schrijven rechtstreeks naar Firestore; deze test
 * roept de methodes aan die de pagina's gebruiken, als de persoon die dat in de app doet.
 * Zo blijkt dat wat de opslag wegschrijft ook is wat de regels toelaten.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { maakOpslag } from "../../src/lib/opslag/opslag";
import { maakFirestoreDatabank } from "../../src/lib/opslag/firestore";
import type { Opslag } from "../../src/lib/opslag/types";
import type { BordItem, Exercise, Herhaling, Lesmap, LiveSessie, Tekening, WedstrijdSpeler } from "../../src/lib/types";
import {
  db,
  lesmap,
  maakBeheerder,
  maakOmgeving,
  maakToegang,
  NU,
  oefening,
  PNG_DATA_URL,
  sessie,
  STANDAARD_BORD,
  UID,
  WEDSTRIJD_VRAAG,
  WEDSTRIJD_WACHT,
  type Persoon,
} from "./omgeving";

let omgeving: RulesTestEnvironment;

beforeAll(async () => {
  omgeving = await maakOmgeving("open-elab-rules-opslag");
});

afterAll(async () => {
  await omgeving.cleanup();
});

beforeEach(async () => {
  await omgeving.clearFirestore();
  await maakToegang(omgeving);
});

/** De opslag zoals de app ze gebruikt, aangemeld als deze persoon. */
function als(wie: Persoon): Opslag {
  // Eén verbinding per persoon: een batch en haar documenten moeten uit dezelfde komen.
  const verbinding = db(omgeving, wie);
  return maakOpslag(maakFirestoreDatabank(() => verbinding));
}

const LERAAR = { id: UID.leraar, naam: "Alex De Vries" };
const BEHEERDER = { id: UID.beheerder, naam: "Beheerder" };
const CODE = "123456";

const eenOefening = (id: string, extra: Record<string, unknown> = {}) =>
  ({ ...oefening({ shareCode: `OEF${id.toUpperCase()}`, ...extra }), id }) as unknown as Exercise;
const eenMap = (id: string, extra: Record<string, unknown> = {}) =>
  ({ ...lesmap({ shareCode: `MAP${id.toUpperCase()}`, ...extra }), id }) as unknown as Lesmap;
const eenSessie = (extra: Record<string, unknown> = {}) => sessie(extra) as unknown as LiveSessie;

/** Wacht tot een luisteraar de verwachte stand meldt. */
async function tot<T>(lees: () => T, klopt: (waarde: T) => boolean): Promise<T> {
  for (let poging = 0; poging < 100; poging++) {
    if (klopt(lees())) return lees();
    await new Promise((klaar) => setTimeout(klaar, 50));
  }
  throw new Error(`Niet bereikt; laatste stand: ${JSON.stringify(lees())}`);
}

describe("materiaal", () => {
  it("een leraar maakt, wijzigt en verwijdert; een cursist opent via de code", async () => {
    const leraar = als("leraar");
    await leraar.maakOefeningen([eenOefening("a"), eenOefening("b", { visibility: "prive" })]);

    const cursist = als("anoniem");
    expect(await cursist.viaCode("oefa")).toEqual({ soort: "oefening", id: "a" });
    expect((await cursist.oefening("a"))?.title).toBe("Hoofdsteden");
    expect(await cursist.viaCode("BESTAATNIET")).toBeNull();

    expect((await leraar.zichtbareOefeningen(LERAAR)).map((ex) => ex.id).sort()).toEqual(["a", "b"]);
    expect((await als("collega").zichtbareOefeningen({ id: UID.collega, naam: "Jan" })).map((ex) => ex.id)).toEqual(["a"]);

    await leraar.wijzigOefening("a", { title: "Hoofdsteden van Europa" });
    expect((await leraar.oefening("a"))?.title).toBe("Hoofdsteden van Europa");

    await leraar.verwijderOefening("a");
    expect(await cursist.viaCode("OEFA")).toBeNull();
    expect((await leraar.zichtbareOefeningen(LERAAR)).map((ex) => ex.id)).toEqual(["b"]);
  });

  it("exit tickets en quizresultaten: een cursist stuurt in, de maker leest", async () => {
    const leraar = als("leraar");
    await leraar.maakOefeningen([eenOefening("a")]);

    const cursist = als("anoniem");
    await cursist.stuurInzending("a", ["Goed", "Minder"]);
    await cursist.stuurInzending("a", ["Prima"]);
    await cursist.stuurQuizresultaat("a", ["q1"], 5);

    const inzendingen = await leraar.inzendingen("a");
    expect(inzendingen).toHaveLength(2);
    expect(new Set(inzendingen.map((i) => i.id)).size).toBe(2);
    expect(await leraar.quizresultaten("a")).toMatchObject([{ foutVragen: ["q1"], aantalVragen: 5 }]);
    await expect(cursist.inzendingen("a")).rejects.toThrow();
  });

  it("gespreid herhalen blijft van de cursist zelf", async () => {
    const cursist = als("cursist");
    const item = { id: "o1_k1", oefeningId: "o1", kaartId: "k1", doos: 2, volgende: "2026-10-12", bijgewerkt: NU } as unknown as Herhaling;
    await cursist.bewaarHerhaling(UID.cursist, item);
    await cursist.bewaarHerhaling(UID.cursist, { ...item, doos: 3 } as Herhaling);
    expect(await cursist.herhalingen(UID.cursist)).toMatchObject([{ id: "o1_k1", doos: 3 }]);
    await expect(als("leraar").herhalingen(UID.cursist)).rejects.toThrow();
  });
});

describe("mappen", () => {
  it("een leraar beheert zijn eigen mappen en verplaatst een oefening", async () => {
    const leraar = als("leraar");
    await leraar.maakMap(eenMap("van", { exerciseIds: ["x", "y"] }));
    await leraar.maakMap(eenMap("naar"));

    expect((await leraar.eigenMappen(LERAAR)).map((m) => m.id).sort()).toEqual(["naar", "van"]);
    expect(await als("anoniem").viaCode("mapvan")).toEqual({ soort: "map", id: "van" });

    await leraar.verplaatsOefening("x", "van", "naar");
    await leraar.wijzigMap("naar", { title: "Les 2" });
    expect((await leraar.map("van"))?.exerciseIds).toEqual(["y"]);
    expect(await leraar.map("naar")).toMatchObject({ title: "Les 2", exerciseIds: ["x"] });

    await leraar.verwijderMap("van");
    expect(await leraar.map("van")).toBeNull();
    expect(await als("anoniem").viaCode("MAPVAN")).toBeNull();
  });

  it("een beheerder ordent organisatiemappen; submappen schuiven mee omhoog", async () => {
    await maakBeheerder(omgeving);
    const beheerder = als("beheerder");
    const org = { organisatie: true, creatorId: UID.beheerder, creatorName: BEHEERDER.naam };
    await beheerder.maakMap(eenMap("boven", { ...org, title: "Talen" }));
    await beheerder.maakMap(eenMap("midden", { ...org, title: "Frans", bovenMapId: "boven" }));
    await beheerder.maakMap(eenMap("onder", { ...org, title: "Niveau 1", bovenMapId: "midden" }));

    expect((await als("leraar").organisatieMappen()).map((m) => m.title)).toEqual(["Frans", "Niveau 1", "Talen"]);
    // Een organisatiemap is niet persoonlijk, ook niet voor wie ze aanmaakte.
    expect(await beheerder.eigenMappen(BEHEERDER)).toEqual([]);

    await beheerder.verwijderMap("midden");
    expect((await beheerder.map("onder"))?.bovenMapId).toBe("boven");

    await beheerder.verplaatsMap("onder", null);
    expect(await beheerder.map("onder")).not.toHaveProperty("bovenMapId");
    await beheerder.verplaatsMap("onder", "boven");
    expect((await beheerder.map("onder"))?.bovenMapId).toBe("boven");
  });
});

describe("live in de klas", () => {
  it("een stemming: het bord volgt, een toestel stemt één keer", async () => {
    const leraar = als("leraar");
    await leraar.startSessie(eenSessie());

    const toestel = als("anoniem");
    const gezien: (LiveSessie | null)[] = [];
    const tellingen: number[] = [];
    const stoppen = [
      toestel.volgSessie(CODE, (s) => gezien.push(s)),
      leraar.volgAntwoorden(CODE, (lijst) => tellingen.push(lijst.length)),
    ];
    await tot(() => gezien.at(-1), (s) => s?.status === "actief");

    await toestel.stuurAntwoord(CODE, { apparaat: "toestel-a", optie: 1, op: NU });
    await expect(toestel.stuurAntwoord(CODE, { apparaat: "toestel-a", optie: 2, op: NU })).rejects.toThrow();
    await tot(() => tellingen.at(-1), (n) => n === 1);

    await leraar.wijzigSessie(CODE, { status: "afgesloten" });
    await tot(() => gezien.at(-1), (s) => s?.status === "afgesloten");
    await expect(toestel.stuurAntwoord(CODE, { apparaat: "toestel-b", optie: 0, op: NU })).rejects.toThrow();
    stoppen.forEach((stop) => stop());
  });

  it("een quizwedstrijd: meedoen, punten van het bord, één antwoord per vraag", async () => {
    const leraar = als("leraar");
    const toestel = als("anoniem");
    await leraar.startSessie(eenSessie({ type: "quiz", opties: [], quiz: WEDSTRIJD_WACHT }));

    const speler: WedstrijdSpeler = { apparaat: "t1", bijnaam: "Vos", op: NU };
    await toestel.meldSpeler(CODE, speler);

    const spelers: WedstrijdSpeler[][] = [];
    const eigen: (WedstrijdSpeler | null)[] = [];
    const antwoorden: number[] = [];
    const stoppen = [
      leraar.volgSpelers(CODE, (lijst) => spelers.push(lijst)),
      toestel.volgSpeler(CODE, "t1", (s) => eigen.push(s)),
      leraar.volgWedstrijdAntwoorden(CODE, 0, (lijst) => antwoorden.push(lijst.length)),
    ];
    await tot(() => spelers.at(-1), (lijst) => lijst?.length === 1);

    await leraar.werkSpelersBij(CODE, [{ ...speler, punten: 100, plaats: 1 }]);
    await tot(() => eigen.at(-1), (s) => s?.punten === 100);

    await leraar.wijzigSessie(CODE, { quiz: WEDSTRIJD_VRAAG } as unknown as Partial<LiveSessie>);
    await toestel.stuurWedstrijdAntwoord(CODE, { apparaat: "t1", vraagNr: 0, keuze: [0], op: NU });
    await expect(
      toestel.stuurWedstrijdAntwoord(CODE, { apparaat: "t1", vraagNr: 0, keuze: [1], op: NU })
    ).rejects.toThrow();
    await tot(() => antwoorden.at(-1), (n) => n === 1);

    await leraar.verwijderSpeler(CODE, "t1");
    await tot(() => eigen.at(-1), (s) => s === null);
    stoppen.forEach((stop) => stop());
  });

  it("een whiteboard: een cursist ziet alleen wat zichtbaar is, de leraar keurt goed", async () => {
    const leraar = als("leraar");
    const toestel = als("anoniem");
    await leraar.startSessie(eenSessie({ type: "bord", opties: [], bord: { ...STANDAARD_BORD, nakijken: true } }));

    const kaart = { id: "k1", apparaat: "t1", soort: "tekst", status: "wacht", op: NU, tekst: "Een idee" } as unknown as BordItem;
    await toestel.stuurBordItem(CODE, kaart);

    const voorHost: BordItem[][] = [];
    const voorCursist: BordItem[][] = [];
    const stoppen = [
      leraar.volgBord(CODE, true, (items) => voorHost.push(items)),
      toestel.volgBord(CODE, false, (items) => voorCursist.push(items)),
    ];
    await tot(() => voorHost.at(-1), (items) => items?.length === 1);
    await tot(() => voorCursist.at(-1), (items) => items?.length === 0);

    await leraar.wijzigBordItem(CODE, "k1", { status: "zichtbaar" } as Partial<BordItem>);
    await tot(() => voorCursist.at(-1), (items) => items?.length === 1);

    await leraar.verwijderBordItem(CODE, "k1");
    await tot(() => voorHost.at(-1), (items) => items?.length === 0);
    stoppen.forEach((stop) => stop());

    // Zonder de voorwaarde "zichtbaar" weigeren de regels een cursist; dat komt binnen als fout.
    let geweigerd = false;
    const stop = toestel.volgBord(CODE, true, () => {}, () => (geweigerd = true));
    await tot(() => geweigerd, (waarde) => waarde);
    stop();
  });

  it("teken uit je geheugen: een toestel stuurt in, de leraar ziet en verwijdert", async () => {
    const leraar = als("leraar");
    const toestel = als("anoniem");
    const tekenen = { nr: 1, aantal: 3, naam: "Vlag van Zweden", seconden: 60, gestartOp: NU, namen: "anoniem" };
    await leraar.startSessie(eenSessie({ type: "tekenen", opties: [], tekenen }));

    const tekening = { id: "t1_1", apparaat: "t1", nr: 1, beeld: PNG_DATA_URL, seconden: 42, op: NU } as unknown as Tekening;
    await toestel.stuurTekening(CODE, tekening);
    await expect(toestel.stuurTekening(CODE, tekening)).rejects.toThrow();

    const gezien: Tekening[][] = [];
    const stop = leraar.volgTekeningen(CODE, (lijst) => gezien.push(lijst));
    await tot(() => gezien.at(-1), (lijst) => lijst?.length === 1);
    await leraar.verwijderTekening(CODE, "t1_1");
    await tot(() => gezien.at(-1), (lijst) => lijst?.length === 0);
    stop();
  });
});
