# Open E-lab installeren

Je kan Open E-lab op vier manieren draaien: om uit te proberen (demomodus), via Docker op een eigen server, op Vercel/Coolify, of via Firebase App Hosting.

> **Ben je ICT-coördinator en zoek je een nog eenvoudigere 100% zelf-gehoste versie zonder Firebase (bv. met Microsoft 365 / Smartschool en lokale opslag)?** Lees dan ook [docs/ZELF_HOSTEN_ONDERZOEK.md](ZELF_HOSTEN_ONDERZOEK.md).

---

## 1. Snel uitproberen (demomodus)

Zonder configuratie draait Open E-lab direct in demomodus. Alle gegevens blijven lokaal in de browser, met voorbeeldmateriaal erbij.

### Met Node.js (20+)

```bash
npm install
npm run dev
```

### Met Docker Compose

```bash
docker compose up -d --build
```

Ga naar <http://localhost:3000/aanmelden> en kies **Bekijk als leraar** (de demoleraar is meteen ook beheerder, dus `/beheer` werkt direct).

---

## 2. Firebase-project opzetten (voor gedeelde schoolomgeving)

Voor gedeeld materiaal over toestellen, live-sessies op het digibord en Google-aanmelding heeft de huidige versie een Firebase-project nodig:

1. Maak een nieuw project aan in de [Firebase-console](https://console.firebase.google.com) (kies bij Firestore een Europese regio zoals `eur3` of `europe-west1`).
2. **Authentication:** zet de aanmeldmethode **Google** aan. Voeg onder *Settings > Authorized domains* het domein toe waarop Open E-lab draait (bv. `lab.jouwschool.be`).
3. **Firestore Database:** maak de standaarddatabank `(default)` aan in productiemodus.
4. **Storage** *(optioneel, voor eigen foto's en audio bij quizvragen)*: maak de standaardbucket aan.
5. **Web-app registreren:** ga naar *Projectinstellingen > Je apps > Web-app toevoegen* en kopieer `apiKey`, `authDomain`, `projectId`, `appId` en (optioneel) `storageBucket` naar `.env.local` (zie `.env.example`).
6. **Beveiligingsregels en indexen uitrollen:**

   ```bash
   npx firebase login
   npx firebase use <jouw-project-id>
   npx firebase deploy --only firestore,storage
   ```

---

## 3. De eerste beheerder aanmaken

Beheerders staan in Firestore in de collectie `beheerders`, zodat niemand zichzelf via de app beheerder kan maken.

1. Open Firestore in de Firebase-console.
2. Maak een collectie `beheerders`.
3. Maak een document met als **Document ID** het e-mailadres van de eerste beheerder, **volledig in kleine letters** (bv. `ict@jouwschool.be`). Een leeg document (of één veld zoals `sinds: "2026-11-22"`) volstaat.

Een beheerder mag altijd aanmelden als leraar, ook voordat de schooldomeinen ingesteld zijn.

Volgende beheerders voeg je toe in de app zelf, onder **Beheer > Beheerders**. Daar haal je ze ook weer weg; jezelf weghalen kan niet, zodat er altijd een beheerder overblijft.

---

## 4. Huisstijl en toegang instellen in de app

Meld je aan met het beheerder-account en klik op het **tandwiel (Beheer)** rechtsboven (`/beheer`):

1. **Huisstijl:** vul de naam van de app, de naam van je school, je logo en je schoolkleur in.
2. **Toegang:**
   - **E-maildomeinen van leraren:** bv. `jouwschool.be`
   - **E-maildomeinen van cursisten:** bv. `leerlingen.jouwschool.be`, of `*` voor elk Google-account.
   - **Patroon voor cursistenaccounts** *(optioneel)*: nodig als leraren en leerlingen hetzelfde domein delen (bv. `s[0-9]+@jouwschool[.]be`).
3. Klik op **Bewaren**. De instellingen en toegangsregels gelden direct voor iedereen (ook in `firestore.rules` en `storage.rules`).

---

## 5. Online zetten (hosting)

Elke host die Next.js (Node.js) draait werkt.

### Optie A — Eigen server / VPS / NAS met Docker Compose

1. Kopieer `.env.example` naar `.env` en vul de `NEXT_PUBLIC_FIREBASE_*`-waarden in.
2. Bouw en start de container:

   ```bash
   docker compose up -d --build
   ```

3. Zet een reverse proxy met HTTPS (bv. Caddy, Nginx Proxy Manager of Traefik) voor poort `3000`.

### Optie B — Vercel of Coolify

1. Koppel je fork van `openelab` aan Vercel of Coolify.
2. Vul de `NEXT_PUBLIC_FIREBASE_*`-omgevingsvariabelen in.
3. Deploy. Vergeet niet het toegekende domein toe te voegen onder *Firebase Authentication > Settings > Authorized domains*.

### Optie C — Firebase App Hosting

1. Vul de waarden in `apphosting.yaml` in.
2. Maak een backend aan en rol uit:

   ```bash
   npx firebase apphosting:backends:create
   ```

---

## 6. Spraak aanzetten (optioneel)

Voor *Inlezen* en *Audio naar tekst* (via OpenAI Whisper) is een OpenAI API-sleutel nodig:

- **Eenvoudigste manier (Docker / Vercel / Coolify):** zet `OPENAI_API_KEY=sk-...` als omgevingsvariabele op de server.
- **Via Beheer > Spraak in de app:**
  - Op **Firebase App Hosting** werkt dit automatisch met de standaardidentiteit van de backend (rol *Cloud Datastore User*).
  - Op **Docker / Vercel / eigen server** geef je een serviceaccount-JSON (rol *Cloud Datastore User*) mee via `FIREBASE_SERVICE_ACCOUNT`.

---

## 7. Back-up maken

Met het bijgeleverde script maak je een lokale JSON-back-up van alle oefeningen, mappen, deelcodes, exit tickets en anonieme quizresultaten:

```bash
FIREBASE_PROJECT_ID=<jouw-project-id> node scripts/backup/oefeningen.mjs
```

De back-up komt in `backups/<datum-tijd>/` (staat in `.gitignore` zodat cursistantwoorden nooit in git belanden).
