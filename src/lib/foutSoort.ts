/**
 * Ligt deze fout aan de verbinding? Dan helpt opnieuw proberen, en is het geen fout van de
 * app. Een deel van een pagina dat niet geladen raakt (ChunkLoadError) is ook een netwerkfout:
 * de browser kon de code niet ophalen.
 */
export function isVerbindingsfout(fout: unknown, online: boolean): boolean {
  if (!online) return true;
  if (!(fout instanceof Error)) return false;
  if (fout.name === "ChunkLoadError") return true;
  // Firestore meldt "unavailable" als de server niet bereikbaar is.
  if ((fout as { code?: unknown }).code === "unavailable") return true;
  return /failed to fetch|networkerror|load failed|loading chunk/i.test(fout.message);
}
