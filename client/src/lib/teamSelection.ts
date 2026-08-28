export function teamSelectionLabel(player: { name: string; position?: string | null }) {
  const position = player.position?.trim();
  return position ? `${player.name} · ${position.toUpperCase()}` : player.name;
}
