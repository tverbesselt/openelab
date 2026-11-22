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
  it("een aangemelde gebruiker leest alleen zijn eigen vermelding; niemand schrijft", async () => {
    await assertSucceeds(getDoc(doc(db(omgeving, "beheerder"), "beheerders", EMAIL.beheerder.toLowerCase())));
    await assertFails(getDoc(doc(db(omgeving, "leraar"), "beheerders", EMAIL.beheerder.toLowerCase())));
    await assertFails(getDocs(collection(db(omgeving, "beheerder"), "beheerders")));
    await assertFails(setDoc(doc(db(omgeving, "beheerder"), "beheerders", EMAIL.leraar), { sinds: "nu" }));
    await assertFails(deleteDoc(doc(db(omgeving, "beheerder"), "beheerders", EMAIL.beheerder.toLowerCase())));
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
