/*
 * Beheer: wie beheerder is, de instellingen van de app en de sleutel van OpenAI.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  assertFails,
  assertSucceeds,
  db,
  EMAIL,
  maakBeheerder,
  maakOmgeving,
  maakToegang,
  metRegelsUit,
  STANDAARD_TEST_INSTELLINGEN,
} from "./omgeving";

let omgeving: RulesTestEnvironment;

beforeAll(async () => {
  omgeving = await maakOmgeving("open-elab-rules-beheer");
});

afterAll(async () => {
  await omgeving.cleanup();
});

beforeEach(async () => {
  await omgeving.clearFirestore();
  await maakToegang(omgeving);
  await maakBeheerder(omgeving);
});

const INSTELLINGEN = {
  ...STANDAARD_TEST_INSTELLINGEN,
  uit: ["escaperoom"],
  tips: { cursisten: true, leraren: false },
};

describe("beheerders", () => {
  const nieuw = { toegevoegdDoor: EMAIL.beheerder.toLowerCase(), op: "2026-11-24T09:00:00.000Z" };

  it("een aangemelde gebruiker leest alleen zijn eigen vermelding en schrijft niets", async () => {
    await assertSucceeds(getDoc(doc(db(omgeving, "beheerder"), "beheerders", EMAIL.beheerder.toLowerCase())));
    await assertSucceeds(getDoc(doc(db(omgeving, "leraar"), "beheerders", EMAIL.leraar)));
    await assertFails(getDoc(doc(db(omgeving, "leraar"), "beheerders", EMAIL.beheerder.toLowerCase())));
    await assertFails(getDocs(collection(db(omgeving, "leraar"), "beheerders")));
    // Zichzelf beheerder maken kan niet.
    await assertFails(setDoc(doc(db(omgeving, "leraar"), "beheerders", EMAIL.leraar), nieuw));
    await assertFails(deleteDoc(doc(db(omgeving, "leraar"), "beheerders", EMAIL.beheerder.toLowerCase())));
  });

  it("een beheerder ziet de lijst, voegt een collega toe en haalt hem weer weg", async () => {
    const beheerder = db(omgeving, "beheerder");
    await assertSucceeds(getDocs(collection(beheerder, "beheerders")));
    await assertSucceeds(setDoc(doc(beheerder, "beheerders", EMAIL.leraar), nieuw));
    // Vanaf nu beheert die collega mee.
    await assertSucceeds(getDocs(collection(db(omgeving, "leraar"), "beheerders")));
    await assertSucceeds(deleteDoc(doc(beheerder, "beheerders", EMAIL.leraar)));
    await assertFails(getDocs(collection(db(omgeving, "leraar"), "beheerders")));
  });

  it("alleen een e-mailadres in kleine letters, zonder extra velden, en nooit jezelf weghalen", async () => {
    const beheerder = db(omgeving, "beheerder");
    await assertFails(setDoc(doc(beheerder, "beheerders", "geen-adres"), nieuw));
    // Met hoofdletters zou de regel isBeheerder() de vermelding nooit terugvinden.
    await assertFails(setDoc(doc(beheerder, "beheerders", "Sofie.Peeters@voorbeeld.school"), nieuw));
    await assertFails(setDoc(doc(beheerder, "beheerders", EMAIL.leraar), { ...nieuw, rol: "super" }));
    await assertSucceeds(setDoc(doc(beheerder, "beheerders", EMAIL.leraar), nieuw));
    // Een bestaande vermelding verandert niet, en zo blijft er altijd een beheerder over.
    await assertFails(updateDoc(doc(beheerder, "beheerders", EMAIL.leraar), { op: "later" }));
    await assertFails(deleteDoc(doc(beheerder, "beheerders", EMAIL.beheerder.toLowerCase())));
  });
});

describe("instellingen", () => {
  it("iedereen leest de instellingen, ook zonder account", async () => {
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, "instellingen", "app"), INSTELLINGEN));
    await assertSucceeds(getDoc(doc(db(omgeving, "anoniem"), "instellingen", "app")));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), "instellingen")));
    await assertFails(getDoc(doc(db(omgeving, "anoniem"), "instellingen", "anders")));
  });

  it("alleen een beheerder schrijft, en alleen de verwachte vorm", async () => {
    await assertFails(setDoc(doc(db(omgeving, "leraar"), "instellingen", "app"), INSTELLINGEN));
    await assertSucceeds(setDoc(doc(db(omgeving, "beheerder"), "instellingen", "app"), INSTELLINGEN));
    await assertFails(setDoc(doc(db(omgeving, "beheerder"), "instellingen", "app"), { ...INSTELLINGEN, extra: 1 }));
    await assertFails(
      setDoc(doc(db(omgeving, "beheerder"), "instellingen", "app"), { ...INSTELLINGEN, uit: "escaperoom" })
    );
    await assertFails(
      setDoc(doc(db(omgeving, "beheerder"), "instellingen", "app"), {
        ...INSTELLINGEN,
        tips: { cursisten: "ja", leraren: true },
      })
    );
    await assertFails(deleteDoc(doc(db(omgeving, "beheerder"), "instellingen", "app")));
  });
});

describe("geheimen", () => {
  const sleutel = { sleutel: "sk-" + "a".repeat(40) };

  it("een beheerder zet of wist de sleutel, maar niemand leest hem terug", async () => {
    await assertSucceeds(setDoc(doc(db(omgeving, "beheerder"), "geheimen", "openai"), sleutel));
    await assertFails(getDoc(doc(db(omgeving, "beheerder"), "geheimen", "openai")));
    await assertFails(getDoc(doc(db(omgeving, "leraar"), "geheimen", "openai")));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), "geheimen")));
    await assertSucceeds(deleteDoc(doc(db(omgeving, "beheerder"), "geheimen", "openai")));
  });

  it("een gewone leraar zet geen sleutel; een typfout komt er niet in", async () => {
    await assertFails(setDoc(doc(db(omgeving, "leraar"), "geheimen", "openai"), sleutel));
    await assertFails(setDoc(doc(db(omgeving, "beheerder"), "geheimen", "openai"), { sleutel: "geen sleutel" }));
    await assertFails(setDoc(doc(db(omgeving, "beheerder"), "geheimen", "openai"), { ...sleutel, bron: "x" }));
    await assertFails(setDoc(doc(db(omgeving, "beheerder"), "geheimen", "anders"), sleutel));
  });

  it("een bestaande sleutel vervangen mag, zonder extra velden", async () => {
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, "geheimen", "openai"), sleutel));
    await assertSucceeds(updateDoc(doc(db(omgeving, "beheerder"), "geheimen", "openai"), { sleutel: "sk-" + "b".repeat(40) }));
    await assertFails(updateDoc(doc(db(omgeving, "beheerder"), "geheimen", "openai"), { notitie: "x" }));
  });
});
