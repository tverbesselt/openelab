"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Expand, Shrink } from "lucide-react";

/*
 * Volledig scherm voor een speler of een projectie. De browser zet het gekozen deel van de
 * pagina over het hele scherm, zonder adresbalk, menu of voettekst: rustig voor een cursist
 * en goed leesbaar op het digibord.
 *
 * Niet elke browser kan dat (een iPhone bijvoorbeeld niet). Daar vult het deel dan het
 * venster, wat bijna hetzelfde oplevert. De klasse hieronder werkt voor allebei.
 */

/** Hoe het deel eruitziet zolang het het scherm vult. */
export const VOLSCHERM_KLASSE = "fixed inset-0 z-50 overflow-y-auto bg-[var(--achtergrond)] p-4 sm:p-6";

// Safari op oudere iPads kent alleen de webkit-namen.
type MetWebkit = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type DocMetWebkit = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function huidigVolElement(): Element | null {
  const d = document as DocMetWebkit;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

/**
 * Zet een deel van de pagina op volledig scherm. Hang `ref` aan dat deel en geef het
 * `VOLSCHERM_KLASSE` zolang `actief` waar is.
 *
 * `esc: false` laat Esc aan de component zelf, bijvoorbeeld als Esc eerst een groot
 * getoond kaartje moet sluiten. In echt volledig scherm sluit de browser het altijd zelf.
 */
export function useVolledigScherm<T extends HTMLElement = HTMLDivElement>({ esc = true } = {}) {
  const ref = useRef<T>(null);
  // De browser toont dit deel op volledig scherm.
  const [echt, setEcht] = useState(false);
  // Terugval: het deel vult het venster.
  const [venster, setVenster] = useState(false);

  useEffect(() => {
    const op = () => setEcht(!!ref.current && huidigVolElement() === ref.current);
    document.addEventListener("fullscreenchange", op);
    document.addEventListener("webkitfullscreenchange", op);
    // Verdwijnt het deel uit de pagina (de sessie stopt), dan sluit de browser het volle
    // scherm zelf.
    return () => {
      document.removeEventListener("fullscreenchange", op);
      document.removeEventListener("webkitfullscreenchange", op);
    };
  }, []);

  useEffect(() => {
    if (!esc || !venster) return;
    const op = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVenster(false);
    };
    window.addEventListener("keydown", op);
    return () => window.removeEventListener("keydown", op);
  }, [esc, venster]);

  const sluit = useCallback(() => {
    if (ref.current && huidigVolElement() === ref.current) sluitEcht();
    setVenster(false);
  }, []);

  const open = useCallback(() => {
    const el = ref.current as MetWebkit | null;
    if (!el) return;
    const vraag = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
    if (!vraag) {
      setVenster(true);
      return;
    }
    // Weigert de browser, of antwoordt ze niet (sommige ingebouwde vensters), dan vult het
    // deel het venster. Komt het volle scherm toch nog, dan sluit één klik ze allebei.
    const terugval = window.setTimeout(() => {
      if (huidigVolElement() !== el) setVenster(true);
    }, 1500);
    try {
      Promise.resolve(vraag())
        .then(() => window.clearTimeout(terugval))
        .catch(() => {
          window.clearTimeout(terugval);
          setVenster(true);
        });
    } catch {
      window.clearTimeout(terugval);
      setVenster(true);
    }
  }, []);

  const actief = echt || venster;
  const wissel = useCallback(() => (actief ? sluit() : open()), [actief, sluit, open]);

  return { ref, actief, wissel, sluit };
}

function sluitEcht() {
  const d = document as DocMetWebkit;
  const stop = d.exitFullscreen?.bind(d) ?? d.webkitExitFullscreen?.bind(d);
  try {
    Promise.resolve(stop?.()).catch(() => {});
  } catch {
    // Al dicht: niets te doen.
  }
}

/** De knop om volledig scherm aan of uit te zetten. */
export function VolledigSchermKnop({
  actief,
  onClick,
  className,
  alleenIcoon = false,
}: {
  actief: boolean;
  onClick: () => void;
  className?: string;
  /** Alleen het icoon, voor een rij kleine knoppen. */
  alleenIcoon?: boolean;
}) {
  const tekst = actief ? "Kleiner" : "Volledig scherm";
  const uitleg = actief ? "Terug naar het gewone scherm (Esc)" : "Toon op volledig scherm";
  const Icoon = actief ? Shrink : Expand;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      title={uitleg}
      aria-label={alleenIcoon ? uitleg : undefined}
      className={className}
    >
      <Icoon className={alleenIcoon ? "w-4 h-4" : "w-3.5 h-3.5"} />
      {!alleenIcoon && <span>{tekst}</span>}
    </button>
  );
}
