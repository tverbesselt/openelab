/*
 * Een lijst bewaren als bestand dat Excel meteen opent: puntkomma's tussen de kolommen
 * (zoals Excel in België verwacht) en een BOM, zodat accenten kloppen.
 */

type Cel = string | number | boolean | null | undefined;

function alsCel(waarde: Cel): string {
  const tekst = waarde === null || waarde === undefined ? "" : String(waarde);
  // Een cel die met = + - of @ begint, zou Excel als formule lezen.
  const veilig = /^[=+\-@]/.test(tekst) ? `'${tekst}` : tekst;
  return /[";\n\r]/.test(veilig) ? `"${veilig.replace(/"/g, '""')}"` : veilig;
}

export function alsCsv(rijen: Cel[][]): string {
  return rijen.map((rij) => rij.map(alsCel).join(";")).join("\r\n");
}

/** Een bestandsnaam zonder tekens waar een besturingssysteem over struikelt. */
export function bestandsnaam(titel: string, achtervoegsel: string): string {
  const kern = titel
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase();
  return `${kern || "open-e-lab"}-${achtervoegsel}.csv`;
}

export function downloadCsv(naam: string, rijen: Cel[][]): void {
  const blob = new Blob(["﻿" + alsCsv(rijen)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = naam;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** "24/11/2026 14:05", voor in een kolom. */
export function datumTijd(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("nl-BE", { dateStyle: "short", timeStyle: "short" });
}
