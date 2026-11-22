// Maakt een back-up van al het materiaal in Open E-lab: oefeningen (met hun exit tickets en
// quizresultaten), mappen en deelcodes. Leest alleen; schrijft niets naar de databank.
// Werkt met de Admin SDK (application default credentials of GOOGLE_APPLICATION_CREDENTIALS).
//
//   FIREBASE_PROJECT_ID=mijn-project node scripts/backup/oefeningen.mjs [doelmap]
//
// Zonder doelmap komt de back-up in backups/<datum-tijd>/ (staat in .gitignore: er zitten
// antwoorden van cursisten in). Beelden in Firebase Storage zitten er niet bij.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DATABANK = process.env.FIRESTORE_DATABASE || process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || "(default)";

if (!PROJECT) {
  console.error("Stel FIREBASE_PROJECT_ID in, bv.: FIREBASE_PROJECT_ID=mijn-project node scripts/backup/oefeningen.mjs");
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId: PROJECT });
const db = DATABANK === "(default)" ? getFirestore() : getFirestore(DATABANK);

const stempel = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const doel = process.argv[2] ?? path.join("backups", stempel);
fs.mkdirSync(doel, { recursive: true });

/** Bewaart documenten als { pad: data } en geeft het aantal en de controlesom terug. */
function bewaar(naam, documenten) {
  const inhoud = JSON.stringify(documenten, null, 1);
  fs.writeFileSync(path.join(doel, `${naam}.json`), inhoud);
  return {
    aantal: Object.keys(documenten).length,
    bytes: Buffer.byteLength(inhoud),
    sha256: crypto.createHash("sha256").update(inhoud).digest("hex"),
  };
}

async function verzameling(naam) {
  const snap = await db.collection(naam).get();
  return Object.fromEntries(snap.docs.map((d) => [d.ref.path, d.data()]));
}

/** Een deelverzameling onder elke oefening, in één vraag. */
async function onderOefeningen(naam) {
  const snap = await db.collectionGroup(naam).get();
  return Object.fromEntries(
    snap.docs.filter((d) => d.ref.path.startsWith("oefeningen/")).map((d) => [d.ref.path, d.data()])
  );
}

const overzicht = { project: PROJECT, databank: DATABANK, gemaakt: new Date().toISOString(), bestanden: {} };
for (const naam of ["oefeningen", "mappen", "codes"]) {
  overzicht.bestanden[naam] = bewaar(naam, await verzameling(naam));
}
for (const naam of ["inzendingen", "resultaten"]) {
  overzicht.bestanden[naam] = bewaar(naam, await onderOefeningen(naam));
}
fs.writeFileSync(path.join(doel, "overzicht.json"), JSON.stringify(overzicht, null, 2));

console.log(`Back-up in ${path.resolve(doel)}`);
for (const [naam, { aantal, bytes }] of Object.entries(overzicht.bestanden)) {
  console.log(`  ${naam.padEnd(12)} ${String(aantal).padStart(6)} documenten  ${(bytes / 1024).toFixed(0)} kB`);
}
