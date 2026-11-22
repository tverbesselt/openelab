# Open E-lab

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker Ready](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

**Didactisch onderbouwde digitale werkvormen, live klastools en oefenomgeving voor leraren en cursisten.** Gratis, zonder reclame en volledig open source (MIT).

[Installeren](docs/INSTALLEREN.md) · [Beheer & huisstijl](docs/BEHEER.md) · [Onderzoek: zelf hosten op school](docs/ZELF_HOSTEN_ONDERZOEK.md) · [Architectuur](docs/ARCHITECTUUR.md) · [Wetenschappelijke basis](docs/WETENSCHAPPELIJKE_BASIS.md) · [Meehelpen](CONTRIBUTING.md)

---

## Waarom Open E-lab?

Veel digitale lestools draaien rond punten, tijdsdruk en ranglijsten. Open E-lab vertrekt vanuit wat onderwijsonderzoek zegt over leren dat blijft hangen:

- **Actief ophalen (retrieval practice):** cursisten halen eerst zelf uit hun geheugen voor ze het antwoord zien.
- **Gespreid herhalen (spacing):** flashcards komen terug net voor je ze dreigt te vergeten (Leitner-dozen).
- **Formatieve feedback:** bij een fout antwoord krijgt de cursist uitleg, zonder punt of oordeel.
- **Lage cognitieve belasting:** rustige schermen, één taak tegelijk, hoge leesbaarheid (inclusief aanpasbare tekstgrootte, leesweergave en hoog contrast).
- **Geen onnodige tijdsdruk:** de klassikale quizwedstrijd bestaat, maar de rustige modus (geen snelheidsbonus, uitleg na elke vraag) is de standaard.

Leraren denken in **lesfases** (*voorkennis activeren*, *inoefenen*, *begrip controleren*, *afsluiten*), niet in losse tools. Lees meer in [docs/WETENSCHAPPELIJKE_BASIS.md](docs/WETENSCHAPPELIJKE_BASIS.md).

---

## Werkvormen en functies

| Lesfase / categorie | Werkvormen en functies |
| --- | --- |
| **Voorkennis activeren** | Live stemming (poll), woordwolk |
| **Inoefenen** | Flashcards (met omkeren & voorlezen), woordtrainer (met uitspraak), paren koppelen, invulzinnen, zinnen bouwen, stappen in volgorde, sorteren, werkwoorden vervoegen, eindeloos rekenen |
| **Begrip controleren** | Eenvoudige quiz (ook klassikaal, met tweede kans, foto/audio/video en vrije beelden uit Openverse), leestekst met vragen, open vraag met modelantwoord, escaperoom, **teken uit je geheugen** (individueel en klassikaal) |
| **Afsluiten** | Exit ticket met didactische standaardvragen |
| **Live in de klas** | Snelle vraag (A–D), begripsmeter (groen/oranje/rood), quizwedstrijd (rustig of met punten, teams, podium), gezamenlijk whiteboard, teken uit je geheugen op het digibord |
| **Klastools** | Klastimer met opdrachten, namenkiezer, groepenmaker, opfrisronde uit vorige lessen, digibordscherm met lesdoelen, audio naar tekst* |
| **Voor cursisten** | Gespreid herhalen, afdrukbare werkbladen en Cornell-notitiebladen, studeertips |

\* *Inlezen* (teksten inspreken in de maakformulieren) en *Audio naar tekst* gebruiken Whisper van OpenAI met een eigen API-sleutel (in te stellen onder **Beheer > Spraak**).

Cursisten en leerlingen doen mee via een **code van zes tekens of QR-code** — zonder account en zonder app te installeren. Met een account onthoudt Open E-lab hun herhaalplanning.

Leraren ordenen materiaal in **persoonlijke mappen**, delen het met de schoolbibliotheek en beheerders richten **organisatiemappen (met submappen)** in.

---

## Maak er de omgeving van jouw school van

Via de beheerpagina (`/beheer`) past een beheerder Open E-lab zonder code aan:

- **Huisstijl:** eigen app-naam, naam van de school/organisatie, logo-upload (ook als tabbladicoon) en een eigen kleurschema. Uit elke gekozen hexkleur berekent Open E-lab automatisch een volledig palet dat voldoet aan WCAG AA-contrast.
- **Werkvormen en functies:** schakel elke werkvorm of klastool per school aan of uit. Uitgeschakelde items verdwijnen uit menu's terwijl bestaand materiaal bewaard blijft.
- **Didactische tips:** schakel tips voor leraren en studeertips voor cursisten afzonderlijk aan of uit.
- **Toegang:** stel e-maildomeinen voor leraren en cursisten in (eventueel met een patroon als beide op hetzelfde domein zitten).
- **Spraak (optioneel):** voeg een OpenAI-sleutel toe voor inlezen en audio naar tekst (alleen de server kan de sleutel lezen).

Meer details: [docs/BEHEER.md](docs/BEHEER.md).

---

## Snel starten (lokaal of met Docker)

### Optie 1 — Lokaal met Node.js (20+)

```bash
git clone https://github.com/tverbesselt/openelab.git
cd openelab
npm install
npm run dev
```

Open <http://localhost:3000>. Zonder Firebase-instellingen draait Open E-lab meteen in **demomodus**: alle gegevens blijven in je browser, met voorbeeldmateriaal erbij. Kies op `/aanmelden` voor *Bekijk als leraar* om ook `/beheer` uit te proberen.

### Optie 2 — Direct starten met Docker Compose

```bash
git clone https://github.com/tverbesselt/openelab.git
cd openelab
docker compose up -d --build
```

Open <http://localhost:3000>. Zonder `.env`-bestand draait de container direct in demomodus; vul `.env` in (op basis van `.env.example`) om te koppelen met Firebase.

Voor een volledige schoolinstallatie met gedeelde databank en Google-login: zie [docs/INSTALLEREN.md](docs/INSTALLEREN.md).

---

## Eenvoudig zelf hosten voor ICT-coördinatoren (onderzoek)

Open E-lab draait vandaag op **Next.js + Firebase (Authentication, Firestore, Storage)** of in demomodus zonder backend. Omdat we Open E-lab zo laagdrempelig mogelijk willen maken voor **ICT-coördinatoren op scholen** (inclusief scholen met Microsoft 365, Smartschool of eigen servers zonder cloud-kredietkaart), hebben we een uitgebreid technisch onderzoek opgesteld:

👉 **[Lees het onderzoeksrapport: Eenvoudig zelf hosten voor scholen](docs/ZELF_HOSTEN_ONDERZOEK.md)**

Dankzij de modulaire opslaglaag ([`src/lib/opslag/databank.ts`](src/lib/opslag/databank.ts) — slechts 6 databankfuncties!) vergelijkt het rapport zes concrete opties (waaronder **MySQL/MariaDB**, een **1-container Docker-oplossing met SQLite + SSE**, **PocketBase**, **Supabase EU** en **geautomatiseerde Firebase-setup**) en beschrijft het een concreet stappenplan naar een **10-minuten-installatie** met ondersteuning voor Microsoft 365 / Entra ID, Google Workspace en Smartschool.

---

## Techniek & kwaliteit

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Firebase (Auth, Firestore, Storage) · lucide-react · qrcode
- **Architectuur:** één registratiepunt per werkvorm (`src/werkvormen/`), één opslaglaag bovenop een databank-adapter (`src/lib/opslag/databank.ts`)
- **Controles:** ESLint (`--max-warnings 0`), TypeScript strict check, unit-tests (Vitest), Firestore & Storage security-rule tests tegen de Firebase-emulator, en Playwright E2E-rooktests in GitHub Actions (`.github/workflows/ci.yml`).

```bash
npm run lint       # ESLint zonder waarschuwingen
npm run typecheck  # TypeScript controle
npm run test:unit  # Unit-tests
npm run test:rules # Firestore & Storage security rules (vereist Java voor emulator)
npm run test:e2e   # Playwright rooktests (vereist Java + Chromium)
```

---

## Meehelpen

Issues, suggesties en pull requests zijn van harte welkom — zeker voor nieuwe werkvormen, verbeteringen rond zelf-hosting (SQLite/PocketBase/OIDC) of toegankelijkheid. Zie [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Licentie en bronvermelding

- **Code:** [MIT-licentie](LICENSE)
- **Oorsprong:** ontstaan uit de praktijk van GO! CVO Antwerpen en als open-sourceproject beschikbaar gemaakt voor elke school.
- **Studeertips:** geschreven in eigen woorden, geïnspireerd op *Studeren met succes* (Tine Hoof, Tim Surma & Paul Kirschner, Thomas More, 2023, CC BY-NC-SA 4.0). Ze kunnen onder **Beheer > Didactische tips** worden uitgeschakeld.
