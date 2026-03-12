// AgencyPanel.jsx — Painel de Gestão da Agência (Fase 3 rev2)
// Colocar em: src/AgencyPanel.jsx

import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ── helpers Supabase ────────────────────────────────────────────────────────
async function sbGet(path, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbGetCount(path, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", Prefer: "count=exact" },
  });
  if (!r.ok) throw new Error(await r.text());
  const count = parseInt(r.headers.get("content-range")?.split("/")[1] || "0", 10);
  return count;
}

async function sbPatch(path, body, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "PATCH",
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Componente principal ────────────────────────────────────────────────────
export default function AgencyPanel({ supabase, session, profile, dark, onNotif }) {
  const [tab, setTab]         = useState("overview");
  const [agency, setAgency]   = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [agName,   setAgName]   = useState("");
  const [agSlug,   setAgSlug]   = useState("");
  const [agColor1, setAgColor1] = useState("#3BB2A1");
  const [agColor2, setAgColor2] = useState("#0f172a");
  const [agLogo,   setAgLogo]   = useState("");
  const [uploading, setUploading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting]       = useState(false);

  // ── Tema ─────────────────────────────────────────────────────────────────
  const teal   = agency?.primary_color || "#3BB2A1";
  const card   = dark ? "#1e293b" : "#ffffff";
  const border = dark ? "#334155" : "#e2e8f0";
  const text   = dark ? "#f1f5f9" : "#0f172a";
  const muted  = dark ? "#94a3b8" : "#64748b";
  const inp    = dark ? "#0f172a" : "#f8fafc";
  const inpB   = dark ? "#334155" : "#cbd5e1";

  const CARD = { background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 24 };
  const INP  = { background: inp, border: `1px solid ${inpB}`, borderRadius: 8, padding: "10px 13px", color: text, fontFamily: "inherit", fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" };
  const LBL  = { display: "block", fontSize: 11, fontWeight: 700, color: muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" };
  const BTNP = { background: teal, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 };
  const BTNS = { background: inp, color: text, border: `1px solid ${border}`, borderRadius: 8, padding: "9px 18px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 };

  const jwt    = session?.access_token;
  const mobile = window.innerWidth < 768;

  // ── Planos: mapear valores reais da BD (starter / growth) ────────────────
  const agencyPlan   = agency?.plan || "pending";
  const maxUsers     = agency?.max_users || 0;
  const currentUsers = members.length;
  const atLimit      = maxUsers > 0 && currentUsers >= maxUsers;

  const PLAN_MAP = {
    starter: { label: "Agência Starter", color: teal,      agents: 10 },
    growth:  { label: "Agência Growth",  color: "#6366f1", agents: 20 },
    pending: { label: "Sem plano activo",color: "#ef4444", agents: 0  },
  };
  const planInfo  = PLAN_MAP[agencyPlan] || PLAN_MAP.pending;
  const planLabel = planInfo.label;
  const planColor = planInfo.color;

  // ── Carregar agência + membros + stats ───────────────────────────────────
  const loadAgency = useCallback(async () => {
    if (!profile?.agency_id || !jwt) { setLoading(false); return; }
    setLoading(true);
    try {
      const [ag, mem] = await Promise.all([
        sbGet(`agencies?id=eq.${profile.agency_id}&select=*`, jwt),
        sbGet(`profiles?agency_id=eq.${profile.agency_id}&select=id,name,photo_url,agency_role,plan,created_at`, jwt),
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
      const mems = mem || [];
      setMembers(mems);

      // Stats agregadas de todos os agentes
      if (mems.length > 0) {
        const ids      = mems.map(m => m.id);
        const inFilter = ids.map(id => `"${id}"`).join(",");

        const [allProps, activeProps, msgs] = await Promise.all([
          sbGetCount(`properties?user_id=in.(${inFilter})&select=id`, jwt),
          sbGetCount(`properties?user_id=in.(${inFilter})&active=eq.true&select=id`, jwt),
          sbGetCount(`whatsapp_sent?user_id=in.(${inFilter})&select=id`, jwt),
        ]);

        const byAgent = await Promise.all(ids.map(async id => {
          const [p, m] = await Promise.all([
            sbGetCount(`properties?user_id=eq.${id}&select=id`, jwt),
            sbGetCount(`whatsapp_sent?user_id=eq.${id}&select=id`, jwt),
          ]);
          return { id, properties: p, messages: m };
        }));

        setStats({ properties: allProps, active_properties: activeProps, messages: msgs, byAgent });
      } else {
        setStats({ properties: 0, active_properties: 0, messages: 0, byAgent: [] });
      }
    } catch (e) {
      setError("Erro ao carregar: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.agency_id, jwt]);

  useEffect(() => { loadAgency(); }, [loadAgency]);

  // ── Guardar perfil (colunas reais: name, slug, primary_color, secondary_color, logo_url) ──
  const saveProfile = async () => {
    if (!agName.trim()) { setError("O nome é obrigatório."); return; }
    setSaving(true); setError("");
    try {
      const slug = agSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      await sbPatch(`agencies?id=eq.${agency.id}`, {
        name: agName.trim(),
        slug,
        primary_color:   agColor1,
        secondary_color: agColor2,
      }, jwt);
      onNotif("✅ Agência actualizada.");
      loadAgency();
    } catch (e) {
      setError("Erro ao guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload logo ───────────────────────────────────────────────────────────
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

  // ── Convidar agente: passa a usar o plano da agência (plan = "agency") ───
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    if (atLimit) { setError(`Limite de ${maxUsers} agentes atingido.`); return; }
    setInviting(true); setError("");
    try {
      const found = await sbGet(`profiles?email=eq.${encodeURIComponent(inviteEmail.trim())}&select=id,name,agency_id`, jwt);
      if (!found.length) {
        setError("Utilizador não encontrado. Verifica que o agente já criou conta no ImoMatch.");
        setInviting(false); return;
      }
      const u = found[0];
      if (u.agency_id && u.agency_id !== agency.id) {
        setError("Este utilizador já pertence a outra agência.");
        setInviting(false); return;
      }
      await sbPatch(`profiles?id=eq.${u.id}`, {
        agency_id:   agency.id,
        agency_role: "agent",
        plan:        "agency",   // acesso via agência, não paga individualmente
      }, jwt);
      onNotif("✅ Agente adicionado.");
      setInviteEmail("");
      loadAgency();
    } catch (e) {
      setError("Erro ao adicionar: " + e.message);
    } finally {
      setInviting(false);
    }
  };

  // ── Remover agente: volta a "pending" até subscrever individualmente ─────
  const removeAgent = async (memberId) => {
    if (!window.confirm("Remover este agente da agência?\nO plano volta a 'pending' até subscrever individualmente.")) return;
    try {
      await sbPatch(`profiles?id=eq.${memberId}`, { agency_id: null, agency_role: null, plan: "pending" }, jwt);
      onNotif("Agente removido.");
      loadAgency();
    } catch (e) {
      setError("Erro ao remover: " + e.message);
    }
  };

  const changeRole = async (memberId, newRole) => {
    try {
      await sbPatch(`profiles?id=eq.${memberId}`, { agency_role: newRole }, jwt);
      loadAgency();
    } catch (e) {
      setError("Erro ao alterar função: " + e.message);
    }
  };

  // ── Sem agência ───────────────────────────────────────────────────────────
  if (!profile?.agency_id && !loading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ ...CARD, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: text, marginBottom: 8 }}>Ainda não tens uma agência</div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 24 }}>
            Para aceder ao painel, o owner deve adicionar-te à equipa ou subscreve um plano de agência abaixo.
          </div>
          <AgencyPlansSection teal={teal} border={border} text={text} muted={muted} inp={inp} inpB={inpB} />
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 24, color: muted, textAlign: "center" }}>A carregar...</div>;

  const isOwner = profile?.agency_role === "owner";
  const isAdmin = profile?.agency_role === "admin" || isOwner;

  const TABS = [
    { id: "overview", label: "Visão Geral", icon: "dashboard"    },
    { id: "profile",  label: "Perfil",      icon: "edit"          },
    { id: "team",     label: "Equipa",      icon: "group"         },
    ...(isOwner ? [{ id: "billing", label: "Billing", icon: "credit_card" }] : []),
  ];

  return (
    <div style={{ padding: mobile ? 12 : 24 }}>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        {agLogo
          ? <img src={agLogo} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "contain", border: `2px solid ${border}` }}/>
          : <div style={{ width: 52, height: 52, borderRadius: 12, background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏢</div>}
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: text }}>{agency?.name}</div>
          <div style={{ fontSize: 13, color: muted }}>imomatch.pt/<strong>{agency?.slug}</strong></div>
        </div>
        <a href={`/${agency?.slug}`} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", ...BTNS, textDecoration: "none" }}>
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
          {!mobile && "Ver página pública"}
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
            style={{ ...(tab === t.id ? BTNP : BTNS), borderRadius: 8, fontSize: 13, padding: "8px 16px" }}>
            <span className="material-icons-outlined" style={{ fontSize: 15 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ VISÃO GERAL ══ */}
      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 16 }}>

          {/* Plano */}
          <div style={CARD}>
            <div style={LBL}>Plano</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>📋</span>
              <div>
                <div style={{ fontWeight: 700, color: planColor, fontSize: 15 }}>{planLabel}</div>
                <div style={{ fontSize: 12, color: muted }}>{currentUsers} / {maxUsers} agentes</div>
              </div>
            </div>
            {maxUsers > 0 && (
              <>
                <div style={{ height: 6, borderRadius: 99, background: inpB, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((currentUsers / maxUsers) * 100, 100)}%`, background: atLimit ? "#ef4444" : teal, borderRadius: 99, transition: "width 0.4s" }}/>
                </div>
                <div style={{ fontSize: 11, color: atLimit ? "#ef4444" : muted, marginTop: 4 }}>
                  {atLimit ? "⚠️ Limite atingido" : `${maxUsers - currentUsers} vaga${maxUsers - currentUsers !== 1 ? "s" : ""} disponível${maxUsers - currentUsers !== 1 ? "eis" : ""}`}
                </div>
              </>
            )}
          </div>

          {/* Agentes */}
          <div style={CARD}>
            <div style={LBL}>Equipa</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>👥</span>
              <div>
                <div style={{ fontWeight: 800, color: text, fontSize: 32, lineHeight: 1 }}>{currentUsers}</div>
                <div style={{ fontSize: 12, color: muted }}>agente{currentUsers !== 1 ? "s" : ""} activo{currentUsers !== 1 ? "s" : ""}</div>
              </div>
            </div>
          </div>

          {/* Imóveis */}
          <div style={CARD}>
            <div style={LBL}>Imóveis</div>
            <div style={{ display: "flex", gap: 28 }}>
              <div>
                <div style={{ fontWeight: 800, color: text, fontSize: 30, lineHeight: 1 }}>{stats?.properties ?? "—"}</div>
                <div style={{ fontSize: 11, color: muted }}>total</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: "#10b981", fontSize: 30, lineHeight: 1 }}>{stats?.active_properties ?? "—"}</div>
                <div style={{ fontSize: 11, color: muted }}>activos</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, color: "#ef4444", fontSize: 30, lineHeight: 1 }}>
                  {stats ? stats.properties - stats.active_properties : "—"}
                </div>
                <div style={{ fontSize: 11, color: muted }}>inactivos</div>
              </div>
            </div>
          </div>

          {/* Mensagens */}
          <div style={CARD}>
            <div style={LBL}>Envios WhatsApp</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>💬</span>
              <div>
                <div style={{ fontWeight: 800, color: text, fontSize: 32, lineHeight: 1 }}>{stats?.messages ?? "—"}</div>
                <div style={{ fontSize: 12, color: muted }}>mensagens enviadas</div>
              </div>
            </div>
          </div>

          {/* URL pública */}
          <div style={{ ...CARD, gridColumn: mobile ? "auto" : "1 / -1" }}>
            <div style={LBL}>URL Pública da Agência</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <code style={{ background: inp, border: `1px solid ${inpB}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: teal, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {window.location.origin}/{agency?.slug}
              </code>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/${agency?.slug}`); onNotif("URL copiada!"); }} style={BTNS}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>content_copy</span>
              </button>
              <a href={`/${agency?.slug}`} target="_blank" rel="noreferrer" style={{ ...BTNS, textDecoration: "none" }}>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              </a>
            </div>
          </div>

          {/* Actividade por agente */}
          {stats?.byAgent?.length > 0 && (
            <div style={{ ...CARD, gridColumn: mobile ? "auto" : "1 / -1" }}>
              <div style={LBL}>Actividade por Agente</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Agente", "Função", "Imóveis", "WA Enviados"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: muted, fontWeight: 700, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => {
                      const s      = stats.byAgent.find(b => b.id === m.id) || { properties: 0, messages: 0 };
                      const rCol   = m.agency_role === "owner" ? "#6366f1" : m.agency_role === "admin" ? teal : muted;
                      const rLabel = m.agency_role === "owner" ? "Owner" : m.agency_role === "admin" ? "Admin" : "Agente";
                      return (
                        <tr key={m.id}>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {m.photo_url
                                ? <img src={m.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}/>
                                : <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</div>}
                              <span style={{ fontWeight: 600, color: text }}>{m.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}` }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: rCol, background: `${rCol}15`, borderRadius: 99, padding: "2px 8px" }}>{rLabel}</span>
                          </td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}`, fontWeight: 700, color: text }}>{s.properties}</td>
                          <td style={{ padding: "10px 12px", borderBottom: `1px solid ${border}`, fontWeight: 700, color: text }}>{s.messages}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ PERFIL ══ */}
      {tab === "profile" && (
        <div style={{ maxWidth: 560 }}>
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 20 }}>Perfil da Agência</div>
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
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={LBL}>Nome *</label>
                <input value={agName} onChange={e => setAgName(e.target.value)} style={INP} disabled={!isAdmin}/>
              </div>
              <div>
                <label style={LBL}>Slug (URL)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: muted, pointerEvents: "none" }}>imomatch.pt/</span>
                  <input value={agSlug} onChange={e => setAgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    style={{ ...INP, paddingLeft: 98 }} disabled={!isAdmin}/>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={LBL}>Cor primária</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={agColor1} onChange={e => setAgColor1(e.target.value)}
                      style={{ width: 40, height: 38, border: `1px solid ${inpB}`, borderRadius: 8, cursor: "pointer", padding: 2, flexShrink: 0 }} disabled={!isAdmin}/>
                    <input value={agColor1} onChange={e => setAgColor1(e.target.value)} style={INP} disabled={!isAdmin}/>
                  </div>
                </div>
                <div>
                  <label style={LBL}>Cor secundária</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={agColor2} onChange={e => setAgColor2(e.target.value)}
                      style={{ width: 40, height: 38, border: `1px solid ${inpB}`, borderRadius: 8, cursor: "pointer", padding: 2, flexShrink: 0 }} disabled={!isAdmin}/>
                    <input value={agColor2} onChange={e => setAgColor2(e.target.value)} style={INP} disabled={!isAdmin}/>
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div style={{ background: agColor1, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: agColor2, flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{agName || "Nome da Agência"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Preview do tema</div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={saveProfile} disabled={saving} style={{ ...BTNP, justifyContent: "center" }}>
                  {saving
                    ? <><span className="material-icons-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>autorenew</span>A guardar...</>
                    : <><span className="material-icons-outlined" style={{ fontSize: 16 }}>save</span>Guardar</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ EQUIPA ══ */}
      {tab === "team" && (
        <div style={{ maxWidth: 680 }}>
          {isAdmin && (
            <div style={{ ...CARD, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 4 }}>
                Adicionar agente
                {atLimit && <span style={{ marginLeft: 8, fontSize: 11, color: "#ef4444" }}>⚠️ Limite atingido ({currentUsers}/{maxUsers})</span>}
              </div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 14 }}>
                O agente passa a usar o plano da agência e não precisa de pagar individualmente.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  placeholder="email@agente.pt" style={{ ...INP, flex: 1 }} disabled={atLimit}/>
                <button onClick={handleInvite} disabled={inviting || atLimit || !inviteEmail.trim()}
                  style={{ ...BTNP, opacity: (atLimit || !inviteEmail.trim()) ? 0.5 : 1, flexShrink: 0 }}>
                  {inviting
                    ? <span className="material-icons-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>autorenew</span>
                    : <><span className="material-icons-outlined" style={{ fontSize: 16 }}>person_add</span>Adicionar</>}
                </button>
              </div>
              <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>Vagas: {currentUsers}/{maxUsers}</div>
            </div>
          )}
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 16 }}>Equipa ({members.length})</div>
            {members.length === 0 && <div style={{ textAlign: "center", color: muted, padding: "24px 0" }}>Nenhum agente ainda.</div>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {members.map((m, i) => {
                const isMe  = m.id === session?.user?.id;
                const rCol  = m.agency_role === "owner" ? "#6366f1" : m.agency_role === "admin" ? teal : muted;
                const aStat = stats?.byAgent?.find(b => b.id === m.id);
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < members.length - 1 ? `1px solid ${border}` : "none" }}>
                    {m.photo_url
                      ? <img src={m.photo_url} alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}/>
                      : <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: text, fontSize: 14 }}>
                        {m.name} {isMe && <span style={{ fontSize: 11, color: muted }}>(tu)</span>}
                      </div>
                      {aStat && <div style={{ fontSize: 11, color: muted }}>{aStat.properties} imóveis · {aStat.messages} envios WA</div>}
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {isAdmin && !isMe && m.agency_role !== "owner"
                        ? <select value={m.agency_role || "agent"} onChange={e => changeRole(m.id, e.target.value)}
                            style={{ background: inp, border: `1px solid ${inpB}`, borderRadius: 6, padding: "4px 8px", fontSize: 12, color: rCol, fontWeight: 600, cursor: "pointer" }}>
                            <option value="admin">Admin</option>
                            <option value="agent">Agente</option>
                          </select>
                        : <span style={{ fontSize: 12, fontWeight: 700, color: rCol, background: `${rCol}15`, borderRadius: 20, padding: "3px 10px" }}>
                            {m.agency_role === "owner" ? "Owner" : m.agency_role === "admin" ? "Admin" : "Agente"}
                          </span>}
                    </div>
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

      {/* ══ BILLING ══ */}
      {tab === "billing" && isOwner && (
        <div style={{ maxWidth: 560 }}>
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 20 }}>Billing da Agência</div>
            <div style={{ background: `${planColor}11`, border: `1px solid ${planColor}33`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: planColor }}>{planLabel}</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                {agencyPlan === "pending"
                  ? "Subscreve um plano para activar a agência."
                  : `${currentUsers} / ${maxUsers} agentes · Os agentes não pagam individualmente.`}
              </div>
            </div>
            {agencyPlan === "pending" && (
              <AgencyPlansSection teal={teal} border={border} text={text} muted={muted} inp={inp} inpB={inpB} />
            )}
            {agencyPlan !== "pending" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href={process.env.REACT_APP_STRIPE_PORTAL_AGENCY || process.env.REACT_APP_STRIPE_PORTAL || "#"}
                  target="_blank" rel="noreferrer" style={{ ...BTNP, textDecoration: "none", justifyContent: "center" }}>
                  <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                  Gerir subscrição (Portal Stripe)
                </a>
                <div style={{ fontSize: 12, color: muted, textAlign: "center" }}>Cancela, altera ou vê facturas no portal seguro da Stripe.</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Cards de planos ──────────────────────────────────────────────────────────
function AgencyPlansSection({ teal, border, text, muted, inp, inpB }) {
  const [sel, setSel] = useState("starter");
  const plans = [
    { id: "starter", label: "Starter", icon: "🏢", agents: 10, env: "REACT_APP_STRIPE_AGENCY_10",
      features: ["Página pública personalizada", "Até 10 agentes incluídos", "Tema e cores da agência", "Gestão da equipa"] },
    { id: "growth",  label: "Growth",  icon: "🏆", agents: 20, env: "REACT_APP_STRIPE_AGENCY_20", highlight: true,
      features: ["Tudo do Starter", "Até 20 agentes incluídos", "Suporte prioritário", "Futuras funcionalidades Pro"] },
  ];
  const sel_plan   = plans.find(p => p.id === sel);
  const stripeLink = process.env[sel_plan?.env] || null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Escolhe um plano</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        {plans.map(p => (
          <div key={p.id} onClick={() => setSel(p.id)}
            style={{ borderRadius: 14, border: `2px solid ${sel === p.id ? teal : inpB}`, padding: 16, cursor: "pointer",
              background: sel === p.id ? `${teal}09` : inp, transition: "all 0.15s", textAlign: "center", position: "relative" }}>
            {p.highlight && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: teal, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "2px 10px", whiteSpace: "nowrap" }}>POPULAR</div>}
            <div style={{ fontSize: 26, marginBottom: 4 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: sel === p.id ? teal : text, marginBottom: 4 }}>{p.label}</div>
            <div style={{ fontSize: 11, color: muted }}>até {p.agents} agentes</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        {sel_plan?.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: muted, marginBottom: 6 }}>
            <span style={{ color: "#10b981", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
          </div>
        ))}
      </div>
      {stripeLink
        ? <a href={stripeLink} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: teal, color: "#fff", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            💳 Subscrever plano {sel_plan?.label}
          </a>
        : <div style={{ background: `${teal}11`, border: `1px solid ${teal}33`, borderRadius: 10, padding: "12px 16px", textAlign: "center", fontSize: 13, color: muted }}>
            ⚙️ Pagamento em breve.<br/>
            <span style={{ fontSize: 11 }}>Configura <code>REACT_APP_STRIPE_AGENCY_10</code> / <code>_20</code> no Railway.</span>
          </div>}
    </div>
  );
}
