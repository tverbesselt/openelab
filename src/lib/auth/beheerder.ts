"use client";

import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

/**
 * Een beheerder stelt de installatie in (Beheer) en ordent gedeeld materiaal in
 * organisatiemappen.
 *
 * Wie beheerder is, staat in Firestore: één document beheerders/{e-mailadres in kleine
 * letters} per persoon. Die lijst beheer je in de Firebase-console, niet in de app. De
 * regels steunen op datzelfde document, dus deze controle bepaalt alleen wat de app toont.
 */
export async function isBeheerderAccount(email: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(getDb(), "beheerders", email.trim().toLowerCase()));
    return snap.exists();
  } catch {
    // Geen verbinding of geen leesrecht: gewoon leraar, niets gaat verloren.
    return false;
  }
}
