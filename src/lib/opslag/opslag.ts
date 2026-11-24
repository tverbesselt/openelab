import type {
  Beheerder,
  BordItem,
  Exercise,
  Herhaling,
  Inzending,
  Lesmap,
  LiveAntwoord,
  LiveSessie,
  Tekening,
  Quizresultaat,
  VorigeVersie,
  WedstrijdAntwoord,
  WedstrijdSpeler,
} from "@/lib/types";
import { vulInhoudAan } from "@/lib/oefeningInhoud";
import type { Databank, Document, Schrijfactie, Waar } from "./databank";
import type { Opslag, CodeDoel } from "./types";

/*
 * De opslag van Open E-lab, één keer geschreven. Ze weet welke verzamelingen er zijn en wat
 * er samen moet veranderen; de databank eronder (Firestore of localStorage) weet alleen
 * hoe je een document leest en schrijft.
 *
 * Verzamelingen (zie firestore.rules voor wie wat mag):
 *   oefeningen/{id}                 het materiaal zelf
 *   oefeningen/{id}/inzendingen/{id} exit tickets, alleen leesbaar voor de maker
 *   oefeningen/{id}/resultaten/{id} anonieme quizresultaten, alleen voor de maker
 *   oefeningen/{id}/versies/vorige  de oefening van vóór de laatste aanpassing
 *   mappen/{id}                     lesmappen, persoonlijk of van de organisatie
 *   beheerders/{e-mail}             wie mee beheert (Beheer > Beheerders)
 *   codes/{CODE}                    code van zes tekens -> oefening of map
 *   sessies/{pincode}               een live-sessie op het digibord
 *   sessies/{pincode}/antwoorden/{apparaat}  één antwoord per toestel
 *   sessies/{pincode}/spelers/{apparaat}     quizwedstrijd: bijnaam en punten
 *   sessies/{pincode}/quizantwoorden/{apparaat}_{vraag}  quizwedstrijd: één antwoord per vraag
 *   sessies/{pincode}/bord/{id}              whiteboard: één kaartje per document
 *   sessies/{pincode}/tekeningen/{apparaat}_{nr}  teken uit je geheugen: één tekening per opdracht
 *   herhalingen/{uid}/items/{id}    de eigen herhaalplanning van een cursist
 *
 * Dat een toestel maar één keer stemt, of dat een bord gesloten is, bewaakt de databank:
 * bij Firestore de regels, in de demomodus lokaleRegels.ts.
 */

const OEFENINGEN = "oefeningen";
const MAPPEN = "mappen";
const CODES = "codes";
const SESSIES = "sessies";
const HERHALINGEN = "herhalingen";
const BEHEERDERS = "beheerders";

/** Hoe lang verwijderd materiaal in de prullenbak blijft voor het voorgoed verdwijnt. */
export const PRULLENBAK_DAGEN = 30;

/** Firestore schrijft hoogstens 500 documenten in één beweging; we blijven er ruim onder. */
const PER_KEER = 400;

function isVerlopen(verwijderdOp: string, nu = Date.now()): boolean {
  return nu - new Date(verwijderdOp).getTime() > PRULLENBAK_DAGEN * 24 * 60 * 60 * 1000;
}

interface CodeDocument {
  soort: "oefening" | "map";
  doelId: string;
}

function nieuwsteEerst<T extends { createdAt: string }>(lijst: T[]): T[] {
  return [...lijst].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function alsOefening({ id, data }: Document<Exercise>): Exercise {
  return vulInhoudAan({ ...data, id });
}

function alsMap({ id, data }: Document<Lesmap>): Lesmap {
  return { ...data, id };
}

const codePad = (code: string) => `${CODES}/${code.toUpperCase()}`;

export function maakOpslag(db: Databank): Opslag {
  const oefeningen = async (waar: Waar[]) =>
    (await db.lijst<Exercise>(OEFENINGEN, waar)).map(alsOefening);
  const mappen = async (waar: Waar[]) => (await db.lijst<Lesmap>(MAPPEN, waar)).map(alsMap);
  const gegevens = async <T>(verzameling: string, waar?: Waar[]) =>
    (await db.lijst<T>(verzameling, waar)).map((document) => document.data);

  /** Wis een hele deelverzameling, in stukken die Firestore in één keer aankan. */
  const wisAlles = async (verzameling: string) => {
    const lijst = await db.lijst<object>(verzameling);
    for (let i = 0; i < lijst.length; i += PER_KEER) {
      await db.schrijf(
        ...lijst.slice(i, i + PER_KEER).map(({ id }): Schrijfactie => ({ soort: "wis", pad: `${verzameling}/${id}` }))
      );
    }
  };

  /** Hetzelfde, maar wie de verzameling niet mag lezen, laat ze gewoon staan. */
  const wisAllesAlsHetMag = (verzameling: string) => wisAlles(verzameling).catch(() => {});

  const wisOefening = async (id: string) => {
    const pad = `${OEFENINGEN}/${id}`;
    const bestaand = await db.lees<Exercise>(pad);
    // Eerst wat eronder hangt: zodra de oefening weg is, weten de regels niet meer van wie
    // het was.
    await Promise.all([
      wisAllesAlsHetMag(`${pad}/inzendingen`),
      wisAllesAlsHetMag(`${pad}/resultaten`),
      wisAllesAlsHetMag(`${pad}/versies`),
    ]);
    const acties: Schrijfactie[] = [{ soort: "wis", pad }];
    if (bestaand?.shareCode) acties.push({ soort: "wis", pad: codePad(bestaand.shareCode) });
    await db.schrijf(...acties);
  };

  return {
    /* Materiaal */

    async zichtbareOefeningen(kijker) {
      // Twee gerichte vragen in plaats van één brede: de regels laten geen lijst toe die
      // ook privé materiaal van collega's zou bevatten.
      const vragen = [oefeningen([["visibility", "organisatie"]])];
      if (kijker?.id) vragen.push(oefeningen([["creatorId", kijker.id]]));
      const resultaten = await Promise.all(vragen);

      const perId = new Map<string, Exercise>();
      for (const lijst of resultaten) {
        for (const ex of lijst) perId.set(ex.id, ex);
      }
      // Wat in de prullenbak zit, staat in geen enkele lijst.
      return nieuwsteEerst([...perId.values()].filter((ex) => !ex.verwijderdOp));
    },

    async oefening(id) {
      const data = await db.lees<Exercise>(`${OEFENINGEN}/${id}`);
      return data ? alsOefening({ id, data }) : null;
    },

    async maakOefeningen(nieuwe) {
      await db.schrijf(
        ...nieuwe.flatMap((ex): Schrijfactie[] => [
          { soort: "zet", pad: `${OEFENINGEN}/${ex.id}`, data: ex },
          {
            soort: "zet",
            pad: codePad(ex.shareCode),
            data: { soort: "oefening", doelId: ex.id, creatorId: ex.creatorId ?? null },
          },
        ])
      );
    },

    async wijzigOefening(id, wijziging) {
      await db.schrijf({ soort: "wijzig", pad: `${OEFENINGEN}/${id}`, data: wijziging });
    },

    async vervangOefening(oefening) {
      const pad = `${OEFENINGEN}/${oefening.id}`;
      const bestaand = await db.lees<Exercise>(pad);
      if (!bestaand) throw new Error("Deze oefening bestaat niet meer.");
      // De code hoort bij de oefening; een aanpassing mag ze niet loskoppelen.
      if (bestaand.shareCode !== oefening.shareCode) throw new Error("De code van een oefening verandert niet.");
      const vorige: VorigeVersie = { oefening: { ...bestaand, id: oefening.id }, bewaardOp: new Date().toISOString() };
      await db.schrijf(
        // Wat er stond, blijft één aanpassing lang bewaard: zo is een vergissing terug te draaien.
        { soort: "zet", pad: `${pad}/versies/vorige`, data: vorige },
        { soort: "zet", pad, data: oefening }
      );
    },

    async vorigeVersie(id) {
      const versie = await db.lees<VorigeVersie>(`${OEFENINGEN}/${id}/versies/vorige`).catch(() => null);
      return versie ? { ...versie, oefening: alsOefening({ id, data: versie.oefening }) } : null;
    },

    async herstelVorigeVersie(id) {
      const pad = `${OEFENINGEN}/${id}`;
      const [nu, versie] = await Promise.all([
        db.lees<Exercise>(pad),
        db.lees<VorigeVersie>(`${pad}/versies/vorige`),
      ]);
      if (!nu || !versie) throw new Error("Er is geen vorige versie.");
      // De inhoud komt terug; van wie het is, wie het ziet en de code blijven zoals nu.
      const terug = {
        ...versie.oefening,
        id,
        creatorId: nu.creatorId,
        creatorName: nu.creatorName,
        visibility: nu.visibility,
        shareCode: nu.shareCode,
      } as Exercise;
      const vorige: VorigeVersie = { oefening: { ...nu, id }, bewaardOp: new Date().toISOString() };
      await db.schrijf(
        { soort: "zet", pad: `${pad}/versies/vorige`, data: vorige },
        { soort: "zet", pad, data: terug }
      );
      return alsOefening({ id, data: terug });
    },

    async verwijderOefening(id) {
      const pad = `${OEFENINGEN}/${id}`;
      const bestaand = await db.lees<Exercise>(pad);
      if (!bestaand) return;
      await db.schrijf({ soort: "wijzig", pad, data: { verwijderdOp: new Date().toISOString() } });
    },

    async herstelOefening(id) {
      const pad = `${OEFENINGEN}/${id}`;
      const bestaand = await db.lees<Exercise>(pad);
      if (!bestaand) throw new Error("Deze oefening bestaat niet meer.");
      await db.schrijf({ soort: "wijzig", pad, weg: ["verwijderdOp"] });
    },

    wisOefening,

    async prullenbak(kijker, alsBeheerder) {
      if (!kijker?.id) return [];
      const resultaten = await Promise.all([
        oefeningen([["creatorId", kijker.id]]),
        alsBeheerder ? oefeningen([["visibility", "organisatie"]]) : Promise.resolve([]),
      ]);
      const perId = new Map<string, Exercise>();
      for (const lijst of resultaten) {
        for (const ex of lijst) if (ex.verwijderdOp) perId.set(ex.id, ex);
      }
      const blijft: Exercise[] = [];
      for (const ex of perId.values()) {
        if (isVerlopen(ex.verwijderdOp!)) await wisOefening(ex.id).catch(() => {});
        else blijft.push(ex);
      }
      return blijft.sort((a, b) => b.verwijderdOp!.localeCompare(a.verwijderdOp!));
    },

    /* Mappen */

    async eigenMappen(eigenaar) {
      if (!eigenaar?.id) return [];
      const lijst = await mappen([["creatorId", eigenaar.id]]);
      // Een organisatiemap die deze beheerder aanmaakte, is niet persoonlijk.
      return nieuwsteEerst(lijst.filter((m) => !m.organisatie));
    },

    async organisatieMappen() {
      const lijst = await mappen([["organisatie", true]]);
      return lijst.sort((a, b) => a.title.localeCompare(b.title, "nl"));
    },

    async map(id) {
      const data = await db.lees<Lesmap>(`${MAPPEN}/${id}`);
      return data ? alsMap({ id, data }) : null;
    },

    async maakMap(map) {
      await db.schrijf(
        { soort: "zet", pad: `${MAPPEN}/${map.id}`, data: map },
        {
          soort: "zet",
          pad: codePad(map.shareCode),
          data: {
            soort: "map",
            doelId: map.id,
            creatorId: map.creatorId ?? null,
            // Zo kan een andere beheerder de code mee opruimen als de map verdwijnt.
            organisatie: map.organisatie === true,
          },
        }
      );
    },

    async wijzigMap(id, wijziging) {
      await db.schrijf({ soort: "wijzig", pad: `${MAPPEN}/${id}`, data: wijziging });
    },

    async verplaatsMap(id, bovenMapId) {
      // Bovenaan = geen bovenMapId: het veld verdwijnt, het wordt niet null.
      await db.schrijf(
        bovenMapId
          ? { soort: "wijzig", pad: `${MAPPEN}/${id}`, data: { bovenMapId } }
          : { soort: "wijzig", pad: `${MAPPEN}/${id}`, weg: ["bovenMapId"] }
      );
    },

    async verwijderMap(id) {
      const pad = `${MAPPEN}/${id}`;
      const map = await db.lees<Lesmap>(pad);
      const acties: Schrijfactie[] = [{ soort: "wis", pad }];
      if (map?.shareCode) acties.push({ soort: "wis", pad: codePad(map.shareCode) });
      if (map && (map.organisatie || map.creatorId)) {
        // De submappen schuiven mee in dezelfde beweging: lukt het verwijderen niet, dan
        // blijven ook zij staan waar ze stonden. De eerste voorwaarde is wat de regels van
        // een lijst vragen: organisatiemappen, of de eigen mappen.
        const kinderen = await db.lijst<Lesmap>(MAPPEN, [
          map.organisatie ? ["organisatie", true] : ["creatorId", map.creatorId!],
          ["bovenMapId", id],
        ]);
        for (const kind of kinderen) {
          acties.push(
            map.bovenMapId
              ? { soort: "wijzig", pad: `${MAPPEN}/${kind.id}`, data: { bovenMapId: map.bovenMapId } }
              : { soort: "wijzig", pad: `${MAPPEN}/${kind.id}`, weg: ["bovenMapId"] }
          );
        }
      }
      await db.schrijf(...acties);
    },

    async verplaatsOefening(oefeningId, vanMapId, naarMapId) {
      // Eraf en erbij in plaats van de hele lijst: een collega die tegelijk iets in dezelfde
      // map zet, overschrijft dit niet en wordt er zelf ook niet door overschreven.
      await db.schrijf(
        { soort: "wijzig", pad: `${MAPPEN}/${vanMapId}`, eraf: { exerciseIds: [oefeningId] } },
        { soort: "wijzig", pad: `${MAPPEN}/${naarMapId}`, erbij: { exerciseIds: [oefeningId] } }
      );
    },

    async viaCode(code): Promise<CodeDoel | null> {
      const data = await db.lees<CodeDocument>(codePad(code));
      return data ? { soort: data.soort, id: data.doelId } : null;
    },

    /* Live in de klas */

    async startSessie(sessie) {
      await db.schrijf({ soort: "zet", pad: `${SESSIES}/${sessie.code}`, data: sessie });
    },

    async wijzigSessie(code, wijziging) {
      await db.schrijf({ soort: "wijzig", pad: `${SESSIES}/${code}`, data: wijziging });
    },

    volgSessie(code, bij) {
      return db.volg<LiveSessie>(`${SESSIES}/${code}`, bij);
    },

    async eigenSessies(hostId) {
      const lijst = await gegevens<LiveSessie>(SESSIES, [["hostId", hostId]]);
      return lijst.sort((a, b) => b.gestartOp.localeCompare(a.gestartOp));
    },

    async wisSessie(code) {
      const pad = `${SESSIES}/${code}`;
      // Antwoorden kan niemand wissen (één stem blijft één stem); die verdwijnen met hun
      // vervaldatum. De rest ruimt de host zelf op.
      await Promise.all(
        ["spelers", "bord", "tekeningen"].map((deel) => wisAllesAlsHetMag(`${pad}/${deel}`))
      );
      await db.schrijf({ soort: "wis", pad });
    },

    async antwoorden(code) {
      return gegevens<LiveAntwoord>(`${SESSIES}/${code}/antwoorden`);
    },

    volgAntwoorden(code, bij) {
      return db.volgLijst<LiveAntwoord>(`${SESSIES}/${code}/antwoorden`, [], bij);
    },

    async stuurAntwoord(code, antwoord) {
      // Het toestel-id is de documentnaam: een tweede stem van hetzelfde toestel botst
      // op de regel "alleen aanmaken", en dat is precies de bedoeling.
      await db.schrijf({
        soort: "zet",
        pad: `${SESSIES}/${code}/antwoorden/${antwoord.apparaat}`,
        data: antwoord,
      });
    },

    /* Quizwedstrijd */

    async meldSpeler(code, speler) {
      await db.schrijf({
        soort: "maak",
        pad: `${SESSIES}/${code}/spelers/${speler.apparaat}`,
        data: speler,
      });
    },

    volgSpeler(code, apparaat, bij) {
      return db.volg<WedstrijdSpeler>(`${SESSIES}/${code}/spelers/${apparaat}`, bij);
    },

    volgSpelers(code, bij) {
      return db.volgLijst<WedstrijdSpeler>(`${SESSIES}/${code}/spelers`, [], bij);
    },

    async werkSpelersBij(code, spelers) {
      // Eén beweging voor de hele klas. Firestore telt tot 500 schrijfacties per keer; een
      // klas zit daar ver onder.
      await db.schrijf(
        ...spelers.map(
          (speler): Schrijfactie => ({
            soort: "zet",
            pad: `${SESSIES}/${code}/spelers/${speler.apparaat}`,
            data: speler,
          })
        )
      );
    },

    async verwijderSpeler(code, apparaat) {
      await db.schrijf({ soort: "wis", pad: `${SESSIES}/${code}/spelers/${apparaat}` });
    },

    async stuurWedstrijdAntwoord(code, antwoord) {
      // Toestel en vraag vormen samen de documentnaam: een tweede antwoord op dezelfde
      // vraag botst op de regel "alleen aanmaken".
      await db.schrijf({
        soort: "maak",
        pad: `${SESSIES}/${code}/quizantwoorden/${antwoord.apparaat}_${antwoord.vraagNr}`,
        data: antwoord,
      });
    },

    volgWedstrijdAntwoorden(code, vraagNr, bij) {
      return db.volgLijst<WedstrijdAntwoord>(
        `${SESSIES}/${code}/quizantwoorden`,
        [["vraagNr", vraagNr]],
        bij
      );
    },

    /* Whiteboard */

    async stuurBordItem(code, item) {
      await db.schrijf({ soort: "maak", pad: `${SESSIES}/${code}/bord/${item.id}`, data: item });
    },

    volgBord(code, alles, bij, bijFout) {
      // Een cursist mag alleen vragen naar wat zichtbaar is; de regels weigeren de rest.
      return db.volgLijst<BordItem>(
        `${SESSIES}/${code}/bord`,
        alles ? [] : [["status", "zichtbaar"]],
        bij,
        bijFout
      );
    },

    async wijzigBordItem(code, id, wijziging) {
      await db.schrijf({ soort: "wijzig", pad: `${SESSIES}/${code}/bord/${id}`, data: wijziging });
    },

    async verwijderBordItem(code, id) {
      await db.schrijf({ soort: "wis", pad: `${SESSIES}/${code}/bord/${id}` });
    },

    /* Teken uit je geheugen */

    async stuurTekening(code, tekening) {
      await db.schrijf({
        soort: "maak",
        pad: `${SESSIES}/${code}/tekeningen/${tekening.id}`,
        data: tekening,
      });
    },

    volgTekeningen(code, bij, bijFout) {
      return db.volgLijst<Tekening>(`${SESSIES}/${code}/tekeningen`, [], bij, bijFout);
    },

    async verwijderTekening(code, id) {
      await db.schrijf({ soort: "wis", pad: `${SESSIES}/${code}/tekeningen/${id}` });
    },

    /* Exit tickets */

    async stuurInzending(oefeningId, antwoorden) {
      await db.schrijf({
        soort: "zet",
        pad: `${OEFENINGEN}/${oefeningId}/inzendingen/${db.nieuwId()}`,
        data: { antwoorden, op: new Date().toISOString() },
      });
    },

    async inzendingen(oefeningId) {
      const lijst = await db.lijst<Omit<Inzending, "id">>(`${OEFENINGEN}/${oefeningId}/inzendingen`);
      return lijst
        .map(({ id, data }): Inzending => ({ id, ...data }))
        .sort((a, b) => b.op.localeCompare(a.op));
    },

    async wisInzendingen(oefeningId) {
      await wisAlles(`${OEFENINGEN}/${oefeningId}/inzendingen`);
    },

    /* Quizresultaten */

    async stuurQuizresultaat(oefeningId, foutVragen, aantalVragen) {
      await db.schrijf({
        soort: "zet",
        pad: `${OEFENINGEN}/${oefeningId}/resultaten/${db.nieuwId()}`,
        data: { foutVragen, aantalVragen, op: new Date().toISOString() },
      });
    },

    async quizresultaten(oefeningId) {
      const lijst = await db.lijst<Omit<Quizresultaat, "id">>(`${OEFENINGEN}/${oefeningId}/resultaten`);
      return lijst
        .map(({ id, data }): Quizresultaat => ({ id, ...data }))
        .sort((a, b) => b.op.localeCompare(a.op));
    },

    async wisQuizresultaten(oefeningId) {
      await wisAlles(`${OEFENINGEN}/${oefeningId}/resultaten`);
    },

    /* Beheerders */

    async beheerders() {
      const lijst = await db.lijst<Omit<Beheerder, "adres">>(BEHEERDERS);
      return lijst
        .map(({ id, data }): Beheerder => ({ ...data, adres: id }))
        .sort((a, b) => a.adres.localeCompare(b.adres));
    },

    async voegBeheerderToe(adres, door) {
      await db.schrijf({
        soort: "maak",
        pad: `${BEHEERDERS}/${adres.trim().toLowerCase()}`,
        data: { toegevoegdDoor: door, op: new Date().toISOString() },
      });
    },

    async verwijderBeheerder(adres) {
      await db.schrijf({ soort: "wis", pad: `${BEHEERDERS}/${adres.trim().toLowerCase()}` });
    },

    /* Gespreid herhalen */

    async herhalingen(gebruikerId) {
      return gegevens<Herhaling>(`${HERHALINGEN}/${gebruikerId}/items`);
    },

    async bewaarHerhaling(gebruikerId, herhaling) {
      await db.schrijf({
        soort: "zet",
        pad: `${HERHALINGEN}/${gebruikerId}/items/${herhaling.id}`,
        data: herhaling,
      });
    },
  };
}
