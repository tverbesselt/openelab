"use client";

import React from "react";
import { TALEN } from "@/lib/spraak";
import { Veld } from "./Velden";

/**
 * Taal van de voorleesknop. Staat los van de taal van de app: een leraar Frans maakt
 * Nederlandstalige schermen met Franse woorden erin.
 */
export function TaalKiezer({
  waarde,
  onWijzig,
  wat,
}: {
  waarde: string;
  onWijzig: (taal: string) => void;
  wat: string;
}) {
  return (
    <Veld
      label="In welke taal staan je woorden?"
      hint={`De voorleesknop spreekt ${wat} in deze taal uit. De Nederlandse betekenis klinkt altijd Nederlands.`}
    >
      <select
        value={waarde}
        onChange={(e) => onWijzig(e.target.value)}
        className="w-full p-2.5 text-sm rounded-xl bg-white border border-veldrand text-slate-900 focus:border-merk-800 focus:ring-2 focus:ring-merk/40 focus:outline-none"
      >
        {TALEN.map((taal) => (
          <option key={taal.code} value={taal.code}>
            {taal.label}
          </option>
        ))}
      </select>
    </Veld>
  );
}
