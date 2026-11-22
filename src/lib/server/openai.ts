/*
 * Alleen op de server: welke sleutel van OpenAI inlezen gebruikt.
 *
 * De sleutel kan op twee plaatsen staan:
 *   1. in het beheer van Open E-lab (Firestore: geheimen/openai). Niemand kan dat document
 *      lezen via de app, ook de beheerder niet: alleen de server, met firebase-admin;
 *   2. in de omgevingsvariabele OPENAI_API_KEY (bijvoorbeeld in Secret Manager, Vercel of Docker).
 * Staat hij op beide plaatsen, dan wint die uit het beheer: die kan een beheerder wijzigen
 * zonder de server opnieuw te starten.
 */

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const DATABANK = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || "(default)";

/** Hoe een sleutel van OpenAI er ongeveer uitziet. Een vangnet voor typfouten. */
export function lijktOpSleutel(x: unknown): x is string {
  return typeof x === "string" && /^sk-[A-Za-z0-9_-]{20,}$/.test(x.trim());
}

export type Bron = "beheer" | "omgeving";

export interface SleutelStand {
  sleutel: string | null;
  bron: Bron | null;
  /** False als de server Firestore niet kan lezen; dan werkt alleen OPENAI_API_KEY. */
  serverToegang: boolean;
}

/*
 * Even onthouden, want Audio naar tekst stuurt een paar stukjes per minuut. Een nieuwe
 * sleutel uit het beheer geldt dus binnen een halve minuut.
 */
const BEWAAR_MS = 30_000;
let onthouden: { stand: SleutelStand; tot: number } | null = null;

async function uitBeheer(): Promise<string | null> {
  const { initializeApp, getApps, cert, applicationDefault } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  // Op App Hosting / Cloud Run gebruikt de server de standaardidentiteit. Elders (Vercel,
  // Docker, eigen server) kan een serviceaccount-JSON in FIREBASE_SERVICE_ACCOUNT staan.
  const serviceaccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const app =
    getApps().find((a) => a.name === "openelab-server") ??
    initializeApp(
      {
        projectId: PROJECT,
        credential: serviceaccount ? cert(JSON.parse(serviceaccount)) : applicationDefault(),
      },
      "openelab-server"
    );
  const db = DATABANK === "(default)" ? getFirestore(app) : getFirestore(app, DATABANK);
  const snap = await db.collection("geheimen").doc("openai").get();
  const sleutel = snap.exists ? snap.get("sleutel") : null;
  return lijktOpSleutel(sleutel) ? sleutel.trim() : null;
}

export async function sleutelStand(vers = false): Promise<SleutelStand> {
  if (!vers && onthouden && onthouden.tot > Date.now()) return onthouden.stand;

  let beheer: string | null = null;
  let serverToegang = false;
  if (PROJECT) {
    try {
      beheer = await uitBeheer();
      serverToegang = true;
    } catch (e) {
      console.error("openai: kan geheimen/openai niet lezen", e);
    }
  }
  const omgeving = lijktOpSleutel(process.env.OPENAI_API_KEY) ? process.env.OPENAI_API_KEY!.trim() : null;

  const stand: SleutelStand = beheer
    ? { sleutel: beheer, bron: "beheer", serverToegang }
    : omgeving
      ? { sleutel: omgeving, bron: "omgeving", serverToegang }
      : { sleutel: null, bron: null, serverToegang };
  onthouden = { stand, tot: Date.now() + BEWAAR_MS };
  return stand;
}
