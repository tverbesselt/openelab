import { Rekensoort } from "./types";

/*
 * Rekenopgaven met telkens nieuwe getallen.
 *
 * De leraar kiest één keer een type; Open E-lab maakt daarna onbeperkt opgaven. Zo kan een
 * cursist blijven oefenen tot het automatisch gaat, zonder dat er honderd vragen getypt
 * moeten worden. De contexten komen uit de studiegebieden zelf: btw en korting voor
 * verkoop en boekhouden, eenheden en Ohm voor techniek, verhoudingen voor koken.
 */

export interface Opgave {
  id: string;
  vraag: string;
  antwoord: number;
  /** Wat er achter het antwoord hoort, bijvoorbeeld "euro" of "gram". */
  eenheid?: string;
  /** Hoe je eraan komt. Verschijnt na het antwoord. */
  uitleg: string;
  /** Aantal decimalen waarop we vergelijken. */
  decimalen: number;
}

export interface Rekentype {
  soort: Rekensoort;
  label: string;
  uitleg: string;
  voorbeeld: string;
}

export const REKENTYPES: Rekentype[] = [
  {
    soort: "procent",
    label: "Procenten",
    uitleg: "Een percentage van een getal berekenen.",
    voorbeeld: "Hoeveel is 15% van 240?",
  },
  {
    soort: "btw",
    label: "Btw erbij",
    uitleg: "Van een prijs zonder btw naar een prijs met btw.",
    voorbeeld: "45,00 euro exclusief btw aan 21%. Wat betaal je?",
  },
  {
    soort: "korting",
    label: "Korting",
    uitleg: "De prijs na korting berekenen.",
    voorbeeld: "Een jas van 80,00 euro met 25% korting.",
  },
  {
    soort: "eenheden",
    label: "Eenheden omzetten",
    uitleg: "Kilo naar gram, meter naar centimeter, liter naar milliliter.",
    voorbeeld: "Zet 2,5 kg om naar gram.",
  },
  {
    soort: "breuken",
    label: "Breuken",
    uitleg: "Een breuk van een hoeveelheid nemen.",
    voorbeeld: "Hoeveel is 3/4 van 60?",
  },
  {
    soort: "ohm",
    label: "Wet van Ohm",
    uitleg: "Stroom, spanning en weerstand uit elkaar afleiden.",
    voorbeeld: "12 V over 4 ohm. Hoeveel stroom loopt er?",
  },
  {
    soort: "verhouding",
    label: "Verhoudingen",
    uitleg: "Een recept of hoeveelheid omrekenen naar meer of minder personen.",
    voorbeeld: "300 g rijst voor 4 personen. Hoeveel voor 6?",
  },
];

export function rekentype(soort: Rekensoort): Rekentype {
  return REKENTYPES.find((t) => t.soort === soort) ?? REKENTYPES[0];
}

function tussen(laag: number, hoog: number): number {
  return laag + Math.floor(Math.random() * (hoog - laag + 1));
}

function kies<T>(lijst: T[]): T {
  return lijst[Math.floor(Math.random() * lijst.length)];
}

/** Bedragen tonen we zoals in het Nederlands: komma als decimaalteken. */
function bedrag(waarde: number): string {
  return waarde.toFixed(2).replace(".", ",");
}

function rond(waarde: number, decimalen: number): number {
  const factor = 10 ** decimalen;
  return Math.round(waarde * factor) / factor;
}

const EENHEDEN: { van: string; naar: string; factor: number; stap: number }[] = [
  { van: "kg", naar: "gram", factor: 1000, stap: 0.5 },
  { van: "liter", naar: "milliliter", factor: 1000, stap: 0.5 },
  { van: "meter", naar: "centimeter", factor: 100, stap: 0.5 },
  { van: "km", naar: "meter", factor: 1000, stap: 0.5 },
];

const BREUKEN: [number, number][] = [
  [1, 2],
  [1, 4],
  [3, 4],
  [1, 3],
  [2, 3],
  [1, 5],
  [2, 5],
];

/** Eén nieuwe opgave van het gevraagde type. */
export function maakOpgave(soort: Rekensoort, nummer: number): Opgave {
  const id = `opg-${nummer}-${Math.random().toString(36).slice(2, 7)}`;

  switch (soort) {
    case "procent": {
      const percent = kies([5, 10, 15, 20, 25, 30, 40, 50, 75]);
      const getal = tussen(2, 40) * 10;
      const antwoord = rond((getal * percent) / 100, 2);
      return {
        id,
        vraag: `Hoeveel is ${percent}% van ${getal}?`,
        antwoord,
        uitleg: `${getal} × ${percent} ÷ 100 = ${bedrag(antwoord)}`,
        decimalen: 2,
      };
    }

    case "btw": {
      const tarief = kies([6, 12, 21]);
      const prijs = rond(tussen(500, 25000) / 100, 2);
      const antwoord = rond(prijs * (1 + tarief / 100), 2);
      return {
        id,
        vraag: `Een artikel kost ${bedrag(prijs)} euro zonder btw. Het btw-tarief is ${tarief}%. Wat is de prijs met btw?`,
        antwoord,
        eenheid: "euro",
        uitleg: `${bedrag(prijs)} × 1,${String(tarief).padStart(2, "0")} = ${bedrag(antwoord)} euro`,
        decimalen: 2,
      };
    }

    case "korting": {
      const percent = kies([10, 15, 20, 25, 30, 40, 50]);
      const prijs = tussen(20, 300);
      const antwoord = rond(prijs * (1 - percent / 100), 2);
      return {
        id,
        vraag: `Een artikel van ${bedrag(prijs)} euro krijgt ${percent}% korting. Wat betaal je?`,
        antwoord,
        eenheid: "euro",
        uitleg: `${prijs} − (${prijs} × ${percent} ÷ 100) = ${bedrag(antwoord)} euro`,
        decimalen: 2,
      };
    }

    case "eenheden": {
      const eenheid = kies(EENHEDEN);
      const waarde = rond(tussen(1, 20) * eenheid.stap, 1);
      const antwoord = rond(waarde * eenheid.factor, 2);
      return {
        id,
        vraag: `Zet ${String(waarde).replace(".", ",")} ${eenheid.van} om naar ${eenheid.naar}.`,
        antwoord,
        eenheid: eenheid.naar,
        uitleg: `${String(waarde).replace(".", ",")} × ${eenheid.factor} = ${antwoord} ${eenheid.naar}`,
        decimalen: 2,
      };
    }

    case "breuken": {
      const [teller, noemer] = kies(BREUKEN);
      const getal = noemer * tussen(2, 20);
      const antwoord = rond((getal * teller) / noemer, 2);
      return {
        id,
        vraag: `Hoeveel is ${teller}/${noemer} van ${getal}?`,
        antwoord,
        uitleg: `${getal} ÷ ${noemer} × ${teller} = ${antwoord}`,
        decimalen: 2,
      };
    }

    case "ohm": {
      const stroom = kies([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]);
      const weerstand = kies([4, 5, 8, 10, 12, 20, 25, 47]);
      const spanning = rond(stroom * weerstand, 2);

      // Afwisselen welke grootheid gevraagd wordt: anders leert de cursist één trucje.
      if (Math.random() < 0.5) {
        return {
          id,
          vraag: `Over een weerstand van ${weerstand} ohm staat ${bedrag(spanning)} V. Hoeveel stroom loopt er?`,
          antwoord: rond(stroom, 2),
          eenheid: "ampère",
          uitleg: `I = U ÷ R = ${bedrag(spanning)} ÷ ${weerstand} = ${String(stroom).replace(".", ",")} A`,
          decimalen: 2,
        };
      }
      return {
        id,
        vraag: `Door een weerstand van ${weerstand} ohm loopt ${String(stroom).replace(".", ",")} A. Hoe groot is de spanning?`,
        antwoord: spanning,
        eenheid: "volt",
        uitleg: `U = I × R = ${String(stroom).replace(".", ",")} × ${weerstand} = ${bedrag(spanning)} V`,
        decimalen: 2,
      };
    }

    case "verhouding":
    default: {
      const personen = tussen(2, 6);
      const nieuwePersonen = personen + tussen(1, 6);
      const perPersoon = kies([50, 60, 75, 80, 100, 125, 150]);
      const hoeveelheid = perPersoon * personen;
      const antwoord = perPersoon * nieuwePersonen;
      const ingredient = kies(["rijst", "bloem", "suiker", "pasta", "aardappelen"]);
      return {
        id,
        vraag: `Voor ${personen} personen heb je ${hoeveelheid} gram ${ingredient} nodig. Hoeveel heb je nodig voor ${nieuwePersonen} personen?`,
        antwoord,
        eenheid: "gram",
        uitleg: `${hoeveelheid} ÷ ${personen} × ${nieuwePersonen} = ${antwoord} gram`,
        decimalen: 0,
      };
    }
  }
}

export function maakRonde(soort: Rekensoort, aantal: number): Opgave[] {
  return Array.from({ length: aantal }, (_, i) => maakOpgave(soort, i));
}

/**
 * Klopt het antwoord? Een komma of een punt maakt niet uit, en een euroteken of eenheid
 * die de cursist meetypt evenmin: het gaat om het rekenwerk, niet om de notatie.
 */
export function isJuist(gegeven: string, opgave: Opgave): boolean {
  const opgeschoond = gegeven
    .trim()
    .replace(/[€\s]/g, "")
    .replace(/[a-zA-Zµ]+$/u, "")
    .replace(",", ".");
  if (!opgeschoond) return false;

  const getal = Number(opgeschoond);
  if (!Number.isFinite(getal)) return false;

  return rond(getal, opgave.decimalen) === rond(opgave.antwoord, opgave.decimalen);
}

/** Het antwoord zoals wij het tonen: met komma, en zonder overbodige nullen. */
export function toonAntwoord(opgave: Opgave): string {
  const tekst = opgave.decimalen === 0 ? String(opgave.antwoord) : bedrag(opgave.antwoord);
  return opgave.eenheid ? `${tekst} ${opgave.eenheid}` : tekst;
}
