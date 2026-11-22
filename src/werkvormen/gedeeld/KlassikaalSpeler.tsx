"use client";

import Link from "next/link";
import { klassikaleStart } from "../register";
import type { SpelerProps } from "../soorten";

/** Een poll of woordwolk speel je niet alleen: de oefenpagina verwijst naar de klas. */
export default function KlassikaalSpeler({ oefening, isLeraar }: SpelerProps<"poll" | "wordcloud">) {
  const start = klassikaleStart(oefening);
  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-slate-200 text-center u-pop">
      <p className="text-sm text-slate-600 mb-4">
        Dit is een klassikale werkvorm. De leraar projecteert ze op het digibord en
        cursisten doen mee met de pincode.
      </p>
      {isLeraar && start && (
        <Link
          href={start.href}
          className="inline-flex px-4 py-2.5 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
        >
          Start in de klas
        </Link>
      )}
    </div>
  );
}
