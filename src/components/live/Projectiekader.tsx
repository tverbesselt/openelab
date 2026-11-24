"use client";

import React, { useEffect, useState } from "react";
import { Download, Eye, EyeOff, Square, Users } from "lucide-react";
import QRCode from "qrcode";
import { merkTint } from "@/lib/instellingen/kleur";
import { opslagGedeeld } from "@/lib/opslag";
import { bestandsnaam, datumTijd, downloadCsv } from "@/lib/csv";
import type { LopendeSessie } from "./useLiveSessie";
import { DemoStemmen } from "./DemoStemmen";
import { VOLSCHERM_KLASSE, VolledigSchermKnop, useVolledigScherm } from "@/components/VolledigScherm";

/**
 * Het kader rond elk projectiescherm: de vraag, de QR-code met de pincode, de teller en de
 * knoppen van de leraar. Wat er met de antwoorden gebeurt, zet het sessietype erin.
 */
export function Projectiekader({
  lopend,
  eenheid = ["antwoord", "antwoorden"],
  voetnoot,
  children,
}: {
  lopend: LopendeSessie;
  /** Wat de teller telt: antwoorden, of bij de begripsmeter cursisten. */
  eenheid?: [enkelvoud: string, meervoud: string];
  /** Eén regel uitleg voor de leraar, onder het bord. */
  voetnoot?: string;
  children: React.ReactNode;
}) {
  const { sessie, antwoorden, stemmen, fout, wijzig, sluitAf } = lopend;
  const volScherm = useVolledigScherm();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/live/join?code=${sessie.code}`;
    setJoinUrl(url);
    QRCode.toDataURL(url, {
      width: 250,
      margin: 2,
      color: { dark: merkTint("900"), light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [sessie.code]);

  const totaal = antwoorden.length;

  /** Het resultaat als bestand: de sessie zelf verdwijnt na een maand. */
  const download = () => {
    let rijen: (string | number)[][];
    if (sessie.opties.length > 0) {
      rijen = sessie.opties.map((optie, i) => [
        sessie.juisteOptie === i ? `${optie} (juist)` : optie,
        stemmen[i] ?? 0,
      ]);
    } else {
      // Een woordwolk: elk woord met hoe vaak het viel, het vaakste eerst.
      const telling = new Map<string, { woord: string; aantal: number }>();
      for (const a of antwoorden) {
        const woord = a.woord?.trim();
        if (!woord) continue;
        const sleutel = woord.toLowerCase();
        const bestaand = telling.get(sleutel);
        if (bestaand) bestaand.aantal++;
        else telling.set(sleutel, { woord, aantal: 1 });
      }
      rijen = [...telling.values()].sort((a, b) => b.aantal - a.aantal).map((t) => [t.woord, t.aantal]);
    }
    downloadCsv(bestandsnaam(sessie.vraag || sessie.titel, "resultaat"), [
      [sessie.vraag || sessie.titel],
      [datumTijd(sessie.gestartOp)],
      [],
      ["Antwoord", "Aantal"],
      ...rijen,
    ]);
  };
  const pincode = `${sessie.code.slice(0, 3)} ${sessie.code.slice(3)}`;

  return (
    <div
      ref={volScherm.ref}
      className={volScherm.actief ? `${VOLSCHERM_KLASSE} space-y-4` : "max-w-4xl mx-auto space-y-4 u-fade"}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={sluitAf}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        >
          <Square className="w-3.5 h-3.5" />
          <span>Sessie afsluiten</span>
        </button>

        <button
          onClick={() => wijzig({ toonResultaten: !sessie.toonResultaten })}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        >
          {sessie.toonResultaten ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>
            {sessie.toonResultaten
              ? "Verberg de tussenstand voor cursisten"
              : "Toon de tussenstand aan cursisten"}
          </span>
        </button>

        <button
          onClick={download}
          disabled={totaal === 0}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 disabled:opacity-40 flex items-center gap-1"
          title="Bewaar het resultaat als bestand voor Excel"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download het resultaat</span>
        </button>

        <VolledigSchermKnop
          actief={volScherm.actief}
          onClick={volScherm.wissel}
          className="text-xs font-bold text-slate-500 hover:text-merk-900 flex items-center gap-1"
        />
      </div>

      {fout && (
        <p role="alert" className="text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          {fout}
        </p>
      )}

      <div className="bg-merk-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-6 border-b border-white/20">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-white/70 block mb-2">
              Scan de code en doe mee
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold leading-snug">{sessie.vraag}</h1>
          </div>

          <div className="bg-white text-merk-900 p-4 rounded-2xl flex flex-col items-center shrink-0">
            {qrDataUrl && (
              <img src={qrDataUrl} alt="QR-code om deel te nemen" className="w-32 h-32 rounded-lg mb-2" />
            )}
            <span className="text-[11px] font-semibold text-slate-500">Pincode</span>
            <span className="font-mono text-xl font-black tracking-widest">{pincode}</span>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between gap-3 text-xs text-white/80">
          <span className="flex items-center gap-2 font-bold bg-white/10 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4" />
            <span>
              {totaal === 0
                ? "Wachten op de eerste antwoorden"
                : `${totaal} ${totaal === 1 ? eenheid[0] : eenheid[1]}`}
            </span>
          </span>
          <span className="truncate">{joinUrl.replace(/^https?:\/\//, "")}</span>
        </div>

        {children}
      </div>

      {voetnoot && <p className="text-xs text-slate-500 text-center">{voetnoot}</p>}

      {!opslagGedeeld && <DemoStemmen sessie={sessie} />}
    </div>
  );
}
