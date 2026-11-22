import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
  type Query,
} from "firebase/firestore";
import type { Databank, Document, Schrijfactie, Waar } from "./databank";

/*
 * De databank op Firestore. Dit bestand kent geen verzamelingen en geen oefeningen: het
 * vertaalt alleen paden en schrijfacties naar Firestore. Wie wat mag, staat in
 * firestore.rules.
 */

/** Firestore weigert undefined; dit gooit lege velden weg zonder de rest te raken. */
function schoon<T>(waarde: T): T {
  return JSON.parse(JSON.stringify(waarde)) as T;
}

/** De velden van een wijziging, met de bewerkingen die Firestore zelf uitvoert. */
function wijziging(actie: Extract<Schrijfactie, { soort: "wijzig" }>): Record<string, unknown> {
  const velden: Record<string, unknown> = { ...schoon(actie.data ?? {}) };
  for (const veld of actie.weg ?? []) velden[veld] = deleteField();
  for (const [veld, waarden] of Object.entries(actie.erbij ?? {})) velden[veld] = arrayUnion(...waarden);
  for (const [veld, waarden] of Object.entries(actie.eraf ?? {})) velden[veld] = arrayRemove(...waarden);
  return velden;
}

/**
 * `haalDb` geeft de Firestore-instantie pas als ze nodig is: bij het laden van de app is
 * Firebase nog niet opgestart, en de tests geven hun eigen instantie mee.
 */
export function maakFirestoreDatabank(haalDb: () => Firestore): Databank {
  const ref = (pad: string): DocumentReference => doc(haalDb(), pad);
  const vraag = (verzameling: string, waar: Waar[] = []): Query => {
    const basis = collection(haalDb(), verzameling);
    return waar.length === 0
      ? basis
      : query(basis, ...waar.map(([veld, waarde]) => where(veld, "==", waarde)));
  };

  return {
    async lees<T>(pad: string) {
      const snap = await getDoc(ref(pad));
      return snap.exists() ? (snap.data() as T) : null;
    },

    async lijst<T>(verzameling: string, waar?: Waar[]) {
      const snap = await getDocs(vraag(verzameling, waar));
      const lijst: Document<T>[] = [];
      snap.forEach((d) => lijst.push({ id: d.id, data: d.data() as T }));
      return lijst;
    },

    async schrijf(...acties) {
      if (acties.length === 0) return;

      if (acties.length === 1) {
        const [actie] = acties;
        if (actie.soort === "zet" || actie.soort === "maak") await setDoc(ref(actie.pad), schoon(actie.data));
        else if (actie.soort === "wijzig") await updateDoc(ref(actie.pad), wijziging(actie));
        else await deleteDoc(ref(actie.pad));
        return;
      }

      const batch = writeBatch(haalDb());
      for (const actie of acties) {
        if (actie.soort === "zet" || actie.soort === "maak") batch.set(ref(actie.pad), schoon(actie.data));
        else if (actie.soort === "wijzig") batch.update(ref(actie.pad), wijziging(actie));
        else batch.delete(ref(actie.pad));
      }
      await batch.commit();
    },

    volg<T>(pad: string, bij: (document: T | null) => void) {
      return onSnapshot(
        ref(pad),
        (snap) => bij(snap.exists() ? (snap.data() as T) : null),
        () => bij(null)
      );
    },

    volgLijst<T>(verzameling: string, waar: Waar[], bij: (documenten: T[]) => void, bijFout?: () => void) {
      return onSnapshot(
        vraag(verzameling, waar),
        (snap) => {
          const lijst: T[] = [];
          snap.forEach((d) => lijst.push(d.data() as T));
          bij(lijst);
        },
        (e) => {
          console.error(`Volgen van ${verzameling} mislukt`, e);
          bijFout?.();
        }
      );
    },

    nieuwId() {
      return doc(collection(haalDb(), "_")).id;
    },
  };
}
