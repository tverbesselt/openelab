/*
 * Vier dingen die altijd moeten werken:
 *   1. een leraar maakt een quiz en krijgt een code;
 *   2. een cursist oefent via die code, zonder account;
 *   3. een leraar start een snelle vraag, een cursist antwoordt op zijn toestel;
 *   4. wat niet bestaat, krijgt een melding met de weg terug.
 *
 * De tests lopen na elkaar in deze volgorde; de code uit test 1 gebruikt test 2.
 */
import { expect, test } from "@playwright/test";
import { cursistToestel, meldAanAlsLeraar } from "./helpers";

test.describe.configure({ mode: "serial" });

let quizCode = "";
const QUIZ_TITEL = `Rooktest hoofdsteden ${Date.now()}`;

test("een leraar maakt een quiz en krijgt een code", async ({ page }) => {
  await meldAanAlsLeraar(page);

  await page.goto("/maken");
  await page.getByRole("button", { name: /eenvoudige quiz/i }).click();

  await page.getByPlaceholder("Bijvoorbeeld: kennischeck elektriciteit").fill(QUIZ_TITEL);
  await page.getByPlaceholder("Je vraag").first().fill("Wat is de hoofdstad van Frankrijk?");
  await page.getByPlaceholder("Juist antwoord").first().fill("Parijs");
  await page.getByPlaceholder("Fout antwoord").first().fill("Lyon");
  await page.getByRole("button", { name: /maak mijn quiz/i }).click();

  // Het resultaatscherm toont elk gemaakt stuk met zijn code van zes tekens.
  const codeTekst = page.getByText(/code [A-Z0-9]{6}/).first();
  await expect(codeTekst).toBeVisible();
  quizCode = (await codeTekst.textContent())?.match(/code ([A-Z0-9]{6})/)?.[1] ?? "";
  expect(quizCode).toHaveLength(6);
});

test("een cursist oefent via de code, zonder account", async ({ browser }) => {
  test.skip(!quizCode, "geen code uit de vorige test");
  const { context, page } = await cursistToestel(browser);

  await page.goto(`/code/${quizCode}`);
  await expect(page).toHaveURL(/\/oefen\//);
  await expect(page.getByRole("heading", { name: QUIZ_TITEL })).toBeVisible();

  await page.getByRole("button", { name: "Parijs" }).click();
  await page.getByRole("button", { name: /controleer mijn antwoord/i }).click();
  await page.getByRole("button", { name: /bekijk je resultaat/i }).click();
  await expect(page.getByText("100%")).toBeVisible();

  await context.close();
});

test("een snelle vraag op het digibord, een antwoord van een toestel", async ({ page, browser }) => {
  await meldAanAlsLeraar(page);

  await page.goto("/live");
  await page.getByRole("button", { name: /snelle vraag/i }).click();
  await page
    .getByPlaceholder("Bijvoorbeeld: welke schakeling hoort bij dit schema?")
    .fill("Welke schakeling hoort bij dit schema?");
  await page.getByRole("button", { name: /toon op het digibord/i }).click();

  // De pincode staat als "123 456" op het projectiescherm.
  const pincodeTekst = page.locator("span.font-mono", { hasText: /^\d{3} \d{3}$/ }).first();
  await expect(pincodeTekst).toBeVisible();
  const pincode = ((await pincodeTekst.textContent()) ?? "").replace(/\D/g, "");
  expect(pincode).toHaveLength(6);

  const { context, page: toestel } = await cursistToestel(browser);
  await toestel.goto("/live/join");
  await toestel.getByLabel("Pincode van de sessie").fill(pincode);
  await toestel.getByRole("button", { name: /doe mee/i }).click();
  await expect(toestel.getByRole("heading", { name: "Welke schakeling hoort bij dit schema?" })).toBeVisible();
  await toestel.getByRole("button", { name: "B", exact: true }).click();
  await expect(toestel.getByText(/je antwoord is binnen|dank/i).first()).toBeVisible();

  // Het bord van de leraar ziet het antwoord binnenkomen.
  await expect(page.getByText("1 antwoord", { exact: true })).toBeVisible();

  await context.close();
});

test("een adres, een code en een oefening die niet bestaan, krijgen een melding met de weg terug", async ({ page }) => {
  await page.goto("/dit-adres-bestaat-niet");
  await expect(page.getByRole("heading", { name: "Deze pagina bestaat niet" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Naar start", exact: true })).toBeVisible();

  await page.goto("/code/ZZZZZZ");
  await expect(page.getByRole("heading", { name: "Deze code bestaat niet" })).toBeVisible();

  await page.goto("/oefen/bestaat-niet");
  await expect(page.getByRole("heading", { name: "Deze oefening bestaat niet" })).toBeVisible();
  await page.getByRole("link", { name: "Naar start", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});
