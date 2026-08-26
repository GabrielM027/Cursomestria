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

export function SponsorsAdminTab({ data }: { data: any }) {
  const [editingId, setEditingId] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayScale, setDisplayScale] = useState("100");
  const [sortOrder, setSortOrder] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const utils = trpc.useUtils();
  const upload = trpc.admin.uploadMedia.useMutation();
  const save = trpc.admin.saveSponsor.useMutation();
  const remove = trpc.admin.deleteSponsor.useMutation();
  const existing = data.sponsors?.find((sponsor: any) => String(sponsor.id) === editingId);

  const clearForm = () => { setEditingId(""); setName(""); setIsActive(true); setDisplayScale("100"); setSortOrder(String((data.sponsors?.length || 0) * 10)); setFile(null); };
  useEffect(() => {
    if (!existing) { if (editingId) clearForm(); return; }
    setName(existing.name || ""); setIsActive(existing.isActive); setDisplayScale(String(Math.round(Number(existing.displayScale ?? 1) * 100))); setSortOrder(String(existing.sortOrder ?? 0)); setFile(null);
  }, [editingId, existing?.id]);

  const invalidate = async () => { await Promise.all([utils.admin.data.invalidate(), utils.club.publicData.invalidate()]); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome do patrocinador.");
    try {
      const uploaded = file ? await upload.mutateAsync({ base64: await fileToBase64(file), fileName: file.name, mimeType: file.type || "image/png", folder: "sponsors" }) : null;
      await save.mutateAsync({ id: editingId ? Number(editingId) : undefined, name, logoUrl: uploaded?.url || existing?.logoUrl || null, logoKey: uploaded?.key || existing?.logoKey || null, displayScale: Number(displayScale) / 100, sortOrder: Number(sortOrder), isActive });
      await invalidate(); clearForm(); toast.success(editingId ? "Patrocinador atualizado na faixa." : "Patrocinador adicionado à faixa.");
    } catch (error: any) { toast.error(error.message || "Não foi possível salvar o patrocinador."); }
  };
  const deleteSponsor = async () => {
    if (!existing || !window.confirm(`Excluir ${existing.name} da faixa de patrocinadores? A logo vinculada também será removida.`)) return;
    try { await remove.mutateAsync({ id: existing.id }); await invalidate(); clearForm(); toast.success("Patrocinador excluído da faixa."); } catch (error: any) { toast.error(error.message || "Não foi possível excluir o patrocinador."); }
  };
  const previewUrl = file ? URL.createObjectURL(file) : existing?.logoUrl || null;
  const scale = Math.min(160, Math.max(70, Number(displayScale) || 100));
  return <section className="sponsors-admin"><section className="admin-card sponsors-admin__intro"><div><span className="section-label">Faixa da tela inicial</span><h2>Patrocinadores</h2><p>Cadastre uma marca por vez e ela entra automaticamente na faixa em movimento. Para melhor resultado, envie a logo em <strong>PNG ou WebP com fundo transparente</strong>. A imagem é exibida sem corte, mesmo se a logo enviada for quadrada.</p></div><div className="sponsors-admin__rules"><span><ImagePlus size={17} /> PNG ou WebP transparente</span><span><Eye size={17} /> Escala até 160%</span></div></section><div className="sponsors-admin__layout"><section className="admin-card"><h2>{editingId ? "Editar patrocinador" : "Novo patrocinador"}</h2><form className="admin-form" onSubmit={submit}><div className="admin-form__grid"><label className="admin-field"><span>Nome da marca</span><input required value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Oficina do Bairro" /></label><label className="admin-field"><span>Ordem na faixa</span><input type="number" min="0" max="9999" value={sortOrder} onChange={event => setSortOrder(event.target.value)} /></label><label className="admin-field"><span>Visibilidade</span><select value={isActive ? "active" : "inactive"} onChange={event => setIsActive(event.target.value === "active")}><option value="active">Aparece na faixa</option><option value="inactive">Oculto temporariamente</option></select></label><label className="admin-field"><span>Logo da marca</span><input type="file" accept="image/png,image/webp,image/jpeg" onChange={event => setFile(event.target.files?.[0] || null)} /></label></div><label className="admin-field sponsors-admin__range"><span>Tamanho visual: <strong>{scale}%</strong></span><input type="range" min="70" max="160" step="5" value={scale} onChange={event => setDisplayScale(event.target.value)} /><small>Use um tamanho maior para logos pequenas ou quadradas. A proporção original será preservada.</small></label><div className="sponsors-admin__preview"><span>Prévia na faixa</span><div className="sponsors-marquee__item sponsors-marquee__item--logo" style={{ "--sponsor-scale": String(scale / 100) } as CSSProperties}>{previewUrl ? <img src={previewUrl} alt={name || "Prévia da logo"} /> : <span>{name || "Nome da marca"}</span>}</div></div><div className="admin-actions"><button className="admin-save" type="submit" disabled={upload.isPending || save.isPending}><Save size={16} /> {editingId ? "Salvar patrocinador" : "Adicionar patrocinador"}</button>{editingId && <button className="admin-secondary" type="button" onClick={clearForm}>Cancelar</button>}{editingId && <button className="admin-danger" type="button" disabled={remove.isPending} onClick={deleteSponsor}><Trash2 size={16} /> Excluir</button>}</div></form></section><section className="admin-card"><div className="sponsors-admin__list-heading"><div><span className="section-label">Marcas cadastradas</span><h2>Na faixa</h2></div><strong>{data.sponsors?.length || 0}</strong></div><div className="sponsors-admin__list">{data.sponsors?.length ? data.sponsors.map((sponsor: any) => <article className="sponsor-admin-card" key={sponsor.id}><div className="sponsor-admin-card__logo" style={{ "--sponsor-scale": String(sponsor.displayScale ?? 1) } as CSSProperties}>{sponsor.logoUrl ? <img src={sponsor.logoUrl} alt={sponsor.name} /> : sponsor.name.slice(0, 1).toUpperCase()}</div><div><strong>{sponsor.name}</strong><small>Ordem {sponsor.sortOrder} · {sponsor.isActive ? "Visível" : "Oculto"}</small></div><button type="button" aria-label={`Editar ${sponsor.name}`} onClick={() => setEditingId(String(sponsor.id))}><Pencil size={16} /></button></article>) : <p className="admin-muted">Ainda não há patrocinadores cadastrados. Os espaços neutros continuam aparecendo na faixa pública até a primeira marca ser adicionada.</p>}</div></section></div></section>;
}
