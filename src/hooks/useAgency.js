// src/hooks/useAgency.js
// ─────────────────────────────────────────────────────────────────────────────
// Hook que:
//  1. Lê o slug da URL  (ex: /era-viana  ou  /era-viana/imovel/123)
//  2. Faz fetch ao endpoint GET /api/agencies/:slug
//  3. Aplica as cores da agência como CSS variables no <html>
//  4. Remove as variáveis ao desmontar (volta ao tema padrão)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";

// Cores padrão da plataforma (usadas quando não há agência)
const DEFAULT_THEME = {
  primary:   "#1a56db",
  secondary: "#1e429f",
};

/**
 * @param {string} [overrideSlug]  - Podes forçar um slug sem depender da URL
 * @returns {{ agency: object|null, loading: boolean, error: string|null }}
 */
export function useAgency(overrideSlug = null) {
  const params   = useParams();
  const location = useLocation();

  // Slug vem de: prop > URL param > primeiro segmento do path
  const slug = overrideSlug
    || params.agencySlug
    || location.pathname.split("/").filter(Boolean)[0]
    || null;

  const [agency,  setAgency]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    // Sem slug → limpar tema e sair
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      applyTheme(null);
      setAgency(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/agencies/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error(res.status === 404 ? "not_found" : "server_error");
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        setAgency(data);
        applyTheme(data);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        applyTheme(null); // volta ao tema padrão
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      // Ao sair da rota da agência, restaurar tema padrão
      applyTheme(null);
    };
  }, [slug]);

  return { agency, loading, error, slug };
}

// ─────────────────────────────────────────────────────────────────────────────
// Aplica / remove CSS variables no elemento :root
// ─────────────────────────────────────────────────────────────────────────────
function applyTheme(agency) {
  const root = document.documentElement;

  if (!agency) {
    root.style.removeProperty("--agency-primary");
    root.style.removeProperty("--agency-secondary");
    root.style.removeProperty("--agency-primary-10");
    root.style.removeProperty("--agency-primary-20");
    root.style.removeProperty("--agency-name");
    root.removeAttribute("data-agency");
    return;
  }

  const primary   = agency.primary_color   || DEFAULT_THEME.primary;
  const secondary = agency.secondary_color || DEFAULT_THEME.secondary;

  root.style.setProperty("--agency-primary",    primary);
  root.style.setProperty("--agency-secondary",  secondary);
  root.style.setProperty("--agency-primary-10", hexToRgba(primary, 0.10));
  root.style.setProperty("--agency-primary-20", hexToRgba(primary, 0.20));
  root.setAttribute("data-agency", agency.slug);
}

// Converte #rrggbb → rgba(r,g,b,alpha)
function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
