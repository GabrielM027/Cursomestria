import {
  CircleUserRound,
  Move,
  RotateCcw,
  Save,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { toast } from "sonner";
import {
  DEFAULT_SELECTION_FORMATION,
  MAX_SELECTION_PLAYERS,
  getSelectionFieldRows,
  getSelectionPlayerCount,
  isValidSelectionFormation,
  type SelectionFormation,
} from "@/lib/amigosData";
import { trpc } from "@/lib/trpc";

type Role = "goalkeeper" | "defender" | "midfielder" | "attacker";
type EditableSlot = {
  role: Role;
  label: string;
  slot: number;
  playerId: number | null;
  fieldX: number;
  fieldY: number;
  isManual: boolean;
};

const roleNames: Record<Role, string> = {
  goalkeeper: "Goleiro",
  defender: "Zagueiro",
  midfielder: "Meio-campista",
  attacker: "Atacante",
};
const clamp = (value: number) => Math.min(95, Math.max(5, Math.round(value)));
const clampCount = (value: number) =>
  Math.min(MAX_SELECTION_PLAYERS - 1, Math.max(0, Math.round(value || 0)));
const slotKey = (slot: Pick<EditableSlot, "role" | "slot">) =>
  `${slot.role}-${slot.slot}`;
const sameFormation = (first: SelectionFormation, second: SelectionFormation) =>
  first.goalkeeperCount === second.goalkeeperCount &&
  first.defenderCount === second.defenderCount &&
  first.midfielderCount === second.midfielderCount &&
  first.attackerCount === second.attackerCount;

export function SelectionAdminTab({ data }: { data: any }) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [slots, setSlots] = useState<EditableSlot[]>([]);
  const [formation, setFormation] = useState<SelectionFormation>({
    ...DEFAULT_SELECTION_FORMATION,
  });
  const [playerCount, setPlayerCount] = useState(
    getSelectionPlayerCount(DEFAULT_SELECTION_FORMATION)
  );
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const save = trpc.admin.selection.saveOverrides.useMutation();
  const saveFormation = trpc.admin.selection.saveFormation.useMutation();
  const reset = trpc.admin.selection.resetOverrides.useMutation();
  const activeSeason = data.activeSeason;
  const currentFormation: SelectionFormation =
    data.selectionFormation || DEFAULT_SELECTION_FORMATION;
  const linePlayers =
    formation.defenderCount +
    formation.midfielderCount +
    formation.attackerCount;
  const targetLinePlayers = playerCount - 1;
  const formationReady =
    isValidSelectionFormation(formation) && linePlayers === targetLinePlayers;
  const formationChanged =
    !sameFormation(formation, currentFormation) ||
    playerCount !== getSelectionPlayerCount(currentFormation);
  const isSaving = save.isPending || saveFormation.isPending || reset.isPending;

  useEffect(() => {
    if (!activeSeason) {
      setSlots([]);
      return;
    }
    setFormation(currentFormation);
    setPlayerCount(getSelectionPlayerCount(currentFormation));
    const savedByKey = new Map<string, any>(
      (data.selectionOverrides || [])
        .filter((override: any) => override.seasonId === activeSeason.id)
        .map((override: any) => [
          `${override.role}-${override.slotNumber}`,
          override,
        ])
    );
    setSlots(
      (data.selectionOfYear || []).map((entry: any) => {
        const override = savedByKey.get(`${entry.role}-${entry.slot}`);
        return {
          role: entry.role,
          label: entry.label,
          slot: entry.slot,
          playerId: override ? override.playerId : (entry.player?.id ?? null),
          fieldX: Number(entry.fieldX),
          fieldY: Number(entry.fieldY),
          isManual: Boolean(override),
        };
      })
    );
  }, [
    activeSeason?.id,
    data.selectionOfYear,
    data.selectionOverrides,
    currentFormation.goalkeeperCount,
    currentFormation.defenderCount,
    currentFormation.midfielderCount,
    currentFormation.attackerCount,
  ]);

  const players = useMemo(() => {
    const registeredIds = new Set(
      (data.registrations || [])
        .filter(
          (registration: any) => registration.seasonId === activeSeason?.id
        )
        .map((registration: any) => registration.playerId)
    );
    const selectedIds = new Set(
      slots.flatMap(slot => (slot.playerId ? [slot.playerId] : []))
    );
    return (data.players || [])
      .filter(
        (player: any) =>
          player.participantType === "fixed" &&
          registeredIds.has(player.id) &&
          (player.isActive || selectedIds.has(player.id))
      )
      .sort((first: any, second: any) => first.name.localeCompare(second.name));
  }, [activeSeason?.id, data.players, data.registrations, slots]);
  const playerById = useMemo(
    () =>
      new Map<number, any>(
        players.map((player: any): [number, any] => [player.id, player])
      ),
    [players]
  );
  const updateSlot = (key: string, changes: Partial<EditableSlot>) =>
    setSlots(current =>
      current.map(slot =>
        slotKey(slot) === key ? { ...slot, ...changes, isManual: true } : slot
      )
    );
  const updateFormation = (
    field: "defenderCount" | "midfielderCount" | "attackerCount",
    value: number
  ) => setFormation(current => ({ ...current, [field]: clampCount(value) }));

  const positionFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const field = fieldRef.current;
    if (!field) return null;
    const bounds = field.getBoundingClientRect();
    return {
      fieldX: clamp(((event.clientX - bounds.left) / bounds.width) * 100),
      fieldY: clamp(((event.clientY - bounds.top) / bounds.height) * 100),
    };
  };
  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    slot: EditableSlot
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingKey(slotKey(slot));
    const position = positionFromPointer(event);
    if (position) updateSlot(slotKey(slot), position);
  };
  const moveDrag = (
    event: PointerEvent<HTMLButtonElement>,
    slot: EditableSlot
  ) => {
    if (draggingKey !== slotKey(slot)) return;
    const position = positionFromPointer(event);
    if (position) updateSlot(slotKey(slot), position);
  };
  const endDrag = () => setDraggingKey(null);

  const applyFormation = async () => {
    if (!activeSeason) return;
    if (!formationReady)
      return toast.error(
        `Distribua ${targetLinePlayers} jogadores de linha para completar a seleção de ${playerCount}.`
      );
    if (
      !window.confirm(
        "Aplicar esta formação? Os melhores por posição serão escalados automaticamente e os ajustes manuais atuais desta temporada serão substituídos."
      )
    )
      return;
    try {
      await saveFormation.mutateAsync({ seasonId: activeSeason.id, formation });
      await Promise.all([
        utils.admin.data.invalidate(),
        utils.club.publicData.invalidate(),
      ]);
      toast.success(
        "Formação aplicada. Os melhores por posição foram selecionados automaticamente."
      );
    } catch (error: any) {
      toast.error(error.message || "Não foi possível aplicar a formação.");
    }
  };

  const saveChanges = async () => {
    if (
      !activeSeason ||
      slots.length !== getSelectionPlayerCount(currentFormation)
    )
      return toast.error(
        "As posições precisam corresponder à quantidade de jogadores da formação aplicada."
      );
    if (formationChanged)
      return toast.error(
        "Aplique a nova formação antes de ajustar os jogadores no campo."
      );
    const selectedIds = slots.flatMap(slot =>
      slot.playerId ? [slot.playerId] : []
    );
    if (new Set(selectedIds).size !== selectedIds.length)
      return toast.error(
        "Um jogador não pode ocupar duas posições. Escolha outro nome antes de salvar."
      );
    try {
      await save.mutateAsync({
        seasonId: activeSeason.id,
        formation: currentFormation,
        slots: slots.map(slot => ({
          role: slot.role,
          slotNumber: slot.slot,
          playerId: slot.playerId,
          fieldX: slot.fieldX,
          fieldY: slot.fieldY,
        })),
      });
      await Promise.all([
        utils.admin.data.invalidate(),
        utils.club.publicData.invalidate(),
      ]);
      toast.success("Ajustes manuais salvos e publicados.");
    } catch (error: any) {
      toast.error(
        error.message || "Não foi possível salvar os ajustes manuais."
      );
    }
  };

  const restoreAutomatic = async () => {
    if (
      !activeSeason ||
      !window.confirm(
        "Restaurar apenas os ajustes manuais? A formação escolhida continuará valendo e os melhores por posição voltarão automaticamente."
      )
    )
      return;
    try {
      await reset.mutateAsync({ seasonId: activeSeason.id });
      await Promise.all([
        utils.admin.data.invalidate(),
        utils.club.publicData.invalidate(),
      ]);
      toast.success("Melhores por posição restaurados automaticamente.");
    } catch (error: any) {
      toast.error(
        error.message || "Não foi possível restaurar o cálculo automático."
      );
    }
  };

  if (!activeSeason)
    return (
      <section className="admin-card">
        <h2>Seleção do Ano</h2>
        <p className="admin-muted">
          Ative uma temporada para montar a seleção e ajustar o campo.
        </p>
      </section>
    );

  return (
    <section className="selection-admin">
      <section className="admin-card selection-admin__intro">
        <div>
          <span className="section-label">Temporada {activeSeason.year}</span>
          <h2>Seleção do Ano</h2>
          <p>
            Escolha a quantidade de jogadores e distribua as posições. Ao
            aplicar, os melhores de cada grupo entram automaticamente pelo total
            de votos de Bola Cheia. Depois, você pode trocar nomes e arrastar os
            cartões.
          </p>
        </div>
        <div className="selection-admin__legend">
          <Move size={17} />
          <span>
            Até {MAX_SELECTION_PLAYERS} jogadores, incluindo 1 goleiro.
          </span>
        </div>
      </section>
      <section className="admin-card selection-admin__formation">
        <div>
          <span className="section-label">Formação automática</span>
          <h2>Monte sua seleção</h2>
          <p>
            Defina quantos jogadores vão entrar e como serão divididos entre
            defesa, meio-campo e ataque.
          </p>
        </div>
        <label className="admin-field selection-admin__quantity">
          <span>Quantidade de jogadores</span>
          <select
            value={playerCount}
            disabled={isSaving}
            onChange={event => setPlayerCount(Number(event.target.value))}
          >
            {Array.from(
              { length: MAX_SELECTION_PLAYERS },
              (_, index) => index + 1
            ).map(count => (
              <option value={count} key={count}>
                {count} {count === 1 ? "jogador" : "jogadores"}
              </option>
            ))}
          </select>
          <small>O total já inclui 1 goleiro.</small>
        </label>
        <div className="selection-admin__formation-fields">
          <label className="admin-field">
            <span>Goleiro</span>
            <input value="1" disabled />
          </label>
          <label className="admin-field">
            <span>Zagueiros</span>
            <input
              type="number"
              min="0"
              max={targetLinePlayers}
              disabled={isSaving}
              value={formation.defenderCount}
              onChange={event =>
                updateFormation("defenderCount", Number(event.target.value))
              }
            />
          </label>
          <label className="admin-field">
            <span>Meio-campistas</span>
            <input
              type="number"
              min="0"
              max={targetLinePlayers}
              disabled={isSaving}
              value={formation.midfielderCount}
              onChange={event =>
                updateFormation("midfielderCount", Number(event.target.value))
              }
            />
          </label>
          <label className="admin-field">
            <span>Atacantes</span>
            <input
              type="number"
              min="0"
              max={targetLinePlayers}
              disabled={isSaving}
              value={formation.attackerCount}
              onChange={event =>
                updateFormation("attackerCount", Number(event.target.value))
              }
            />
          </label>
        </div>
        <div
          className={`selection-admin__formation-summary${formationReady ? " is-valid" : ""}`}
          role="status"
        >
          <UsersRound size={17} />
          <span>
            <strong>
              {linePlayers}/{targetLinePlayers}
            </strong>{" "}
            jogadores de linha + 1 goleiro · {playerCount} no total
          </span>
          <button
            className="admin-save"
            type="button"
            disabled={!formationReady || isSaving}
            onClick={applyFormation}
          >
            Aplicar e selecionar os melhores
          </button>
        </div>
        {!formationReady && (
          <p className="selection-admin__formation-feedback">
            {linePlayers < targetLinePlayers
              ? `Adicione mais ${targetLinePlayers - linePlayers} nas posições acima para completar a seleção.`
              : `Retire ${linePlayers - targetLinePlayers} das posições acima para chegar à quantidade escolhida.`}
          </p>
        )}
      </section>
      <div className="selection-admin__layout">
        <section className="admin-card selection-admin__field-card">
          <div className="selection-admin__field-heading">
            <div>
              <span className="section-label">Formação aplicada</span>
              <h2>Posicionamento</h2>
            </div>
            <span>
              {slots.filter(slot => slot.playerId).length}/{slots.length}{" "}
              escalados
            </span>
          </div>
          <div
            className="selection-field selection-admin-field"
            style={
              {
                "--selection-rows": getSelectionFieldRows(currentFormation),
              } as CSSProperties
            }
            ref={fieldRef}
            aria-label="Campo para ajustar a Seleção do Ano"
          >
            <div className="selection-field__half" />
            <div className="selection-field__circle" />
            <div className="selection-field__goal selection-field__goal--top" />
            <div className="selection-field__goal selection-field__goal--bottom" />
            {slots.map(slot => {
              const player = slot.playerId
                ? playerById.get(slot.playerId)
                : null;
              const key = slotKey(slot);
              return (
                <button
                  type="button"
                  className={`selection-slot selection-admin-slot${draggingKey === key ? " is-dragging" : ""}`}
                  key={key}
                  style={{ left: `${slot.fieldX}%`, top: `${slot.fieldY}%` }}
                  disabled={isSaving}
                  onPointerDown={event => startDrag(event, slot)}
                  onPointerMove={event => moveDrag(event, slot)}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  aria-label={`Mover ${roleNames[slot.role]} ${slot.slot}`}
                >
                  <span className="selection-slot__role">
                    {roleNames[slot.role]}
                  </span>
                  <span className="selection-slot__avatar">
                    {player?.avatarUrl ? (
                      <img src={player.avatarUrl} alt="" />
                    ) : player ? (
                      player.name.slice(0, 1).toUpperCase()
                    ) : (
                      <CircleUserRound size={18} />
                    )}
                    {player?.entityBadgeUrl && (
                      <img
                        className="selection-slot__badge"
                        src={player.entityBadgeUrl}
                        alt=""
                      />
                    )}
                  </span>
                  <strong>{player?.name || "Escolher"}</strong>
                </button>
              );
            })}
          </div>
        </section>
        <section className="admin-card selection-admin__editor">
          <div className="selection-admin__editor-heading">
            <div>
              <span className="section-label">Ajuste fino</span>
              <h2>Trocar e mover</h2>
            </div>
            <SlidersHorizontal size={19} />
          </div>
          <div className="selection-admin__slots">
            {slots.map(slot => {
              const key = slotKey(slot);
              return (
                <article className="selection-admin__slot" key={key}>
                  <header>
                    <div>
                      <strong>
                        {roleNames[slot.role]} {slot.slot > 1 ? slot.slot : ""}
                      </strong>
                      <small>
                        {slot.isManual ? "Ajuste manual" : "Seleção automática"}
                      </small>
                    </div>
                    <span>
                      {slot.role === "goalkeeper"
                        ? "GK"
                        : slot.role === "defender"
                          ? "DEF"
                          : slot.role === "midfielder"
                            ? "MEI"
                            : "ATA"}
                    </span>
                  </header>
                  <label className="admin-field">
                    <span>Jogador</span>
                    <select
                      disabled={isSaving}
                      value={slot.playerId ? String(slot.playerId) : ""}
                      onChange={event =>
                        updateSlot(key, {
                          playerId: event.target.value
                            ? Number(event.target.value)
                            : null,
                        })
                      }
                    >
                      <option value="">Deixar sem jogador</option>
                      {players.map((player: any) => (
                        <option value={player.id} key={player.id}>
                          {player.name}
                          {player.position ? ` · ${player.position}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="selection-admin__coordinates">
                    <label className="admin-field">
                      <span>X · lateral</span>
                      <input
                        type="number"
                        min="5"
                        max="95"
                        disabled={isSaving}
                        value={slot.fieldX}
                        onChange={event =>
                          updateSlot(key, {
                            fieldX: clamp(Number(event.target.value)),
                          })
                        }
                      />
                    </label>
                    <label className="admin-field">
                      <span>Y · profundidade</span>
                      <input
                        type="number"
                        min="5"
                        max="95"
                        disabled={isSaving}
                        value={slot.fieldY}
                        onChange={event =>
                          updateSlot(key, {
                            fieldY: clamp(Number(event.target.value)),
                          })
                        }
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="selection-admin__actions">
            <button
              className="admin-save"
              type="button"
              disabled={isSaving || formationChanged}
              onClick={saveChanges}
            >
              <Save size={16} /> Salvar ajustes no site
            </button>
            <button
              className="admin-secondary"
              type="button"
              disabled={isSaving}
              onClick={restoreAutomatic}
            >
              <RotateCcw size={16} /> Voltar aos melhores automáticos
            </button>
          </div>
          {formationChanged && (
            <p className="selection-admin__formation-feedback">
              Aplique a nova quantidade e distribuição antes de salvar ajustes
              no campo.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
