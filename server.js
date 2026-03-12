/**
 * ImoPro – Express server com suporte a Open Graph (WhatsApp / Telegram previews)
 *
 * Lógica:
 *  - Bot/crawler visita /imovel/:id  →  devolve HTML com meta OG do imóvel
 *  - Utilizador normal               →  serve a React SPA normalmente
 */

const express  = require("express");
const path     = require("path");
const fs       = require("fs");
const https    = require("https");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Variáveis de ambiente ──────────────────────────────────────────────────
const SUPABASE_URL         = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY    = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // admin — nunca exposta ao browser
const SITE_URL             = process.env.REACT_APP_SITE_URL || "https://imomatch.pt";

const BUILD_DIR = path.join(__dirname, "build");

// ── Detectar bots / crawlers ───────────────────────────────────────────────
function isBot(ua = "") {
  const bots = [
    "whatsapp", "facebot", "facebookexternalhit",
    "telegrambot", "twitterbot", "linkedinbot",
    "slackbot", "discordbot", "pinterest",
    "googlebot", "bingbot", "yandexbot",
    "applebot", "ia_archiver", "rogerbot",
    "embedly", "quora link preview", "showyoubot",
    "outbrain", "vkshare", "w3c_validator",
    "redditbot", "ahrefsbot", "semrushbot",
  ];
  const lower = ua.toLowerCase();
  return bots.some(b => lower.includes(b));
}

// ── Buscar imóvel no Supabase (sem SDK, só fetch nativo) ────────────────────
function fetchProperty(id) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return reject(new Error("Supabase env vars missing"));
    }

    const url = `${SUPABASE_URL}/rest/v1/properties?id=eq.${encodeURIComponent(id)}&select=id,title,price,typology,area,concelho,description,photos&limit=1`;

    const options = {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    };

    https.get(url, options, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          const rows = JSON.parse(data);
          resolve(Array.isArray(rows) && rows.length ? rows[0] : null);
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// ── Gerar HTML com meta OG ─────────────────────────────────────────────────
function buildOGHtml(property) {
  const title       = property.title || "Imóvel";
  const price       = property.price
    ? Number(property.price).toLocaleString("pt-PT") + "€"
    : "";
  const typology    = property.typology || "";
  const area        = property.area ? `${property.area}m²` : "";
  const concelho    = property.concelho || "";
  const description = property.description
    ? property.description.slice(0, 200)
    : `${typology} ${area} em ${concelho}`.trim();

  // Primeira foto do imóvel (array de {url})
  const photos      = property.photos || [];
  // Usar proxy para a imagem (evita hotlink blocks do Supabase Storage)
  const imageProxy  = `${SITE_URL}/og-image/${property.id}`;
  const image       = photos.length ? imageProxy : `${SITE_URL}/og-default.png`;

  const pageUrl     = `${SITE_URL}/imovel/${property.id}`;

  const titleFull   = `${title}${price ? " — " + price : ""}`;
  const descFull    = [typology, area, concelho].filter(Boolean).join(" · ")
    + (description ? `\n${description}` : "");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>

  <!-- Open Graph (WhatsApp, Facebook, Telegram, LinkedIn…) -->
  <meta property="og:type"        content="website"/>
  <meta property="og:site_name"   content="ImoPro"/>
  <meta property="og:url"         content="${esc(pageUrl)}"/>
  <meta property="og:title"       content="${esc(titleFull)}"/>
  <meta property="og:description" content="${esc(descFull)}"/>
  <meta property="og:image"       content="${esc(image)}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height"content="630"/>
  <meta property="og:locale"      content="pt_PT"/>

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${esc(titleFull)}"/>
  <meta name="twitter:description" content="${esc(descFull)}"/>
  <meta name="twitter:image"       content="${esc(image)}"/>

  <!-- SEO básico -->
  <title>${esc(titleFull)} | ImoPro</title>
  <meta name="description" content="${esc(descFull)}"/>

  <!-- Redireciona utilizadores humanos para a SPA React -->
  <script>
    var ua = navigator.userAgent.toLowerCase();
    var bots = ["whatsapp","facebot","facebookexternalhit","telegrambot","twitterbot","linkedinbot","slackbot","discordbot","googlebot","bingbot"];
    var isBot = bots.some(function(b){ return ua.indexOf(b) !== -1; });
    if (!isBot) { window.location.replace("${esc(pageUrl)}"); }
  </script>
</head>
<body>
  <h1>${esc(titleFull)}</h1>
  <p>${esc(descFull)}</p>
  <a href="${esc(pageUrl)}">Ver imóvel</a>
</body>
</html>`;
}

function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Proxy de imagem OG (evita CORS de Supabase Storage) ──────────────────
app.get("/og-image/:id", async (req, res) => {
  try {
    const property = await fetchProperty(req.params.id);
    const imageUrl = property?.photos?.[0]?.url;

    if (!imageUrl) {
      return res.sendFile(path.join(BUILD_DIR, "og-default.png"), err => {
        if (err) res.status(404).send("No image");
      });
    }

    // Proxy da imagem para evitar problemas de CORS/hotlink
    const urlObj = new URL(imageUrl);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImoPro-Bot/1.0)",
        "Accept": "image/*,*/*",
        "Referer": SITE_URL,
      },
    };

    https.get(options, imgRes => {
      // Seguir redirects
      if (imgRes.statusCode === 301 || imgRes.statusCode === 302) {
        const redirectUrl = imgRes.headers["location"];
        if (redirectUrl) return res.redirect(redirectUrl);
      }
      if (imgRes.statusCode !== 200) {
        return res.sendFile(path.join(BUILD_DIR, "og-default.png"), err => {
          if (err) res.status(404).send("No image");
        });
      }
      res.setHeader("Content-Type", imgRes.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");
      imgRes.pipe(res);
    }).on("error", () => {
      res.sendFile(path.join(BUILD_DIR, "og-default.png"), err => {
        if (err) res.status(404).send("No image");
      });
    });

  } catch (err) {
    console.error("[OG-IMAGE] Erro:", err.message);
    res.sendFile(path.join(BUILD_DIR, "og-default.png"), err => {
      if (err) res.status(404).send("No image");
    });
  }
});


app.get("/imovel/:id", async (req, res, next) => {
  const ua = req.headers["user-agent"] || "";

  // Utilizador normal → deixa passar para o React
  if (!isBot(ua)) return next();

  try {
    const property = await fetchProperty(req.params.id);

    if (!property) {
      // Imóvel não encontrado → resposta mínima para não quebrar o crawler
      return res.status(404).send(`<!DOCTYPE html><html><head>
        <meta property="og:title" content="Imóvel não encontrado | ImoPro"/>
        <title>Imóvel não encontrado | ImoPro</title>
      </head><body><p>Imóvel não encontrado.</p></body></html>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300"); // cache 5 min
    return res.send(buildOGHtml(property));

  } catch (err) {
    console.error("[OG] Erro ao buscar imóvel:", err.message);
    return next(); // em caso de erro serve a SPA normalmente
  }
});

// ── Facebook OAuth callback ───────────────────────────────────────────────
// O Facebook redireciona para /auth/facebook/callback?code=...
// Passamos o code para a SPA via query param fb_code
app.get("/auth/facebook/callback", (req, res) => {
  const code  = req.query.code;
  const error = req.query.error;
  if (error) {
    return res.redirect(`/?fb_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return res.redirect("/?fb_error=no_code");
  }
  // Redireciona para a SPA com o código
  res.redirect(`/?fb_code=${encodeURIComponent(code)}`);
});

// ── Ficheiros estáticos do React build ────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// PATCH para server.js — Módulo de Agências (Fase 2)
// Adicionar ANTES da linha: app.use(express.static(BUILD_DIR))
// ═══════════════════════════════════════════════════════════════════════════

// ── Buscar agência pelo slug no Supabase ───────────────────────────────────
function fetchAgencyBySlug(slug) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return reject(new Error("Supabase env vars missing"));
    }

    const url =
      `${SUPABASE_URL}/rest/v1/agencies` +
      `?slug=eq.${encodeURIComponent(slug)}` +
      `&select=id,slug,name,logo_url,primary_color,secondary_color,plan` +
      `&limit=1`;

    const options = {
      headers: {
        apikey:        SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept:        "application/json",
      },
    };

    https.get(url, options, res => {
      let data = "";
      res.on("data", chunk => (data += chunk));
      res.on("end", () => {
        try {
          const rows = JSON.parse(data);
          resolve(Array.isArray(rows) && rows.length ? rows[0] : null);
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// ── API: GET /api/agencies/:slug ────────────────────────────────────────────
// Devolve os dados públicos da agência para o frontend aplicar o tema.
app.get("/api/agencies/:slug", async (req, res) => {
  const { slug } = req.params;

  // Slug só pode conter letras, números e hífens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: "Slug inválido" });
  }

  try {
    const agency = await fetchAgencyBySlug(slug);

    if (!agency) {
      return res.status(404).json({ error: "Agência não encontrada" });
    }

    // Cache de 5 minutos (CDN / browser)
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.json(agency);

  } catch (err) {
    console.error("[AGENCY] Erro ao buscar agência:", err.message);
    return res.status(500).json({ error: "Erro interno" });
  }
});

// ── API: GET /api/agencies/:slug/properties ─────────────────────────────────
// Imóveis públicos da agência (para a página pública /[slug])
app.get("/api/agencies/:slug/properties", async (req, res) => {
  const { slug } = req.params;
  const page  = Math.max(1, parseInt(req.query.page  || "1",  10));
  const limit = Math.min(50, parseInt(req.query.limit || "12", 10));
  const offset = (page - 1) * limit;

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: "Slug inválido" });
  }

  try {
    // 1. Resolver agency_id a partir do slug
    const agency = await fetchAgencyBySlug(slug);
    if (!agency) {
      return res.status(404).json({ error: "Agência não encontrada" });
    }

    // 2. Buscar imóveis filtrados por agency_id
    const url =
      `${SUPABASE_URL}/rest/v1/properties` +
      `?agency_id=eq.${encodeURIComponent(agency.id)}` +
      `&select=id,title,price,typology,area,concelho,parish,photos,status` +
      `&status=eq.active` +
      `&order=created_at.desc` +
      `&limit=${limit}&offset=${offset}`;

    const options = {
      headers: {
        apikey:        SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept:        "application/json",
        // Pedir contagem total para paginação
        Prefer:        "count=exact",
      },
    };

    https.get(url, options, propRes => {
      let data = "";
      propRes.on("data", chunk => (data += chunk));
      propRes.on("end", () => {
        try {
          const properties = JSON.parse(data);
          // Supabase devolve o total no header Content-Range: 0-11/48
          const range = propRes.headers["content-range"] || "";
          const total = parseInt((range.split("/")[1] || "0"), 10);

          res.setHeader("Cache-Control", "public, max-age=60");
          res.json({ agency, properties, total, page, limit });
        } catch (e) {
          res.status(500).json({ error: "Erro ao parsear imóveis" });
        }
      });
    }).on("error", err => {
      console.error("[AGENCY PROPS] Erro:", err.message);
      res.status(500).json({ error: "Erro interno" });
    });

  } catch (err) {
    console.error("[AGENCY PROPS] Erro:", err.message);
    res.status(500).json({ error: "Erro interno" });
  }
});



// ═══════════════════════════════════════════════════════════════════════════
// API: Convidar agente para agência (cria conta + liga à agência)
// POST /api/agencies/invite-agent
// Body: { agency_id, email, invited_by_jwt }
// Requer SUPABASE_SERVICE_ROLE_KEY no Railway
// ═══════════════════════════════════════════════════════════════════════════

app.use(express.json());

// Helper: fetch via https nativo (POST/PATCH com body)
function supabaseRequest({ method, path, body, useServiceKey, extraHeaders }) {
  return new Promise((resolve, reject) => {
    const key  = useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
    const urlObj = new URL(SUPABASE_URL + path);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   method || "GET",
      headers: {
        apikey:         key,
        Authorization:  `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept:         "application/json",
        Prefer:         "return=representation",
        ...(extraHeaders || {}),
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, res => {
      let buf = "";
      res.on("data", c => (buf += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf || "null") }); }
        catch (e) { resolve({ status: res.statusCode, body: buf }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

app.post("/api/agencies/invite-agent", async (req, res) => {
  const { agency_id, email } = req.body || {};

  if (!agency_id || !email) {
    return res.status(400).json({ error: "agency_id e email são obrigatórios." });
  }
  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada." });
  }

  try {
    // Verificar se já está noutra agência (se já tem conta)
    const existingRes = await supabaseRequest({
      method: "GET",
      path:   `/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      useServiceKey: true,
    });
    const existingUser = existingRes.body?.users?.[0] || null;

    if (existingUser) {
      const profileRes = await supabaseRequest({
        method: "GET",
        path:   `/rest/v1/profiles?id=eq.${existingUser.id}&select=agency_id`,
        useServiceKey: true,
      });
      const p = profileRes.body?.[0];
      if (p?.agency_id && p.agency_id !== agency_id) {
        return res.status(409).json({ error: "Este utilizador já pertence a outra agência." });
      }
    }

    // Usar SEMPRE o /invite — se o utilizador não existe cria e envia email.
    // Se já existe, o Supabase reenvía o email de convite sem criar duplicado.
    const inviteRes = await supabaseRequest({
      method: "POST",
      path:   `/auth/v1/invite?redirect_to=${encodeURIComponent(SITE_URL + "/?welcome=agency")}`,
      body:   { email },
      useServiceKey: true,
    });

    if (inviteRes.status !== 200 && inviteRes.status !== 201) {
      console.error("[INVITE] Erro:", JSON.stringify(inviteRes.body));
      return res.status(500).json({ error: "Erro ao enviar convite: " + (inviteRes.body?.message || inviteRes.body?.msg || "erro desconhecido") });
    }

    const userId = inviteRes.body?.id;

    // Criar ou actualizar perfil ligado à agência (upsert via Prefer: resolution=merge-duplicates)
    await supabaseRequest({
      method: "POST",
      path:   "/rest/v1/profiles",
      body: {
        id:          userId,
        name:        email.split("@")[0],
        agency_id,
        agency_role: "agent",
        plan:        "agency",
      },
      useServiceKey: true,
      extraHeaders: { Prefer: "return=representation,resolution=merge-duplicates" },
    });

    // Limpar convite pendente se existia
    await supabaseRequest({
      method: "DELETE",
      path:   `/rest/v1/agency_invites?agency_id=eq.${agency_id}&email=eq.${encodeURIComponent(email)}`,
      useServiceKey: true,
    }).catch(() => {});

    // Buscar nome da agência para personalizar email
    const agRes = await supabaseRequest({
      method: "GET",
      path:   `/rest/v1/agencies?id=eq.${agency_id}&select=name,logo_url,primary_color`,
      useServiceKey: true,
    });
    const ag = agRes.body?.[0] || {};
    const agencyName  = ag.name  || "a tua agência";
    const agencyColor = ag.primary_color || "#3BB2A1";

    // Enviar email personalizado via Resend (substitui o email genérico do Supabase)
    if (process.env.RESEND_API_KEY) {
      // Gerar magic link para entrada directa
      const linkRes = await supabaseRequest({
        method: "POST",
        path:   "/auth/v1/admin/generate_link",
        body: {
          type:  "invite",
          email,
          options: { redirect_to: `${SITE_URL}/?welcome=agency` },
        },
        useServiceKey: true,
      });
      const actionLink = linkRes.body?.properties?.action_link || `${SITE_URL}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    `ImoMatch <suporte@imomatch.pt>`,
          to:      [email],
          subject: `Foste convidado para a agência ${agencyName} no ImoMatch`,
          html: `<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:${agencyColor};padding:32px 32px 24px">
      ${ag.logo_url ? `<img src="${ag.logo_url}" height="48" style="margin-bottom:16px;border-radius:8px;background:#fff;padding:4px"/>` : ""}
      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800">${agencyName}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Convite para a equipa</p>
    </div>
    <div style="padding:32px">
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:18px">Foste adicionado à equipa! 🎉</h2>
      <p style="color:#64748b;line-height:1.6;margin:0 0 24px">
        Foste convidado para fazer parte da agência <strong style="color:#0f172a">${agencyName}</strong> no ImoMatch.
        O teu acesso está activo — não precisas de pagar nenhuma subscrição individual.
      </p>
      <a href="${actionLink}"
        style="display:inline-block;background:${agencyColor};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">
        Entrar no ImoMatch →
      </a>
      <p style="color:#94a3b8;font-size:12px;margin-top:32px;line-height:1.5">
        Se não reconheces este convite, podes ignorar este email.<br/>
        O link expira em 24 horas.
      </p>
    </div>
  </div>
</body></html>`,
        }),
      }).catch(e => console.error("[INVITE] Erro Resend:", e.message));
    }

    console.log(`[INVITE] ${email} convidado para agência ${agency_id}`);
    return res.json({ success: true, userId, message: `Convite enviado para ${email}.` });

  } catch (e) {
    console.error("[INVITE] Erro inesperado:", e.message);
    return res.status(500).json({ error: "Erro interno: " + e.message });
  }
});


app.use(express.static(BUILD_DIR));

// ── SPA fallback: todas as outras rotas devolvem o index.html ─────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(BUILD_DIR, "index.html"));
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ImoPro server running on port ${PORT}`);
  console.log(`   SITE_URL: ${SITE_URL}`);
  console.log(`   Supabase: ${SUPABASE_URL ? "configurado" : "⚠️  NÃO configurado"}`);
});
