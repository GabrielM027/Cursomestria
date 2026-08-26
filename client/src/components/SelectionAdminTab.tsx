import { CircleUserRound, Move, RotateCcw, Save, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Role = "goalkeeper" | "defender" | "midfielder" | "attacker";
type EditableSlot = { role: Role; label: string; slot: number; playerId: number | null; fieldX: number; fieldY: number; isManual: boolean };

const roleNames: Record<Role, string> = { goalkeeper: "Goleiro", defender: "Zagueiro", midfielder: "Meio-campista", attacker: "Atacante" };
const clamp = (value: number) => Math.min(95, Math.max(5, Math.round(value)));

function slotKey(slot: Pick<EditableSlot, "role" | "slot">) { return `${slot.role}-${slot.slot}`; }

export function SelectionAdminTab({ data }: { data: any }) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [slots, setSlots] = useState<EditableSlot[]>([]);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const save = trpc.admin.selection.saveOverrides.useMutation();
  const reset = trpc.admin.selection.resetOverrides.useMutation();
  const activeSeason = data.activeSeason;

  useEffect(() => {
    if (!activeSeason) return setSlots([]);
    const savedByKey = new Map<string, any>((data.selectionOverrides || []).filter((override: any) => override.seasonId === activeSeason.id).map((override: any) => [`${override.role}-${override.slotNumber}`, override]));
    setSlots((data.selectionOfYear || []).map((entry: any) => {
      const override = savedByKey.get(`${entry.role}-${entry.slot}`);
      return { role: entry.role, label: entry.label, slot: entry.slot, playerId: override ? override.playerId : entry.player?.id ?? null, fieldX: Number(entry.fieldX), fieldY: Number(entry.fieldY), isManual: Boolean(override) };
    }));
  }, [activeSeason?.id, data.selectionOfYear, data.selectionOverrides]);

  const players = useMemo(() => {
    const registeredIds = new Set((data.registrations || []).filter((registration: any) => registration.seasonId === activeSeason?.id).map((registration: any) => registration.playerId));
    const selectedIds = new Set(slots.flatMap(slot => slot.playerId ? [slot.playerId] : []));
    return (data.players || []).filter((player: any) => player.participantType === "fixed" && registeredIds.has(player.id) && (player.isActive || selectedIds.has(player.id))).sort((first: any, second: any) => first.name.localeCompare(second.name));
  }, [activeSeason?.id, data.players, data.registrations, slots]);

  const playerById = useMemo(() => new Map<number, any>(players.map((player: any): [number, any] => [player.id, player])), [players]);
  const updateSlot = (key: string, changes: Partial<EditableSlot>) => setSlots(current => current.map(slot => slotKey(slot) === key ? { ...slot, ...changes, isManual: true } : slot));

  const positionFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const field = fieldRef.current;
    if (!field) return null;
    const bounds = field.getBoundingClientRect();
    return { fieldX: clamp(((event.clientX - bounds.left) / bounds.width) * 100), fieldY: clamp(((event.clientY - bounds.top) / bounds.height) * 100) };
  };
  const startDrag = (event: PointerEvent<HTMLButtonElement>, slot: EditableSlot) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingKey(slotKey(slot));
    const position = positionFromPointer(event);
    if (position) updateSlot(slotKey(slot), position);
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>, slot: EditableSlot) => {
    if (draggingKey !== slotKey(slot)) return;
    const position = positionFromPointer(event);
    if (position) updateSlot(slotKey(slot), position);
  };
  const endDrag = () => setDraggingKey(null);

  const saveChanges = async () => {
    if (!activeSeason || slots.length !== 8) return toast.error("Ative uma temporada antes de ajustar a seleção.");
    const selectedIds = slots.flatMap(slot => slot.playerId ? [slot.playerId] : []);
    if (new Set(selectedIds).size !== selectedIds.length) return toast.error("Um jogador não pode ocupar duas posições. Escolha outro nome antes de salvar.");
    try {
      await save.mutateAsync({ seasonId: activeSeason.id, slots: slots.map(slot => ({ role: slot.role, slotNumber: slot.slot, playerId: slot.playerId, fieldX: slot.fieldX, fieldY: slot.fieldY })) });
      await Promise.all([utils.admin.data.invalidate(), utils.club.publicData.invalidate()]);
      toast.success("Seleção do Ano manual salva e publicada.");
    } catch (error: any) { toast.error(error.message || "Não foi possível salvar a formação manual."); }
  };

  const restoreAutomatic = async () => {
    if (!activeSeason || !window.confirm("Restaurar o cálculo automático? Os ajustes manuais dessa temporada serão apagados.")) return;
    try {
      await reset.mutateAsync({ seasonId: activeSeason.id });
      await Promise.all([utils.admin.data.invalidate(), utils.club.publicData.invalidate()]);
      toast.success("Cálculo automático restaurado.");
    } catch (error: any) { toast.error(error.message || "Não foi possível restaurar o cálculo automático."); }
  };

  if (!activeSeason) return <section className="admin-card"><h2>Seleção do Ano</h2><p className="admin-muted">Ative uma temporada para montar a seleção e ajustar o campo.</p></section>;

  return <section className="selection-admin"><section className="admin-card selection-admin__intro"><div><span className="section-label">Temporada {activeSeason.year}</span><h2>Seleção do Ano</h2><p>Arraste os cartões no campo, escolha qualquer jogador fixo ativo e salve quando a formação estiver do jeito que vocês combinarem. Ao salvar, o ajuste substitui a seleção automática no site público.</p></div><div className="selection-admin__legend"><Move size={17} /><span>Arraste no campo ou ajuste X e Y abaixo.</span></div></section><div className="selection-admin__layout"><section className="admin-card selection-admin__field-card"><div className="selection-admin__field-heading"><div><span className="section-label">Campo society</span><h2>Posicionamento</h2></div><span>{slots.filter(slot => slot.playerId).length}/8 escalados</span></div><div className="selection-field selection-admin-field" ref={fieldRef} aria-label="Campo para ajustar a Seleção do Ano"><div className="selection-field__half" /><div className="selection-field__circle" /><div className="selection-field__goal selection-field__goal--top" /><div className="selection-field__goal selection-field__goal--bottom" />{slots.map(slot => { const player = slot.playerId ? playerById.get(slot.playerId) : null; const key = slotKey(slot); return <button type="button" className={`selection-slot selection-admin-slot${draggingKey === key ? " is-dragging" : ""}`} key={key} style={{ left: `${slot.fieldX}%`, top: `${slot.fieldY}%` }} onPointerDown={event => startDrag(event, slot)} onPointerMove={event => moveDrag(event, slot)} onPointerUp={endDrag} onPointerCancel={endDrag} aria-label={`Mover ${roleNames[slot.role]} ${slot.slot}`}><span className="selection-slot__role">{roleNames[slot.role]}</span><span className="selection-slot__avatar">{player?.avatarUrl ? <img src={player.avatarUrl} alt="" /> : player ? player.name.slice(0, 1).toUpperCase() : <CircleUserRound size={18} />}{player?.entityBadgeUrl && <img className="selection-slot__badge" src={player.entityBadgeUrl} alt="" />}</span><strong>{player?.name || "Escolher"}</strong></button>; })}</div></section><section className="admin-card selection-admin__editor"><div className="selection-admin__editor-heading"><div><span className="section-label">Escalação</span><h2>Trocar e ajustar</h2></div><SlidersHorizontal size={19} /></div><div className="selection-admin__slots">{slots.map(slot => { const key = slotKey(slot); return <article className="selection-admin__slot" key={key}><header><div><strong>{roleNames[slot.role]} {slot.slot > 1 ? slot.slot : ""}</strong><small>{slot.isManual ? "Ajuste manual" : "Base automática"}</small></div><span>{slot.role === "goalkeeper" ? "GK" : slot.role === "defender" ? "DEF" : slot.role === "midfielder" ? "MEI" : "ATA"}</span></header><label className="admin-field"><span>Jogador</span><select value={slot.playerId ? String(slot.playerId) : ""} onChange={event => updateSlot(key, { playerId: event.target.value ? Number(event.target.value) : null })}><option value="">Deixar sem jogador</option>{players.map((player: any) => <option value={player.id} key={player.id}>{player.name}{player.position ? ` · ${player.position}` : ""}</option>)}</select></label><div className="selection-admin__coordinates"><label className="admin-field"><span>X · lateral</span><input type="number" min="5" max="95" value={slot.fieldX} onChange={event => updateSlot(key, { fieldX: clamp(Number(event.target.value)) })} /></label><label className="admin-field"><span>Y · profundidade</span><input type="number" min="5" max="95" value={slot.fieldY} onChange={event => updateSlot(key, { fieldY: clamp(Number(event.target.value)) })} /></label></div></article>; })}</div><div className="selection-admin__actions"><button className="admin-save" type="button" disabled={save.isPending || reset.isPending} onClick={saveChanges}><Save size={16} /> Salvar no site</button><button className="admin-secondary" type="button" disabled={save.isPending || reset.isPending} onClick={restoreAutomatic}><RotateCcw size={16} /> Restaurar automático</button></div></section></div></section>;
}
