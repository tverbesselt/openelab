import { Exercise, Lesmap } from "./types";
import { WERKVORM_LIJST } from "@/werkvormen/register";

/*
 * Het voorbeeldmateriaal van de demomodus. Elke werkvorm brengt zijn eigen voorbeelden mee
 * (voorbeelden.ts in zijn map onder src/werkvormen). Alleen de lokale databank laadt dit
 * bestand, en pas als ze het nodig heeft.
 */

/** De demo-accounts bij de namen in het voorbeeldmateriaal: zo is "van mij" ook daar een id. */
const DEMO_MAKERS: Record<string, string> = {
  "Alex De Vries": "leraar@voorbeeld.school",
};

function metMaker<T extends { creatorId?: string; creatorName: string }>(item: T): T {
  const id = item.creatorId ?? DEMO_MAKERS[item.creatorName];
  return id ? { ...item, creatorId: id } : item;
}

/** Alle voorbeeldoefeningen, in de volgorde van het register. */
export async function voorbeeldOefeningen(): Promise<Exercise[]> {
  const perWerkvorm = await Promise.all(
    WERKVORM_LIJST.map(async (werkvorm): Promise<Exercise[]> => (await werkvorm.voorbeelden?.()) ?? [])
  );
  return perWerkvorm.flat();
}

/**
 * Wat de demo bij het eerste gebruik in de databank zet: de oefeningen, de mappen en bij
 * elk de code waarmee een cursist ze opent.
 */
export async function voorbeeldmateriaal(): Promise<Record<string, Record<string, Record<string, unknown>>>> {
  const oefeningen = (await voorbeeldOefeningen()).map(metMaker);
  const mappen = INITIAL_MAPPEN.map(metMaker);
  const codes: Record<string, Record<string, unknown>> = {};
  for (const ex of oefeningen) {
    codes[ex.shareCode.toUpperCase()] = { soort: "oefening", doelId: ex.id, creatorId: ex.creatorId ?? null };
  }
  for (const map of mappen) {
    codes[map.shareCode.toUpperCase()] = {
      soort: "map",
      doelId: map.id,
      creatorId: map.creatorId ?? null,
      organisatie: map.organisatie === true,
    };
  }
  const perId = <T extends { id: string }>(lijst: T[]) =>
    Object.fromEntries(lijst.map((item) => [item.id, item as unknown as Record<string, unknown>]));
  return { oefeningen: perId(oefeningen), mappen: perId(mappen), codes };
}

export const INITIAL_MAPPEN: Lesmap[] = [
  {
    id: "set-nt2-pakket",
    title: "NT2 niveau 1 — boodschappen en markt",
    description:
      "Eerst de woordenschat inoefenen, daarna controleren of ze blijft hangen. Samen goed voor één les.",
    exerciseIds: ["ex-nt2-1", "ex-frans-1"],
    creatorName: "Alex De Vries",
    shareCode: "NT2SET",
    createdAt: "2026-08-07"
  },
  {
    id: "org-nt2",
    title: "Nederlands tweede taal",
    description: "Gedeeld materiaal voor NT2, geordend door de beheerders.",
    exerciseIds: ["ex-sorteer-dehet"],
    creatorName: "Open E-lab",
    shareCode: "ORGNT2",
    createdAt: "2026-09-01",
    organisatie: true
  },
  {
    id: "org-nt2-rg1",
    title: "Richtgraad 1",
    description: "",
    exerciseIds: ["ex-invul-nt2"],
    creatorName: "Open E-lab",
    shareCode: "ORGRG1",
    createdAt: "2026-09-01",
    organisatie: true,
    bovenMapId: "org-nt2"
  },
  {
    id: "org-nt2-rg2",
    title: "Richtgraad 2",
    description: "",
    exerciseIds: ["ex-zin-nt2"],
    creatorName: "Open E-lab",
    shareCode: "ORGRG2",
    createdAt: "2026-09-01",
    organisatie: true,
    bovenMapId: "org-nt2"
  },
  {
    id: "org-nt2-rg2-lezen",
    title: "Lezen",
    description: "",
    exerciseIds: ["ex-lezen-slapen"],
    creatorName: "Open E-lab",
    shareCode: "ORGRGL",
    createdAt: "2026-09-01",
    organisatie: true,
    bovenMapId: "org-nt2-rg2"
  },
  {
    id: "org-rekenen",
    title: "Rekenen en wiskunde",
    description: "",
    exerciseIds: ["ex-reken-btw"],
    creatorName: "Open E-lab",
    shareCode: "ORGREK",
    createdAt: "2026-09-01",
    organisatie: true
  }
];
