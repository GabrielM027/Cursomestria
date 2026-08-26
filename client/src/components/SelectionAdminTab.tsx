import { CircleUserRound, Move, RotateCcw, Save, SlidersHorizontal, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { toast } from "sonner";
import { DEFAULT_SELECTION_FORMATION, isValidSelectionFormation, type SelectionFormation } from "@/lib/amigosData";
import { trpc } from "@/lib/trpc";

type Role = "goalkeeper" | "defender" | "midfielder" | "attacker";
type EditableSlot = { role: Role; label: string; slot: number; playerId: number | null; fieldX: number; fieldY: number; isManual: boolean };

const roleNames: Record<Role, string> = { goalkeeper: "Goleiro", defender: "Zagueiro", midfielder: "Meio-campista", attacker: "Atacante" };
const clamp = (value: number) => Math.min(95, Math.max(5, Math.round(value)));
const clampCount = (value: number) => Math.min(7, Math.max(0, Math.round(value || 0)));
const slotKey = (slot: Pick<EditableSlot, "role" | "slot">) => `${slot.role}-${slot.slot}`;
const sameFormation = (first: SelectionFormation, second: SelectionFormation) => first.goalkeeperCount === second.goalkeeperCount && first.defenderCount === second.defenderCount && first.midfielderCount === second.midfielderCount && first.attackerCount === second.attackerCount;

export function SelectionAdminTab({ data }: { data: any }) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [slots, setSlots] = useState<EditableSlot[]>([]);
  const [formation, setFormation] = useState<SelectionFormation>({ ...DEFAULT_SELECTION_FORMATION });
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const save = trpc.admin.selection.saveOverrides.useMutation();
  const saveFormation = trpc.admin.selection.saveFormation.useMutation();
  const reset = trpc.admin.selection.resetOverrides.useMutation();
  const activeSeason = data.activeSeason;
  const currentFormation: SelectionFormation = data.selectionFormation || DEFAULT_SELECTION_FORMATION;
  const linePlayers = formation.defenderCount + formation.midfielderCount + formation.attackerCount;

  useEffect(() => {
    if (!activeSeason) { setSlots([]); return; }
    setFormation(currentFormation);
    const savedByKey = new Map<string, any>((data.selectionOverrides || []).filter((override: any) => override.seasonId === activeSeason.id).map((override: any) => [`${override.role}-${override.slotNumber}`, override]));
    setSlots((data.selectionOfYear || []).map((entry: any) => {
      const override = savedByKey.get(`${entry.role}-${entry.slot}`);
      return { role: entry.role, label: entry.label, slot: entry.slot, playerId: override ? override.playerId : entry.player?.id ?? null, fieldX: Number(entry.fieldX), fieldY: Number(entry.fieldY), isManual: Boolean(override) };
    }));
  }, [activeSeason?.id, data.selectionOfYear, data.selectionOverrides, currentFormation.goalkeeperCount, currentFormation.defenderCount, currentFormation.midfielderCount, currentFormation.attackerCount]);

  const players = useMemo(() => {
    const registeredIds = new Set((data.registrations || []).filter((registration: any) => registration.seasonId === activeSeason?.id).map((registration: any) => registration.playerId));
    const selectedIds = new Set(slots.flatMap(slot => slot.playerId ? [slot.playerId] : []));
    return (data.players || []).filter((player: any) => player.participantType === "fixed" && registeredIds.has(player.id) && (player.isActive || selectedIds.has(player.id))).sort((first: any, second: any) => first.name.localeCompare(second.name));
  }, [activeSeason?.id, data.players, data.registrations, slots]);
  const playerById = useMemo(() => new Map<number, any>(players.map((player: any): [number, any] => [player.id, player])), [players]);
  const updateSlot = (key: string, changes: Partial<EditableSlot>) => setSlots(current => current.map(slot => slotKey(slot) === key ? { ...slot, ...changes, isManual: true } : slot));
  const updateFormation = (field: "defenderCount" | "midfielderCount" | "attackerCount", value: number) => setFormation(current => ({ ...current, [field]: clampCount(value) }));

  const positionFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const field = fieldRef.current;
    if (!field) return null;
    const bounds = field.getBoundingClientRect();
    return { fieldX: clamp(((event.clientX - bounds.left) / bounds.width) * 100), fieldY: clamp(((event.clientY - bounds.top) / bounds.height) * 100) };
  };
  const startDrag = (event: PointerEvent<HTMLButtonElement>, slot: EditableSlot) => { event.currentTarget.setPointerCapture(event.pointerId); setDraggingKey(slotKey(slot)); const position = positionFromPointer(event); if (position) updateSlot(slotKey(slot), position); };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>, slot: EditableSlot) => { if (draggingKey !== slotKey(slot)) return; const position = positionFromPointer(event); if (position) updateSlot(slotKey(slot), position); };
  const endDrag = () => setDraggingKey(null);

  const applyFormation = async () => {
    if (!activeSeason) return;
    if (!isValidSelectionFormation(formation)) return toast.error("A formação precisa fechar em 1 goleiro e 7 jogadores de linha.");
    if (!window.confirm("Aplicar esta formação? Os melhores por posição serão escalados automaticamente e os ajustes manuais atuais desta temporada serão substituídos.")) return;
    try {
      await saveFormation.mutateAsync({ seasonId: activeSeason.id, formation });
      await Promise.all([utils.admin.data.invalidate(), utils.club.publicData.invalidate()]);
      toast.success("Formação aplicada. Os melhores por posição foram selecionados automaticamente.");
    } catch (error: any) { toast.error(error.message || "Não foi possível aplicar a formação."); }
  };

  const saveChanges = async () => {
    if (!activeSeason || slots.length !== 8) return toast.error("A formação precisa ter oito posições.");
    if (!sameFormation(formation, currentFormation)) return toast.error("Aplique a nova formação antes de ajustar os jogadores no campo.");
    const selectedIds = slots.flatMap(slot => slot.playerId ? [slot.playerId] : []);
    if (new Set(selectedIds).size !== selectedIds.length) return toast.error("Um jogador não pode ocupar duas posições. Escolha outro nome antes de salvar.");
    try {
      await save.mutateAsync({ seasonId: activeSeason.id, formation: currentFormation, slots: slots.map(slot => ({ role: slot.role, slotNumber: slot.slot, playerId: slot.playerId, fieldX: slot.fieldX, fieldY: slot.fieldY })) });
      await Promise.all([utils.admin.data.invalidate(), utils.club.publicData.invalidate()]);
      toast.success("Ajustes manuais salvos e publicados.");
    } catch (error: any) { toast.error(error.message || "Não foi possível salvar os ajustes manuais."); }
  };

  const restoreAutomatic = async () => {
    if (!activeSeason || !window.confirm("Restaurar apenas os ajustes manuais? A formação escolhida continuará valendo e os melhores por posição voltarão automaticamente.")) return;
    try {
      await reset.mutateAsync({ seasonId: activeSeason.id });
      await Promise.all([utils.admin.data.invalidate(), utils.club.publicData.invalidate()]);
      toast.success("Melhores por posição restaurados automaticamente.");
    } catch (error: any) { toast.error(error.message || "Não foi possível restaurar o cálculo automático."); }
  };

  if (!activeSeason) return <section className="admin-card"><h2>Seleção do Ano</h2><p className="admin-muted">Ative uma temporada para montar a seleção e ajustar o campo.</p></section>;

  return <section className="selection-admin"><section className="admin-card selection-admin__intro"><div><span className="section-label">Temporada {activeSeason.year}</span><h2>Seleção do Ano</h2><p>Primeiro defina quantos jogadores haverá em cada posição. Ao aplicar, os melhores de cada grupo entram automaticamente pelo total de votos de Bola Cheia. Depois, se quiser, você pode trocar nomes e arrastar os cartões.</p></div><div className="selection-admin__legend"><Move size={17} /><span>Formação livre, mantendo 1 goleiro e 7 jogadores de linha.</span></div></section><section className="admin-card selection-admin__formation"><div><span className="section-label">Formação automática</span><h2>Defina a distribuição</h2><p>Exemplo: 1 zagueiro, 5 meias e 1 atacante. O sistema busca automaticamente os melhores em cada posição.</p></div><div className="selection-admin__formation-fields"><label className="admin-field"><span>Goleiro</span><input value="1" disabled /></label><label className="admin-field"><span>Zagueiros</span><input type="number" min="0" max="7" value={formation.defenderCount} onChange={event => updateFormation("defenderCount", Number(event.target.value))} /></label><label className="admin-field"><span>Meio-campistas</span><input type="number" min="0" max="7" value={formation.midfielderCount} onChange={event => updateFormation("midfielderCount", Number(event.target.value))} /></label><label className="admin-field"><span>Atacantes</span><input type="number" min="0" max="7" value={formation.attackerCount} onChange={event => updateFormation("attackerCount", Number(event.target.value))} /></label></div><div className={`selection-admin__formation-summary${linePlayers === 7 ? " is-valid" : ""}`}><UsersRound size={17} /><span><strong>{linePlayers}/7</strong> jogadores de linha</span><button className="admin-save" type="button" disabled={linePlayers !== 7 || saveFormation.isPending || reset.isPending} onClick={applyFormation}>Aplicar e selecionar os melhores</button></div></section><div className="selection-admin__layout"><section className="admin-card selection-admin__field-card"><div className="selection-admin__field-heading"><div><span className="section-label">Campo society</span><h2>Posicionamento</h2></div><span>{slots.filter(slot => slot.playerId).length}/8 escalados</span></div><div className="selection-field selection-admin-field" ref={fieldRef} aria-label="Campo para ajustar a Seleção do Ano"><div className="selection-field__half" /><div className="selection-field__circle" /><div className="selection-field__goal selection-field__goal--top" /><div className="selection-field__goal selection-field__goal--bottom" />{slots.map(slot => { const player = slot.playerId ? playerById.get(slot.playerId) : null; const key = slotKey(slot); return <button type="button" className={`selection-slot selection-admin-slot${draggingKey === key ? " is-dragging" : ""}`} key={key} style={{ left: `${slot.fieldX}%`, top: `${slot.fieldY}%` }} onPointerDown={event => startDrag(event, slot)} onPointerMove={event => moveDrag(event, slot)} onPointerUp={endDrag} onPointerCancel={endDrag} aria-label={`Mover ${roleNames[slot.role]} ${slot.slot}`}><span className="selection-slot__role">{roleNames[slot.role]}</span><span className="selection-slot__avatar">{player?.avatarUrl ? <img src={player.avatarUrl} alt="" /> : player ? player.name.slice(0, 1).toUpperCase() : <CircleUserRound size={18} />}{player?.entityBadgeUrl && <img className="selection-slot__badge" src={player.entityBadgeUrl} alt="" />}</span><strong>{player?.name || "Escolher"}</strong></button>; })}</div></section><section className="admin-card selection-admin__editor"><div className="selection-admin__editor-heading"><div><span className="section-label">Ajuste fino</span><h2>Trocar e mover</h2></div><SlidersHorizontal size={19} /></div><div className="selection-admin__slots">{slots.map(slot => { const key = slotKey(slot); return <article className="selection-admin__slot" key={key}><header><div><strong>{roleNames[slot.role]} {slot.slot > 1 ? slot.slot : ""}</strong><small>{slot.isManual ? "Ajuste manual" : "Seleção automática"}</small></div><span>{slot.role === "goalkeeper" ? "GK" : slot.role === "defender" ? "DEF" : slot.role === "midfielder" ? "MEI" : "ATA"}</span></header><label className="admin-field"><span>Jogador</span><select value={slot.playerId ? String(slot.playerId) : ""} onChange={event => updateSlot(key, { playerId: event.target.value ? Number(event.target.value) : null })}><option value="">Deixar sem jogador</option>{players.map((player: any) => <option value={player.id} key={player.id}>{player.name}{player.position ? ` · ${player.position}` : ""}</option>)}</select></label><div className="selection-admin__coordinates"><label className="admin-field"><span>X · lateral</span><input type="number" min="5" max="95" value={slot.fieldX} onChange={event => updateSlot(key, { fieldX: clamp(Number(event.target.value)) })} /></label><label className="admin-field"><span>Y · profundidade</span><input type="number" min="5" max="95" value={slot.fieldY} onChange={event => updateSlot(key, { fieldY: clamp(Number(event.target.value)) })} /></label></div></article>; })}</div><div className="selection-admin__actions"><button className="admin-save" type="button" disabled={save.isPending || reset.isPending || saveFormation.isPending} onClick={saveChanges}><Save size={16} /> Salvar ajustes no site</button><button className="admin-secondary" type="button" disabled={save.isPending || reset.isPending || saveFormation.isPending} onClick={restoreAutomatic}><RotateCcw size={16} /> Voltar aos melhores automáticos</button></div></section></div></section>;
}
