/*
 * Storage: de foto's en audiofragmenten bij quizvragen, in media/<uid>/<bestand>.
 */
import { afterAll, beforeAll, describe, it } from "vitest";
import { deleteObject, getBytes, listAll, ref, uploadBytes } from "firebase/storage";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import type { FirebaseStorage } from "firebase/storage";
import { als, assertFails, assertSucceeds, maakOmgeving, maakToegang, type Persoon, UID } from "./omgeving";

let omgeving: RulesTestEnvironment;

beforeAll(async () => {
  // Moet overeenkomen met --project in package.json, zodat cross-service firestore.get()
  // in de Storage-emulator dezelfde Firestore-projectruimte leest.
  omgeving = await maakOmgeving("demo-open-elab", true);
  await omgeving.clearFirestore();
  await maakToegang(omgeving);
});

afterAll(async () => {
  await omgeving.cleanup();
});

// De testomgeving laadt storage.rules in de standaardbucket van het testproject.
function opslag(wie: Persoon): FirebaseStorage {
  return als(omgeving, wie).storage() as unknown as FirebaseStorage;
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("media", () => {
  it("een leraar uploadt een foto in zijn eigen map; iedereen mag ze ophalen", async () => {
    await assertSucceeds(
      uploadBytes(ref(opslag("leraar"), `media/${UID.leraar}/foto.png`), PNG, { contentType: "image/png" })
    );
    await assertSucceeds(getBytes(ref(opslag("anoniem"), `media/${UID.leraar}/foto.png`)));
    await assertFails(listAll(ref(opslag("anoniem"), `media/${UID.leraar}`)));
    await assertFails(listAll(ref(opslag("leraar"), `media/${UID.leraar}`)));
  });

  it("niet in de map van een collega, niet als cursist, niet zonder account", async () => {
    await assertFails(
      uploadBytes(ref(opslag("collega"), `media/${UID.leraar}/kaap.png`), PNG, { contentType: "image/png" })
    );
    await assertFails(
      uploadBytes(ref(opslag("cursist"), `media/${UID.cursist}/foto.png`), PNG, { contentType: "image/png" })
    );
    await assertFails(uploadBytes(ref(opslag("anoniem"), "media/iemand/foto.png"), PNG, { contentType: "image/png" }));
  });

  it("alleen foto's en audio; geen SVG, pdf of tekst", async () => {
    const eigen = (naam: string) => ref(opslag("leraar"), `media/${UID.leraar}/${naam}`);
    await assertSucceeds(uploadBytes(eigen("fragment.webm"), PNG, { contentType: "audio/webm" }));
    await assertFails(uploadBytes(eigen("logo.svg"), PNG, { contentType: "image/svg+xml" }));
    await assertFails(uploadBytes(eigen("cursus.pdf"), PNG, { contentType: "application/pdf" }));
    await assertFails(uploadBytes(eigen("script.html"), PNG, { contentType: "text/html" }));
  });

  // Overschrijven staat in de regels dicht (update: false), maar de emulator ziet een upload
  // over een bestaand bestand als create. Daarom testen we dat hier niet.
  it("wissen doet alleen de eigenaar", async () => {
    const pad = `media/${UID.leraar}/vast.png`;
    await assertSucceeds(uploadBytes(ref(opslag("leraar"), pad), PNG, { contentType: "image/png" }));
    await assertFails(deleteObject(ref(opslag("collega"), pad)));
    await assertSucceeds(deleteObject(ref(opslag("leraar"), pad)));
  });

  it("buiten media/ is alles dicht", async () => {
    await assertFails(uploadBytes(ref(opslag("leraar"), "anders/foto.png"), PNG, { contentType: "image/png" }));
    await assertFails(getBytes(ref(opslag("anoniem"), "anders/foto.png")));
  });
});
