import { useState, useEffect } from "react";

const INTERESTS = ["Apartamento", "Moradia", "Terreno", "Comercial", "Investimento"];
const TYPOLOGIES = ["T0", "T1", "T2", "T3", "T4+"];
const LOCATIONS = ["Lisboa", "Porto", "Cascais", "Sintra", "Setúbal", "Braga", "Aveiro", "Faro", "Coimbra"];
const PRICE_RANGES = ["Até 100k€", "100k–200k€", "200k–350k€", "350k–500k€", "500k€+"];

const mockContacts = [
  { id: 1, name: "Ana Ferreira", phone: "+351 912 345 678", email: "ana@email.pt", interests: ["Apartamento"], typologies: ["T2", "T3"], locations: ["Lisboa", "Cascais"], priceRange: "200k–350k€", status: "Quente", notes: "Procura imóvel para habitação própria" },
  { id: 2, name: "João Mendes", phone: "+351 963 456 789", email: "joao@email.pt", interests: ["Moradia"], typologies: ["T3", "T4+"], locations: ["Sintra", "Cascais"], priceRange: "350k–500k€", status: "Morno", notes: "Família com 2 filhos, precisa de jardim" },
  { id: 3, name: "Carla Santos", phone: "+351 934 567 890", email: "carla@email.pt", interests: ["Investimento", "Apartamento"], typologies: ["T1", "T2"], locations: ["Porto", "Braga"], priceRange: "100k–200k€", status: "Quente", notes: "Investidora, procura rendimento" },
  { id: 4, name: "Miguel Costa", phone: "+351 915 678 901", email: "miguel@email.pt", interests: ["Comercial", "Terreno"], typologies: ["T0"], locations: ["Lisboa"], priceRange: "500k€+", status: "Frio", notes: "Empresário, expansão de negócio" },
  { id: 5, name: "Sofia Rodrigues", phone: "+351 926 789 012", email: "sofia@email.pt", interests: ["Apartamento"], typologies: ["T1"], locations: ["Porto", "Aveiro"], priceRange: "Até 100k€", status: "Morno", notes: "Primeira habitação" },
];

const mockProperties = [
  { id: 1, title: "Apartamento T2 em Cascais", type: "Apartamento", typology: "T2", location: "Cascais", price: 285000, area: 92, description: "Moderno apartamento com vista mar, acabamentos premium.", images: ["🏠"], matchCount: 3 },
  { id: 2, title: "Moradia T4 em Sintra", type: "Moradia", typology: "T4+", location: "Sintra", price: 420000, area: 210, description: "Moradia com jardim e piscina, condomínio fechado.", images: ["🏡"], matchCount: 1 },
];

const statusColors = { "Quente": "#ef4444", "Morno": "#f59e0b", "Frio": "#3b82f6" };

export default function ImoPro() {
  const [page, setPage] = useState("dashboard");
  const [contacts, setContacts] = useState(mockContacts);
  const [properties, setProperties] = useState(mockProperties);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendPropertyId, setSendPropertyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInterest, setFilterInterest] = useState("");
  const [notification, setNotification] = useState(null);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "", interests: [], typologies: [], locations: [], priceRange: "", status: "Frio", notes: "" });
  const [newProperty, setNewProperty] = useState({ title: "", type: "", typology: "", location: "", price: "", area: "", description: "" });

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getMatchingContacts = (property) => {
    return contacts.filter(c =>
      c.interests.includes(property.type) &&
      (c.typologies.includes(property.typology) || c.typologies.length === 0) &&
      (c.locations.includes(property.location) || c.locations.length === 0)
    );
  };

  const filteredContacts = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    const matchFilter = filterInterest ? c.interests.includes(filterInterest) : true;
    return matchSearch && matchFilter;
  });

  const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) return;
    setContacts([...contacts, { ...newContact, id: Date.now() }]);
    setNewContact({ name: "", phone: "", email: "", interests: [], typologies: [], locations: [], priceRange: "", status: "Frio", notes: "" });
    setShowAddContact(false);
    showNotif("Contacto adicionado com sucesso!");
  };

  const handleAddProperty = () => {
    if (!newProperty.title || !newProperty.type) return;
    const prop = { ...newProperty, id: Date.now(), price: Number(newProperty.price), area: Number(newProperty.area), images: ["🏠"], matchCount: 0 };
    setProperties([...properties, prop]);
    setNewProperty({ title: "", type: "", typology: "", location: "", price: "", area: "", description: "" });
    setShowAddProperty(false);
    showNotif("Imóvel adicionado com sucesso!");
  };

  const handleSend = (propertyId) => {
    setSendPropertyId(propertyId);
    setShowSendModal(true);
  };

  const stats = {
    contacts: contacts.length,
    hot: contacts.filter(c => c.status === "Quente").length,
    properties: properties.length,
    sent: 12
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0a0e17", minHeight: "100vh", color: "#e8e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0a0e17; } ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 3px; }
        .nav-btn { background: none; border: none; cursor: pointer; padding: 10px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 8px; color: #8892b0; }
        .nav-btn:hover { background: #151c2e; color: #c9b06b; }
        .nav-btn.active { background: linear-gradient(135deg, #1a2240, #1e2a4a); color: #c9b06b; border: 1px solid #2a3a60; }
        .card { background: #111827; border: 1px solid #1e2740; border-radius: 16px; padding: 24px; transition: all 0.2s; }
        .card:hover { border-color: #2a3a60; }
        .btn-primary { background: linear-gradient(135deg, #c9b06b, #a8903e); color: #0a0e17; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; transition: all 0.2s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary { background: #151c2e; color: #8892b0; border: 1px solid #1e2740; padding: 10px 20px; border-radius: 10px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; transition: all 0.2s; }
        .btn-secondary:hover { border-color: #c9b06b; color: #c9b06b; }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
        .input-field { background: #0d1321; border: 1px solid #1e2740; border-radius: 10px; padding: 10px 14px; color: #e8e8f0; font-family: 'DM Sans', sans-serif; font-size: 14px; width: 100%; outline: none; transition: border 0.2s; }
        .input-field:focus { border-color: #c9b06b; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: #111827; border: 1px solid #1e2740; border-radius: 20px; padding: 32px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
        .notif { position: fixed; top: 24px; right: 24px; z-index: 200; background: #111827; border: 1px solid #c9b06b; border-radius: 12px; padding: 14px 20px; font-size: 14px; color: #c9b06b; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .chip { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; margin: 3px; border: 1px solid; transition: all 0.15s; }
        .chip.selected { background: #c9b06b22; border-color: #c9b06b; color: #c9b06b; }
        .chip.unselected { background: transparent; border-color: #1e2740; color: #8892b0; }
        .chip:hover { border-color: #c9b06b; color: #c9b06b; }
        .contact-card { background: #111827; border: 1px solid #1e2740; border-radius: 14px; padding: 20px; cursor: pointer; transition: all 0.2s; }
        .contact-card:hover { border-color: #c9b06b44; transform: translateY(-2px); }
        .prop-card { background: #111827; border: 1px solid #1e2740; border-radius: 16px; overflow: hidden; transition: all 0.2s; }
        .prop-card:hover { border-color: #c9b06b44; transform: translateY(-2px); }
        .stat-card { background: linear-gradient(135deg, #111827, #0d1321); border: 1px solid #1e2740; border-radius: 16px; padding: 24px; }
        select.input-field { appearance: none; }
      `}</style>

      {notification && <div className="notif">✓ {notification.msg}</div>}

      {/* Sidebar */}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 220, background: "#0d1321", borderRight: "1px solid #1a2240", padding: "28px 16px", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 50 }}>
          <div style={{ marginBottom: 40, paddingLeft: 10 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#c9b06b", letterSpacing: "0.5px" }}>ImoPro</div>
            <div style={{ fontSize: 11, color: "#4a5578", marginTop: 2, letterSpacing: "2px", textTransform: "uppercase" }}>Portugal</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {[
              { id: "dashboard", icon: "◈", label: "Dashboard" },
              { id: "contacts", icon: "◉", label: "Contactos" },
              { id: "properties", icon: "⬡", label: "Imóveis" },
              { id: "campaigns", icon: "◎", label: "Campanhas" },
              { id: "social", icon: "◇", label: "Redes Sociais" },
            ].map(item => (
              <button key={item.id} className={`nav-btn ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                <span style={{ fontSize: 16 }}>{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
          <div style={{ borderTop: "1px solid #1a2240", paddingTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #c9b06b, #a8903e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#0a0e17" }}>MR</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e8e8f0" }}>Miguel Ramos</div>
                <div style={{ fontSize: 11, color: "#4a5578" }}>Plano Pro</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ marginLeft: 220, flex: 1, padding: 32 }}>

          {/* DASHBOARD */}
          {page === "dashboard" && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#e8e8f0" }}>Bom dia, Miguel</h1>
                <p style={{ color: "#4a5578", marginTop: 4 }}>Aqui está o resumo da sua actividade</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
                {[
                  { label: "Total Contactos", value: stats.contacts, sub: "+3 este mês", icon: "◉", color: "#3b82f6" },
                  { label: "Leads Quentes", value: stats.hot, sub: "Prontos para avançar", icon: "◈", color: "#ef4444" },
                  { label: "Imóveis Activos", value: stats.properties, sub: "Em carteira", icon: "⬡", color: "#c9b06b" },
                  { label: "Envios WhatsApp", value: stats.sent, sub: "Esta semana", icon: "◎", color: "#22c55e" },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#4a5578", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>{s.label}</div>
                        <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#4a5578", marginTop: 4 }}>{s.sub}</div>
                      </div>
                      <div style={{ fontSize: 24, color: s.color, opacity: 0.4 }}>{s.icon}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div className="card">
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#c9b06b" }}>Leads Recentes</h3>
                  {contacts.filter(c => c.status === "Quente").map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #1a2240" }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1a2240", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#c9b06b" }}>{c.name.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#4a5578" }}>{c.interests.join(", ")} · {c.locations[0]}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }}></div>
                    </div>
                  ))}
                  <button className="btn-secondary" style={{ marginTop: 16, width: "100%" }} onClick={() => setPage("contacts")}>Ver todos os contactos</button>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#c9b06b" }}>Imóveis para Enviar</h3>
                  {properties.map(p => {
                    const matches = getMatchingContacts(p);
                    return (
                      <div key={p.id} style={{ padding: "14px 0", borderBottom: "1px solid #1a2240" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</div>
                            <div style={{ fontSize: 12, color: "#4a5578", marginTop: 2 }}>{p.location} · {p.typology} · {p.price.toLocaleString("pt-PT")}€</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: "#22c55e", marginBottom: 6 }}>{matches.length} interessados</div>
                            <button className="btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleSend(p.id)}>Enviar</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button className="btn-secondary" style={{ marginTop: 16, width: "100%" }} onClick={() => setPage("properties")}>Ver todos os imóveis</button>
                </div>
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {page === "contacts" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>Contactos</h1>
                  <p style={{ color: "#4a5578", marginTop: 4, fontSize: 14 }}>{contacts.length} contactos na sua base</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddContact(true)}>+ Novo Contacto</button>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                <input className="input-field" style={{ maxWidth: 280 }} placeholder="🔍  Pesquisar por nome ou telefone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <select className="input-field" style={{ maxWidth: 180 }} value={filterInterest} onChange={e => setFilterInterest(e.target.value)}>
                  <option value="">Todos os interesses</option>
                  {INTERESTS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {filteredContacts.map(c => (
                  <div key={c.id} className="contact-card" onClick={() => setSelectedContact(c)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #1a2240, #2a3a60)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#c9b06b" }}>{c.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: "#4a5578" }}>{c.phone}</div>
                        </div>
                      </div>
                      <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${statusColors[c.status]}22`, color: statusColors[c.status], border: `1px solid ${statusColors[c.status]}44` }}>{c.status}</span>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      {c.interests.map(t => <span key={t} className="tag" style={{ background: "#c9b06b11", color: "#c9b06b", border: "1px solid #c9b06b33", marginRight: 4 }}>{t}</span>)}
                      {c.typologies.map(t => <span key={t} className="tag" style={{ background: "#3b82f611", color: "#3b82f6", border: "1px solid #3b82f633", marginRight: 4 }}>{t}</span>)}
                    </div>
                    <div style={{ fontSize: 12, color: "#4a5578", display: "flex", gap: 12 }}>
                      <span>📍 {c.locations.join(", ")}</span>
                      <span>💶 {c.priceRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROPERTIES */}
          {page === "properties" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>Imóveis</h1>
                  <p style={{ color: "#4a5578", marginTop: 4, fontSize: 14 }}>{properties.length} imóveis em carteira</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAddProperty(true)}>+ Novo Imóvel</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
                {properties.map(p => {
                  const matches = getMatchingContacts(p);
                  return (
                    <div key={p.id} className="prop-card">
                      <div style={{ background: "linear-gradient(135deg, #1a2240, #0d1321)", height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, position: "relative" }}>
                        {p.images[0]}
                        <div style={{ position: "absolute", top: 12, right: 12, background: "#22c55e22", border: "1px solid #22c55e44", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#22c55e" }}>{matches.length} interessados</div>
                      </div>
                      <div style={{ padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.title}</h3>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#c9b06b", fontFamily: "'Playfair Display', serif" }}>{p.price.toLocaleString("pt-PT")}€</div>
                        </div>
                        <div style={{ fontSize: 13, color: "#4a5578", marginBottom: 12 }}>📍 {p.location} · {p.typology} · {p.area}m²</div>
                        <p style={{ fontSize: 13, color: "#8892b0", marginBottom: 16, lineHeight: 1.5 }}>{p.description}</p>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleSend(p.id)}>📱 Enviar WhatsApp</button>
                          <button className="btn-secondary" style={{ flex: 1 }}>📸 Publicar Redes</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CAMPAIGNS */}
          {page === "campaigns" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>Campanhas</h1>
                <p style={{ color: "#4a5578", marginTop: 4, fontSize: 14 }}>Histórico de envios e resultados</p>
              </div>
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#c9b06b", marginBottom: 20 }}>Último Envio</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {[["Enviados", "12", "#3b82f6"], ["Entregues", "11", "#22c55e"], ["Visualizados", "8", "#c9b06b"], ["Respostas", "3", "#ef4444"]].map(([l, v, c]) => (
                    <div key={l} style={{ background: "#0d1321", borderRadius: 12, padding: 20, textAlign: "center" }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: c, fontFamily: "'Playfair Display', serif" }}>{v}</div>
                      <div style={{ fontSize: 12, color: "#4a5578", marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#c9b06b", marginBottom: 20 }}>Histórico</h3>
                {[
                  { date: "04 Mar 2025", property: "Apt T2 Cascais", sent: 12, type: "WhatsApp" },
                  { date: "28 Fev 2025", property: "Moradia T4 Sintra", sent: 5, type: "WhatsApp" },
                  { date: "20 Fev 2025", property: "Apt T1 Lisboa", sent: 18, type: "Instagram" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #1a2240" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.property}</div>
                      <div style={{ fontSize: 12, color: "#4a5578", marginTop: 2 }}>{item.date}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ background: "#c9b06b11", color: "#c9b06b", border: "1px solid #c9b06b33", padding: "3px 10px", borderRadius: 20, fontSize: 12, marginRight: 8 }}>{item.type}</span>
                      <span style={{ fontSize: 13, color: "#8892b0" }}>{item.sent} envios</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOCIAL */}
          {page === "social" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700 }}>Redes Sociais</h1>
                <p style={{ color: "#4a5578", marginTop: 4, fontSize: 14 }}>Automatize as suas publicações</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                {[
                  { name: "Facebook", icon: "f", color: "#1877f2", connected: false, desc: "Publicação automática na sua página" },
                  { name: "Instagram", icon: "◈", color: "#e1306c", connected: false, desc: "Posts e Stories automáticos" },
                  { name: "WhatsApp Business", icon: "◉", color: "#25d366", connected: true, desc: "Envio directo para contactos" },
                  { name: "Portal Imobiliário", icon: "⬡", color: "#c9b06b", connected: false, desc: "Publicação em idealista / imovirtual" },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}22`, border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: s.color }}>{s.icon}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: "#4a5578", marginTop: 2 }}>{s.desc}</div>
                      </div>
                    </div>
                    <button style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${s.connected ? "#22c55e44" : "#1e2740"}`, background: s.connected ? "#22c55e11" : "#151c2e", color: s.connected ? "#22c55e" : "#8892b0", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                      {s.connected ? "✓ Ligado" : "Ligar"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#c9b06b", marginBottom: 6 }}>Agendamento de Publicações</h3>
                <p style={{ fontSize: 13, color: "#4a5578", marginBottom: 20 }}>Ligue as suas contas para activar o agendamento automático</p>
                <div style={{ background: "#0d1321", borderRadius: 12, padding: 24, textAlign: "center", border: "1px dashed #1e2740" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
                  <div style={{ fontSize: 14, color: "#4a5578" }}>Ligue pelo menos uma conta de rede social para começar a agendar publicações</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SEND MODAL */}
      {showSendModal && (() => {
        const property = properties.find(p => p.id === sendPropertyId);
        const matches = property ? getMatchingContacts(property) : [];
        return (
          <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 6 }}>Enviar por WhatsApp</h2>
              <p style={{ color: "#4a5578", fontSize: 14, marginBottom: 24 }}>{property?.title}</p>
              <div style={{ background: "#0d1321", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#c9b06b", fontWeight: 600, marginBottom: 12 }}>{matches.length} contactos correspondentes ao perfil do imóvel:</div>
                {matches.length === 0 && <div style={{ fontSize: 13, color: "#4a5578" }}>Nenhum contacto com este perfil ainda.</div>}
                {matches.map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a2240" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a2240", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#c9b06b", fontWeight: 700 }}>{c.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#4a5578" }}>{c.phone}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: `${statusColors[c.status]}22`, color: statusColors[c.status] }}>{c.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "#8892b0", display: "block", marginBottom: 8 }}>Mensagem personalizada</label>
                <textarea className="input-field" rows={4} defaultValue={`Olá! Tenho um imóvel que pode ser do seu interesse: ${property?.title} por ${property?.price?.toLocaleString("pt-PT")}€. Tem interesse em saber mais?`} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowSendModal(false)}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setShowSendModal(false); showNotif(`Enviado para ${matches.length} contactos!`); }}>
                  Enviar para {matches.length} contactos
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD CONTACT MODAL */}
      {showAddContact && (
        <div className="modal-overlay" onClick={() => setShowAddContact(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24 }}>Novo Contacto</h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Nome *</label><input className="input-field" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="Nome completo" /></div>
                <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Telefone *</label><input className="input-field" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+351 9XX XXX XXX" /></div>
              </div>
              <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Email</label><input className="input-field" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} placeholder="email@exemplo.pt" /></div>
              <div>
                <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 8 }}>Interesses</label>
                <div>{INTERESTS.map(i => <span key={i} className={`chip ${newContact.interests.includes(i) ? "selected" : "unselected"}`} onClick={() => setNewContact({ ...newContact, interests: toggleArr(newContact.interests, i) })}>{i}</span>)}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 8 }}>Tipologia</label>
                <div>{TYPOLOGIES.map(t => <span key={t} className={`chip ${newContact.typologies.includes(t) ? "selected" : "unselected"}`} onClick={() => setNewContact({ ...newContact, typologies: toggleArr(newContact.typologies, t) })}>{t}</span>)}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 8 }}>Localização</label>
                <div>{LOCATIONS.map(l => <span key={l} className={`chip ${newContact.locations.includes(l) ? "selected" : "unselected"}`} onClick={() => setNewContact({ ...newContact, locations: toggleArr(newContact.locations, l) })}>{l}</span>)}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Budget</label>
                  <select className="input-field" value={newContact.priceRange} onChange={e => setNewContact({ ...newContact, priceRange: e.target.value })}>
                    <option value="">Seleccionar</option>
                    {PRICE_RANGES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Estado</label>
                  <select className="input-field" value={newContact.status} onChange={e => setNewContact({ ...newContact, status: e.target.value })}>
                    <option>Quente</option><option>Morno</option><option>Frio</option>
                  </select>
                </div>
              </div>
              <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Notas</label><textarea className="input-field" rows={3} value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })} placeholder="Informações adicionais..." style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddContact(false)}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddContact}>Guardar Contacto</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD PROPERTY MODAL */}
      {showAddProperty && (
        <div className="modal-overlay" onClick={() => setShowAddProperty(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24 }}>Novo Imóvel</h2>
            <div style={{ display: "grid", gap: 16 }}>
              <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Título *</label><input className="input-field" value={newProperty.title} onChange={e => setNewProperty({ ...newProperty, title: e.target.value })} placeholder="Ex: Apartamento T2 em Lisboa" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Tipo *</label>
                  <select className="input-field" value={newProperty.type} onChange={e => setNewProperty({ ...newProperty, type: e.target.value })}>
                    <option value="">Tipo</option>
                    {INTERESTS.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Tipologia</label>
                  <select className="input-field" value={newProperty.typology} onChange={e => setNewProperty({ ...newProperty, typology: e.target.value })}>
                    <option value="">T</option>
                    {TYPOLOGIES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Localização</label>
                  <select className="input-field" value={newProperty.location} onChange={e => setNewProperty({ ...newProperty, location: e.target.value })}>
                    <option value="">Cidade</option>
                    {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Preço (€)</label><input className="input-field" type="number" value={newProperty.price} onChange={e => setNewProperty({ ...newProperty, price: e.target.value })} placeholder="Ex: 250000" /></div>
                <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Área (m²)</label><input className="input-field" type="number" value={newProperty.area} onChange={e => setNewProperty({ ...newProperty, area: e.target.value })} placeholder="Ex: 95" /></div>
              </div>
              <div><label style={{ fontSize: 12, color: "#4a5578", display: "block", marginBottom: 6 }}>Descrição</label><textarea className="input-field" rows={3} value={newProperty.description} onChange={e => setNewProperty({ ...newProperty, description: e.target.value })} placeholder="Descreva o imóvel..." style={{ resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddProperty(false)}>Cancelar</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddProperty}>Guardar Imóvel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT DETAIL MODAL */}
      {selectedContact && (
        <div className="modal-overlay" onClick={() => setSelectedContact(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #1a2240, #2a3a60)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#c9b06b" }}>{selectedContact.name.charAt(0)}</div>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>{selectedContact.name}</h2>
                <div style={{ fontSize: 13, color: "#4a5578" }}>{selectedContact.phone} · {selectedContact.email}</div>
              </div>
              <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${statusColors[selectedContact.status]}22`, color: statusColors[selectedContact.status], border: `1px solid ${statusColors[selectedContact.status]}44` }}>{selectedContact.status}</span>
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#4a5578", marginBottom: 8 }}>INTERESSES</div><div>{selectedContact.interests.map(t => <span key={t} className="tag" style={{ background: "#c9b06b11", color: "#c9b06b", border: "1px solid #c9b06b33", marginRight: 6 }}>{t}</span>)}</div></div>
              <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#4a5578", marginBottom: 8 }}>TIPOLOGIA</div><div>{selectedContact.typologies.map(t => <span key={t} className="tag" style={{ background: "#3b82f611", color: "#3b82f6", border: "1px solid #3b82f633", marginRight: 6 }}>{t}</span>)}</div></div>
              <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#4a5578", marginBottom: 8 }}>LOCALIZAÇÃO</div><div style={{ fontSize: 14 }}>📍 {selectedContact.locations.join(", ")}</div></div>
              <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#4a5578", marginBottom: 8 }}>BUDGET</div><div style={{ fontSize: 14, color: "#c9b06b", fontWeight: 600 }}>💶 {selectedContact.priceRange}</div></div>
              {selectedContact.notes && <div className="card" style={{ padding: 16 }}><div style={{ fontSize: 12, color: "#4a5578", marginBottom: 8 }}>NOTAS</div><div style={{ fontSize: 14, color: "#8892b0" }}>{selectedContact.notes}</div></div>}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedContact(null)}>Fechar</button>
              <button className="btn-primary" style={{ flex: 1 }}>📱 Enviar WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
