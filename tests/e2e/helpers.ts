/*
 * Hulpfuncties voor de rooktests.
 *
 * Aanmelden gaat buiten het Google-venster om: de test zet de schooldomeinen klaar in de
 * Firestore-emulator, maakt het account aan in de Auth-emulator en meldt de browser aan met
 * een custom token.
 */
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

export const LERAAR = { email: "leraar@voorbeeld.school", naam: "Alex De Vries" };

const AUTH = (process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099").replace(/^https?:\/\//, "");
const FIRESTORE = (process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8089").replace(/^https?:\/\//, "");
const PROJECT = "demo-open-elab";

function base64url(x: string): string {
  return Buffer.from(x).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Een ongetekend custom token; de emulator aanvaardt dat. */
function customToken(uid: string): string {
  const nu = Math.floor(Date.now() / 1000);
  const kop = base64url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const inhoud = base64url(
    JSON.stringify({
      iss: `firebase-auth-emulator@${PROJECT}.iam.gserviceaccount.com`,
      sub: `firebase-auth-emulator@${PROJECT}.iam.gserviceaccount.com`,
      aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: nu,
      exp: nu + 3600,
      uid,
    })
  );
  return `${kop}.${inhoud}.`;
}

/** Zet voorbeeld.school als leraardomein in de Firestore-emulator zodat aanmelden en schrijven mag. */
async function zetTestToegang(): Promise<void> {
  const antwoord = await fetch(
    `http://${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents/instellingen/app`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({
        fields: {
          naam: { stringValue: "Open E-lab" },
          organisatie: { stringValue: "Voorbeeldschool" },
          logo: { nullValue: null },
          kleur: { stringValue: "#2f6fde" },
          uit: { arrayValue: { values: [] } },
          tips: {
            mapValue: {
              fields: {
                cursisten: { booleanValue: true },
                leraren: { booleanValue: true },
              },
            },
          },
          toegang: {
            mapValue: {
              fields: {
                leraarDomeinen: { arrayValue: { values: [{ stringValue: "voorbeeld.school" }] } },
                cursistDomeinen: { arrayValue: { values: [] } },
                cursistPatroon: { stringValue: "" },
              },
            },
          },
        },
      }),
    }
  );
  if (!antwoord.ok) {
    throw new Error(`Testtoegang klaarzetten mislukte: ${antwoord.status} ${await antwoord.text()}`);
  }
}

/**
 * Het account aanmaken in de emulator, als Google-account met dit e-mailadres. Geeft de uid
 * terug die de emulator koos.
 */
async function maakAccount(): Promise<string> {
  const idToken = JSON.stringify({
    sub: "google-leraar-test",
    email: LERAAR.email,
    email_verified: true,
    name: LERAAR.naam,
  });
  const antwoord = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=emulator`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      postBody: `id_token=${encodeURIComponent(idToken)}&providerId=google.com`,
      requestUri: "http://localhost",
      returnIdpCredential: true,
      returnSecureToken: true,
    }),
  });
  if (!antwoord.ok) {
    throw new Error(`Account aanmaken in de Auth-emulator mislukte: ${antwoord.status} ${await antwoord.text()}`);
  }
  const data = (await antwoord.json()) as { localId?: string };
  if (!data.localId) throw new Error("De Auth-emulator gaf geen uid terug.");
  return data.localId;
}

/** Een leraar aanmelden met het schoolaccount. */
export async function meldAanAlsLeraar(page: Page): Promise<void> {
  await zetTestToegang();
  const uid = await maakAccount();
  await page.goto("/");
  await page.waitForFunction(
    () => typeof (window as { __openElabTestAanmelden?: unknown }).__openElabTestAanmelden === "function"
  );
  await page.evaluate(
    (token) =>
      (window as unknown as { __openElabTestAanmelden: (t: string) => Promise<unknown> }).__openElabTestAanmelden(
        token
      ),
    customToken(uid)
  );
  // Aangemeld: de aanmeldknop in de kop verdwijnt en de naam verschijnt.
  await expect(page.getByRole("link", { name: "Aanmelden" })).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByText(LERAAR.naam).first()).toBeVisible({ timeout: 15_000 });
}

/** Een tweede browser, zonder aanmelding: de cursist met zijn eigen toestel. */
export async function cursistToestel(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  return { context, page };
}
