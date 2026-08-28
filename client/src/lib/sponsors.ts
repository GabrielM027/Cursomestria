export const sponsorSlots = ["Sua marca aqui", "Patrocine a pelada", "Apoio à resenha", "Parceiro local"];

export type SponsorPresentation = { displayScale?: number | null; sortOrder?: number | null; offsetX?: number | null; offsetY?: number | null; fitMode?: string | null };

export function normalizeSponsorPresentation(input: SponsorPresentation) {
  const displayScale = Number(input.displayScale ?? 1);
  const sortOrder = Number(input.sortOrder ?? 0);
  const offsetX = Number(input.offsetX ?? 0);
  const offsetY = Number(input.offsetY ?? 0);
  return {
    displayScale: Math.min(1.6, Math.max(.7, Number.isFinite(displayScale) ? Math.round(displayScale * 100) / 100 : 1)),
    sortOrder: Math.min(9999, Math.max(0, Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0)),
    offsetX: Math.min(30, Math.max(-30, Number.isFinite(offsetX) ? Math.round(offsetX * 100) / 100 : 0)),
    offsetY: Math.min(30, Math.max(-30, Number.isFinite(offsetY) ? Math.round(offsetY * 100) / 100 : 0)),
    fitMode: input.fitMode === "contain" ? "contain" : "cover",
  };
}

export function buildSponsorTickerItems(sponsors: string[]) {
  const cleaned = sponsors.map(sponsor => sponsor.trim()).filter(Boolean);
  return [...cleaned, ...cleaned];
}

export function sponsorAt<T>(sponsors: T[], index: number) {
  if (!sponsors.length) return null;
  return sponsors[((index % sponsors.length) + sponsors.length) % sponsors.length];
}

export function usesFilledSponsorCard(name: string) {
  return Boolean(name.trim());
}
