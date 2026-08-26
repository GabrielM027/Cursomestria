export const sponsorSlots = ["Sua marca aqui", "Patrocine a pelada", "Apoio à resenha", "Parceiro local"];

export function buildSponsorTickerItems(sponsors: string[]) {
  const cleaned = sponsors.map(sponsor => sponsor.trim()).filter(Boolean);
  return [...cleaned, ...cleaned];
}
