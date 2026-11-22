# Onderzoek: Open E-lab eenvoudig zelf hosten voor ICT-coördinatoren op school

> **Onderzoeksvraag:** Hoe kan Open E-lab worden omgezet naar een eenvoudig zelf te hosten webapplicatie die ICT-coördinatoren op scholen snel, veilig en zonder hoge drempels kunnen opzetten en onderhouden?

---

## 1. Samenvatting en conclusie

Open E-lab heeft vandaag al een groot architecturaal voordeel: **alle opslaglogica loopt via één kleine interface van slechts 6 methodes** (`src/lib/opslag/databank.ts`). Toch is de huidige installatie op Firebase voor veel school-ICT-coördinatoren nog te omslachtig, om vier concrete redenen:

1. **Te veel handmatige cloud-stappen:** Firebase-project aanmaken, regio kiezen, Authentication configureren, Firestore & Storage aanmaken, eerste beheerder handmatig in de database typen, en via de CLI security rules uitrollen.
2. **Kredietkaart / Blaze-abonnement:** Voor Firebase Storage en App Hosting vereist Google een betaalrekening (ook al blijft het gebruik vaak binnen de gratis limiet). Op scholen is een schoolkredietkaart koppelen aan een cloudproject administratief vaak een blokkade.
3. **Alleen Google-aanmelding:** Veel scholen in Vlaanderen en Nederland gebruiken **Microsoft 365 (Entra ID)** of **Smartschool**, geen Google Workspace.
4. **Privacy / AVG (GDPR):** ICT-coördinatoren en DPO's (functionarissen voor gegevensbescherming) geven de voorkeur aan gegevens die op een eigen schoolserver of een Europese server (zonder extra verwerkersovereenkomst met Google) blijven.

### Aanbevolen doelarchitectuur

De meest toegankelijke zelf-host-oplossing voor ICT-coördinatoren is een **All-in-One Docker-oplossing met één commando en een installatiewizard in de browser (`/setup`)**:

- **Hoofdaanbeveling (eigen server / VPS / NAS / Coolify):** **Next.js + SQLite + Server-Sent Events (SSE)** in **één enkele Docker-container** (of **Next.js + PocketBase** via `docker-compose.yml`).
  - **Installatietijd:** ~5 tot 10 minuten.
  - **Back-up:** één map (`/data`) kopiëren.
  - **Login:** keuze uit **Microsoft 365 (Entra ID)**, **Google Workspace**, **Smartschool (OAuth2)** of **ingebouwde e-mail/wachtwoord-accounts** (geen externe identity provider verplicht).
  - **Kosten:** €0 licentiekosten op bestaande schoolinfrastructuur, of ~€5–€10/maand op een Europese VPS (Hetzner, Combell, TransIP).
- **Aanvullend (voor scholen zonder eigen server):** **1-klik deploy op Coolify / Vercel + Supabase (EU)** of een **geautomatiseerd Firebase-installatiescript** voor Google Workspace-scholen.

---

## 2. Wat heeft Open E-lab technisch écht nodig?

Een grondige analyse van de huidige broncode toont aan dat de afhankelijkheid van Firebase verrassend klein en scherp afgebakend is. Er zijn slechts **vier koppelpunten**:

| Koppelpunt | Huidige bestanden | Wat het precies doet |
| --- | --- | --- |
| **1. Databank + Realtime** | `src/lib/opslag/databank.ts`<br>`src/lib/opslag/firestore.ts`<br>`src/lib/instellingen/InstellingenProvider.tsx` | Documenten opslaan en ophalen op pad (`oefeningen/{id}`, `mappen/{id}`, `codes/{CODE}`, `sessies/{pin}`, `herhalingen/{uid}/items/{id}`, `instellingen/app`), filteren op max. 1–2 velden, atomaire batch-writes, en **realtime updates** (`volg`, `volgLijst`) voor live-sessies (poll, woordwolk, quizwedstrijd, whiteboard, teken uit je geheugen). |
| **2. Authenticatie & rollen** | `src/lib/auth/AuthProvider.tsx`<br>`src/lib/auth/account.ts`<br>`src/lib/auth/beheerder.ts`<br>`src/lib/server/leraar.ts` | Leraren (en beheerders) aanmelden om materiaal te maken en live-sessies te starten. Cursisten oefenen **zonder account** via code/QR; een account is alleen nodig voor gespreid herhalen. |
| **3. Media-opslag** | `src/lib/media.ts` | Foto's (in de browser al verkleind tot WebP/JPEG, max. 1600 px) en korte audiofragmenten (max. 10 MB) bij quizvragen uploaden en publiek op een URL beschikbaar maken. |
| **4. Twee lichte serverroutes** | `src/app/api/inlezen/route.ts`<br>`src/app/api/beelden/*` | (1) Optionele Whisper-spraakherkenning via OpenAI-sleutel. (2) Proxy naar Openverse voor vrije CC-afbeeldingen (geen sleutel nodig; voorkomt blokkades door schoolfirewalls). |

**Belangrijke vaststelling:**
Omdat `src/lib/opslag/opslag.ts` (alle 38 domeinfuncties) en `src/werkvormen/` (alle 20+ werkvormen) **volledig los staan van Firebase**, hoeft er aan de spelers, maakformulieren, live-projectieschermen en didactische logica **niets** herschreven te worden om een andere backend aan te sluiten!

---

## 3. Vergelijking van 6 zelf-host-opties voor scholen

### Optie 1: Eén Docker-container (Next.js + SQLite + SSE + lokale uploads) ⭐ Aanbevolen voor kleinste opzet

Open E-lab draait als één zelfstandige Docker-image (`ghcr.io/tverbesselt/openelab:latest`). De Next.js-server krijgt een kleine interne API (`/api/db`, `/api/events`, `/api/media`, `/api/auth`) bovenop **SQLite** (in WAL-modus, razendsnel voor 100–2000 gelijktijdige cursisten op één school), **Server-Sent Events (SSE)** voor live-sessies en een lokale map `/data/uploads` voor quizfoto's en audio.

- **Wat de ICT-coördinator doet:**
  1. Kopieert één `docker-compose.yml` (15 regels) naar de schoolserver, Synology NAS, Proxmox VM of VPS.
  2. Draait `docker compose up -d`.
  3. Opent `https://lab.jouwschool.be/setup`, kiest de eerste beheerder en stelt desgewenst Microsoft 365 / Google / Smartschool in via de browser.
- **Pluspunten:**
  - Slechts **1 container**, geen aparte database-server, geen externe cloud-accounts, geen kredietkaart.
  - 100% AVG/GDPR-proof (alle data blijft binnen de school of EU-VPS).
  - Back-up is één map (`/data/openelab.db` + `/data/uploads`).
  - Werkt zelfs op een lokaal schoolnetwerk (zonder internet, behalve Openverse/Whisper).
  - Past naadloos op Coolify, Portainer, Docker Desktop, Synology Container Manager en Ubuntu Server.
- **Aandachtspunten:**
  - Enkele dagen eenmalige ontwikkeltijd om de `Databank`-adapter (`sqlite.ts` + API-routes + SSE-eventbus), lokale media-opslag en Auth.js/OIDC te bouwen.
  - Niet schaalbaar naar duizenden scholen tegelijk op één instantie (maar voor één school of scholengroep tot enkele duizenden gebruikers is SQLite ruimschoots snel genoeg).

---

### Optie 2: Next.js + MySQL / MariaDB (eigen schoolserver, Plesk/DirectAdmin of VPS) ⭐ Beste keuze bij bestaande schoolinfrastructuur

Veel scholen en Belgische/Nederlandse hostingpartijen (Combell, TransIP, Hetzner, school-VM's met Plesk/DirectAdmin/Docker) hebben al een **MySQL 8 of MariaDB 10.6+** database draaien (vaak naast Moodle of WordPress). Open E-lab kan volledig los van Google Cloud op deze stack draaien, mits er **Node.js 20+** (of Docker) beschikbaar is.

- **Wat er technisch nodig is om op MySQL/MariaDB te draaien (4 afgebakende onderdelen):**
  1. **Databank-adapter (`mysql2` / Drizzle) + API-laag (`/api/db`):** omdat alle domeinlogica al via de 6 methodes van `Databank` (`src/lib/opslag/databank.ts`) loopt, volstaat één generieke documententabel met JSON-kolom (aangevuld met gegenereerde indexkolommen op `creatorId` en `visibility` voor snelle lijsten):
     ```sql
     CREATE TABLE documenten (
       pad         VARCHAR(255) PRIMARY KEY,
       verzameling VARCHAR(191) NOT NULL,
       data        JSON NOT NULL,
       bijgewerkt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       INDEX idx_verzameling (verzameling)
     );
     ```
     De toegangscontrole uit `firestore.rules` verhuist naar één server-side validatielaag in `/api/db` (de logica bestaat al grotendeels in `src/lib/opslag/lokaleRegels.ts`).
  2. **Realtime voor live-sessies (`volg` / `volgLijst`):** MySQL/MariaDB heeft geen ingebouwde realtime push zoals Firestore. De Next.js-server lost dit op met **Server-Sent Events (SSE)** op `/api/events`: zodra een leraar of cursist schrijft via `/api/db`, duwt de server het bericht direct naar alle verbonden toestellen in die sessie (bij één serverinstantie via een in-memory EventEmitter; bij meerdere instanties via korte polling of Redis).
  3. **Authenticatie zonder Firebase Auth:** **Auth.js (NextAuth v5)** met JWT-sessie of MySQL-sessietabel. Ondersteunt direct **Microsoft 365 (Entra ID)**, **Google Workspace**, **Smartschool (OAuth2)** én **eigen lokale leraar-accounts** (e-mail + gehasht wachtwoord in MySQL). Cursisten blijven anoniem via code/QR.
  4. **Media-opslag zonder Firebase Storage:** `src/lib/media.ts` uploadt via `POST /api/media` naar een lokale schijfmap (bv. `/data/uploads` gemount in Docker) of naar S3-compatibele opslag (MinIO, Cloudflare R2, Hetzner Object Storage).
- **Wat de ICT-coördinator doet:**
  1. Maakt één lege MySQL/MariaDB-databank aan (of gebruikt `docker-compose.yml` met een MariaDB-container erbij).
  2. Vult 3 variabelen in (`DATABASE_URL=mysql://...`, `AUTH_SECRET`, en optioneel Entra/Google/Smartschool OAuth-gegevens).
  3. Start de Node.js-app of Docker-container; tabellen worden bij de eerste start automatisch aangemaakt en `/setup` maakt de eerste beheerder aan.
- **Pluspunten:**
  - Past rechtstreeks op bestaande schoolservers, Linux-VM's en Europese hosting met MySQL/MariaDB (geen Google Cloud, geen nieuwe databanktechnologie voor ICT).
  - Volledig compatibel met bestaande back-up-routines (`mysqldump` / MariaDB-snapshots).
  - Eenvoudig te combineren met SQLite via dezelfde SQL/Drizzle-laag (één adapter voor zowel SQLite als MySQL/MariaDB).
- **Aandachtspunten:**
  - Vereist **Node.js 20+** of **Docker** (pure PHP-only shared hosting zonder Node.js volstaat niet voor Next.js).
  - Realistische eenmalige ontwikkeltijd: **~4 tot 6 werkdagen** (waarna `firebase` en `firebase-admin` volledig optioneel worden).

---

### Optie 3: Docker Compose met PocketBase

[PocketBase](https://pocketbase.io) is een lichtgewicht open-source backend (één Go-executable van ~40 MB) met ingebouwde SQLite-databank, **ingebouwde realtime SSE-subscriptions**, bestandsopslag, gebruikersbeheer, een eigen admin-dashboard en kant-en-klare OAuth2/OIDC-koppelingen (Microsoft, Google, OIDC/Smartschool).

- **Wat de ICT-coördinator doet:**
  1. Start twee containers via één `docker-compose.yml` (`open-elab` + `pocketbase`).
  2. Configureert de eerste beheerder en OAuth2-provider via het dashboard of de setup-wizard.
- **Pluspunten:**
  - Zeer weinig backendcode zelf te schrijven: realtime SSE, permissieregels, auth-tokens, wachtwoordreset en bestandsopslag zitten kant-en-klaar in PocketBase.
  - De 6 methodes van `Databank` (`lees`, `lijst`, `schrijf`, `volg`, `volgLijst`, `nieuwId`) sluiten bijna 1-op-1 aan op de PocketBase JS SDK.
  - Ook een simpele bestandsback-up (één volume `pb_data`).
- **Aandachtspunten:**
  - Twee containers i.p.v. één (wel in één `docker-compose.yml`).
  - Externe afhankelijkheid van PocketBase-versies en migraties bij updates.

---

### Optie 4: Managed / Self-hosted Supabase + Vercel of Coolify

Voor scholen zonder eigen server die een "1-klik in de cloud"-ervaring willen, maar wel een EU-regio en Microsoft 365-login nodig hebben.

- **Wat de ICT-coördinator doet:**
  1. Maakt een Supabase-project in de EU-regio (Frankfurt/Stockholm) of host Supabase zelf via Coolify.
  2. Klikt op een **"Deploy to Vercel"**-knop in de GitHub README en vult 3 variabelen in (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
  3. Zet Microsoft Azure (Entra ID) of Google aan in Supabase Auth.
- **Pluspunten:**
  - Postgres + Realtime + Storage + Auth (Microsoft & Google) op één plek.
  - Gratis tier volstaat vaak voor een kleine school; Pro (~€25/mnd) voor grotere scholen.
  - Geen eigen serverbeheer nodig.
- **Aandachtspunten:**
  - Gratis Supabase-projecten pauzeren na 7 dagen inactiviteit (lastig in schoolvakanties!).
  - Vereist nog steeds twee platformaccounts (Vercel + Supabase) en SQL-schema/RLS-migraties.

---

### Optie 5: Huidige Firebase-stack + geautomatiseerd setup-script (snelle tussenstap)

De code blijft zoals ze vandaag is, maar we voegen een interactief script toe (`npm run setup:firebase`) dat de ICT-coördinator door de installatie loodst, `firestore.rules` + `storage.rules` uitrolt, het eerste `beheerders/`-document aanmaakt en `.env` genereert.

- **Pluspunten:**
  - Direct realiseerbaar (halve dag werk).
  - Ideaal voor Google Workspace for Education-scholen die al met Google Cloud werken.
- **Aandachtspunten:**
  - Lost de kernknelpunten niet op: nog steeds Google-account/Blaze-plan nodig voor Storage & App Hosting, en geen Microsoft 365 of Smartschool-login zonder extra Firebase-configuratie (OIDC vereist Identity Platform / Blaze).

---

### Optie 6: Puur statische website (GitHub Pages / Cloudflare Pages / eenvoudige webhosting)

Soms vragen ICT-coördinatoren: *"Kan ik dit gewoon als statische HTML/JS-map op onze gewone schoolwebsite (FTP / GitHub Pages) plaatsen?"*

- **Wat wél kan zonder server:**
  - De volledige oefenomgeving in demomodus (alles in `localStorage` van de browser).
  - Eventueel deelbare oefeningen waarbij de volledige oefening gecomprimeerd in de URL (`#data=...`) of als los `.json`-bestand op de webserver staat.
- **Wat niét kan zonder server/databank:**
  - **Alle live-functies in de klas:** poll, woordwolk, snelle vraag, begripsmeter, quizwedstrijd, whiteboard en klassikaal tekenen vereisen realtime communicatie tussen het digibord en de toestellen van cursisten.
  - **Deelcodes van 6 tekens** (een korte code moet op een server opgezocht worden).
  - **Centrale schoolbibliotheek & organisatiemappen** voor leraren.
  - **Exit tickets & anonieme quizresultaten** terugkoppelen aan de leraar.
  - **Openverse-proxy & Whisper-spraakherkenning** (vereisen serverroutes).

**Conclusie over statische hosting:** Een puur statische build is hoogstens nuttig als **publieke demo** (bv. op Vercel of Cloudflare Pages), maar volstaat niet als volwaardige schoolomgeving.

---

### Overzichtstabel

| Criterium | 1. Docker + SQLite | 2. Node/Docker + MySQL/MariaDB | 3. Docker + PocketBase | 4. Vercel + Supabase (EU) | 5. Firebase + script | 6. Statisch |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Installatietijd ICT** | ~10 min | ~15 min | ~15 min | ~20 min | ~25 min | ~5 min |
| **Geen cloud-kredietkaart** | ✅ Ja | ✅ Ja | ✅ Ja | ⚠️ Beperkt | ❌ Nee (Blaze) | ✅ Ja |
| **Microsoft 365 / Entra ID** | ✅ OIDC | ✅ OIDC | ✅ OIDC | ✅ Ingebouwd | ⚠️ Betaald | ❌ Nee |
| **Google Workspace** | ✅ OIDC | ✅ OIDC | ✅ OIDC | ✅ Ingebouwd | ✅ Ingebouwd | ❌ Nee |
| **Smartschool OAuth2** | ✅ Mogelijk | ✅ Mogelijk | ✅ Mogelijk | ⚠️ Custom | ❌ Moeilijk | ❌ Nee |
| **Eigen accounts zonder SSO** | ✅ Ja | ✅ Ja | ✅ Ja | ✅ Ja | ⚠️ Extra werk | ❌ Nee |
| **Live-sessies (realtime)** | ✅ SSE | ✅ SSE | ✅ SSE | ✅ WebSockets | ✅ Firestore | ❌ Nee |
| **100% op eigen server (AVG)** | ✅ Ja | ✅ Ja | ✅ Ja | ⚠️ Self-hosted | ❌ Nee (Google) | ✅ Ja |
| **Back-up eenvoud** | ⭐⭐⭐ (1 map) | ⭐⭐⭐ (`mysqldump`) | ⭐⭐⭐ (1 map) | ⭐⭐ (dashboard) | ⭐ (script) | n.v.t. |
| **Ontwikkelinspanning** | ~5–7 dagen | ~4–6 dagen | ~4–5 dagen | ~5–6 dagen | ~0,5 dag | Incompleet |

---

## 4. Authenticatie voor scholen (Vlaanderen & Nederland)

Voor ICT-coördinatoren is aanmelden vaak het belangrijkste beslispunt. Cursisten hebben in Open E-lab **geen account nodig** (code/QR volstaat), waardoor alleen **leraren** (en optioneel cursisten voor gespreid herhalen) hoeven aan te melden.

Een goede zelf-gehoste versie ondersteunt via **Auth.js (NextAuth v5)** of **PocketBase OAuth2** vier keuzes, instelbaar via omgevingsvariabelen of `/beheer`:

1. **Microsoft 365 / Entra ID (OIDC):** standaard in de meeste Vlaamse en Nederlandse scholen. Vereist slechts `AUTH_MICROSOFT_ID`, `AUTH_MICROSOFT_SECRET` en `AUTH_MICROSOFT_TENANT_ID` (app-registratie in Entra duurt 3 minuten).
2. **Google Workspace (OIDC):** voor Google-scholen (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`).
3. **Smartschool (OAuth2):** veel Vlaamse scholen koppelen via Smartschool OAuth2 (of via een eigen school-SSO). Met een generieke OAuth2/OIDC-provider kan dit zonder maatwerk per school.
4. **Lokale leraar-accounts (e-mail + wachtwoord of uitnodigingslink):** essentieel voor kleine scholen of ICT-coördinatoren die Open E-lab eerst in een pilootproject willen testen zonder meteen SSO in Entra/Google te hoeven registreren!

---

## 5. Aanbevolen concreet stappenplan naar "10-minuten zelf-hosten"

De huidige versie in deze repository bevat al een werkende **`Dockerfile` en `docker-compose.yml`** (voor demomodus of gekoppeld aan Firebase). Om volledig los te komen van Firebase en de **1-container Docker-ervaring (Optie 1)** of **PocketBase (Optie 2)** te realiseren, adviseren we vier overzichtelijke stappen:

### Stap 1 — Backend-adapter voor SQLite + SSE (of PocketBase)
- Bouw `src/lib/opslag/apiDatabank.ts` die de 6 methodes van `Databank` (`src/lib/opslag/databank.ts`) aanroept via `/api/db/*` (CRUD + batches) en `/api/events` (SSE voor `volg` en `volgLijst`).
- Bewaar documenten in SQLite (één tabel `documenten(pad PRIMARY KEY, verzameling, data JSON, bijgewerkt)` met index op `verzameling` — zo werken alle collecties én subcollecties zonder ingewikkelde SQL-migraties!).
- Verplaats de validatie uit `firestore.rules` / `lokaleRegels.ts` naar één gedeelde server-validatielaag.

### Stap 2 — Lokale media-opslag
- Breid `src/lib/media.ts` uit met een uploadmodus naar `/api/media` die verkleinde WebP/JPEG-afbeeldingen en audio opslaat in `/data/uploads/<eigenaar>/<uuid>.<ext>` (gemount als Docker-volume) en serveert met veilige `Content-Type`-headers (geen SVG).

### Stap 3 — Flexibele schoollogin + `/setup`-wizard
- Voeg **Auth.js** (of PocketBase Auth) toe met ondersteuning voor:
  - Lokale accounts (beheerder nodigt leraren uit of keurt domein goed)
  - Microsoft Entra ID (Microsoft 365)
  - Google Workspace
  - Generieke OIDC / Smartschool
- Bij de allereerste opstart (als er nog geen beheerder in `/data/openelab.db` staat) toont de app automatisch **`/setup`**: in drie schermen kiest de ICT-coördinator de naam/kleur van de school, maakt het eerste beheerder-account aan en kiest de aanmeldmethode.

### Stap 4 — Kant-en-klare distributie voor ICT-coördinatoren
- Publiceer bij elke release automatisch een kant-en-klare Docker-image op **GitHub Container Registry** (`ghcr.io/tverbesselt/openelab:latest`) via GitHub Actions.
- Een ICT-coördinator hoeft dan zelfs **geen `git clone` en geen build** meer te doen — enkel:

```yaml
services:
  open-elab:
    image: ghcr.io/tverbesselt/openelab:latest
    ports:
      - "3000:3000"
    volumes:
      - openelab_data:/data
    restart: unless-stopped

volumes:
  openelab_data:
```

Met dat ene bestand van 10 regels, plus automatische HTTPS via Caddy of Nginx Proxy Manager (of een 1-klik sjabloon voor **Coolify**), staat Open E-lab binnen **5 minuten** live op elke school.
