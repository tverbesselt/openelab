"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eraser, RotateCcw, Undo2 } from "lucide-react";
import { MediaFout } from "@/lib/media";

/*
 * Een wit tekenblad voor vinger, pen of muis: kleuren, drie diktes, een gom, terug en
 * wissen. Gebruikt op het whiteboard en bij Teken uit je geheugen. `touch-action: none`
 * houdt de pagina stil terwijl je op een tablet of gsm tekent.
 */

const TEKEN_KLEUREN = [
  { kleur: "#0f172a", naam: "Zwart" },
  { kleur: "#b91c1c", naam: "Rood" },
  { kleur: "#1d4ed8", naam: "Blauw" },
  { kleur: "#15803d", naam: "Groen" },
  { kleur: "#c2410c", naam: "Oranje" },
  { kleur: "#216f6d", naam: "Turkoois" },
  { kleur: "#eab308", naam: "Geel" },
  { kleur: "#7e22ce", naam: "Paars" },
];
const DIKTES = [4, 10, 24];
const BREEDTE = 1200;
const HOOGTE = 900;

interface Lijn {
  kleur: string;
  dikte: number;
  punten: [number, number][];
}

export function TekenBlad({
  canvasRef,
  onLeeg,
}: {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  onLeeg: (leeg: boolean) => void;
}) {
  const [kleur, setKleur] = useState(TEKEN_KLEUREN[0].kleur);
  const [dikte, setDikte] = useState(DIKTES[0]);
  const [gum, setGum] = useState(false);
  const lijnen = useRef<Lijn[]>([]);
  const huidig = useRef<Lijn | null>(null);
  const [aantal, setAantal] = useState(0);

  const teken = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, BREEDTE, HOOGTE);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const lijn of [...lijnen.current, ...(huidig.current ? [huidig.current] : [])]) {
      ctx.strokeStyle = lijn.kleur;
      ctx.lineWidth = lijn.dikte;
      ctx.beginPath();
      lijn.punten.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      // Eén tik tekent een stip.
      if (lijn.punten.length === 1) ctx.lineTo(lijn.punten[0][0] + 0.1, lijn.punten[0][1]);
      ctx.stroke();
    }
  };

  useEffect(teken, []); // eslint-disable-line react-hooks/exhaustive-deps

  const punt = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * BREEDTE, ((e.clientY - r.top) / r.height) * HOOGTE];
  };

  const wijzig = () => {
    setAantal(lijnen.current.length);
    onLeeg(lijnen.current.length === 0);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={BREEDTE}
        height={HOOGTE}
        aria-label="Tekenblad"
        className="w-full aspect-[4/3] rounded-xl border border-slate-300 bg-white cursor-crosshair"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          huidig.current = { kleur: gum ? "#ffffff" : kleur, dikte: gum ? 40 : dikte, punten: [punt(e)] };
          teken();
        }}
        onPointerMove={(e) => {
          if (!huidig.current) return;
          huidig.current.punten.push(punt(e));
          teken();
        }}
        onPointerUp={() => {
          if (!huidig.current) return;
          lijnen.current.push(huidig.current);
          huidig.current = null;
          teken();
          wijzig();
        }}
        onPointerCancel={() => {
          huidig.current = null;
          teken();
        }}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {TEKEN_KLEUREN.map((k) => (
          <button
            key={k.kleur}
            type="button"
            onClick={() => {
              setKleur(k.kleur);
              setGum(false);
            }}
            aria-label={k.naam}
            aria-pressed={!gum && kleur === k.kleur}
            className={`w-8 h-8 rounded-full border-2 ${
              !gum && kleur === k.kleur ? "border-slate-900 ring-2 ring-offset-1 ring-merk" : "border-white shadow"
            }`}
            style={{ backgroundColor: k.kleur }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {DIKTES.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDikte(d);
              setGum(false);
            }}
            aria-label={d === DIKTES[0] ? "Dunne pen" : d === DIKTES[1] ? "Middelste pen" : "Dikke pen"}
            aria-pressed={!gum && dikte === d}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
              !gum && dikte === d ? "border-merk-800 bg-merk-50" : "border-slate-200 bg-white"
            }`}
          >
            <span className="rounded-full bg-slate-900" style={{ width: d / 2 + 2, height: d / 2 + 2 }} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setGum((g) => !g)}
          aria-pressed={gum}
          aria-label="Gom"
          title="Gom"
          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            gum ? "border-merk-800 bg-merk-50" : "border-slate-200 bg-white"
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>
        <span className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            disabled={aantal === 0}
            onClick={() => {
              lijnen.current.pop();
              teken();
              wijzig();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" /> Terug
          </button>
          <button
            type="button"
            disabled={aantal === 0}
            onClick={() => {
              lijnen.current = [];
              teken();
              wijzig();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Wissen
          </button>
        </span>
      </div>
    </div>
  );
}

export function tekeningAlsBlob(canvas: HTMLCanvasElement | null): Promise<Blob> {
  return new Promise((ok, nietOk) => {
    if (!canvas) return nietOk(new MediaFout("Er is geen tekening om te versturen."));
    canvas.toBlob((b) => (b ? ok(b) : nietOk(new MediaFout("De tekening kon niet bewaard worden."))), "image/png");
  });
}

