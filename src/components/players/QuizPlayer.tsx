"use client";

import React, { useMemo, useRef, useState } from "react";
import { QuizQuestion, DidacticConfig } from "@/lib/types";
import { CheckCircle2, XCircle, ArrowRight, RefreshCw, RotateCcw, Undo2 } from "lucide-react";
import { Voortgang } from "./FlashcardPlayer";
import { OptieBronnen, VraagMedia } from "./VraagMedia";
import { Opmaak } from "./Opmaak";
import { hussel } from "@/lib/hussel";
import { MAX_TYPANTWOORD, isTypAntwoordJuist, toonAntwoord } from "@/lib/typantwoord";

interface QuizPlayerProps {
  questions: QuizQuestion[];
  didacticConfig?: DidacticConfig;
  onComplete?: (scorePct: number) => void;
  /**
   * Welke vragen fout gingen, na de eerste volledige ronde. Alleen dat: geen naam, geen
   * score per persoon. De leraar ziet er straks mee waar de klas struikelt. Met een tweede
   * poging telt een vraag als fout zodra de eerste poging mis was.
   */
  onKlaar?: (foutVragen: string[], aantalVragen: number) => void;
}

/**
 * Een tweede poging heeft alleen zin als er na een fout nog iets te kiezen valt. Bij waar
 * of niet waar, of bij twee antwoorden, ligt het juiste antwoord dan al vast.
 */
function kanTweedePoging(q: QuizQuestion) {
  if (q.type === "dia") return false;
  return q.type === "typ" || q.type === "multiple_response" || q.options.length > 2;
}

/** Een dia telt niet mee: niets te antwoorden, dus ook niets juist of fout. */
const telt = (q: QuizQuestion) => q.type !== "dia";

/** Een volgorde husselen, maar nooit zo dat ze al juist staat. */
function husselVolgorde(aantal: number): number[] {
  const idx = Array.from({ length: aantal }, (_, i) => i);
  if (aantal < 2) return idx;
  for (let poging = 0; poging < 10; poging++) {
    const h = hussel(idx);
    if (h.some((v, i) => v !== i)) return h;
  }
  return [...idx.slice(1), idx[0]];
}

export function QuizPlayer({ questions, didacticConfig, onComplete, onKlaar }: QuizPlayerProps) {
  const tweedeKans = didacticConfig?.tweedeKans ?? false;
  const [queue, setQueue] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [getypt, setGetypt] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  /** De eerste poging was mis; de cursist is nu aan de tweede. */
  const [tweedePoging, setTweedePoging] = useState(false);
  /** Bij één antwoord kiezen: de eerste keuze, zodat die niet nog eens gekozen wordt. */
  const [eersteKeuze, setEersteKeuze] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [pasBijTweede, setPasBijTweede] = useState(0);
  // Niet meteen juist: fout bij de eerste (of enige) poging.
  const [foutIds, setFoutIds] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  // Alleen de eerste volledige ronde telt mee. Wie daarna enkel de foute vragen herdoet,
  // zou het beeld anders scheeftrekken.
  const gemeld = useRef(false);

  const currentQ = queue[currentIndex];

  // De maker typt het juiste antwoord altijd eerst. Zonder husselen stond het dus altijd
  // bovenaan. Per ronde één vaste volgorde; waar/onwaar blijft in zijn gewone volgorde.
  const volgorde = useMemo(
    () =>
      new Map(
        queue.map((q) => {
          const idx = q.options.map((_, i) => i);
          if (q.type === "volgorde") return [q.id, husselVolgorde(idx.length)];
          return [q.id, q.type === "true_false" ? idx : hussel(idx)];
        })
      ),
    [queue]
  );

  const kiesOptie = (index: number) => {
    if (isAnswered || eersteKeuze.includes(index)) return;

    if (currentQ.type === "volgorde") {
      // De volgorde waarin de cursist de delen aantikt, is zijn antwoord.
      if (!selectedOptions.includes(index)) setSelectedOptions([...selectedOptions, index]);
    } else if (currentQ.type === "multiple_response") {
      setSelectedOptions(
        selectedOptions.includes(index)
          ? selectedOptions.filter((i) => i !== index)
          : [...selectedOptions, index]
      );
    } else {
      setSelectedOptions([index]);
    }
  };

  const isTyp = currentQ?.type === "typ";
  const isVolgorde = currentQ?.type === "volgorde";
  const isDia = currentQ?.type === "dia";
  const aantalVragen = queue.filter(telt).length;

  const isJuist = () =>
    isTyp
      ? isTypAntwoordJuist(getypt, currentQ.antwoorden)
      : isVolgorde
        ? selectedOptions.length === currentQ.options.length && selectedOptions.every((val, i) => val === i)
        : currentQ.type === "multiple_response"
          ? selectedOptions.length === currentQ.correctAnswers.length &&
            selectedOptions.every((val) => currentQ.correctAnswers.includes(val))
          : // Eén antwoord kiezen: als meer dan één optie juist is, volstaat elk ervan.
            selectedOptions.length === 1 && currentQ.correctAnswers.includes(selectedOptions[0]);

  const klaarOmTeControleren = !currentQ
    ? false
    : isTyp
      ? Boolean(getypt.trim())
      : isVolgorde
        ? selectedOptions.length === currentQ.options.length
        : selectedOptions.length > 0;

  const controleer = () => {
    if (isAnswered || !klaarOmTeControleren) return;

    const juist = isJuist();

    // Vertraagde feedback: zeg alleen dat het nog niet juist is en laat opnieuw proberen.
    // Het juiste antwoord en de uitleg komen pas na de tweede poging.
    if (!juist && tweedeKans && !tweedePoging && kanTweedePoging(currentQ)) {
      setTweedePoging(true);
      setFoutIds((prev) => [...prev, currentQ.id]);
      if (isVolgorde) {
        setSelectedOptions([]);
      } else if (currentQ.type !== "multiple_response" && !isTyp) {
        setEersteKeuze(selectedOptions);
        setSelectedOptions([]);
      }
      return;
    }

    setIsAnswered(true);
    if (juist) {
      setCorrectCount((prev) => prev + 1);
      if (tweedePoging) setPasBijTweede((prev) => prev + 1);
    } else if (!tweedePoging) {
      setFoutIds((prev) => [...prev, currentQ.id]);
    }
  };

  const volgende = () => {
    setSelectedOptions([]);
    setGetypt("");
    setIsAnswered(false);
    setTweedePoging(false);
    setEersteKeuze([]);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      onComplete?.(aantalVragen ? Math.round((correctCount / aantalVragen) * 100) : 100);
      if (!gemeld.current && aantalVragen > 0) {
        gemeld.current = true;
        onKlaar?.(foutIds, aantalVragen);
      }
    }
  };

  const herstel = (nieuweQueue: QuizQuestion[]) => {
    setQueue(nieuweQueue);
    setCurrentIndex(0);
    setSelectedOptions([]);
    setGetypt("");
    setIsAnswered(false);
    setTweedePoging(false);
    setEersteKeuze([]);
    setCorrectCount(0);
    setPasBijTweede(0);
    setFoutIds([]);
    setIsCompleted(false);
  };

  if (isCompleted) {
    const score = aantalVragen ? Math.round((correctCount / aantalVragen) * 100) : 100;
    const foute = questions.filter((q) => foutIds.includes(q.id));

    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center max-w-lg mx-auto u-pop">
        <CheckCircle2 className="w-10 h-10 text-merk mx-auto mb-3" />
        <h3 className="text-xl font-extrabold text-merk-900 mb-1">Je bent rond</h3>
        <p className="text-sm text-slate-600 mb-6">Deze quiz telt niet mee voor punten.</p>

        <div className="p-6 rounded-xl bg-slate-50 mb-6">
          <span className="text-4xl font-extrabold text-merk-900 block mb-1">{score}%</span>
          <span className="text-sm text-slate-600">
            {correctCount} van de {aantalVragen} vragen juist
          </span>
          {pasBijTweede > 0 && (
            <span className="text-sm text-slate-600 block mt-1">
              {pasBijTweede < correctCount
                ? `Waarvan ${pasBijTweede} bij je tweede poging`
                : correctCount === 1
                  ? "Bij je tweede poging"
                  : "Allemaal bij je tweede poging"}
            </span>
          )}
        </div>

        {foute.length > 0 && (
          <button
            onClick={() => herstel(foute)}
            className="w-full py-3 mb-3 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>
              {tweedeKans
                ? `Oefen de ${foute.length === 1 ? "vraag" : `${foute.length} vragen`} die niet meteen ${foute.length === 1 ? "lukte" : "lukten"}`
                : `Doe enkel de ${foute.length} ${foute.length === 1 ? "foute vraag" : "foute vragen"} opnieuw`}
            </span>
          </button>
        )}

        <button
          onClick={() => herstel(questions)}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
        >
          Begin opnieuw met alle vragen
        </button>
      </div>
    );
  }

  if (!currentQ) return null;

  const voortgang = Math.round(((currentIndex + 1) / queue.length) * 100);
  const juist = isAnswered && isJuist();

  if (isDia) {
    const regels = (currentQ.explanation ?? "").split("\n").map((r) => r.trim()).filter(Boolean);
    return (
      <div className="max-w-xl mx-auto">
        <Voortgang label={`${currentIndex + 1} van ${queue.length}`} percentage={voortgang} />
        <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5">
          <span className="text-xs font-bold text-slate-500 block mb-2">Even lezen</span>
          {currentQ.question && (
            <h2 className="text-lg font-extrabold text-merk-900 leading-snug mb-4">
              <Opmaak tekst={currentQ.question} />
            </h2>
          )}
          {currentQ.media && (
            <div className="mb-4">
              <VraagMedia media={currentQ.media} />
            </div>
          )}
          {regels.length > 1 ? (
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-800 leading-relaxed">
              {regels.map((r, i) => (
                <li key={i}>
                  <Opmaak tekst={r.replace(/^[-•]\s*/, "")} />
                </li>
              ))}
            </ul>
          ) : (
            regels[0] && (
              <p className="text-sm text-slate-800 leading-relaxed">
                <Opmaak tekst={regels[0]} />
              </p>
            )
          )}
        </div>
        <button
          onClick={volgende}
          className="w-full py-3.5 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>{currentIndex + 1 < queue.length ? "Verder" : "Bekijk je resultaat"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Voortgang label={`Vraag ${queue.slice(0, currentIndex + 1).filter(telt).length} van ${aantalVragen}`} percentage={voortgang} />

      <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-5">
        <span className="text-xs font-bold text-slate-500 block mb-2">
          {isTyp
            ? "Typ je antwoord"
            : isVolgorde
              ? "Tik de delen aan in de juiste volgorde"
              : currentQ.type === "multiple_response"
              ? "Meerdere antwoorden mogelijk"
              : "Kies één antwoord"}
        </span>

        {currentQ.media && (
          <div className="mb-4">
            <VraagMedia media={currentQ.media} />
          </div>
        )}

        <h2 className="text-lg font-extrabold text-merk-900 leading-snug mb-5">
          <Opmaak tekst={currentQ.question} />
        </h2>

        {isTyp ? (
          <div className="space-y-2">
            <input
              type="text"
              value={getypt}
              onChange={(e) => setGetypt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAnswered) {
                  e.preventDefault();
                  controleer();
                }
              }}
              maxLength={MAX_TYPANTWOORD}
              placeholder="Typ je antwoord"
              aria-label="Je antwoord"
              autoComplete="off"
              autoCapitalize="none"
              disabled={isAnswered}
              className={`w-full px-4 py-3.5 text-base font-bold rounded-xl border text-slate-900 focus:outline-none ${
                isAnswered
                  ? juist
                    ? "bg-emerald-50 border-emerald-400"
                    : "bg-rose-50 border-rose-400"
                  : "bg-white border-veldrand focus:border-merk-800 focus:ring-2 focus:ring-merk/40"
              }`}
            />
            {!isAnswered && (
              <p className="text-xs text-slate-500">
                Hoofdletters, accenten en extra spaties maken niet uit.
              </p>
            )}
            {isAnswered && !juist && (
              <p className="text-sm text-slate-800">
                Het juiste antwoord: <strong>{toonAntwoord(currentQ.antwoorden)}</strong>
              </p>
            )}
          </div>
        ) : isVolgorde ? (
          <Ordenen
            vraag={currentQ}
            husselVolgorde={volgorde.get(currentQ.id) ?? currentQ.options.map((_, i) => i)}
            rij={selectedOptions}
            beantwoord={isAnswered}
            onKies={kiesOptie}
            onTerug={() => setSelectedOptions(selectedOptions.slice(0, -1))}
          />
        ) : (
        <div className="space-y-2.5">
          {(volgorde.get(currentQ.id) ?? currentQ.options.map((_, i) => i)).map((idx) => {
            const optie = currentQ.options[idx];
            const gekozen = selectedOptions.includes(idx);
            const isJuisteOptie = currentQ.correctAnswers.includes(idx);
            const alGeprobeerd = eersteKeuze.includes(idx);

            let stijl = "bg-slate-50 border-slate-200 text-slate-800 hover:border-merk";
            if (alGeprobeerd && !isAnswered) {
              stijl = "bg-slate-50 border-slate-200 text-slate-400 line-through";
            } else if (gekozen && !isAnswered) {
              stijl = "bg-merk-50 border-merk text-merk-900 font-bold";
            } else if (isAnswered) {
              if (isJuisteOptie) stijl = "bg-emerald-50 border-emerald-400 text-emerald-900 font-bold";
              else if (gekozen) stijl = "bg-rose-50 border-rose-400 text-rose-900";
              else stijl = "bg-slate-50 border-slate-200 text-slate-400";
            }

            return (
              <button
                key={idx}
                disabled={isAnswered || alGeprobeerd}
                onClick={() => kiesOptie(idx)}
                className={`w-full p-4 rounded-xl border text-left text-sm transition-colors flex items-center justify-between gap-3 ${stijl}`}
              >
                {currentQ.optieMedia?.[idx] ? (
                  <span className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentQ.optieMedia[idx]!.url}
                      alt={currentQ.optieMedia[idx]!.alt || optie}
                      className="h-28 sm:h-36 max-w-[75%] object-contain rounded-lg bg-white"
                    />
                    {optie && optie !== currentQ.optieMedia[idx]!.alt && <span>{optie}</span>}
                  </span>
                ) : (
                  <span>
                    <Opmaak tekst={optie} />
                  </span>
                )}
                {isAnswered && isJuisteOptie && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && gekozen && !isJuisteOptie && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        )}
        <OptieBronnen media={currentQ.optieMedia} />
      </div>

      {/* Na een eerste foute poging: geen antwoord, wel een nieuwe kans */}
      {tweedePoging && !isAnswered && (
        <div
          role="status"
          className="p-5 rounded-2xl mb-5 u-rise bg-amber-50 text-amber-900 border border-amber-200"
        >
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            <RotateCcw className="w-5 h-5 text-amber-700" />
            <span>Nog niet juist. Probeer het nog een keer.</span>
          </div>
          <p className="text-sm leading-relaxed">
            {isTyp
              ? "Lees de vraag nog eens en pas je antwoord aan."
              : isVolgorde
                ? "Begin opnieuw en kijk goed naar de volgorde."
                : currentQ.type === "multiple_response"
                ? "Kijk je keuzes nog eens na. Misschien zit er een te veel of een te weinig bij."
                : "Lees de vraag nog eens en kies opnieuw."}{" "}
            Na deze poging zie je het juiste antwoord.
          </p>
        </div>
      )}

      {/* Feedback met uitleg: meteen, of na de tweede poging */}
      {isAnswered && (
        <div
          className={`p-5 rounded-2xl mb-5 u-rise ${
            juist ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm mb-2">
            {juist ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600" />
            )}
            <span>
              {juist
                ? tweedePoging
                  ? "Juist, bij je tweede poging"
                  : "Juist"
                : tweedePoging
                  ? "Ook nu nog niet juist"
                  : "Nog niet juist"}
            </span>
          </div>
          {isVolgorde && !juist && (
            <p className="text-sm mb-1">
              De juiste volgorde: <strong>{currentQ.options.join(" → ")}</strong>
            </p>
          )}
          {currentQ.explanation && (
            <p className="text-sm leading-relaxed">
              <Opmaak tekst={currentQ.explanation} />
            </p>
          )}
        </div>
      )}

      {!isAnswered ? (
        <button
          disabled={!klaarOmTeControleren}
          onClick={controleer}
          className="w-full py-3.5 rounded-xl bg-merk-800 hover:bg-merk-900 disabled:opacity-50 text-white font-bold text-sm transition-colors"
        >
          {tweedePoging ? "Controleer opnieuw" : "Controleer mijn antwoord"}
        </button>
      ) : (
        <button
          onClick={volgende}
          className="w-full py-3.5 rounded-xl bg-merk-900 hover:bg-merk-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 u-rise"
        >
          <span>{currentIndex + 1 < queue.length ? "Volgende vraag" : "Bekijk je resultaat"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/** Ordenen: tik de delen aan in de volgorde die je denkt dat juist is. */
function Ordenen({
  vraag,
  husselVolgorde,
  rij,
  beantwoord,
  onKies,
  onTerug,
}: {
  vraag: QuizQuestion;
  husselVolgorde: number[];
  rij: number[];
  beantwoord: boolean;
  onKies: (index: number) => void;
  onTerug: () => void;
}) {
  return (
    <div className="space-y-3">
      <div
        className="min-h-14 rounded-xl border-2 border-dashed border-merk/40 bg-slate-50 p-3 flex flex-wrap gap-2"
        aria-live="polite"
      >
        {rij.length === 0 ? (
          <span className="text-sm text-slate-500">Jouw volgorde verschijnt hier.</span>
        ) : (
          rij.map((idx, plek) => {
            const opJuistePlek = idx === plek;
            return (
              <span
                key={idx}
                className={`px-3 py-2 rounded-lg text-sm font-bold ${
                  beantwoord
                    ? opJuistePlek
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-rose-100 text-rose-900"
                    : "bg-merk-800 text-white"
                }`}
              >
                <span className="opacity-70 mr-1">{plek + 1}</span>
                {vraag.options[idx]}
              </span>
            );
          })
        )}
      </div>
      {!beantwoord && (
        <>
          <div className="flex flex-wrap gap-2">
            {husselVolgorde.map((idx) => (
              <button
                key={idx}
                disabled={rij.includes(idx)}
                onClick={() => onKies(idx)}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 hover:border-merk disabled:opacity-30"
              >
                {vraag.options[idx]}
              </button>
            ))}
          </div>
          <button
            onClick={onTerug}
            disabled={rij.length === 0}
            className="text-xs font-bold text-slate-500 hover:text-merk-900 disabled:opacity-40 flex items-center gap-1"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Laatste deel terugzetten
          </button>
        </>
      )}
    </div>
  );
}
