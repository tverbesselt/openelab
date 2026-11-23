"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ClassroomTimer } from "@/components/tools/ClassroomTimer";
import { StudentRandomizer } from "@/components/tools/StudentRandomizer";
import { GroupGenerator } from "@/components/tools/GroupGenerator";
import { AudioNaarTekst } from "@/components/tools/AudioNaarTekst";
import { KLASTOOLS } from "@/lib/labels";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";
import { Uitgeschakeld } from "@/components/FunctiePoort";
import { VOLSCHERM_KLASSE, VolledigSchermKnop, useVolledigScherm } from "@/components/VolledigScherm";

type ToolId = "timer" | "randomizer" | "groups" | "audiotekst";

const KOLOMMEN: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

function KlastoolsInhoud() {
  const searchParams = useSearchParams();
  const { isAan } = useInstellingen();
  // "groups" is de groepenmaker; de andere ids zijn gelijk aan hun functie.
  const tools = KLASTOOLS.filter((k) => isAan(k.id === "groups" ? "groupmaker" : k.id));
  const [actief, setActief] = useState<ToolId>("timer");
  // De tool alleen op het scherm, groot genoeg voor achteraan in de klas.
  const volScherm = useVolledigScherm();

  useEffect(() => {
    const param = searchParams.get("tool");
    if (param === "timer" || param === "randomizer" || param === "groups" || param === "audiotekst") {
      setActief(param);
    }
  }, [searchParams]);

  // Staat de gekozen tool uit, dan de eerste die wel aan staat.
  const huidig = tools.find((t) => t.id === actief) ?? tools[0];

  if (tools.length === 0) return <Uitgeschakeld />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 u-fade">

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-merk-900 tracking-tight mb-1">
          Klastools
        </h1>
        <p className="text-sm text-slate-600">
          Hulpmiddelen die je zonder voorbereiding gebruikt tijdens de les.
        </p>
      </div>

      <div className={`grid gap-2 ${KOLOMMEN[tools.length] ?? "grid-cols-1"}`}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActief = huidig?.id === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActief(tool.id)}
              aria-pressed={isActief}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors border ${
                isActief
                  ? "bg-merk-800 text-white border-merk-800"
                  : "bg-white text-slate-700 border-slate-200 hover:border-merk"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {huidig && <p className="text-xs text-slate-600 text-center">{huidig.uitleg}</p>}

      <div
        ref={volScherm.ref}
        className={volScherm.actief ? `${VOLSCHERM_KLASSE} flex flex-col` : undefined}
      >
        {/* Audio naar tekst is werk aan je eigen bureau, niets om te projecteren. */}
        {huidig && huidig.id !== "audiotekst" && (
          <div className="flex justify-end mb-3">
            <VolledigSchermKnop
              actief={volScherm.actief}
              onClick={volScherm.wissel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-white border-slate-200 text-slate-700 hover:border-merk text-xs font-bold transition-colors"
            />
          </div>
        )}
        <div className={volScherm.actief ? "my-auto w-full max-w-3xl mx-auto py-6" : undefined}>
        {huidig?.id === "timer" && <ClassroomTimer />}
        {huidig?.id === "randomizer" && <StudentRandomizer />}
        {huidig?.id === "groups" && <GroupGenerator />}
        {huidig?.id === "audiotekst" && <AudioNaarTekst />}
        </div>
      </div>
    </div>
  );
}

export default function KlastoolsPagina() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <KlastoolsInhoud />
    </Suspense>
  );
}
