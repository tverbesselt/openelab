# Architectuur van Open E-lab

Dit document geeft ontwikkelaars en ICT-coördinatoren een snel overzicht van hoe Open E-lab in elkaar zit.

## Overzicht van de lagen

```
┌──────────────────────────────────────────────────────────┐
│ Pagina's (Next.js App Router — src/app/)                 │
│ Start, Maken, Bibliotheek, Mappen, Oefen, Live, Beheer   │
├──────────────────────────────────────────────────────────┤
│ Werkvormen-register (src/werkvormen/)                    │
│ Eén map per werkvorm: label, speler, maakvorm, afdruk    │
├──────────────────────────────┬───────────────────────────┤
│ Opslaglaag (src/lib/opslag/) │ Serverroutes (src/app/api)│
│ opslag.ts → Databank (6 fns) │ /api/inlezen (Whisper)    │
│  ├─ firestore.ts (productie) │ /api/beelden (Openverse)  │
│  └─ lokaal.ts    (demomodus) │                           │
└──────────────────────────────┴───────────────────────────┘
```

## 1. Werkvormen-register (`src/werkvormen/`)

Elke werkvorm heeft een eigen map onder `src/werkvormen/<type>/` met:
- `index.ts`: metadata (label, icoon, lesfase, samenvatting, klassikale start), verwijzing naar de maakvorm, speler, afdrukweergave en voorbeeldmateriaal.
- Schermen worden lui geladen via `next/dynamic` zodat de startbundel licht blijft.
- `src/werkvormen/register.ts` bundelt alle werkvormen op één plek.

`Exercise` in `src/lib/types.ts` is een discriminated union (`OefeningVan<T>`), zodat TypeScript per werkvorm exact controleert welke inhoudsvelden bestaan.

## 2. Opslaglaag en Databank-adapter (`src/lib/opslag/`)

Alle 38 opslagmethodes van de applicatie (oefeningen, mappen, codes, live-sessies, bordkaartjes, tekeningen, herhalingen) staan op één plek in `src/lib/opslag/opslag.ts`.

Die laag praat uitsluitend tegen de kleine interface `Databank` in [`src/lib/opslag/databank.ts`](../src/lib/opslag/databank.ts) met slechts **6 methodes**:

1. `lees<T>(pad)` — één document ophalen
2. `lijst<T>(verzameling, waar?)` — documenten filteren op gelijkheid
3. `schrijf(...acties)` — atomaire batch van `zet`, `maak`, `wijzig`, `wis`
4. `volg<T>(pad, bij)` — realtime abonnement op één document (live-sessies)
5. `volgLijst<T>(verzameling, waar, bij)` — realtime abonnement op een lijst (stemmen, bordkaartjes, tekeningen)
6. `nieuwId()` — nieuw uniek id

Vandaag bestaan er twee adapters:
- `src/lib/opslag/firestore.ts`: praat met Cloud Firestore.
- `src/lib/opslag/lokaal.ts` + `lokaleRegels.ts`: draait in `localStorage` voor demomodus en unit-tests.

Juist door deze 6-functies-adapter is het relatief eenvoudig om in de toekomst een zelf-gehoste adapter (SQLite/SSE of PocketBase) toe te voegen zonder de rest van de app aan te passen. Zie [docs/ZELF_HOSTEN_ONDERZOEK.md](ZELF_HOSTEN_ONDERZOEK.md).

## 3. Beveiliging en identiteit

- **Client:** `src/lib/auth/AuthProvider.tsx` en `src/lib/auth/account.ts` bepalen de rol (`leraar` of `cursist`) op basis van `instellingen/app.toegang` en `beheerders/{email}`.
- **Databank & opslag:** `firestore.rules` en `storage.rules` dwingen exact dezelfde toegangsregels af aan de serverzijde van Firebase.
- **API-routes:** `src/lib/server/leraar.ts` verifieert het Firebase ID-token bij Google en leest daarna `instellingen/app` en `beheerders/{email}` via de Firestore REST-API met het token van de gebruiker zelf.

## 4. Huisstijl en instellingen

`src/lib/instellingen/InstellingenProvider.tsx` laadt `instellingen/app` (of `localStorage` in demomodus), berekent het WCAG AA-kleurenpalet (`src/lib/instellingen/kleur.ts`) en zet de CSS-variabelen `--merk-50` t.e.m. `--merk-900` op `<html>`. `themaScript.ts` zet de gecachete kleuren al vóór de eerste tekening om flikkeren te vermijden.

## 5. Tests

- `tests/unit/`: logica van oefeningen, opslag (lokale adapter), register en netwerkfouten (`npm run test:unit`).
- `tests/rules/`: alle beveiligingsregels van `firestore.rules` en `storage.rules` tegen de echte Firebase-emulators (`npm run test:rules`).
- `tests/e2e/`: Playwright-rooktests die de belangrijkste gebruikersstromen testen (`npm run test:e2e`).
