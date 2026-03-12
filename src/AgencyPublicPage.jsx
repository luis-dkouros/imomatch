// src/AgencyPublicPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Página pública da agência: imomatch.pt/era-viana/
//  - Header com logo + nome da agência (cores dinâmicas)
//  - Grid de imóveis da agência com paginação
//  - Totalmente responsivo
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link }      from "react-router-dom";
import { useAgency }                          from "./hooks/useAgency";

// ─── Utilitários ──────────────────────────────────────────────────────────────
const fmt = n =>
  n != null ? Number(n).toLocaleString("pt-PT") + " €" : "Preço sob consulta";

const firstPhoto = photos => {
  if (!Array.isArray(photos) || !photos.length) return null;
  return photos[0]?.url || photos[0] || null;
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AgencyPublicPage() {
  const { agencySlug } = useParams();
  const navigate        = useNavigate();

  const { agency, loading: agencyLoading, error: agencyError } = useAgency(agencySlug);

  const [properties, setProperties] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [propsLoading, setPropsLoading] = useState(false);
  const LIMIT = 12;

  // Buscar imóveis da agência
  const fetchProperties = useCallback(async (p = 1) => {
    if (!agencySlug) return;
    setPropsLoading(true);
    try {
      const res  = await fetch(`/api/agencies/${agencySlug}/properties?page=${p}&limit=${LIMIT}`);
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
        setTotal(data.total || 0);
        setPage(p);
      }
    } catch (e) {
      console.error("[AgencyPage] Erro ao carregar imóveis:", e);
    } finally {
      setPropsLoading(false);
    }
  }, [agencySlug]);

  useEffect(() => { fetchProperties(1); }, [fetchProperties]);

  const totalPages = Math.ceil(total / LIMIT);

  // ── Estados de carregamento / erro ──────────────────────────────────────────
  if (agencyLoading) return <PageLoader />;

  if (agencyError === "not_found" || (!agencyLoading && !agency)) {
    return (
      <div style={styles.notFound}>
        <h2>Agência não encontrada</h2>
        <p>O endereço <strong>/{agencySlug}</strong> não corresponde a nenhuma agência registada.</p>
        <Link to="/" style={styles.backLink}>← Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── Header da Agência ─────────────────────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandRow}>
            {agency?.logo_url ? (
              <img
                src={agency.logo_url}
                alt={`Logo ${agency.name}`}
                style={styles.logo}
              />
            ) : (
              <div style={styles.logoPlaceholder}>
                {agency?.name?.[0] || "A"}
              </div>
            )}
            <div>
              <h1 style={styles.agencyName}>{agency?.name}</h1>
              <p style={styles.agencyMeta}>
                {total > 0 ? `${total} imóvel${total !== 1 ? "s" : ""} disponível${total !== 1 ? "is" : ""}` : "Sem imóveis publicados"}
              </p>
            </div>
          </div>

          {/* Botão para voltar à plataforma */}
          <Link to="/" style={styles.platformLink}>
            <span>imomatch.pt</span>
          </Link>
        </div>
      </header>

      {/* ── Grid de Imóveis ───────────────────────────────────────────────── */}
      <main style={styles.main}>
        {propsLoading ? (
          <GridLoader />
        ) : properties.length === 0 ? (
          <div style={styles.empty}>
            <p>Esta agência ainda não tem imóveis publicados.</p>
          </div>
        ) : (
          <>
            <div style={styles.grid}>
              {properties.map(prop => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  agencySlug={agencySlug}
                  onClick={() => navigate(`/${agencySlug}/imovel/${prop.id}`)}
                />
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={styles.pageBtn(page === 1)}
                  disabled={page === 1}
                  onClick={() => fetchProperties(page - 1)}
                >
                  ← Anterior
                </button>
                <span style={styles.pageInfo}>
                  Página {page} de {totalPages}
                </span>
                <button
                  style={styles.pageBtn(page === totalPages)}
                  disabled={page === totalPages}
                  onClick={() => fetchProperties(page + 1)}
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── PropertyCard ─────────────────────────────────────────────────────────────
function PropertyCard({ property, agencySlug, onClick }) {
  const photo = firstPhoto(property.photos);
  const [imgError, setImgError] = useState(false);

  return (
    <article style={styles.card} onClick={onClick}>
      <div style={styles.cardImg}>
        {photo && !imgError ? (
          <img
            src={photo}
            alt={property.title}
            style={styles.cardImgEl}
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={styles.cardImgFallback}>
            <span style={{ fontSize: 32 }}>🏠</span>
          </div>
        )}
        {property.typology && (
          <span style={styles.badge}>{property.typology}</span>
        )}
      </div>

      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{property.title}</h3>
        <p style={styles.cardLocation}>
          {[property.parish, property.concelho].filter(Boolean).join(", ")}
        </p>
        <div style={styles.cardFooter}>
          <span style={styles.cardPrice}>{fmt(property.price)}</span>
          {property.area && (
            <span style={styles.cardArea}>{property.area} m²</span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Loaders ──────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={styles.loaderWrap}>
      <div style={styles.spinner} />
      <p style={{ color: "#6b7280", marginTop: 12 }}>A carregar agência…</p>
    </div>
  );
}

function GridLoader() {
  return (
    <div style={styles.grid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={styles.skeleton} />
      ))}
    </div>
  );
}

// ─── Estilos (inline, compatível com tema dinâmico via CSS vars) ──────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  // Header usa a cor primária da agência via CSS var com fallback
  header: {
    background:   "var(--agency-primary, #1a56db)",
    color:        "#fff",
    padding:      "0 1rem",
    boxShadow:    "0 2px 8px rgba(0,0,0,0.15)",
  },
  headerInner: {
    maxWidth:       "1280px",
    margin:         "0 auto",
    padding:        "1.25rem 0",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            "1rem",
    flexWrap:       "wrap",
  },
  brandRow: {
    display:    "flex",
    alignItems: "center",
    gap:        "1rem",
  },
  logo: {
    height:       "56px",
    width:        "56px",
    objectFit:    "contain",
    borderRadius: "8px",
    background:   "rgba(255,255,255,0.15)",
    padding:      "4px",
  },
  logoPlaceholder: {
    height:          "56px",
    width:           "56px",
    borderRadius:    "8px",
    background:      "rgba(255,255,255,0.2)",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    fontSize:        "1.75rem",
    fontWeight:      "700",
    color:           "#fff",
  },
  agencyName: {
    margin:     0,
    fontSize:   "1.4rem",
    fontWeight: "700",
    lineHeight: 1.2,
  },
  agencyMeta: {
    margin:   "0.15rem 0 0",
    fontSize: "0.85rem",
    opacity:  0.85,
  },
  platformLink: {
    color:          "rgba(255,255,255,0.8)",
    textDecoration: "none",
    fontSize:       "0.8rem",
    border:         "1px solid rgba(255,255,255,0.35)",
    borderRadius:   "6px",
    padding:        "0.3rem 0.75rem",
    transition:     "all 0.15s",
    whiteSpace:     "nowrap",
  },

  // Main
  main: {
    maxWidth: "1280px",
    margin:   "0 auto",
    padding:  "2rem 1rem",
  },

  // Grid
  grid: {
    display:             "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap:                 "1.5rem",
  },

  // Card
  card: {
    background:   "#fff",
    borderRadius: "12px",
    overflow:     "hidden",
    boxShadow:    "0 1px 4px rgba(0,0,0,0.08)",
    cursor:       "pointer",
    transition:   "transform 0.15s, box-shadow 0.15s",
    // hover via CSS var para cor primária
    border:       "2px solid transparent",
  },
  cardImg: {
    position:   "relative",
    height:     "180px",
    background: "#f3f4f6",
    overflow:   "hidden",
  },
  cardImgEl: {
    width:      "100%",
    height:     "100%",
    objectFit:  "cover",
  },
  cardImgFallback: {
    width:           "100%",
    height:          "100%",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      "#f3f4f6",
  },
  badge: {
    position:     "absolute",
    top:          "0.6rem",
    left:         "0.6rem",
    background:   "var(--agency-primary, #1a56db)",
    color:        "#fff",
    fontSize:     "0.72rem",
    fontWeight:   "600",
    padding:      "0.2rem 0.55rem",
    borderRadius: "4px",
    letterSpacing:"0.03em",
  },
  cardBody: {
    padding: "1rem",
  },
  cardTitle: {
    margin:        "0 0 0.25rem",
    fontSize:      "0.97rem",
    fontWeight:    "600",
    color:         "#111827",
    whiteSpace:    "nowrap",
    overflow:      "hidden",
    textOverflow:  "ellipsis",
  },
  cardLocation: {
    margin:    "0 0 0.75rem",
    fontSize:  "0.82rem",
    color:     "#6b7280",
  },
  cardFooter: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
  },
  cardPrice: {
    fontSize:   "1.05rem",
    fontWeight: "700",
    color:      "var(--agency-primary, #1a56db)",
  },
  cardArea: {
    fontSize: "0.82rem",
    color:    "#9ca3af",
  },

  // Paginação
  pagination: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    gap:            "1rem",
    marginTop:      "2.5rem",
  },
  pageBtn: disabled => ({
    padding:       "0.5rem 1.25rem",
    borderRadius:  "8px",
    border:        "1px solid #d1d5db",
    background:    disabled ? "#f9fafb" : "var(--agency-primary, #1a56db)",
    color:         disabled ? "#9ca3af" : "#fff",
    cursor:        disabled ? "not-allowed" : "pointer",
    fontWeight:    "500",
    fontSize:      "0.9rem",
    transition:    "all 0.15s",
  }),
  pageInfo: {
    fontSize: "0.9rem",
    color:    "#374151",
  },

  // Not found
  notFound: {
    textAlign:  "center",
    padding:    "4rem 1rem",
    color:      "#374151",
  },
  backLink: {
    display:         "inline-block",
    marginTop:       "1rem",
    color:           "#1a56db",
    textDecoration:  "none",
    fontWeight:      "500",
  },

  // Loaders
  loaderWrap: {
    display:         "flex",
    flexDirection:   "column",
    alignItems:      "center",
    justifyContent:  "center",
    minHeight:       "60vh",
  },
  spinner: {
    width:       "36px",
    height:      "36px",
    border:      "3px solid #e5e7eb",
    borderTop:   "3px solid var(--agency-primary, #1a56db)",
    borderRadius:"50%",
    animation:   "spin 0.8s linear infinite",
  },
  skeleton: {
    height:       "260px",
    borderRadius: "12px",
    background:   "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)",
    backgroundSize: "200% 100%",
    animation:    "shimmer 1.2s infinite",
  },
  empty: {
    textAlign: "center",
    padding:   "4rem 1rem",
    color:     "#6b7280",
  },
};
