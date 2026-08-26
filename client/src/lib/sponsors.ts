export const sponsorSlots = ["Sua marca aqui", "Patrocine a pelada", "Apoio à resenha", "Parceiro local"];

export type SponsorPresentation = { displayScale?: number | null; sortOrder?: number | null };

export function normalizeSponsorPresentation(input: SponsorPresentation) {
  const displayScale = Number(input.displayScale ?? 1);
  const sortOrder = Number(input.sortOrder ?? 0);
  return {
    displayScale: Math.min(1.6, Math.max(.7, Number.isFinite(displayScale) ? Math.round(displayScale * 100) / 100 : 1)),
    sortOrder: Math.min(9999, Math.max(0, Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0)),
  };
}

export function buildSponsorTickerItems(sponsors: string[]) {
  const cleaned = sponsors.map(sponsor => sponsor.trim()).filter(Boolean);
  return [...cleaned, ...cleaned];
}
