import type { LiveSessie } from "@/lib/types";
import type { Databank, Document, Schrijfactie, Waar } from "./databank";
import { BIJ_INSTUREN, magBordLezen } from "./lokaleRegels";

/*
 * De databank van de demomodus: alles in localStorage van deze browser. Elke verzameling
 * is één sleutel met haar documenten erin. Live-sessies werken tussen tabbladen van
 * dezelfde browser, via het storage-event. Handig om te tonen hoe Open E-lab werkt zonder
 * Firebase-project; op school draait de Firestore-uitvoering.
 */

const VOORVOEGSEL = "openelab_db:";
const EIGEN_EVENT = "openelab-opslag";
/** Staat deze sleutel er, dan is het voorbeeldmateriaal al klaargezet. */
const GEZAAID = "openelab_db_gezaaid";

type Verzameling = Record<string, Record<string, unknown>>;

/** Waar de demo haar gegevens bewaart en hoort dat er iets wijzigde. */
export interface LokaleOmgeving {
  opslagplaats: Pick<Storage, "getItem" | "setItem">;
  /** Het venster: daar komen de storage-events van andere tabbladen binnen. */
  bus: EventTarget;
}

/** Het voorbeeldmateriaal: per verzameling de documenten, met hun id als sleutel. */
export type Zaad = Record<string, Verzameling>;

function splits(pad: string): [verzameling: string, id: string] {
  const knip = pad.lastIndexOf("/");
  return [pad.slice(0, knip), pad.slice(knip + 1)];
}

/** `sessies/123456/bord` -> de code en de naam van de deelverzameling; anders null. */
function inSessie(verzameling: string): { sessiePad: string; deel: string } | null {
  const delen = verzameling.split("/");
  if (delen.length !== 3 || delen[0] !== "sessies") return null;
  return { sessiePad: `sessies/${delen[1]}`, deel: delen[2] };
}

function voldoet(data: Record<string, unknown>, waar: Waar[]): boolean {
  return waar.every(([veld, waarde]) => data[veld] === waarde);
}

/**
 * `omgeving` geeft null op de server, waar geen localStorage bestaat: lezen geeft dan niets
 * terug en schrijven doet niets. `zaad` levert het voorbeeldmateriaal, één keer per browser.
 */
export function maakLokaleDatabank(
  omgeving: () => LokaleOmgeving | null,
  zaad?: () => Promise<Zaad>
): Databank {
  let klaar: Promise<void> | null = null;

  const haal = (verzameling: string): Verzameling => {
    const bewaard = omgeving()?.opslagplaats.getItem(VOORVOEGSEL + verzameling);
    if (!bewaard) return {};
    try {
      return JSON.parse(bewaard) as Verzameling;
    } catch {
      // Onleesbare opslag: begin opnieuw met een lege verzameling.
      return {};
    }
  };

  const bewaar = (verzameling: string, documenten: Verzameling) => {
    try {
      omgeving()?.opslagplaats.setItem(VOORVOEGSEL + verzameling, JSON.stringify(documenten));
    } catch {
      // localStorage is maar een paar MB groot; op school geldt die grens niet.
      throw new Error("In demomodus is de opslag vol. Haal een foto, fragment of tekening weg.");
    }
  };

  /** Zet bij het eerste gebruik het voorbeeldmateriaal klaar. */
  const zaai = (): Promise<void> => {
    const hier = omgeving();
    if (!hier || !zaad) return Promise.resolve();
    klaar ??= (async () => {
      if (hier.opslagplaats.getItem(GEZAAID)) return;
      for (const [verzameling, documenten] of Object.entries(await zaad())) {
        bewaar(verzameling, { ...documenten, ...haal(verzameling) });
      }
      hier.opslagplaats.setItem(GEZAAID, new Date().toISOString());
    })();
    return klaar;
  };

  const leesNu = <T>(pad: string): T | null => {
    const [verzameling, id] = splits(pad);
    return (haal(verzameling)[id] as T | undefined) ?? null;
  };

  const lijstNu = <T>(verzameling: string, waar: Waar[] = []): Document<T>[] => {
    const sessie = inSessie(verzameling);
    if (sessie?.deel === "bord" && !magBordLezen(leesNu<LiveSessie>(sessie.sessiePad), waar.length > 0)) {
      return [];
    }
    return Object.entries(haal(verzameling))
      .filter(([, data]) => voldoet(data, waar))
      .map(([id, data]) => ({ id, data: data as T }));
  };

  /**
   * Luister naar wijzigingen aan één verzameling, uit een ander tabblad (storage-event) of
   * uit dit tabblad (eigen event, want de browser vuurt storage niet voor de schrijver zelf).
   */
  const volgVerzameling = (verzameling: string, bij: () => void): (() => void) => {
    const hier = omgeving();
    if (!hier) return () => {};
    const sleutel = VOORVOEGSEL + verzameling;
    const opStorage = (e: Event) => {
      if ((e as StorageEvent).key === sleutel) bij();
    };
    const opEigen = (e: Event) => {
      if ((e as CustomEvent<string>).detail === verzameling) bij();
    };
    hier.bus.addEventListener("storage", opStorage);
    hier.bus.addEventListener(EIGEN_EVENT, opEigen);
    // Eerst het voorbeeldmateriaal, dan de eerste stand: net als Firestore meldt volgen
    // zich altijd één keer, ook als er niets verandert.
    let gestopt = false;
    zaai().then(() => {
      if (!gestopt) bij();
    });
    return () => {
      gestopt = true;
      hier.bus.removeEventListener("storage", opStorage);
      hier.bus.removeEventListener(EIGEN_EVENT, opEigen);
    };
  };

  /** Past één actie toe op de documenten van haar verzameling. */
  const pasToe = (documenten: Verzameling, actie: Schrijfactie, id: string) => {
    if (actie.soort === "wis") {
      delete documenten[id];
      return;
    }
    if (actie.soort === "zet" || actie.soort === "maak") {
      documenten[id] = actie.data as Record<string, unknown>;
      return;
    }
    const huidig = documenten[id];
    // Een document dat er niet meer is, wijzig je niet: er verandert dan niets.
    if (!huidig) return;
    const nieuw: Record<string, unknown> = { ...huidig, ...actie.data };
    for (const veld of actie.weg ?? []) delete nieuw[veld];
    for (const [veld, waarden] of Object.entries(actie.erbij ?? {})) {
      const lijst = (nieuw[veld] as unknown[] | undefined) ?? [];
      nieuw[veld] = [...lijst, ...waarden.filter((w) => !lijst.includes(w))];
    }
    for (const [veld, waarden] of Object.entries(actie.eraf ?? {})) {
      const lijst = (nieuw[veld] as unknown[] | undefined) ?? [];
      nieuw[veld] = lijst.filter((w) => !waarden.includes(w));
    }
    documenten[id] = nieuw;
  };

  return {
    async lees<T>(pad: string) {
      await zaai();
      return leesNu<T>(pad);
    },

    async lijst<T>(verzameling: string, waar?: Waar[]) {
      await zaai();
      return lijstNu<T>(verzameling, waar);
    },

    async schrijf(...acties) {
      const hier = omgeving();
      if (!hier) return;
      await zaai();

      // Eerst nakijken of alles mag, dan pas schrijven: allemaal, of geen enkele.
      for (const actie of acties) {
        if (actie.soort !== "zet" && actie.soort !== "maak") continue;
        const [verzameling] = splits(actie.pad);
        const sessie = inSessie(verzameling);
        if (!sessie) continue;
        BIJ_INSTUREN[sessie.deel]?.({
          soort: actie.soort,
          sessie: leesNu<LiveSessie>(sessie.sessiePad),
          bestaand: leesNu(actie.pad),
          nieuw: actie.data,
        });
      }

      const gewijzigd = new Map<string, Verzameling>();
      for (const actie of acties) {
        const [verzameling, id] = splits(actie.pad);
        if (!gewijzigd.has(verzameling)) gewijzigd.set(verzameling, haal(verzameling));
        pasToe(gewijzigd.get(verzameling)!, actie, id);
      }
      for (const [verzameling, documenten] of gewijzigd) bewaar(verzameling, documenten);
      for (const verzameling of gewijzigd.keys()) {
        hier.bus.dispatchEvent(new CustomEvent(EIGEN_EVENT, { detail: verzameling }));
      }
    },

    volg<T>(pad: string, bij: (document: T | null) => void) {
      const [verzameling] = splits(pad);
      return volgVerzameling(verzameling, () => bij(leesNu<T>(pad)));
    },

    volgLijst<T>(verzameling: string, waar: Waar[], bij: (documenten: T[]) => void) {
      return volgVerzameling(verzameling, () =>
        bij(lijstNu<T>(verzameling, waar).map((document) => document.data))
      );
    },

    nieuwId() {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    },
  };
}
