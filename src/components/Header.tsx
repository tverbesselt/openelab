"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, LogOut, Settings, FlaskConical } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useInstellingen } from "@/lib/instellingen/InstellingenProvider";

export function Header() {
  const pathname = usePathname();
  const { status, gebruiker, isLeraar, isBeheerder, demo, afmelden } = useAuth();
  const { instellingen, isAan } = useInstellingen();
  const klastools = isAan("timer") || isAan("randomizer") || isAan("groupmaker") || isAan("audiotekst");

  const links = isLeraar
    ? [
        { href: "/", label: "Start" },
        { href: "/mappen", label: "Mappen" },
        { href: "/bibliotheek", label: "Bibliotheek" },
        { href: "/live", label: "In de klas" },
        ...(klastools ? [{ href: "/klastools", label: "Klastools" }] : []),
      ]
    : [
        { href: "/", label: "Start" },
        { href: "/bibliotheek", label: "Oefeningen" },
        ...(instellingen.tips.cursisten ? [{ href: "/slim-oefenen", label: "Slim oefenen" }] : []),
      ];

  const isActief = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="niet-afdrukken sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          <Link
            href="/"
            aria-label={`${instellingen.naam} — naar start`}
            className="flex items-center gap-2.5 shrink-0"
          >
            {instellingen.logo ? (
              <img
                src={instellingen.logo}
                alt={instellingen.organisatie || instellingen.naam}
                className="h-8 sm:h-9 w-auto max-w-[10rem] object-contain"
              />
            ) : (
              <span className="w-8 h-8 rounded-xl bg-merk-800 text-white flex items-center justify-center shrink-0">
                <FlaskConical className="w-4.5 h-4.5" aria-hidden />
              </span>
            )}
            <span className="font-extrabold text-lg text-merk-900 tracking-tight">
              {instellingen.naam}
            </span>
            {demo && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                demo
              </span>
            )}
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} actief={isActief(link.href)}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {isLeraar && (
              <Link
                href="/maken"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-merk-800 hover:bg-merk-900 text-white font-bold text-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nieuw</span>
              </Link>
            )}

            {isBeheerder && (
              <Link
                href="/beheer"
                title="Beheer"
                aria-label="Beheer"
                aria-current={isActief("/beheer") ? "page" : undefined}
                className={`p-2 rounded-xl transition-colors ${
                  isActief("/beheer")
                    ? "bg-merk-50 text-merk-900"
                    : "text-slate-500 hover:text-merk-900 hover:bg-slate-100"
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}

            {status === "aangemeld" && gebruiker ? (
              <div className="flex items-center gap-1">
                <span className="hidden md:block text-xs text-slate-600 max-w-[12rem] truncate">
                  {gebruiker.naam}
                </span>
                <button
                  onClick={afmelden}
                  title="Afmelden"
                  aria-label="Afmelden"
                  className="p-2 rounded-xl text-slate-500 hover:text-merk-900 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : status === "afgemeld" ? (
              <Link
                href="/aanmelden"
                className="px-3 py-2 rounded-xl text-sm font-bold text-merk-900 hover:bg-slate-100 transition-colors"
              >
                Aanmelden
              </Link>
            ) : null}
          </div>
        </div>

        {/* Navigatie op smalle schermen */}
        <nav className="flex sm:hidden gap-1.5 pb-2 text-xs overflow-x-auto whitespace-nowrap">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} actief={isActief(link.href)}>
              {link.label}
            </NavLink>
          ))}
          {isLeraar && (
            <NavLink href="/maken" actief={isActief("/maken")}>
              Nieuw
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  actief,
}: {
  href: string;
  children: React.ReactNode;
  actief: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={actief ? "page" : undefined}
      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
        actief
          ? "bg-merk-50 text-merk-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}
