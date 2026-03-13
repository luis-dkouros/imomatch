// AgencyPanel.jsx — Fase 3 rev3
// src/AgencyPanel.jsx

import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY;

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
  if (!r.ok) return 0;
  return parseInt(r.headers.get("content-range")?.split("/")[1] || "0", 10);
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

async function sbPost(path, body, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbDelete(path, jwt) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(await r.text());
}

// ── Mini sparkline bar chart ─────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ height: 6, borderRadius: 99, background: `${color}20`, overflow: "hidden", marginTop: 8 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }}/>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, bar, barMax, accent, card, border, text, muted }) {
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Decoração fundo */}
      <div style={{ position: "absolute", right: -10, top: -10, width: 80, height: 80, borderRadius: "50%", background: `${color}10`, pointerEvents: "none" }}/>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          {icon}
        </div>
        {accent !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, borderRadius: 99, padding: "3px 10px" }}>
            {accent}
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: text, lineHeight: 1, marginBottom: 4 }}>
        {value ?? <span style={{ fontSize: 20, color: muted }}>—</span>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: muted }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{sub}</div>}
      {bar !== undefined && <MiniBar value={bar} max={barMax} color={color}/>}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AgencyPanel({ supabase, session, profile, dark, onNotif }) {
  const [tab, setTab]         = useState("overview");
  const [agency, setAgency]   = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]); // convites pendentes
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [agName,    setAgName]    = useState("");
  const [agSlug,    setAgSlug]    = useState("");
  const [agColor1,  setAgColor1]  = useState("#3BB2A1");
  const [agColor2,  setAgColor2]  = useState("#0f172a");
  const [agLogo,    setAgLogo]    = useState("");
  const [uploading, setUploading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting,    setInviting]    = useState(false);

  // ── Tema ──────────────────────────────────────────────────────────────────
  const teal   = agency?.primary_color || "#3BB2A1";
  const card   = dark ? "#1e293b" : "#ffffff";
  const bg2    = dark ? "#0f172a" : "#f8fafc";
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

  // ── Carregar tudo ─────────────────────────────────────────────────────────
  const loadAgency = useCallback(async () => {
    if (!profile?.agency_id || !jwt) { setLoading(false); return; }
    setLoading(true);
    try {
      const [ag, mem, inv] = await Promise.all([
        sbGet(`agencies?id=eq.${profile.agency_id}&select=*`, jwt),
        sbGet(`profiles?agency_id=eq.${profile.agency_id}&select=id,name,photo_url,agency_role,plan,created_at`, jwt),
        // convites pendentes (tabela agency_invites)
        sbGet(`agency_invites?agency_id=eq.${profile.agency_id}&status=eq.pending&select=*`, jwt).catch(() => []),
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
      setInvites(inv || []);

      // Stats
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

  // ── Guardar perfil ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!agName.trim()) { setError("O nome é obrigatório."); return; }
    setSaving(true); setError("");
    try {
      const slug = agSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      await sbPatch(`agencies?id=eq.${agency.id}`, {
        name: agName.trim(), slug, primary_color: agColor1, secondary_color: agColor2,
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

  // ── Convidar agente via servidor ─────────────────────────────────────────
  // O server.js usa a service_role key para:
  //   - Se já tem conta → liga directamente à agência
  //   - Se não tem conta → cria conta, liga à agência, envia email com link de senha
  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (atLimit) { setError(`Limite de ${maxUsers} agentes atingido.`); return; }
    setInviting(true); setError("");
    try {
      const r = await fetch("/api/agencies/invite-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ agency_id: agency.id, email, invited_by_jwt: jwt }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Erro ao convidar agente.");
        return;
      }
      onNotif(`✅ ${data.message}`);
      setInviteEmail("");
      loadAgency();
    } catch (e) {
      setError("Erro de ligação ao servidor.");
    } finally {
      setInviting(false);
    }
  };

  // ── Cancelar convite ──────────────────────────────────────────────────────
  const cancelInvite = async (id) => {
    try {
      await sbDelete(`agency_invites?id=eq.${id}`, jwt);
      onNotif("Convite cancelado.");
      loadAgency();
    } catch (e) {
      setError("Erro ao cancelar: " + e.message);
    }
  };

  // ── Remover agente ────────────────────────────────────────────────────────
  const removeAgent = async (memberId) => {
    if (!window.confirm("Remover este agente da agência?\nO plano volta a 'pending'.")) return;
    try {
      const r = await fetch("/api/agencies/remove-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, agency_id: profile.agency_id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro desconhecido");
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
      setError("Erro: " + e.message);
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
            Subscreve um plano abaixo. Os agentes que convidares não precisam de pagar individualmente.
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
    { id: "overview", label: "Dashboard",  icon: "dashboard"    },
    { id: "profile",  label: "Perfil",     icon: "edit"          },
    { id: "team",     label: "Equipa",     icon: "group"         },
    ...(isOwner ? [{ id: "billing", label: "Billing", icon: "credit_card" }] : []),
  ];

  // Cores dos KPIs
  const C_TEAL   = teal;
  const C_BLUE   = "#3b82f6";
  const C_GREEN  = "#10b981";
  const C_ORANGE = "#f59e0b";
  const C_PURPLE = "#8b5cf6";
  const C_RED    = "#ef4444";

  const totalProps    = stats?.properties        ?? 0;
  const activeProps   = stats?.active_properties ?? 0;
  const inactiveProps = totalProps - activeProps;
  const totalMsgs     = stats?.messages          ?? 0;

  return (
    <div style={{ padding: mobile ? 12 : 24 }}>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        {agLogo
          ? <img src={agLogo} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "contain", border: `2px solid ${border}`, background: card }}/>
          : <div style={{ width: 56, height: 56, borderRadius: 14, background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🏢</div>}
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: text }}>{agency?.name}</div>
          <div style={{ fontSize: 13, color: muted, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-icons-outlined" style={{ fontSize: 14 }}>link</span>
            imomatch.pt/<strong>{agency?.slug}</strong>
            <span style={{ fontSize: 11, fontWeight: 700, color: planColor, background: `${planColor}15`, borderRadius: 99, padding: "2px 8px", marginLeft: 4 }}>{planLabel}</span>
          </div>
        </div>
        <a href={`/${agency?.slug}`} target="_blank" rel="noreferrer"
          style={{ marginLeft: "auto", ...BTNS, textDecoration: "none" }}>
          <span className="material-icons-outlined" style={{ fontSize: 15 }}>open_in_new</span>
          {!mobile && "Página pública"}
        </a>
      </div>

      {error && (
        <div style={{ background: "#ef444411", border: "1px solid #ef444433", borderRadius: 8, padding: "10px 14px", color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
          {error}
          <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ ...(tab === t.id ? BTNP : BTNS), borderRadius: 8, fontSize: 13, padding: "8px 16px" }}>
            <span className="material-icons-outlined" style={{ fontSize: 15 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB: DASHBOARD
      ══════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Fila 1: KPIs principais */}
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
            <StatCard icon="👥" label="Agentes" value={currentUsers}
              sub={`${maxUsers - currentUsers} vagas livres`}
              color={C_TEAL} bar={currentUsers} barMax={maxUsers}
              accent={`${currentUsers}/${maxUsers}`}
              card={card} border={border} text={text} muted={muted}/>
            <StatCard icon="🏠" label="Imóveis Total" value={totalProps}
              sub={`${activeProps} activos`}
              color={C_BLUE}
              card={card} border={border} text={text} muted={muted}/>
            <StatCard icon="✅" label="Imóveis Activos" value={activeProps}
              sub={totalProps > 0 ? `${Math.round((activeProps/totalProps)*100)}% do total` : "—"}
              color={C_GREEN}
              card={card} border={border} text={text} muted={muted}/>
            <StatCard icon="💬" label="Envios WhatsApp" value={totalMsgs}
              sub="total da equipa"
              color={C_ORANGE}
              card={card} border={border} text={text} muted={muted}/>
          </div>

          {/* Fila 2: Ocupação do plano + Imóveis breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>

            {/* Ocupação do plano */}
            <div style={{ ...CARD }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: text }}>Ocupação do Plano</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: planColor, background: `${planColor}15`, borderRadius: 99, padding: "3px 10px" }}>{planLabel}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                {/* Donut simples */}
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="28" fill="none" stroke={`${planColor}20`} strokeWidth="10"/>
                    <circle cx="36" cy="36" r="28" fill="none" stroke={planColor} strokeWidth="10"
                      strokeDasharray={`${maxUsers > 0 ? (currentUsers / maxUsers) * 175.9 : 0} 175.9`}
                      strokeLinecap="round" transform="rotate(-90 36 36)"/>
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: text }}>
                    {maxUsers > 0 ? `${Math.round((currentUsers/maxUsers)*100)}%` : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: text }}>{currentUsers} <span style={{ fontSize: 13, fontWeight: 400, color: muted }}>/ {maxUsers}</span></div>
                  <div style={{ fontSize: 12, color: muted }}>agentes activos</div>
                  <div style={{ fontSize: 11, color: atLimit ? C_RED : C_GREEN, fontWeight: 600, marginTop: 4 }}>
                    {atLimit ? "⚠️ Limite atingido" : `✓ ${maxUsers - currentUsers} vaga${maxUsers - currentUsers !== 1 ? "s" : ""} disponível${maxUsers - currentUsers !== 1 ? "eis" : ""}`}
                  </div>
                </div>
              </div>
              {/* Barra de progresso detalhada */}
              <div style={{ background: bg2, borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: muted, marginBottom: 6 }}>
                  <span>0</span><span>{maxUsers}</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: `${planColor}20`, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${maxUsers > 0 ? (currentUsers/maxUsers)*100 : 0}%`, background: planColor, borderRadius: 99, transition: "width 0.6s ease" }}/>
                </div>
              </div>
            </div>

            {/* Imóveis breakdown */}
            <div style={{ ...CARD }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 16 }}>Imóveis da Agência</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Total de imóveis", value: totalProps,    color: C_BLUE,   icon: "🏠" },
                  { label: "Activos",          value: activeProps,   color: C_GREEN,  icon: "✅" },
                  { label: "Inactivos",        value: inactiveProps, color: C_RED,    icon: "⛔" },
                ].map(({ label, value, color, icon }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: muted }}>
                        <span>{icon}</span>{label}
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: text }}>{value}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: `${color}15`, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${totalProps > 0 ? (value/totalProps)*100 : 0}%`, background: color, borderRadius: 99, transition: "width 0.6s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 3: Actividade por agente */}
          {members.length > 0 && (
            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: text }}>Actividade por Agente</div>
                <span style={{ fontSize: 11, color: muted }}>{members.length} membros</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {members.map((m, i) => {
                  const s      = stats?.byAgent?.find(b => b.id === m.id) || { properties: 0, messages: 0 };
                  const rCol   = m.agency_role === "owner" ? C_PURPLE : m.agency_role === "admin" ? teal : muted;
                  const rLabel = m.agency_role === "owner" ? "Owner" : m.agency_role === "admin" ? "Admin" : "Agente";
                  const maxP   = Math.max(...(stats?.byAgent?.map(b => b.properties) || [1]), 1);
                  const maxM   = Math.max(...(stats?.byAgent?.map(b => b.messages)   || [1]), 1);
                  return (
                    <div key={m.id} style={{ padding: "14px 0", borderBottom: i < members.length - 1 ? `1px solid ${border}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        {m.photo_url
                          ? <img src={m.photo_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}/>
                          : <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${teal}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>👤</div>}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: text, fontSize: 14 }}>{m.name}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: rCol, background: `${rCol}15`, borderRadius: 99, padding: "2px 8px" }}>{rLabel}</span>
                      </div>
                      {/* Mini barras */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingLeft: 48 }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: muted, marginBottom: 3 }}>
                            <span>🏠 Imóveis</span><strong style={{ color: text }}>{s.properties}</strong>
                          </div>
                          <div style={{ height: 5, borderRadius: 99, background: `${C_BLUE}20`, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(s.properties/maxP)*100}%`, background: C_BLUE, borderRadius: 99 }}/>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: muted, marginBottom: 3 }}>
                            <span>💬 WA Enviados</span><strong style={{ color: text }}>{s.messages}</strong>
                          </div>
                          <div style={{ height: 5, borderRadius: 99, background: `${C_ORANGE}20`, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(s.messages/maxM)*100}%`, background: C_ORANGE, borderRadius: 99 }}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* URL pública */}
          <div style={CARD}>
            <div style={LBL}>URL Pública da Agência</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <code style={{ background: inp, border: `1px solid ${inpB}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, color: teal, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: PERFIL
      ══════════════════════════════════════════════ */}
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
                {[["Cor primária", agColor1, setAgColor1], ["Cor secundária", agColor2, setAgColor2]].map(([lbl, val, setter]) => (
                  <div key={lbl}>
                    <label style={LBL}>{lbl}</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="color" value={val} onChange={e => setter(e.target.value)}
                        style={{ width: 40, height: 38, border: `1px solid ${inpB}`, borderRadius: 8, cursor: "pointer", padding: 2, flexShrink: 0 }} disabled={!isAdmin}/>
                      <input value={val} onChange={e => setter(e.target.value)} style={INP} disabled={!isAdmin}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: agColor1, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: agColor2, flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{agName || "Nome da Agência"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Preview do tema da agência</div>
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

      {/* ══════════════════════════════════════════════
          TAB: EQUIPA
      ══════════════════════════════════════════════ */}
      {tab === "team" && (
        <div style={{ maxWidth: 700 }}>
          {/* Convidar */}
          {isAdmin && (
            <div style={{ ...CARD, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 4 }}>
                Convidar agente
                {atLimit && <span style={{ marginLeft: 8, fontSize: 11, color: "#ef4444" }}>⚠️ Limite ({currentUsers}/{maxUsers})</span>}
              </div>
              <div style={{ fontSize: 12, color: muted, marginBottom: 14, background: `${teal}09`, border: `1px solid ${teal}22`, borderRadius: 8, padding: "8px 12px" }}>
                💡 O agente não precisa de pagar — está incluído no plano da agência.<br/>
                Se ainda não tiver conta, o convite fica pendente e é ligado quando criar conta.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  placeholder="email@agente.pt" style={{ ...INP, flex: 1 }} disabled={atLimit}/>
                <button onClick={handleInvite} disabled={inviting || atLimit || !inviteEmail.trim()}
                  style={{ ...BTNP, opacity: (atLimit || !inviteEmail.trim()) ? 0.5 : 1, flexShrink: 0 }}>
                  {inviting
                    ? <span className="material-icons-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>autorenew</span>
                    : <><span className="material-icons-outlined" style={{ fontSize: 16 }}>person_add</span>Convidar</>}
                </button>
              </div>
              <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>Vagas: {currentUsers}/{maxUsers}</div>
            </div>
          )}

          {/* Convites pendentes */}
          {invites.length > 0 && (
            <div style={{ ...CARD, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 12 }}>
                ⏳ Convites pendentes ({invites.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {invites.map(inv => (
                  <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, background: bg2, borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C_ORANGE}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✉️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: text, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.email}</div>
                      <div style={{ fontSize: 11, color: muted }}>Aguarda criação de conta</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => cancelInvite(inv.id)}
                        style={{ background: "none", border: "none", color: muted, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
                        title="Cancelar convite">
                        <span className="material-icons-outlined" style={{ fontSize: 18 }}>close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membros activos */}
          <div style={CARD}>
            <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 16 }}>
              Membros activos ({members.length})
            </div>
            {members.length === 0 && <div style={{ textAlign: "center", color: muted, padding: "24px 0" }}>Nenhum agente ainda.</div>}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {members.map((m, i) => {
                const isMe  = m.id === session?.user?.id;
                const rCol  = m.agency_role === "owner" ? C_PURPLE : m.agency_role === "admin" ? teal : muted;
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

      {/* ══════════════════════════════════════════════
          TAB: BILLING
      ══════════════════════════════════════════════ */}
      {tab === "billing" && isOwner && (
        <div style={{ maxWidth: 560 }}>
          <div style={CARD}>
            <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 20 }}>Billing da Agência</div>
            <div style={{ background: `${planColor}11`, border: `1px solid ${planColor}33`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: planColor }}>{planLabel}</div>
              <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                {agencyPlan === "pending"
                  ? "Subscreve um plano para activar a agência."
                  : `${currentUsers} / ${maxUsers} agentes incluídos — sem custo individual por agente.`}
              </div>
            </div>
            {agencyPlan === "pending"
              ? <AgencyPlansSection teal={teal} border={border} text={text} muted={muted} inp={inp} inpB={inpB}/>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a href={process.env.REACT_APP_STRIPE_PORTAL_AGENCY || process.env.REACT_APP_STRIPE_PORTAL || "#"}
                    target="_blank" rel="noreferrer" style={{ ...BTNP, textDecoration: "none", justifyContent: "center" }}>
                    <span className="material-icons-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                    Gerir subscrição (Portal Stripe)
                  </a>
                  <div style={{ fontSize: 12, color: muted, textAlign: "center" }}>Cancela, altera ou vê facturas no portal seguro da Stripe.</div>
                </div>}
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
      features: ["Página pública personalizada", "Até 10 agentes incluídos", "Tema e cores da agência", "Gestão da equipa no painel"] },
    { id: "growth",  label: "Growth",  icon: "🏆", agents: 20, env: "REACT_APP_STRIPE_AGENCY_20", highlight: true,
      features: ["Tudo do Starter", "Até 20 agentes incluídos", "Suporte prioritário", "Funcionalidades Pro futuras"] },
  ];
  const sp         = plans.find(p => p.id === sel);
  const stripeLink = process.env[sp?.env] || null;
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
        {sp?.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: muted, marginBottom: 6 }}>
            <span style={{ color: "#10b981", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
          </div>
        ))}
      </div>
      {stripeLink
        ? <a href={stripeLink} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: teal, color: "#fff", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            💳 Subscrever plano {sp?.label}
          </a>
        : <div style={{ background: `${teal}11`, border: `1px solid ${teal}33`, borderRadius: 10, padding: "12px 16px", textAlign: "center", fontSize: 13, color: muted }}>
            ⚙️ Pagamento em breve.<br/>
            <span style={{ fontSize: 11 }}>Configura <code>REACT_APP_STRIPE_AGENCY_10</code> / <code>_20</code> no Railway.</span>
          </div>}
    </div>
  );
}
