import { Eye, EyeOff, ImagePlus, Pencil, Save, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

const clamp = (value: number, lower: number, upper: number) => Math.min(upper, Math.max(lower, value));

export function SponsorsAdminTab({ data }: { data: any }) {
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayScale, setDisplayScale] = useState("100");
  const [offsetX, setOffsetX] = useState("0");
  const [offsetY, setOffsetY] = useState("0");
  const [fitMode, setFitMode] = useState<"cover" | "contain">("contain");
  const [sortOrder, setSortOrder] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const utils = trpc.useUtils();
  const upload = trpc.admin.uploadMedia.useMutation();
  const save = trpc.admin.saveSponsor.useMutation();
  const remove = trpc.admin.deleteSponsor.useMutation();
  const existing = data.sponsors?.find((sponsor: any) => String(sponsor.id) === editingId);

  const clearForm = () => {
    setEditingId(""); setName(""); setIsActive(true); setDisplayScale("100"); setOffsetX("0"); setOffsetY("0"); setFitMode("contain"); setSortOrder(String((data.sponsors?.length || 0) * 10)); setFile(null);
  };
  useEffect(() => {
    if (!existing) { if (editingId) clearForm(); return; }
    setName(existing.name || ""); setIsActive(existing.isActive); setDisplayScale(String(Math.round(Number(existing.displayScale ?? 1) * 100))); setOffsetX(String(Number(existing.offsetX ?? 0))); setOffsetY(String(Number(existing.offsetY ?? 0))); setFitMode(existing.fitMode === "contain" ? "contain" : "cover"); setSortOrder(String(existing.sortOrder ?? 0)); setFile(null);
  }, [editingId, existing?.id]);

  const invalidate = async () => { await Promise.all([utils.admin.data.invalidate(), utils.club.publicData.invalidate()]); };
  const scale = clamp(Number(displayScale) || 100, 70, 160);
  const horizontal = clamp(Number(offsetX) || 0, -30, 30);
  const vertical = clamp(Number(offsetY) || 0, -30, 30);
  const previewUrl = file ? URL.createObjectURL(file) : existing?.logoUrl || null;
  const frameStyle = { "--sponsor-scale": String(scale / 100), "--sponsor-offset-x": `${horizontal}%`, "--sponsor-offset-y": `${vertical}%` } as CSSProperties;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome do patrocinador.");
    try {
      const uploaded = file ? await upload.mutateAsync({ base64: await fileToBase64(file), fileName: file.name, mimeType: file.type || "image/png", folder: "sponsors" }) : null;
      await save.mutateAsync({ id: editingId ? Number(editingId) : undefined, name, logoUrl: uploaded?.url || existing?.logoUrl || null, logoKey: uploaded?.key || existing?.logoKey || null, displayScale: scale / 100, offsetX: horizontal, offsetY: vertical, fitMode, sortOrder: Number(sortOrder), isActive });
      await invalidate(); clearForm(); toast.success(editingId ? "Enquadramento do patrocinador atualizado." : "Patrocinador adicionado à faixa.");
    } catch (error: any) { toast.error(error.message || "Não foi possível salvar o patrocinador."); }
  };
  const deleteSponsor = async () => {
    if (!existing || !window.confirm(`Excluir ${existing.name} da faixa de patrocinadores? A logo vinculada também será removida.`)) return;
    try { await remove.mutateAsync({ id: existing.id }); await invalidate(); clearForm(); toast.success("Patrocinador excluído da faixa."); } catch (error: any) { toast.error(error.message || "Não foi possível excluir o patrocinador."); }
  };
  const movePreview = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const box = event.currentTarget.getBoundingClientRect();
    setOffsetX(String(Math.round(clamp(((event.clientX - box.left) / box.width - .5) * 60, -30, 30))));
    setOffsetY(String(Math.round(clamp(((event.clientY - box.top) / box.height - .5) * 60, -30, 30))));
  };

  return <section className="sponsors-admin"><section className="admin-card sponsors-admin__intro"><div><span className="section-label">Destaque da tela inicial</span><h2>Patrocinadores</h2><p>A prévia tracejada representa a área invisível da logo na página. Prefira PNG ou WebP transparente: assim a marca fica totalmente integrada ao fundo do site, sem cartão, fundo ou moldura.</p></div><div className="sponsors-admin__rules"><span><ImagePlus size={17} /> Transparência integrada</span><span><Eye size={17} /> Ajuste de escala e posição</span></div></section><div className="sponsors-admin__layout"><section className="admin-card"><h2>{editingId ? "Editar patrocinador" : "Novo patrocinador"}</h2><form className="admin-form" onSubmit={submit}><div className="admin-form__grid"><label className="admin-field"><span>Nome da marca</span><input required value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Oficina do Bairro" /></label><label className="admin-field"><span>Ordem na faixa</span><input type="number" min="0" max="9999" value={sortOrder} onChange={event => setSortOrder(event.target.value)} /></label><label className="admin-field"><span>Visibilidade</span><select value={isActive ? "active" : "inactive"} onChange={event => setIsActive(event.target.value === "active")}><option value="active">Aparece na faixa</option><option value="inactive">Oculto temporariamente</option></select></label><label className="admin-field"><span>Logo da marca</span><input type="file" accept="image/png,image/webp,image/jpeg" onChange={event => setFile(event.target.files?.[0] || null)} /><small>PNG ou WebP transparente dá o melhor resultado no destaque.</small></label></div><label className="admin-field sponsors-admin__range"><span>Tamanho visual: <strong>{scale}%</strong></span><input type="range" min="70" max="160" step="5" value={scale} onChange={event => setDisplayScale(event.target.value)} /><small>Amplie para destacar a marca. A área tracejada mostra o limite invisível do posicionamento.</small></label><div className="sponsors-admin__position-grid"><label className="admin-field sponsors-admin__range"><span>Horizontal: <strong>{horizontal > 0 ? `+${horizontal}` : horizontal}</strong></span><input type="range" min="-30" max="30" step="1" value={horizontal} onChange={event => setOffsetX(event.target.value)} /></label><label className="admin-field sponsors-admin__range"><span>Vertical: <strong>{vertical > 0 ? `+${vertical}` : vertical}</strong></span><input type="range" min="-30" max="30" step="1" value={vertical} onChange={event => setOffsetY(event.target.value)} /></label><label className="admin-field"><span>Enquadramento</span><select value={fitMode} onChange={event => setFitMode(event.target.value === "contain" ? "contain" : "cover")}><option value="cover">Preencher a área (corta bordas)</option><option value="contain">Mostrar logo inteira</option></select></label></div><div className="sponsors-admin__preview"><span>Prévia da área de destaque — arraste a logo</span><div className={`sponsor-logo-frame sponsor-logo-frame--${fitMode}`} style={frameStyle} onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={movePreview} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)}>{previewUrl ? <img src={previewUrl} alt={name || "Prévia da logo"} draggable={false} /> : <span>{name || "Nome da marca"}</span>}</div></div><div className="admin-actions"><button className="admin-save" type="submit" disabled={upload.isPending || save.isPending}><Save size={16} /> {editingId ? "Salvar patrocinador" : "Adicionar patrocinador"}</button>{editingId && <button className="admin-secondary" type="button" onClick={clearForm}>Cancelar</button>}{editingId && <button className="admin-danger" type="button" disabled={remove.isPending} onClick={deleteSponsor}><Trash2 size={16} /> Excluir</button>}</div></form></section><section className="admin-card"><div className="sponsors-admin__list-heading"><div><span className="section-label">Marcas cadastradas</span><h2>Na faixa</h2></div><strong>{data.sponsors?.length || 0}</strong></div><div className="sponsors-admin__list">{data.sponsors?.length ? data.sponsors.map((sponsor: any) => <article className="sponsor-admin-card" key={sponsor.id}><div className={`sponsor-logo-frame sponsor-logo-frame--${sponsor.fitMode === "contain" ? "contain" : "cover"}`} style={{ "--sponsor-scale": String(sponsor.displayScale ?? 1), "--sponsor-offset-x": `${Number(sponsor.offsetX ?? 0)}%`, "--sponsor-offset-y": `${Number(sponsor.offsetY ?? 0)}%` } as CSSProperties}>{sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} /> : sponsor.name.slice(0, 1).toUpperCase()}</div><div><strong>{sponsor.name}</strong><small>Ordem {sponsor.sortOrder} · {sponsor.isActive ? "Visível" : "Oculto"}</small></div><button type="button" aria-label={`Editar ${sponsor.name}`} onClick={() => setEditingId(String(sponsor.id))}><Pencil size={16} /></button></article>) : <p className="admin-muted">Ainda não há patrocinadores cadastrados. Os espaços neutros continuam aparecendo na faixa pública até a primeira marca ser adicionada.</p>}</div></section></div></section>;
}
