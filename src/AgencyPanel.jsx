// AgencyPanel.jsx — Painel de Gestão da Agência (Fase 3)
// Colocar em: src/AgencyPanel.jsx

import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ── helpers Supabase sem SDK ────────────────────────────────────────────────
async function sbGet(path, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbPatch(path, body, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbPost(path, body, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Componente principal ────────────────────────────────────────────────────
export default function AgencyPanel({ supabase, session, profile, dark, onNotif }) {
  const [tab, setTab]           = useState("overview");
  const [agency, setAgency]     = useState(null);
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Perfil editável
  const [agName,  setAgName]   = useState("");
  const [agSlug,  setAgSlug]   = useState("");
  const [agColor1,setAgColor1] = useState("#3BB2A1");
  const [agColor2,setAgColor2] = useState("#0f172a");
  const [agLogo,  setAgLogo]   = useState("");
  const [uploading, setUploading] = useState(false);

  // Convite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting]       = useState(false);

  // ── Tema ────────────────────────────────────────────────────────────────
  const teal   = agency?.primary_color  || "#3BB2A1";
  const bg     = dark ? "#0f172a"  : "#f1f5f9";
  const card   = dark ? "#1e293b"  : "#ffffff";
  const border = dark ? "#334155"  : "#e2e8f0";
  const text   = dark ? "#f1f5f9"  : "#0f172a";
  const muted  = dark ? "#94a3b8"  : "#64748b";
  const inp    = dark ? "#0f172a"  : "#f8fafc";
  const inpB   = dark ? "#334155"  : "#cbd5e1";

  const CARD = { background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 };
  const INP  = { background: inp, border: `1px solid ${inpB}`, borderRadius: 8, padding: "10px 13px", color: text, fontFamily: "inherit", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" };
  const LBL  = { display: "block", fontSize: 11, fontWeight: 700, color: muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" };
  const BTNP = { background: teal, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 };
  const BTNS = { background: inp, color: text, border: `1px solid ${border}`, borderRadius: 8, padding: "9px 18px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 };

  const jwt = session?.access_token;

  // ── Carregar agência ─────────────────────────────────────────────────────
  const loadAgency = useCallback(async () => {
    if (!profile?.agency_id || !jwt) { setLoading(false); return; }
    setLoading(true);
    try {
      const [ag, mem] = await Promise.all([
        sbGet(`agencies?id=eq.${profile.agency_id}&select=*`, jwt),
        sbGet(`profiles?agency_id=eq.${profile.agency_id}&select=id,name,email,photo_url,agency_role,plan,created_at`, jwt),
      ]);
      const a = ag[0];
      if (a) {
        setAgency(a);
        setAgName(a.name || "");
        setAgSlug(a.slug || "");
        setAgColor1(a.primary_color || "#3BB2A1");
        setAgColor2(a.secondary_color || "#0f172a");
        setAgLogo(a.logo_url || "");
      }
      setMembers(mem || []);
    } catch (e) {
      setError("Erro ao carregar agência: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.agency_id, jwt]);

  useEffect(() => { loadAgency(); }, [loadAgency]);

  const isOwner = profile?.agency_role === "owner";
  const isAdmin = profile?.agency_role === "admin" || isOwner;
  const agencyPlan = agency?.plan || "pending";
  const maxUsers   = agency?.max_users || 0;
  const currentUsers = members.length;
  const atLimit    = currentUsers >= maxUsers;

  const planLabel = agencyPlan === "agency_basic" ? "Agência Basic (até 10 agentes)"
    : agencyPlan === "agency_pro" ? "Agência Pro (até 20 agentes)"
    : "Sem plano activo";
  const planColor = agencyPlan === "agency_basic" ? "#3BB2A1"
    : agencyPlan === "agency_pro" ? "#6366f1"
    : "#ef4444";

  // ── Guardar perfil da agência ────────────────────────────────────────────
  const saveProfile = async () => {
    if (!agName.trim()) { setError("O nome é obrigatório."); return; }
    setSaving(true); setError("");
    try {
      const slug = agSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      await sbPatch(`agencies?id=eq.${agency.id}`, {
        name: agName.trim(),
        slug,
        primary_color: agColor1,
        secondary_color: agColor2,
        updated_at: new Date().toISOString(),
      }, jwt);
      onNotif("✅ Agência actualizada.");
      loadAgency();
    } catch (e) {
      setError("Erro ao guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload logo ──────────────────────────────────────────────────────────
  const handleLogo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true); setError("");
    try {
      const ext  = file.name.split(".").pop();
      const path = `${agency.id}/logo-${Date.now()}.${ext}`;
      const res  = await fetch(`${SUPABASE_URL}/storage/v1/object/agency-assets/${path}`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${jwt}`, "Content-Type": file.type, "x-upsert": "true" },
        body: file,
      });
      if (!res.ok) throw new Error(await res.text());
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/agency-assets/${path}`;
      await sbPatch(`agencies?id=eq.${agency.id}`, { logo_url: publicUrl }, jwt);
      setAgLogo(publicUrl);
      onNotif("✅ Logo actualizado.");
    } catch (e) {
      setError("Erro ao carregar logo: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Convidar agente ──────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    if (atLimit) { setError(`Limite de ${maxUsers} agentes atingido. Faz upgrade para adicionar mais.`); return; }
    setInviting(true); setError("");
    try {
      // Procurar utilizador pelo email
      const users = await sbGet(`profiles?email=eq.${encodeURIComponent(inviteEmail.trim())}&select=id,name,agency_id`, jwt);
      if (!users.length) { setError("Utilizador não encontrado. O agente deve criar conta primeiro."); setInviting(false); return; }
      const u = users[0];
      if (u.agency_id && u.agency_id !== agency.id) { setError("Este utilizador já pertence a outra agência."); setInviting(false); return; }
      await sbPatch(`profiles?id=eq.${u.id}`, { agency_id: agency.id, agency_role: "agent" }, jwt);
      onNotif("✅ Agente adicionado à agência.");
      setInviteEmail("");
      loadAgency();
    } catch (e) {
      setError("Erro ao convidar: " + e.message);
    } finally {
      setInviting(false);
    }
  };

  // ── Remover agente ───────────────────────────────────────────────────────
  const removeAgent = async (memberId) => {
    if (!window.confirm("Remover este agente da agência?")) return;
    try {
      await sbPatch(`profiles?id=eq.${memberId}`, { agency_id: null, agency_role: null }, jwt);
      onNotif("Agente removido.");
      loadAgency();
    } catch (e) {
      setError("Erro ao remover: " + e.message);
    }
  };

  // ── Alterar role ─────────────────────────────────────────────────────────
  const changeRole = async (memberId, newRole) => {
    try {
      await sbPatch(`profiles?id=eq.${memberId}`, { agency_role: newRole }, jwt);
      loadAgency();
    } catch (e) {
      setError("Erro ao alterar função: " + e.message);
    }
  };

  // ── Render: sem agência ──────────────────────────────────────────────────
  if (!profile?.agency_id && !loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ ...CARD, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: text, marginBottom: 8 }}>
            Ainda não tens uma agência
          </div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 20 }}>
            Para aceder ao painel de agência, o owner da agência deve adicionar-te à equipa
            ou deves criar uma nova agência com um plano dedicado.
          </div>
          {/* Secção de planos — compra */}
          <AgencyPlansSection dark={dark} teal={teal} card={card} border={border} text={text} muted={muted} inp={inp} inpB={inpB} />
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 24, color: muted, textAlign: "center" }}>A carregar agência...</div>;
  }

  const TABS = [
    { id: "overview",  label: "Visão Geral",       icon: "dashboard" },
    { id: "profile",   label: "Perfil",             icon: "edit"      },
    { id: "team",      label: "Equipa",             icon: "group"     },
    ...(isOwner ? [{ id: "billing", label: "Billing", icon: "credit_card" }] : []),
  ];

  return (
    <div style={{ padding: isMobile() ? 12 : 24 }}>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        {agLogo
          ? <img src={agLogo} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "contain", border: `2px solid ${border}` }}/>
          : <div style={{ width: 52, height: 52, borderRadius: 12, background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏢</div>}
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: text }}>{agency?.name}</div>
          <div style={{ fontSize: 13, color: muted }}>imomatch.pt/<strong>{agency?.slug}</strong></div>
        </div>
        <a href={`/${agency?.slug}`} target="_blank" rel="noreferrer"
          style={{ marginLeft: "auto", ...BTNS, textDecoration: "none" }}>
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
          Ver página pública
        </a>
      </div>

      {error && (
        <div style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
          {error}
          <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...( tab === t.id ? BTNP : BTNS ), borderRadius: 8, fontSize: 13, padding: "8px 16px" }}>
            <span className="material-icons-outlined" style={{ fontSize: 15 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Visão Geral ── */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile() ? "1fr" : "1fr 1fr", gap: 16 }}>
          {/* Plano */}
          <div style={{ ...CARD }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Plano</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>📋</span>
              <div>
                <div style={{ fontWeight: 700, color: planColor, fontSize: 15 }}>{planLabel}</div>
                <div style={{ fontSize: 12, color: muted }}>
                  {agencyPlan !== "pending" ? `${currentUsers} / ${maxUsers} agentes` : "Subscreve um plano para activar a agência"}
                </div>
              </div>
            </div>
          </div>

          {/* Equipa */}
          <div style={{ ...CARD }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Equipa</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>👥</span>
              <div>
                <div style={{ fontWeight: 700, color: text, fontSize: 22 }}>{currentUsers}</div>
                <div style={{ fontSize: 12, color: muted }}>agente{currentUsers !== 1 ? "s" : ""} activo{currentUsers !== 1 ? "s" : ""}</div>
              </div>
            </div>
            {/* Barra de ocupação */}
            {maxUsers > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 6, borderRadius: 99, background: inpB, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((currentUsers / maxUsers) * 100, 100)}%`, background: atLimit ? "#ef4444" : teal, borderRadius: 99, transition: "width 0.4s" }}/>
                </div>
                <div style={{ fontSize: 11, color: atLimit ? "#ef4444" : muted, marginTop: 4 }}>
                  {atLimit ? "⚠️ Limite atingido" : `${maxUsers - currentUsers} vaga${maxUsers - currentUsers !== 1 ? "s" : ""} disponível${maxUsers - currentUsers !== 1 ? "eis" : ""}`}
                </div>
              </div>
            )}
          </div>

          {/* Link público */}
          <div style={{ ...CARD, gridColumn: isMobile() ? "auto" : "1 / -1" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>URL Pública da Agência</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <code style={{ background: inp, border: `1px solid ${inpB}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: teal, flex: 1 }}>
                {window.location.origin}/{agency?.slug}
              </code>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${agency?.slug}`); onNotif("URL copiada!"); }}
                style={BTNS}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>content_copy</span>
              </button>
              <a href={`/${agency?.slug}`} target="_blank" rel="noreferrer" style={{ ...BTNS, textDecoration: "none" }}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Perfil ── */}
      {tab === "profile" && (
        <div style={{ maxWidth: 560 }}>
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 20 }}>Perfil da Agência</div>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              {agLogo
                ? <img src={agLogo} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "contain", border: `2px solid ${border}` }}/>
                : <div style={{ width: 72, height: 72, borderRadius: 12, background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: `2px dashed ${teal}` }}>🏢</div>}
              <div>
                <label style={LBL}>Logótipo</label>
                <label style={{ ...BTNS, cursor: "pointer" }}>
                  <span className="material-icons-outlined" style={{ fontSize: 15 }}>{uploading ? "autorenew" : "upload"}</span>
                  {uploading ? "A carregar..." : "Carregar logo"}
                  <input type="file" accept="image/*" onChange={handleLogo} style={{ display: "none" }} disabled={uploading || !isAdmin}/>
                </label>
                <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>PNG ou SVG recomendado</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={LBL}>Nome da agência *</label>
                <input value={agName} onChange={e => setAgName(e.target.value)} style={INP} disabled={!isAdmin}/>
              </div>
              <div>
                <label style={LBL}>Slug (URL) *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: muted }}>imomatch.pt/</span>
                  <input value={agSlug} onChange={e => setAgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    style={{ ...INP, paddingLeft: 96 }} disabled={!isAdmin}/>
                </div>
              </div>

              {/* Cores */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LBL}>Cor primária</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={agColor1} onChange={e => setAgColor1(e.target.value)}
                      style={{ width: 40, height: 36, border: `1px solid ${inpB}`, borderRadius: 8, cursor: "pointer", padding: 2 }} disabled={!isAdmin}/>
                    <input value={agColor1} onChange={e => setAgColor1(e.target.value)} style={{ ...INP, flex: 1 }} disabled={!isAdmin}/>
                  </div>
                </div>
                <div>
                  <label style={LBL}>Cor secundária</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="color" value={agColor2} onChange={e => setAgColor2(e.target.value)}
                      style={{ width: 40, height: 36, border: `1px solid ${inpB}`, borderRadius: 8, cursor: "pointer", padding: 2 }} disabled={!isAdmin}/>
                    <input value={agColor2} onChange={e => setAgColor2(e.target.value)} style={{ ...INP, flex: 1 }} disabled={!isAdmin}/>
                  </div>
                </div>
              </div>

              {/* Preview do tema */}
              <div style={{ background: agColor1, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: agColor2, flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{agName || "Nome da Agência"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Preview do tema</div>
                </div>
              </div>

              {isAdmin && (
                <button onClick={saveProfile} disabled={saving} style={{ ...BTNP, justifyContent: "center" }}>
                  {saving
                    ? <><span className="material-icons-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>autorenew</span>A guardar...</>
                    : <><span className="material-icons-outlined" style={{ fontSize: 16 }}>save</span>Guardar alterações</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Equipa ── */}
      {tab === "team" && (
        <div style={{ maxWidth: 680 }}>
          {/* Convidar */}
          {isAdmin && (
            <div style={{ ...CARD, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 16 }}>
                Convidar agente
                {atLimit && <span style={{ marginLeft: 8, fontSize: 11, color: "#ef4444", fontWeight: 400 }}>⚠️ Limite atingido</span>}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  placeholder="email@agente.pt" style={{ ...INP, flex: 1 }} disabled={atLimit}/>
                <button onClick={handleInvite} disabled={inviting || atLimit || !inviteEmail.trim()} style={{ ...BTNP, opacity: (atLimit || !inviteEmail.trim()) ? 0.5 : 1, flexShrink: 0 }}>
                  {inviting
                    ? <span className="material-icons-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>autorenew</span>
                    : <><span className="material-icons-outlined" style={{ fontSize: 16 }}>person_add</span>Adicionar</>}
                </button>
              </div>
              <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>
                O agente já deve ter conta criada no ImoMatch.
                {maxUsers > 0 && ` Vagas: ${currentUsers}/${maxUsers}.`}
              </div>
            </div>
          )}

          {/* Lista */}
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 16 }}>
              Equipa ({members.length})
            </div>
            {members.length === 0 && (
              <div style={{ textAlign: "center", color: muted, padding: "24px 0", fontSize: 14 }}>
                Nenhum agente na equipa ainda.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {members.map(m => {
                const isMe = m.id === session?.user?.id;
                const roleColor = m.agency_role === "owner" ? "#6366f1" : m.agency_role === "admin" ? teal : muted;
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${border}` }}>
                    {m.photo_url
                      ? <img src={m.photo_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}/>
                      : <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: text, fontSize: 14 }}>{m.name} {isMe && <span style={{ fontSize: 11, color: muted }}>(tu)</span>}</div>
                      <div style={{ fontSize: 12, color: muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                    </div>
                    {/* Role badge */}
                    <div style={{ flexShrink: 0 }}>
                      {isAdmin && !isMe && m.agency_role !== "owner" ? (
                        <select value={m.agency_role || "agent"} onChange={e => changeRole(m.id, e.target.value)}
                          style={{ background: inp, border: `1px solid ${inpB}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: roleColor, fontWeight: 600, cursor: "pointer" }}>
                          <option value="admin">Admin</option>
                          <option value="agent">Agente</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: roleColor, background: `${roleColor}15`, borderRadius: 20, padding: "3px 10px" }}>
                          {m.agency_role === "owner" ? "Owner" : m.agency_role === "admin" ? "Admin" : "Agente"}
                        </span>
                      )}
                    </div>
                    {/* Remover */}
                    {isAdmin && !isMe && m.agency_role !== "owner" && (
                      <button onClick={() => removeAgent(m.id)}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <span className="material-icons-outlined" style={{ fontSize: 18 }}>person_remove</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Billing (owner only) ── */}
      {tab === "billing" && isOwner && (
        <div style={{ maxWidth: 560 }}>
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 20 }}>Billing da Agência</div>

            {/* Plano actual */}
            <div style={{ background: `${planColor}11`, border: `1px solid ${planColor}33`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: planColor }}>{planLabel}</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                {agencyPlan === "pending" ? "Subscreve um plano para activar a tua agência." : `${currentUsers} / ${maxUsers} agentes activos`}
              </div>
            </div>

            {/* Planos disponíveis (se sem plano) */}
            {agencyPlan === "pending" && (
              <AgencyPlansSection dark={dark} teal={teal} card={card} border={border} text={text} muted={muted} inp={inp} inpB={inpB} />
            )}

            {/* Portal Stripe (se com plano) */}
            {agencyPlan !== "pending" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a href={process.env.REACT_APP_STRIPE_PORTAL_AGENCY || process.env.REACT_APP_STRIPE_PORTAL || "#"}
                  target="_blank" rel="noreferrer"
                  style={{ ...BTNP, textDecoration: "none", justifyContent: "center" }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                  Gerir subscrição (Portal Stripe)
                </a>
                <div style={{ fontSize: 12, color: muted, textAlign: "center" }}>
                  Cancela, altera ou vê facturas no portal seguro da Stripe.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Sub-componente: cards de planos de agência ──────────────────────────────
function AgencyPlansSection({ dark, teal, card, border, text, muted, inp, inpB }) {
  const [sel, setSel] = useState("agency_basic");

  const plans = [
    {
      id: "agency_basic",
      label: "Agência Basic",
      icon: "🏢",
      agents: 10,
      price: "—",           // preço a definir
      desc: "Até 10 agentes. Página pública com tema personalizado.",
      env: "REACT_APP_STRIPE_AGENCY_10",
    },
    {
      id: "agency_pro",
      label: "Agência Pro",
      icon: "🏆",
      agents: 20,
      price: "—",           // preço a definir
      desc: "Até 20 agentes. Todas as funcionalidades Basic + prioridade.",
      env: "REACT_APP_STRIPE_AGENCY_20",
      highlight: true,
    },
  ];

  const selected = plans.find(p => p.id === sel);
  const stripeLink = process.env[selected?.env] || null;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Planos de Agência</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {plans.map(p => (
          <div key={p.id} onClick={() => setSel(p.id)}
            style={{
              borderRadius: 14,
              border: `2px solid ${sel === p.id ? teal : inpB}`,
              padding: 16,
              cursor: "pointer",
              background: sel === p.id ? `${teal}09` : inp,
              transition: "all 0.15s",
              textAlign: "center",
              position: "relative",
            }}>
            {p.highlight && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: teal, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "2px 10px" }}>POPULAR</div>}
            <div style={{ fontSize: 24, marginBottom: 4 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: sel === p.id ? teal : text, marginBottom: 4 }}>{p.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: sel === p.id ? teal : text, marginBottom: 4 }}>
              {p.price}<span style={{ fontSize: 11, fontWeight: 400 }}>{p.price !== "—" ? "/mês" : ""}</span>
            </div>
            <div style={{ fontSize: 11, color: muted }}>até {p.agents} agentes</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: muted, marginBottom: 14, textAlign: "center" }}>{selected?.desc}</div>
      {stripeLink ? (
        <a href={stripeLink} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: teal, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer", fontSize: 14, textDecoration: "none" }}>
          <span style={{ fontSize: 18 }}>💳</span>
          Subscrever {selected?.label}
        </a>
      ) : (
        <div style={{ background: `${teal}11`, border: `1px solid ${teal}33`, borderRadius: 10, padding: "12px 16px", textAlign: "center", fontSize: 13, color: muted }}>
          ⚙️ Link de pagamento ainda não configurado.<br/>
          <span style={{ fontSize: 11 }}>Configura <code>REACT_APP_STRIPE_AGENCY_10</code> e <code>REACT_APP_STRIPE_AGENCY_20</code> no Railway.</span>
        </div>
      )}
    </div>
  );
}

// helper para responsive fora do contexto
function isMobile() { return window.innerWidth < 768; }
