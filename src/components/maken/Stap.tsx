/** Klein label boven de titel: waar zit je in de twee stappen? */
export function Stap({ nummer }: { nummer: 1 | 2 }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 mb-1">
      Stap {nummer} van 2 · {nummer === 1 ? "kiezen" : "invullen"}
    </p>
  );
}
