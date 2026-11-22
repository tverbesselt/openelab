"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  firebaseConfigured,
  getFirebaseAuth,
  aanmeldenMetGoogle,
  verwerkRedirectResultaat,
  afmelden as firebaseAfmelden,
} from "@/lib/firebase/client";
import {
  bepaalRol,
  enigDomein,
  naamVanEmail,
  weigeringsUitleg,
  type Rol,
} from "@/lib/auth/account";
import { isBeheerderAccount } from "@/lib/auth/beheerder";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";

const DEMO_SLEUTEL = "openelab_demo_rol";

export type AuthStatus = "laden" | "afgemeld" | "aangemeld";

export interface Gebruiker {
  /** Firebase-uid, of het e-mailadres in demomodus. Hieraan hangt het eigen materiaal. */
  id: string;
  email: string;
  naam: string;
  rol: Rol;
  /** Leraar die instellingen en organisatiemappen mag beheren. */
  beheerder: boolean;
}

interface AuthContext {
  status: AuthStatus;
  gebruiker: Gebruiker | null;
  isLeraar: boolean;
  isBeheerder: boolean;
  foutmelding: string | null;
  /** True zolang er geen Firebase-project ingesteld is; dan is enkel de demo mogelijk. */
  demoBeschikbaar: boolean;
  demo: boolean;
  aanmelden: () => Promise<void>;
  kiesDemo: (rol: Rol) => void;
  afmelden: () => Promise<void>;
}

const Ctx = createContext<AuthContext | null>(null);

const DEMO_GEBRUIKERS: Record<Rol, Gebruiker> = {
  leraar: {
    id: "leraar@voorbeeld.school",
    email: "leraar@voorbeeld.school",
    naam: "Alex De Vries",
    rol: "leraar",
    // In de demo toont de leraar ook wat een beheerder kan.
    beheerder: true,
  },
  cursist: {
    id: "cursist@voorbeeld.school",
    email: "cursist@voorbeeld.school",
    naam: "Sam Peeters",
    rol: "cursist",
    beheerder: false,
  },
};

/** Firebase-foutcodes vertaald naar iets waar je als gebruiker mee verder kan. */
function foutTekst(code: string): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return "Dit webadres staat nog niet bij de toegelaten domeinen in Firebase. Meld dit aan de beheerder.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Het aanmeldvenster ging dicht voor je klaar was. Probeer opnieuw.";
    case "auth/popup-blocked":
      return "Je browser blokkeerde het aanmeldvenster. Sta pop-ups toe en probeer opnieuw.";
    case "auth/network-request-failed":
      return "Geen verbinding met de aanmeldservice. Kijk je internet na en probeer opnieuw.";
    default:
      return "Aanmelden is niet gelukt. Probeer het opnieuw.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instellingen, geladen: instellingenGeladen } = useInstellingen();
  const [status, setStatus] = useState<AuthStatus>("laden");
  const [gebruiker, setGebruiker] = useState<Gebruiker | null>(null);
  const [foutmelding, setFoutmelding] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const toegangRef = useRef(instellingen.toegang);
  toegangRef.current = instellingen.toegang;

  useEffect(() => {
    if (!firebaseConfigured) {
      // Geen project ingesteld: enkel de demo. Een eerder gekozen rol blijft staan.
      const bewaard = localStorage.getItem(DEMO_SLEUTEL);
      if (bewaard === "leraar" || bewaard === "cursist") {
        setDemo(true);
        setGebruiker(DEMO_GEBRUIKERS[bewaard]);
        setStatus("aangemeld");
      } else {
        setStatus("afgemeld");
      }
      return;
    }

    // Wacht tot de instellingen geladen zijn: daarin staan de toegelaten domeinen.
    if (!instellingenGeladen) return;

    verwerkRedirectResultaat().catch((e) => {
      setFoutmelding(foutTekst((e as { code?: string })?.code ?? ""));
    });

    const stop = onAuthStateChanged(getFirebaseAuth(), async (u: User | null) => {
      if (!u) {
        setGebruiker(null);
        setStatus("afgemeld");
        return;
      }

      const email = u.email ?? "";
      // Eerst nagaan of dit een beheerder is: een beheerder mag altijd aanmelden, ook vóór
      // er domeinen ingesteld zijn.
      const beheerder = Boolean(email) && (await isBeheerderAccount(email));
      const rol = bepaalRol(email, toegangRef.current, beheerder);
      if (rol === null) {
        // Verkeerd account: uitleggen wat wél werkt en meteen afmelden, anders blijft de
        // gebruiker in een half-aangemelde toestand hangen.
        setFoutmelding(weigeringsUitleg(u.email, toegangRef.current));
        setGebruiker(null);
        setStatus("afgemeld");
        firebaseAfmelden().catch(() => {});
        return;
      }

      setFoutmelding(null);
      setGebruiker({
        id: u.uid,
        email,
        naam: u.displayName || naamVanEmail(email),
        rol,
        beheerder: rol === "leraar" && beheerder,
      });
      setStatus("aangemeld");
    });

    return () => stop();
  }, [instellingenGeladen]);

  const aanmelden = useCallback(async () => {
    setFoutmelding(null);
    if (!firebaseConfigured) {
      setFoutmelding(
        "Er is nog geen Firebase-project ingesteld voor Open E-lab. Vul de NEXT_PUBLIC_FIREBASE-waarden in."
      );
      return;
    }
    try {
      await aanmeldenMetGoogle(enigDomein(toegangRef.current));
    } catch (e) {
      setFoutmelding(foutTekst((e as { code?: string })?.code ?? ""));
    }
  }, []);

  const kiesDemo = useCallback((rol: Rol) => {
    localStorage.setItem(DEMO_SLEUTEL, rol);
    setDemo(true);
    setGebruiker(DEMO_GEBRUIKERS[rol]);
    setFoutmelding(null);
    setStatus("aangemeld");
  }, []);

  const afmelden = useCallback(async () => {
    localStorage.removeItem(DEMO_SLEUTEL);
    setDemo(false);
    setGebruiker(null);
    setStatus("afgemeld");
    await firebaseAfmelden().catch(() => {});
  }, []);

  return (
    <Ctx.Provider
      value={{
        status,
        gebruiker,
        isLeraar: gebruiker?.rol === "leraar",
        isBeheerder: gebruiker?.rol === "leraar" && gebruiker.beheerder,
        foutmelding,
        demoBeschikbaar: !firebaseConfigured,
        demo,
        aanmelden,
        kiesDemo,
        afmelden,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthContext {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth moet binnen <AuthProvider> gebruikt worden.");
  return v;
}
