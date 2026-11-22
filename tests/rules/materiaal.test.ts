/*
 * Oefeningen, mappen, codes, exit tickets, quizresultaten en gespreid herhalen.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  assertFails,
  assertSucceeds,
  db,
  lesmap,
  maakBeheerder,
  maakOmgeving,
  maakToegang,
  metRegelsUit,
  NU,
  oefening,
  UID,
} from "./omgeving";

let omgeving: RulesTestEnvironment;

beforeAll(async () => {
  omgeving = await maakOmgeving("open-elab-rules-materiaal");
});

afterAll(async () => {
  await omgeving.cleanup();
});

beforeEach(async () => {
  await omgeving.clearFirestore();
  await maakToegang(omgeving);
});

describe("oefeningen", () => {
  it("wie de link heeft, mag één oefening ophalen, ook zonder account", async () => {
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, "oefeningen", "o1"), oefening({ visibility: "prive" })));
    await assertSucceeds(getDoc(doc(db(omgeving, "anoniem"), "oefeningen", "o1")));
  });

  it("een lijst zonder filter is dicht: die zou privé materiaal van collega's bevatten", async () => {
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, "oefeningen", "o1"), oefening()));
    await assertFails(getDocs(collection(db(omgeving, "collega"), "oefeningen")));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), "oefeningen")));
  });

  it("de lijst van gedeeld materiaal en van eigen materiaal mag wel", async () => {
    await metRegelsUit(omgeving, async (d) => {
      await setDoc(doc(d, "oefeningen", "o1"), oefening());
      await setDoc(doc(d, "oefeningen", "o2"), oefening({ visibility: "prive" }));
    });
    const ref = collection(db(omgeving, "collega"), "oefeningen");
    await assertSucceeds(getDocs(query(ref, where("visibility", "==", "organisatie"))));
    await assertSucceeds(
      getDocs(query(collection(db(omgeving, "leraar"), "oefeningen"), where("creatorId", "==", UID.leraar)))
    );
    // Een collega die het privé materiaal van de leraar opvraagt, vangt bot.
    await assertFails(getDocs(query(ref, where("creatorId", "==", UID.leraar))));
  });

  it("alleen personeel maakt materiaal, en alleen op eigen naam", async () => {
    await assertSucceeds(setDoc(doc(db(omgeving, "leraar"), "oefeningen", "o1"), oefening()));
    await assertFails(setDoc(doc(db(omgeving, "cursist"), "oefeningen", "o2"), oefening({ creatorId: UID.cursist })));
    await assertFails(
      setDoc(doc(db(omgeving, "buitenstaander"), "oefeningen", "o3"), oefening({ creatorId: UID.buitenstaander }))
    );
    await assertFails(setDoc(doc(db(omgeving, "anoniem"), "oefeningen", "o4"), oefening()));
    // Een leraar die materiaal op naam van een collega zet.
    await assertFails(setDoc(doc(db(omgeving, "collega"), "oefeningen", "o5"), oefening()));
  });

  it("de vorm wordt nagekeken: titel, zichtbaarheid en code", async () => {
    const d = db(omgeving, "leraar");
    await assertFails(setDoc(doc(d, "oefeningen", "o1"), oefening({ title: "x".repeat(201) })));
    await assertFails(setDoc(doc(d, "oefeningen", "o2"), oefening({ visibility: "publiek" })));
    await assertFails(setDoc(doc(d, "oefeningen", "o3"), oefening({ shareCode: "VEELTELANGECODE" })));
  });

  it("wijzigen en wissen doet alleen de maker, en de maker blijft dezelfde", async () => {
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, "oefeningen", "o1"), oefening()));
    await assertSucceeds(updateDoc(doc(db(omgeving, "leraar"), "oefeningen", "o1"), { title: "Nieuwe titel" }));
    await assertFails(updateDoc(doc(db(omgeving, "collega"), "oefeningen", "o1"), { title: "Gekaapt" }));
    await assertFails(updateDoc(doc(db(omgeving, "leraar"), "oefeningen", "o1"), { creatorId: UID.collega }));
    await assertFails(deleteDoc(doc(db(omgeving, "collega"), "oefeningen", "o1")));
    await assertSucceeds(deleteDoc(doc(db(omgeving, "leraar"), "oefeningen", "o1")));
  });
});

describe("exit tickets en quizresultaten", () => {
  beforeEach(async () => {
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, "oefeningen", "o1"), oefening()));
  });

  it("iedereen stuurt een exit ticket in, alleen de maker leest ze", async () => {
    const inzending = { antwoorden: ["Goed", "Minder"], op: NU };
    await assertSucceeds(setDoc(doc(db(omgeving, "anoniem"), "oefeningen/o1/inzendingen", "i1"), inzending));
    await assertSucceeds(getDocs(collection(db(omgeving, "leraar"), "oefeningen/o1/inzendingen")));
    await assertFails(getDocs(collection(db(omgeving, "collega"), "oefeningen/o1/inzendingen")));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), "oefeningen/o1/inzendingen")));
  });

  it("een inzending is beperkt in vorm en kan niet meer veranderen", async () => {
    const d = db(omgeving, "anoniem");
    await assertFails(setDoc(doc(d, "oefeningen/o1/inzendingen", "i1"), { antwoorden: ["a"], op: NU, naam: "Jan" }));
    await assertFails(
      setDoc(doc(d, "oefeningen/o1/inzendingen", "i2"), { antwoorden: new Array(11).fill("a"), op: NU })
    );
    await assertSucceeds(setDoc(doc(d, "oefeningen/o1/inzendingen", "i3"), { antwoorden: ["a"], op: NU }));
    await assertFails(updateDoc(doc(d, "oefeningen/o1/inzendingen", "i3"), { antwoorden: ["b"] }));
    await assertFails(deleteDoc(doc(db(omgeving, "leraar"), "oefeningen/o1/inzendingen", "i3")));
  });

  it("quizresultaten zijn anoniem en geaggregeerd", async () => {
    const d = db(omgeving, "anoniem");
    await assertSucceeds(
      setDoc(doc(d, "oefeningen/o1/resultaten", "r1"), { foutVragen: ["q1"], aantalVragen: 5, op: NU })
    );
    await assertFails(
      setDoc(doc(d, "oefeningen/o1/resultaten", "r2"), { foutVragen: ["q1"], aantalVragen: 5, op: NU, wie: "Jan" })
    );
    await assertFails(setDoc(doc(d, "oefeningen/o1/resultaten", "r3"), { foutVragen: [], aantalVragen: 0, op: NU }));
    await assertSucceeds(getDocs(collection(db(omgeving, "leraar"), "oefeningen/o1/resultaten")));
    await assertFails(getDocs(collection(db(omgeving, "collega"), "oefeningen/o1/resultaten")));
  });
});

describe("mappen", () => {
  it("een persoonlijke map is van de leraar die ze maakte", async () => {
    await assertSucceeds(setDoc(doc(db(omgeving, "leraar"), "mappen", "m1"), lesmap()));
    await assertSucceeds(getDoc(doc(db(omgeving, "anoniem"), "mappen", "m1")));
    await assertSucceeds(updateDoc(doc(db(omgeving, "leraar"), "mappen", "m1"), { title: "Les 2" }));
    await assertFails(updateDoc(doc(db(omgeving, "collega"), "mappen", "m1"), { title: "Gekaapt" }));
    await assertFails(updateDoc(doc(db(omgeving, "leraar"), "mappen", "m1"), { shareCode: "ANDERS" }));
    await assertFails(deleteDoc(doc(db(omgeving, "collega"), "mappen", "m1")));
    await assertSucceeds(deleteDoc(doc(db(omgeving, "leraar"), "mappen", "m1")));
  });

  it("een organisatiemap maakt alleen een beheerder, en elke beheerder mag ze wijzigen", async () => {
    await maakBeheerder(omgeving);
    await assertFails(setDoc(doc(db(omgeving, "leraar"), "mappen", "org1"), lesmap({ organisatie: true })));
    await assertSucceeds(
      setDoc(doc(db(omgeving, "beheerder"), "mappen", "org1"), lesmap({ organisatie: true, creatorId: UID.beheerder }))
    );
    // Een gewone leraar ziet de lijst, maar wijzigt niets.
    await assertSucceeds(
      getDocs(query(collection(db(omgeving, "leraar"), "mappen"), where("organisatie", "==", true)))
    );
    await assertFails(updateDoc(doc(db(omgeving, "leraar"), "mappen", "org1"), { title: "Gekaapt" }));
    // Een map verandert nooit van soort.
    await assertFails(updateDoc(doc(db(omgeving, "beheerder"), "mappen", "org1"), { organisatie: false }));
    await assertSucceeds(updateDoc(doc(db(omgeving, "beheerder"), "mappen", "org1"), { title: "Wiskunde" }));
  });

  describe("organisatiemappen in organisatiemappen", () => {
    const orgMap = (extra: Record<string, unknown> = {}) =>
      lesmap({ organisatie: true, creatorId: UID.beheerder, ...extra });

    beforeEach(async () => {
      await maakBeheerder(omgeving);
      await metRegelsUit(omgeving, async (d) => {
        await setDoc(doc(d, "mappen", "nt2"), orgMap({ title: "Nederlands tweede taal", shareCode: "ORGNT2" }));
        await setDoc(doc(d, "mappen", "wis"), orgMap({ title: "Wiskunde", shareCode: "ORGWIS" }));
        await setDoc(doc(d, "mappen", "eigen"), lesmap({ shareCode: "EIGEN1" }));
      });
    });

    it("een beheerder zet een organisatiemap in een organisatiemap", async () => {
      await assertSucceeds(
        setDoc(doc(db(omgeving, "beheerder"), "mappen", "rg1"), orgMap({ title: "Richtgraad 1", bovenMapId: "nt2" }))
      );
      // Verplaatsen naar een andere organisatiemap, en terug naar het hoogste niveau.
      await assertSucceeds(updateDoc(doc(db(omgeving, "beheerder"), "mappen", "rg1"), { bovenMapId: "wis" }));
      await assertSucceeds(
        updateDoc(doc(db(omgeving, "beheerder"), "mappen", "rg1"), { bovenMapId: deleteField() })
      );
      await assertSucceeds(updateDoc(doc(db(omgeving, "beheerder"), "mappen", "wis"), { bovenMapId: "nt2" }));
    });

    it("een gewone leraar zet geen organisatiemap in een andere", async () => {
      await assertFails(
        setDoc(
          doc(db(omgeving, "leraar"), "mappen", "rg1"),
          lesmap({ organisatie: true, title: "Richtgraad 1", bovenMapId: "nt2" })
        )
      );
      await assertFails(updateDoc(doc(db(omgeving, "leraar"), "mappen", "wis"), { bovenMapId: "nt2" }));
    });

    it("een persoonlijke map heeft geen bovenmap", async () => {
      await assertFails(
        setDoc(doc(db(omgeving, "leraar"), "mappen", "m2"), lesmap({ shareCode: "MAP002", bovenMapId: "nt2" }))
      );
      await assertFails(updateDoc(doc(db(omgeving, "leraar"), "mappen", "eigen"), { bovenMapId: "nt2" }));
      // Gewoon aanpassen blijft kunnen.
      await assertSucceeds(updateDoc(doc(db(omgeving, "leraar"), "mappen", "eigen"), { title: "Les 2" }));
    });

    it("de bovenmap is een bestaande organisatiemap", async () => {
      const beheerder = db(omgeving, "beheerder");
      // Een map die niet bestaat.
      await assertFails(setDoc(doc(beheerder, "mappen", "rg1"), orgMap({ bovenMapId: "bestaatniet" })));
      // Een persoonlijke map.
      await assertFails(setDoc(doc(beheerder, "mappen", "rg1"), orgMap({ bovenMapId: "eigen" })));
      // Geen tekst.
      await assertFails(setDoc(doc(beheerder, "mappen", "rg1"), orgMap({ bovenMapId: 42 })));
      // In zichzelf.
      await assertFails(updateDoc(doc(beheerder, "mappen", "nt2"), { bovenMapId: "nt2" }));
      // In haar eigen submap.
      await assertSucceeds(updateDoc(doc(beheerder, "mappen", "wis"), { bovenMapId: "nt2" }));
      await assertFails(updateDoc(doc(beheerder, "mappen", "nt2"), { bovenMapId: "wis" }));
    });

    it("een submap waarvan de bovenmap verdween, blijft aan te passen", async () => {
      await metRegelsUit(omgeving, (d) =>
        setDoc(doc(d, "mappen", "wees"), orgMap({ title: "Wees", shareCode: "ORGWEE", bovenMapId: "weg" }))
      );
      await assertSucceeds(updateDoc(doc(db(omgeving, "beheerder"), "mappen", "wees"), { title: "Lezen" }));
      await assertFails(updateDoc(doc(db(omgeving, "beheerder"), "mappen", "wees"), { bovenMapId: "ookweg" }));
    });

    it("bij verwijderen schuiven de submappen in één keer een niveau hoger", async () => {
      await metRegelsUit(omgeving, async (d) => {
        await setDoc(doc(d, "mappen", "rg2"), orgMap({ title: "Richtgraad 2", shareCode: "ORGRG2", bovenMapId: "nt2" }));
        await setDoc(doc(d, "mappen", "lezen"), orgMap({ title: "Lezen", shareCode: "ORGLEZ", bovenMapId: "rg2" }));
      });
      const beheerder = db(omgeving, "beheerder");
      // Zo zoekt de app de submappen op.
      await assertSucceeds(
        getDocs(
          query(collection(beheerder, "mappen"), where("organisatie", "==", true), where("bovenMapId", "==", "rg2"))
        )
      );
      const batch = writeBatch(beheerder);
      batch.delete(doc(beheerder, "mappen", "rg2"));
      batch.update(doc(beheerder, "mappen", "lezen"), { bovenMapId: "nt2" });
      await assertSucceeds(batch.commit());
    });
  });

  it("cursisten en buitenstaanders vragen geen lijsten op", async () => {
    await metRegelsUit(omgeving, (d) => setDoc(doc(d, "mappen", "org1"), lesmap({ organisatie: true })));
    const q = (wie: "cursist" | "anoniem" | "buitenstaander") =>
      getDocs(query(collection(db(omgeving, wie), "mappen"), where("organisatie", "==", true)));
    await assertFails(q("cursist"));
    await assertFails(q("anoniem"));
    await assertFails(q("buitenstaander"));
  });
});

describe("codes", () => {
  it("een code leidt iedereen naar een oefening, maar alleen personeel maakt ze", async () => {
    const code = { soort: "oefening", doelId: "o1", creatorId: UID.leraar };
    await assertSucceeds(setDoc(doc(db(omgeving, "leraar"), "codes", "ABC123"), code));
    await assertSucceeds(getDoc(doc(db(omgeving, "anoniem"), "codes", "ABC123")));
    await assertFails(getDocs(collection(db(omgeving, "anoniem"), "codes")));
    await assertFails(setDoc(doc(db(omgeving, "cursist"), "codes", "DEF456"), { ...code, creatorId: UID.cursist }));
    // Een bestaande code neem je niet over.
    await assertFails(setDoc(doc(db(omgeving, "collega"), "codes", "ABC123"), { ...code, creatorId: UID.collega }));
    await assertFails(updateDoc(doc(db(omgeving, "leraar"), "codes", "ABC123"), { doelId: "o2" }));
  });

  it("de code van een organisatiemap vraagt een beheerder", async () => {
    await maakBeheerder(omgeving);
    const code = { soort: "map", doelId: "org1", organisatie: true };
    await assertFails(setDoc(doc(db(omgeving, "leraar"), "codes", "ORG001"), { ...code, creatorId: UID.leraar }));
    await assertSucceeds(
      setDoc(doc(db(omgeving, "beheerder"), "codes", "ORG001"), { ...code, creatorId: UID.beheerder })
    );
    // Een andere beheerder ruimt ze op; een gewone leraar niet.
    await assertFails(deleteDoc(doc(db(omgeving, "leraar"), "codes", "ORG001")));
    await assertSucceeds(deleteDoc(doc(db(omgeving, "beheerder"), "codes", "ORG001")));
  });
});

describe("gespreid herhalen", () => {
  const item = { id: "o1_k1", oefeningId: "o1", kaartId: "k1", doos: 2, volgende: "2026-10-12", bijgewerkt: NU };

  it("blijft van de cursist zelf; ook de leraar leest het niet", async () => {
    await assertSucceeds(setDoc(doc(db(omgeving, "cursist"), `herhalingen/${UID.cursist}/items`, "o1_k1"), item));
    await assertSucceeds(getDocs(collection(db(omgeving, "cursist"), `herhalingen/${UID.cursist}/items`)));
    await assertFails(getDocs(collection(db(omgeving, "leraar"), `herhalingen/${UID.cursist}/items`)));
    await assertFails(setDoc(doc(db(omgeving, "leraar"), `herhalingen/${UID.cursist}/items`, "o1_k2"), item));
    await assertFails(setDoc(doc(db(omgeving, "anoniem"), "herhalingen/iemand/items", "o1_k1"), item));
  });

  it("de Leitner-doos blijft tussen 0 en 5", async () => {
    const d = db(omgeving, "cursist");
    await assertFails(setDoc(doc(d, `herhalingen/${UID.cursist}/items`, "x"), { ...item, doos: 6 }));
    await assertFails(setDoc(doc(d, `herhalingen/${UID.cursist}/items`, "y"), { ...item, extra: true }));
  });
});

describe("al de rest", () => {
  it("een onbekende collectie is dicht, ook voor een beheerder", async () => {
    await maakBeheerder(omgeving);
    await assertFails(setDoc(doc(db(omgeving, "beheerder"), "logboek", "x"), { a: 1 }));
    await assertFails(getDoc(doc(db(omgeving, "leraar"), "gebruikers", "x")));
  });
});
