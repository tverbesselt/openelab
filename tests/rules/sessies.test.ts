/*
 * Live-sessies: stemming, woordwolk, begripsmeter, quizwedstrijd, whiteboard en
 * Teken uit je geheugen. Cursisten doen mee zonder account, met de pincode.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  assertFails,
  assertSucceeds,
  db,
  maakOmgeving,
  maakToegang,
  metRegelsUit,
  NU,
  PNG_DATA_URL,
  sessie,
  STANDAARD_BORD,
  UID,
  WEDSTRIJD_VRAAG,
  WEDSTRIJD_WACHT,
} from "./omgeving";

let omgeving: RulesTestEnvironment;

beforeAll(async () => {
  omgeving = await maakOmgeving("open-elab-rules-sessies");
});

afterAll(async () => {
  await omgeving.cleanup();
});

beforeEach(async () => {
  await omgeving.clearFirestore();
  await maakToegang(omgeving);
});

const CODE = "123456";

async function zetSessie(extra: Record<string, unknown> = {}) {
  await metRegelsUit(omgeving, (d) => setDoc(doc(d, "sessies", CODE), sessie(extra)));
}

describe("sessie", () => {
  it("alleen een leraar start een sessie, op eigen naam, van een gekend type", async () => {
    await assertSucceeds(setDoc(doc(db(omgeving, "leraar"), "sessies", CODE), sessie()));
    await assertFails(setDoc(doc(db(omgeving, "cursist"), "sessies", "222222"), sessie({ hostId: UID.cursist })));
    await assertFails(setDoc(doc(db(omgeving, "collega"), "sessies", "333333"), sessie()));
    await assertFails(setDoc(doc(db(omgeving, "leraar"), "sessies", "444444"), sessie({ type: "bingo" })));
  });

  it("wie de pincode kent, volgt de sessie; een lijst krijgt alleen de leraar, van zijn eigen sessies", async () => {
    await zetSessie();
    await assertSucceeds(getDoc(doc(db(omgeving, "anoniem"), "sessies", CODE)));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), "sessies")));
    await assertFails(getDocs(collection(db(omgeving, "collega"), "sessies")));
    await assertFails(getDocs(collection(db(omgeving, "leraar"), "sessies")));
    const van = (wie: "leraar" | "collega" | "cursist", hostId: string) =>
      getDocs(query(collection(db(omgeving, wie), "sessies"), where("hostId", "==", hostId)));
    await assertSucceeds(van("leraar", UID.leraar));
    await assertFails(van("collega", UID.leraar));
    await assertFails(van("cursist", UID.cursist));
  });

  it("alleen de host stuurt de sessie en kan ze niet aan een ander geven", async () => {
    await zetSessie();
    await assertSucceeds(updateDoc(doc(db(omgeving, "leraar"), "sessies", CODE), { toonResultaten: true }));
    await assertFails(updateDoc(doc(db(omgeving, "collega"), "sessies", CODE), { status: "afgesloten" }));
    await assertFails(updateDoc(doc(db(omgeving, "leraar"), "sessies", CODE), { hostId: UID.collega }));
    await assertFails(deleteDoc(doc(db(omgeving, "collega"), "sessies", CODE)));
    await assertSucceeds(deleteDoc(doc(db(omgeving, "leraar"), "sessies", CODE)));
  });
});

describe("stemming en woordwolk", () => {
  it("één stem per toestel, alleen zolang de sessie loopt", async () => {
    await zetSessie();
    const d = db(omgeving, "anoniem");
    const stem = { apparaat: "toestel-a", optie: 1, op: NU };
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "toestel-a"), stem));
    // Een tweede keer stemmen is geweigerd, ook met een andere keuze.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "toestel-a"), { ...stem, optie: 2 }));
    // Een stem onder een andere toestelnaam dan het document.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "toestel-b"), stem));
    // Een optie die niet bestaat.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "toestel-c"), { ...stem, apparaat: "toestel-c", optie: 4 }));
  });

  it("na het afsluiten komt er niets meer binnen", async () => {
    await zetSessie({ status: "afgesloten" });
    await assertFails(
      setDoc(doc(db(omgeving, "anoniem"), `sessies/${CODE}/antwoorden`, "toestel-a"), { apparaat: "toestel-a", optie: 0, op: NU })
    );
  });

  it("alleen de host leest de antwoorden", async () => {
    await zetSessie();
    await metRegelsUit(omgeving, (d) =>
      setDoc(doc(d, `sessies/${CODE}/antwoorden`, "toestel-a"), { apparaat: "toestel-a", optie: 0, op: NU })
    );
    await assertSucceeds(getDocs(collection(db(omgeving, "leraar"), `sessies/${CODE}/antwoorden`)));
    await assertFails(getDocs(collection(db(omgeving, "collega"), `sessies/${CODE}/antwoorden`)));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), `sessies/${CODE}/antwoorden`)));
  });

  it("een woord in de woordwolk is kort, en zonder extra velden", async () => {
    await zetSessie({ type: "wordcloud", opties: [] });
    const d = db(omgeving, "anoniem");
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "t1"), { apparaat: "t1", woord: "lente", op: NU }));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "t2"), { apparaat: "t2", woord: "x".repeat(61), op: NU }));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "t3"), { apparaat: "t3", woord: "ok", naam: "Jan", op: NU }));
  });

  it("de begripsmeter mag bijgesteld worden, een stemming niet", async () => {
    await zetSessie({ type: "begripsmeter", opties: ["groen", "oranje", "rood"] });
    const d = db(omgeving, "anoniem");
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/antwoorden`, "t1"), { apparaat: "t1", optie: 2, op: NU }));
    await assertSucceeds(updateDoc(doc(d, `sessies/${CODE}/antwoorden`, "t1"), { optie: 0, op: NU }));
    await assertFails(deleteDoc(doc(d, `sessies/${CODE}/antwoorden`, "t1")));
  });
});

describe("quizwedstrijd", () => {
  it("een toestel meldt zich één keer aan met een bijnaam, in de wachtruimte", async () => {
    await zetSessie({ type: "quiz", quiz: WEDSTRIJD_WACHT });
    const d = db(omgeving, "anoniem");
    const speler = { apparaat: "t1", bijnaam: "Vos", op: NU };
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/spelers`, "t1"), speler));
    // Punten geeft een speler zichzelf niet.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/spelers`, "t2"), { ...speler, apparaat: "t2", punten: 9000 }));
    await assertFails(updateDoc(doc(d, `sessies/${CODE}/spelers`, "t1"), { punten: 9000 }));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/spelers`, "t3"), { ...speler, apparaat: "t3", bijnaam: "" }));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/spelers`, "t4"), { ...speler, apparaat: "t4", bijnaam: "x".repeat(21) }));
  });

  it("een team kiezen kan alleen binnen het aantal teams", async () => {
    await zetSessie({ type: "quiz", quiz: { ...WEDSTRIJD_WACHT, instellingen: { ...WEDSTRIJD_WACHT.instellingen, teams: 2 } } });
    const d = db(omgeving, "anoniem");
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/spelers`, "t1"), { apparaat: "t1", bijnaam: "Vos", team: 1, op: NU }));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/spelers`, "t2"), { apparaat: "t2", bijnaam: "Uil", team: 2, op: NU }));
  });

  it("elk toestel leest zijn eigen stand; de lijst is voor het bord", async () => {
    await zetSessie({ type: "quiz", quiz: WEDSTRIJD_WACHT });
    await metRegelsUit(omgeving, (d) =>
      setDoc(doc(d, `sessies/${CODE}/spelers`, "t1"), { apparaat: "t1", bijnaam: "Vos", punten: 0, op: NU })
    );
    await assertSucceeds(getDoc(doc(db(omgeving, "anoniem"), `sessies/${CODE}/spelers`, "t1")));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), `sessies/${CODE}/spelers`)));
    await assertSucceeds(getDocs(collection(db(omgeving, "leraar"), `sessies/${CODE}/spelers`)));
    // Het bord werkt punten bij en haalt een ongepaste bijnaam weg.
    await assertSucceeds(updateDoc(doc(db(omgeving, "leraar"), `sessies/${CODE}/spelers`, "t1"), { punten: 1000 }));
    await assertFails(deleteDoc(doc(db(omgeving, "collega"), `sessies/${CODE}/spelers`, "t1")));
    await assertSucceeds(deleteDoc(doc(db(omgeving, "leraar"), `sessies/${CODE}/spelers`, "t1")));
  });

  it("één antwoord per vraag, alleen tijdens die vraag en alleen als speler", async () => {
    await zetSessie({ type: "quiz", quiz: WEDSTRIJD_VRAAG });
    await metRegelsUit(omgeving, (d) =>
      setDoc(doc(d, `sessies/${CODE}/spelers`, "t1"), { apparaat: "t1", bijnaam: "Vos", op: NU })
    );
    const d = db(omgeving, "anoniem");
    const antwoord = { apparaat: "t1", vraagNr: 0, keuze: [0], op: NU };
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/quizantwoorden`, "t1_0"), antwoord));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/quizantwoorden`, "t1_0"), { ...antwoord, keuze: [1] }));
    // Verkeerde documentnaam, verkeerd vraagnummer, niet aangemeld als speler.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/quizantwoorden`, "anders"), antwoord));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/quizantwoorden`, "t1_1"), { ...antwoord, vraagNr: 1 }));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/quizantwoorden`, "t9_0"), { ...antwoord, apparaat: "t9" }));
    // Kiezen én typen tegelijk kan niet; typen alleen wel.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/quizantwoorden`, "t1_0b"), { ...antwoord, tekst: "Parijs" }));
    await metRegelsUit(omgeving, (dd) =>
      setDoc(doc(dd, `sessies/${CODE}/spelers`, "t2"), { apparaat: "t2", bijnaam: "Uil", op: NU })
    );
    await assertSucceeds(
      setDoc(doc(d, `sessies/${CODE}/quizantwoorden`, "t2_0"), { apparaat: "t2", vraagNr: 0, tekst: "Parijs", op: NU })
    );
  });

  it("buiten de vraagfase komt er geen antwoord meer binnen", async () => {
    await zetSessie({ type: "quiz", quiz: { ...WEDSTRIJD_VRAAG, fase: "uitleg" } });
    await metRegelsUit(omgeving, (d) =>
      setDoc(doc(d, `sessies/${CODE}/spelers`, "t1"), { apparaat: "t1", bijnaam: "Vos", op: NU })
    );
    await assertFails(
      setDoc(doc(db(omgeving, "anoniem"), `sessies/${CODE}/quizantwoorden`, "t1_0"), { apparaat: "t1", vraagNr: 0, keuze: [0], op: NU })
    );
  });
});

describe("whiteboard", () => {
  // Een tekstkaartje; met `url` erbij wordt het een beeld of filmpje zonder tekst.
  const kaartje = (extra: Record<string, unknown> = {}) => {
    const basis: Record<string, unknown> = { id: "k1", apparaat: "t1", soort: "tekst", status: "zichtbaar", op: NU, ...extra };
    if (!("url" in basis) && !("tekst" in basis)) basis.tekst = "Een idee";
    return basis;
  };

  it("een cursist zet een kaartje op een open bord, binnen de keuzes van de leraar", async () => {
    await zetSessie({ type: "bord", opties: [], bord: STANDAARD_BORD });
    const d = db(omgeving, "anoniem");
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/bord`, "k1"), kaartje()));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/bord`, "k2"), kaartje({ id: "k2", tekst: "x".repeat(281) })));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/bord`, "k3"), kaartje({ id: "k3", soort: "video", url: "https://www.youtube.com/watch?v=abcdefghijk" })));
    // Vastpinnen is voor de leraar.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/bord`, "k4"), kaartje({ id: "k4", vast: true })));
  });

  it("een afbeelding alleen als veilige data-URL, nooit SVG of een externe link", async () => {
    await zetSessie({ type: "bord", opties: [], bord: STANDAARD_BORD });
    const d = db(omgeving, "anoniem");
    const beeld = (id: string, url: string) => kaartje({ id, soort: "afbeelding", url });
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/bord`, "b1"), beeld("b1", PNG_DATA_URL)));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/bord`, "b2"), beeld("b2", "data:image/svg+xml;base64,PHN2Zz4=")));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/bord`, "b3"), beeld("b3", "https://example.com/plaatje.png")));
  });

  it("gesloten bord of nakijken aan: dan wacht een kaartje of komt het er niet op", async () => {
    await zetSessie({ type: "bord", opties: [], bord: { ...STANDAARD_BORD, open: false } });
    await assertFails(setDoc(doc(db(omgeving, "anoniem"), `sessies/${CODE}/bord`, "k1"), kaartje()));

    await zetSessie({ type: "bord", opties: [], bord: { ...STANDAARD_BORD, nakijken: true } });
    const d = db(omgeving, "anoniem");
    await assertFails(setDoc(doc(d, `sessies/${CODE}/bord`, "k1"), kaartje({ status: "zichtbaar" })));
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/bord`, "k1"), kaartje({ status: "wacht" })));
  });

  it("de leraar keurt goed, pint vast en verplaatst; de inhoud zelf verandert niet", async () => {
    await zetSessie({ type: "bord", opties: [], bord: { ...STANDAARD_BORD, nakijken: true, kolommen: ["Voor", "Tegen"] } });
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, `sessies/${CODE}/bord`, "k1"), kaartje({ status: "wacht" })));
    const d = db(omgeving, "leraar");
    await assertSucceeds(updateDoc(doc(d, `sessies/${CODE}/bord`, "k1"), { status: "zichtbaar", vast: true, kolom: 1 }));
    await assertFails(updateDoc(doc(d, `sessies/${CODE}/bord`, "k1"), { tekst: "Herschreven" }));
    await assertFails(updateDoc(doc(d, `sessies/${CODE}/bord`, "k1"), { kolom: 2 }));
    await assertFails(updateDoc(doc(db(omgeving, "anoniem"), `sessies/${CODE}/bord`, "k1"), { status: "zichtbaar" }));
    await assertFails(deleteDoc(doc(db(omgeving, "anoniem"), `sessies/${CODE}/bord`, "k1")));
    await assertSucceeds(deleteDoc(doc(d, `sessies/${CODE}/bord`, "k1")));
  });

  it("een cursist ziet alleen wat zichtbaar is, en alleen als de leraar het bord toont", async () => {
    await zetSessie({ type: "bord", opties: [], bord: STANDAARD_BORD });
    await metRegelsUit(omgeving, async (d) => {
      await setDoc(doc(d, `sessies/${CODE}/bord`, "k1"), kaartje());
      await setDoc(doc(d, `sessies/${CODE}/bord`, "k2"), kaartje({ id: "k2", status: "wacht" }));
    });
    const zichtbaar = query(collection(db(omgeving, "anoniem"), `sessies/${CODE}/bord`), where("status", "==", "zichtbaar"));
    await assertSucceeds(getDocs(zichtbaar));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), `sessies/${CODE}/bord`)));
    await assertSucceeds(getDocs(collection(db(omgeving, "leraar"), `sessies/${CODE}/bord`)));

    await zetSessie({ type: "bord", opties: [], bord: { ...STANDAARD_BORD, zichtbaar: false } });
    await assertFails(getDocs(zichtbaar));
  });
});

describe("teken uit je geheugen", () => {
  const tekenen = { nr: 1, aantal: 3, naam: "Vlag van Zweden", seconden: 60, gestartOp: NU, namen: "anoniem" };
  const tekening = (extra: Record<string, unknown> = {}) => ({
    id: "t1_1",
    apparaat: "t1",
    nr: 1,
    beeld: PNG_DATA_URL,
    seconden: 42,
    op: NU,
    ...extra,
  });

  it("één tekening per toestel en per opdracht; een vorige opdracht mag nog", async () => {
    await zetSessie({ type: "tekenen", opties: [], tekenen });
    const d = db(omgeving, "anoniem");
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/tekeningen`, "t1_1"), tekening()));
    await assertFails(setDoc(doc(d, `sessies/${CODE}/tekeningen`, "t1_1"), tekening({ seconden: 1 })));
    await assertSucceeds(setDoc(doc(d, `sessies/${CODE}/tekeningen`, "t1_0"), tekening({ id: "t1_0", nr: 0 })));
    // Een opdracht die nog niet begonnen is.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/tekeningen`, "t1_2"), tekening({ id: "t1_2", nr: 2 })));
    // Een naam alleen als de leraar namen vroeg.
    await assertFails(setDoc(doc(d, `sessies/${CODE}/tekeningen`, "t2_1"), tekening({ id: "t2_1", apparaat: "t2", auteur: "Jan" })));
  });

  it("alleen de host ziet de tekeningen en haalt er een weg", async () => {
    await zetSessie({ type: "tekenen", opties: [], tekenen });
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, `sessies/${CODE}/tekeningen`, "t1_1"), tekening()));
    await assertSucceeds(getDocs(collection(db(omgeving, "leraar"), `sessies/${CODE}/tekeningen`)));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), `sessies/${CODE}/tekeningen`)));
    await assertFails(getDoc(doc(db(omgeving, "anoniem"), `sessies/${CODE}/tekeningen`, "t1_1")));
    await assertFails(deleteDoc(doc(db(omgeving, "collega"), `sessies/${CODE}/tekeningen`, "t1_1")));
    await assertSucceeds(deleteDoc(doc(db(omgeving, "leraar"), `sessies/${CODE}/tekeningen`, "t1_1")));
  });
});
