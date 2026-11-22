"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, FlaskConical, GraduationCap, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";

export default function AanmeldenPagina() {
  const router = useRouter();
  const { status, gebruiker, foutmelding, aanmelden, kiesDemo, demoBeschikbaar } = useAuth();
  const { instellingen } = useInstellingen();
  const leraarDomeinen = instellingen.toegang.leraarDomeinen;
  const cursistDomeinen = instellingen.toegang.cursistDomeinen.filter((d) => d !== "*");

  useEffect(() => {
    if (status === "aangemeld") router.replace("/");
  }, [status, gebruiker, router]);

  if (status === "laden" || status === "aangemeld") {
    return <div className="h-64" aria-hidden />;
  }

  return (
    <div className="max-w-md mx-auto space-y-10 u-fade pt-4">
      <div className="text-center">
        {instellingen.logo ? (
          <img
            src={instellingen.logo}
            alt={instellingen.organisatie || instellingen.naam}
            className="h-14 w-auto max-w-[14rem] object-contain mx-auto mb-6"
          />
        ) : (
          <span className="w-14 h-14 rounded-2xl bg-merk-800 text-white inline-flex items-center justify-center mx-auto mb-6">
            <FlaskConical className="w-7 h-7" aria-hidden />
          </span>
        )}
        <h1 className="text-3xl font-extrabold text-merk-900 tracking-tight mb-2">Aanmelden</h1>
        <p className="text-sm text-slate-600">
          {instellingen.organisatie
            ? `${instellingen.naam} gebruikt je schoolaccount van ${instellingen.organisatie}.`
            : `Meld je aan bij ${instellingen.naam} met je schoolaccount.`}
        </p>
      </div>

      {foutmelding && (
        <p className="text-sm text-rose-900 bg-rose-50 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{foutmelding}</span>
        </p>
      )}

      {!demoBeschikbaar && (
        <button
          onClick={aanmelden}
          className="w-full py-3.5 rounded-2xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2.5"
        >
          <GoogleLogo />
          <span>Aanmelden met Google</span>
        </button>
      )}

      <div className="space-y-4 text-sm">
        <Regel icon={GraduationCap} titel="Ben je leraar?">
          {leraarDomeinen.length > 0 ? (
            <>
              Meld je aan met je schoolaccount op{" "}
              <span className="font-mono text-xs">
                {leraarDomeinen.map((d) => `@${d}`).join(", ")}
              </span>
              . Daarna kan je oefeningen maken, klassikaal starten en delen.
            </>
          ) : (
            "Meld je aan met je schoolaccount om oefeningen te maken, klassikaal te starten en te delen."
          )}
        </Regel>

        <Regel icon={UserCheck} titel="Ben je cursist of leerling?">
          Je hoeft je niet aan te melden om te oefenen. De code of QR-code van je leraar volstaat.
          {cursistDomeinen.length > 0 ? (
            <>
              {" "}
              Wil je dat de app onthoudt welke kaarten je al kent, meld je dan aan met je account
              op{" "}
              <span className="font-mono text-xs">
                {cursistDomeinen.map((d) => `@${d}`).join(", ")}
              </span>
              .
            </>
          ) : (
            " Met een account onthoudt de app welke flashcards je al kent."
          )}
        </Regel>
      </div>

      {demoBeschikbaar && (
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-600 mb-3">
            <strong>Demomodus actief:</strong> alle gegevens blijven in deze browser bewaard. Probeer{" "}
            {instellingen.naam} meteen uit met voorbeeldmateriaal (als leraar heb je ook toegang
            tot Beheer):
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => kiesDemo("leraar")}
              className="flex-1 py-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
            >
              Bekijk als leraar
            </button>
            <button
              onClick={() => kiesDemo("cursist")}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
            >
              Bekijk als cursist
            </button>
          </div>
        </div>
      )}

      <p className="text-center">
        <Link href="/" className="text-xs font-bold text-slate-500 hover:text-merk-900">
          Terug naar start
        </Link>
      </p>
    </div>
  );
}

function Regel({
  icon: Icon,
  titel,
  children,
}: {
  icon: React.ElementType;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <p className="text-sm text-slate-600 leading-relaxed">
        <strong className="text-slate-900">{titel}</strong> {children}
      </p>
    </div>
  );
}

/** Het Google-logo in de knop; de merkkleuren mogen niet aangepast worden. */
function GoogleLogo() {
  return (
    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
      <svg viewBox="0 0 48 48" className="w-3.5 h-3.5" aria-hidden>
        <path
          fill="#4285F4"
          d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.4 6.6-16.1z"
        />
        <path
          fill="#34A853"
          d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z"
        />
        <path
          fill="#FBBC05"
          d="M11.6 28.1c-.5-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.3-5.7z"
        />
        <path
          fill="#EA4335"
          d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.3 30 2 24 2 15.4 2 7.9 6.9 4.3 14.2l7.3 5.7c1.8-5.2 6.6-9.1 12.4-9.1z"
        />
      </svg>
    </span>
  );
}
