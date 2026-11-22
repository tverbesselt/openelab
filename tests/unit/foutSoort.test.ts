import { describe, expect, it } from "vitest";
import { isVerbindingsfout } from "@/lib/foutSoort";

function fout(naam: string, bericht: string, code?: string): Error {
  const e = new Error(bericht);
  e.name = naam;
  if (code) (e as Error & { code: string }).code = code;
  return e;
}

describe("isVerbindingsfout", () => {
  it("zonder internet is elke fout een verbindingsfout", () => {
    expect(isVerbindingsfout(new Error("iets"), false)).toBe(true);
    expect(isVerbindingsfout(null, false)).toBe(true);
  });

  it("herkent een deel van de pagina dat niet geladen raakt", () => {
    expect(isVerbindingsfout(fout("ChunkLoadError", "Loading chunk 12 failed."), true)).toBe(true);
    expect(isVerbindingsfout(fout("Error", "Loading chunk 12 failed."), true)).toBe(true);
  });

  it("herkent een mislukte aanvraag en een onbereikbare Firestore", () => {
    expect(isVerbindingsfout(fout("TypeError", "Failed to fetch"), true)).toBe(true);
    expect(isVerbindingsfout(fout("FirebaseError", "Could not reach backend", "unavailable"), true)).toBe(true);
  });

  it("een gewone fout in de app is geen verbindingsfout", () => {
    expect(isVerbindingsfout(fout("TypeError", "x is undefined"), true)).toBe(false);
    expect(isVerbindingsfout(fout("FirebaseError", "Missing permissions", "permission-denied"), true)).toBe(false);
    expect(isVerbindingsfout("tekst", true)).toBe(false);
  });
});
