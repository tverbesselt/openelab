# Meehelpen aan Open E-lab

Fijn dat je wil bijdragen aan Open E-lab! Bugmeldingen, voorstellen van leraren en ICT-coördinatoren, documentatieverbeteringen en pull requests zijn allemaal welkom.

## Lokaal starten

Vereisten: Node.js 20 of nieuwer (en Java 21 als je ook de Firebase-emulatortests wil draaien).

```bash
git clone https://github.com/tverbesselt/openelab.git
cd openelab
npm install
npm run dev
```

Zonder `.env.local` draait de app in demomodus op <http://localhost:3000>. Kies op `/aanmelden` voor *Bekijk als leraar* om alle schermen en `/beheer` te kunnen gebruiken.

## Voor je een pull request opent

Draai minstens de snelle controles:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Heb je aan `firestore.rules`, `storage.rules` of `src/lib/opslag/` gewerkt? Draai dan ook:

```bash
npm run test:rules
```

## Een nieuwe werkvorm toevoegen

Elke werkvorm heeft één registratiepunt onder `src/werkvormen/<type>/index.ts` en wordt samengebracht in `src/werkvormen/register.ts`. Zie [docs/ARCHITECTUUR.md](docs/ARCHITECTUUR.md) voor het overzicht.

## Richtlijnen

- Houd schermen rustig en overzichtelijk (lage cognitieve belasting).
- Zorg dat nieuwe knoppen en meldingen toegankelijk zijn (toetsenbord, labels, contrast).
- Bewaar geen schoolspecifieke namen, domeinen of sleutels in de broncode.
