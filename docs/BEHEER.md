# Beheer van Open E-lab

Beheerders zien rechtsboven in de balk een tandwiel dat naar `/beheer` leidt. Wie beheerder is, staat in Firestore in de collectie `beheerders/{e-mailadres}` (in kleine letters). In demomodus is de demoleraar automatisch beheerder.

Alle wijzigingen (behalve de OpenAI-sleutel) pas je eerst op een kopie aan; pas na **Bewaren** gelden ze direct voor alle gebruikers.

---

## 1. Huisstijl

- **Naam van de app:** verschijnt in de kopbalk, in het browsertabblad en op afdrukken (standaard: *Open E-lab*).
- **School of organisatie:** optioneel; verschijnt in de voettekst, op de aanmeldpagina en op Cornell-notitiebladen.
- **Logo:** upload een PNG, JPG, WebP of SVG. De app verkleint het automatisch (max. 256 px) en gebruikt het ook als favicon.
- **Kleurschema:** kies één van de acht standaardkleuren of vul een eigen hexcode in. Open E-lab berekent automatisch de volledige schaal (`--merk-50` t.e.m. `--merk-900`) en zorgt ervoor dat witte tekst op knoppen altijd minstens 4,5:1 contrast haalt (WCAG AA).

---

## 2. Werkvormen en functies

Schakel per lesfase of functie in of uit wat jouw school aanbiedt. Uitgeschakelde werkvormen verdwijnen uit het maakmenu en de navigatie; bestaande oefeningen blijven gewoon bewaard in de databank en verschijnen meteen weer als je de schakelaar opnieuw aanzet.

Sommige functies hangen van een andere af (zoals *Quizwedstrijd* van *Eenvoudige quiz*, of *Gespreid herhalen* van *Flashcards*). De beheerpagina meldt dat automatisch.

---

## 3. Didactische tips

- **Tips voor leraren:** korte didactische aanwijzingen bij het maken en in de les, en de uitleg bij de vier lesfases.
- **Studeertips voor cursisten:** korte leerstrategieën op de startpagina, tijdens het oefenen en de pagina *Slim oefenen*.

---

## 4. Spraak (OpenAI Whisper)

*Inlezen* en *Audio naar tekst* versturen spraakfragmenten via de eigen server (`/api/inlezen`) naar OpenAI Whisper (~$0,006 per minuut). Opnames worden niet bewaard.

Een beheerder kan hier een sleutel (`sk-...`) invullen of verwijderen. De sleutel wordt write-only opgeslagen in `geheimen/openai`: niemand kan hem via de app teruglezen.

---

## 5. Toegang

- **E-maildomeinen van leraren:** domeinen (zonder `@`) waarmee leraren mogen aanmelden en materiaal mogen maken.
- **E-maildomeinen van cursisten:** domeinen voor cursisten, of `*` om elk Google-account als cursist toe te laten. Oefenen via code of QR-code werkt altijd zonder account.
- **Patroon voor cursistenaccounts (optioneel):** reguliere expressie op het volledige e-mailadres wanneer leraren en cursisten op hetzelfde domein zitten, bijvoorbeeld `s[0-9]+@school[.]be` voor leerlingnummers.

De app én `firestore.rules` (en `storage.rules`) passen exact dezelfde toegangsregels toe.

---

## 6. Organisatiemappen

Op de pagina **Mappen** (`/mappen`) kunnen beheerders gedeelde **organisatiemappen** (inclusief submappen) aanmaken, hernoemen en ordenen. Elke leraar van de school kan door die structuur bladeren en gedeeld materiaal snel terugvinden.
