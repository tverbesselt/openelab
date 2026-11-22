"use client";

import React from "react";
import { BeeldBron, QuizMedia } from "@/lib/types";
import { herkenVideo, videoInbedden } from "@/lib/media";

/**
 * De foto, het filmpje of het audiofragment bij een quizvraag. Staat boven de vraag,
 * want de vraag gaat erover. `groot` is voor het digibord.
 */
export function VraagMedia({ media, groot = false }: { media: QuizMedia; groot?: boolean }) {
  if (media.soort === "afbeelding") {
    return (
      <figure>
        <img
          src={media.url}
          alt={media.alt ?? ""}
          className={`block mx-auto rounded-xl border border-slate-200 bg-slate-50 object-contain w-auto max-w-full ${
            groot ? "max-h-[50vh]" : "max-h-72"
          }`}
        />
        {media.bron && (
          <figcaption className={`mt-1 text-center text-[10px] ${groot ? "opacity-70" : "text-slate-500"}`}>
            <Bronvermelding bron={media.bron} />
          </figcaption>
        )}
      </figure>
    );
  }

  if (media.soort === "audio") {
    return (
      <audio controls preload="metadata" src={media.url} className="w-full">
        Je browser kan dit audiofragment niet afspelen.
      </audio>
    );
  }

  const bron = herkenVideo(media.url);
  if (!bron) {
    return (
      <p className="text-sm text-slate-600">
        Dit filmpje kunnen we niet tonen.{" "}
        <a href={media.url} target="_blank" rel="noreferrer" className="underline">
          Open de link
        </a>
        .
      </p>
    );
  }

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black ${groot ? "max-h-[55vh]" : ""}`}>
      <iframe
        src={videoInbedden(bron, media.start, media.eind)}
        title="Filmpje bij de vraag"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

/**
 * Maker en licentie van een vrije afbeelding, met links. Klein, maar de licentie vraagt
 * dat het erbij staat.
 */
export function Bronvermelding({ bron }: { bron: BeeldBron }) {
  const link = "underline decoration-dotted hover:decoration-solid";
  return (
    <span>
      {bron.pagina ? (
        <a href={bron.pagina} target="_blank" rel="noreferrer" className={link}>
          Beeld
        </a>
      ) : (
        "Beeld"
      )}
      {bron.maker && (
        <>
          {" van "}
          {bron.makerUrl ? (
            <a href={bron.makerUrl} target="_blank" rel="noreferrer" className={link}>
              {bron.maker}
            </a>
          ) : (
            bron.maker
          )}
        </>
      )}
      {" · "}
      {bron.licentieUrl ? (
        <a href={bron.licentieUrl} target="_blank" rel="noreferrer" className={link}>
          {bron.licentie}
        </a>
      ) : (
        bron.licentie
      )}
    </span>
  );
}

/** Onder de antwoorden: de bronnen van de beelden bij de opties, als die er zijn. */
export function OptieBronnen({ media, licht = false }: { media?: (QuizMedia | null)[]; licht?: boolean }) {
  const bronnen = (media ?? []).flatMap((m, i) => (m?.bron ? [{ i, bron: m.bron }] : []));
  if (bronnen.length === 0) return null;
  return (
    <p className={`mt-2 text-[10px] leading-relaxed ${licht ? "opacity-70" : "text-slate-500"}`}>
      {bronnen.map(({ i, bron }, n) => (
        <span key={i}>
          {n > 0 && " — "}
          {bronnen.length > 1 && `${n + 1}. `}
          <Bronvermelding bron={bron} />
        </span>
      ))}
    </p>
  );
}
