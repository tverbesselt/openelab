import type {
  BordItem,
  Exercise,
  Herhaling,
  Inzending,
  Lesmap,
  LiveAntwoord,
  LiveSessie,
  Tekening,
  Quizresultaat,
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
 *   mappen/{id}                     lesmappen, persoonlijk of van de organisatie
 *   beheerders/{e-mail}             wie organisatiemappen beheert (alleen via de console)
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
      return nieuwsteEerst([...perId.values()]);
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

    async verwijderOefening(id) {
      const pad = `${OEFENINGEN}/${id}`;
      const bestaand = await db.lees<Exercise>(pad);
      const acties: Schrijfactie[] = [{ soort: "wis", pad }];
      if (bestaand?.shareCode) acties.push({ soort: "wis", pad: codePad(bestaand.shareCode) });
      await db.schrijf(...acties);
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
      if (map?.organisatie) {
        // De submappen schuiven mee in dezelfde beweging: lukt het verwijderen niet, dan
        // blijven ook zij staan waar ze stonden.
        const kinderen = await db.lijst<Lesmap>(MAPPEN, [
          ["organisatie", true],
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
