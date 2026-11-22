import { ALLE_FUNCTIES, type FunctieId } from "./functies";
import { STANDAARD_KLEUR, isHex } from "./kleur";

/**
 * De instellingen van deze installatie (Beheer, /beheer). Eén document, dat iedereen
 * mag lezen en alleen een beheerder mag wijzigen (Firestore: instellingen/app; zonder
 * Firebase: deze browser).
 */
export interface Instellingen {
  /** Naam van de app, in de kop, de titel van het tabblad en op afdrukken. */
  naam: string;
  /** Naam van de school of organisatie. Leeg = geen organisatienaam tonen. */
  organisatie: string;
  /** Logo als data-URL (webp of png), al verkleind. Null = het standaardicoon. */
  logo: string | null;
  /** De merkkleur; de rest van het kleurschema volgt daaruit. */
  kleur: string;
  /**
   * Functies die uit staan. Een lijst van wat uit staat, en niet van wat aan staat: zo staat
   * een werkvorm die er in een nieuwe versie bijkomt, meteen aan.
   */
  uit: FunctieId[];
  tips: {
    /** Studeertips voor cursisten: op de startpagina, bij het oefenen, "Slim oefenen". */
    cursisten: boolean;
    /** Didactische tips voor leraren: bij het maken, in de klas, de lesfases. */
    leraren: boolean;
  };
  /** Wie als leraar of cursist mag aanmelden. Alleen van belang met Firebase. */
  toegang: Toegang;
}

export interface Toegang {
  /** E-maildomeinen van leraren, bijvoorbeeld "school.be" of "school.nl". */
  leraarDomeinen: string[];
  /** E-maildomeinen van cursisten. "*" = elk Google-account. */
  cursistDomeinen: string[];
  /**
   * Optioneel: een reguliere expressie op het volledige e-mailadres die altijd een cursist
   * aanduidt, ook op een leraardomein. Voor scholen waar iedereen op hetzelfde domein zit,
   * bijvoorbeeld s[0-9]+@school[.]be voor leerlingnummers.
   */
  cursistPatroon: string;
}

export const STANDAARD_INSTELLINGEN: Instellingen = {
  naam: "Open E-lab",
  organisatie: "",
  logo: null,
  kleur: STANDAARD_KLEUR,
  uit: [],
  tips: { cursisten: true, leraren: true },
  toegang: { leraarDomeinen: [], cursistDomeinen: [], cursistPatroon: "" },
};

/** Grootste logo dat we bewaren, in tekens van de data-URL. */
export const MAX_LOGO = 200_000;

function lijst(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((d): d is string => typeof d === "string") : [];
}

/**
 * Maakt van wat er bewaard staat een volledig en geldig geheel. Oude of half ingevulde
 * documenten vallen zo terug op de standaard, in plaats van de app te laten vastlopen.
 */
export function normaliseer(ruw: unknown): Instellingen {
  const r = (ruw && typeof ruw === "object" ? ruw : {}) as Record<string, unknown>;
  const s = STANDAARD_INSTELLINGEN;
  const tips = (r.tips && typeof r.tips === "object" ? r.tips : {}) as Record<string, unknown>;
  const toegang = (r.toegang && typeof r.toegang === "object" ? r.toegang : {}) as Record<string, unknown>;
  const logo =
    typeof r.logo === "string" && r.logo.startsWith("data:image/") && r.logo.length <= MAX_LOGO
      ? r.logo
      : null;

  return {
    naam: typeof r.naam === "string" && r.naam.trim() ? r.naam.trim().slice(0, 40) : s.naam,
    organisatie: typeof r.organisatie === "string" ? r.organisatie.trim().slice(0, 80) : s.organisatie,
    logo,
    kleur: isHex(r.kleur) ? r.kleur.toLowerCase() : s.kleur,
    uit: lijst(r.uit).filter((f): f is FunctieId => (ALLE_FUNCTIES as unknown[]).includes(f)),
    tips: {
      cursisten: typeof tips.cursisten === "boolean" ? tips.cursisten : s.tips.cursisten,
      leraren: typeof tips.leraren === "boolean" ? tips.leraren : s.tips.leraren,
    },
    toegang: {
      leraarDomeinen: lijst(toegang.leraarDomeinen).map((d) => d.trim().toLowerCase()).filter(Boolean),
      cursistDomeinen: lijst(toegang.cursistDomeinen).map((d) => d.trim().toLowerCase()).filter(Boolean),
      cursistPatroon: typeof toegang.cursistPatroon === "string" ? toegang.cursistPatroon.trim() : "",
    },
  };
}
