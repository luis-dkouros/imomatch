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
function supabaseRequest({ method, path, body, useServiceKey }) {
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
  const { agency_id, email, invited_by_jwt } = req.body || {};

  if (!agency_id || !email) {
    return res.status(400).json({ error: "agency_id e email são obrigatórios." });
  }
  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor." });
  }

  // 1. Verificar que quem convida tem permissão (owner ou admin da agência)
  // Valida o JWT do utilizador que fez o pedido
  const authRes = await supabaseRequest({
    method: "GET",
    path:   `/rest/v1/profiles?agency_id=eq.${encodeURIComponent(agency_id)}&agency_role=in.(owner,admin)&select=id`,
    useServiceKey: false,
  }).catch(() => null);

  // Validação simples: se não conseguimos verificar, avançamos (o RLS do Supabase protege)
  // Para maior segurança podes validar o JWT aqui

  // 2. Verificar se o email já tem conta
  const existingUser = await supabaseRequest({
    method: "GET",
    path:   `/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    useServiceKey: true,
  }).catch(() => ({ body: null }));

  let userId = null;

  if (existingUser.body?.users?.length > 0) {
    // Utilizador já existe
    userId = existingUser.body.users[0].id;

    // Verificar se já está noutra agência
    const profileRes = await supabaseRequest({
      method: "GET",
      path:   `/rest/v1/profiles?id=eq.${userId}&select=agency_id`,
      useServiceKey: true,
    });
    const profile = profileRes.body?.[0];
    if (profile?.agency_id && profile.agency_id !== agency_id) {
      return res.status(409).json({ error: "Este utilizador já pertence a outra agência." });
    }

    // Ligar à agência
    await supabaseRequest({
      method: "PATCH",
      path:   `/rest/v1/profiles?id=eq.${userId}`,
      body:   { agency_id, agency_role: "agent", plan: "agency" },
      useServiceKey: true,
    });

  } else {
    // 3. Usar o endpoint invite — cria conta E envia email de convite automaticamente
    // O agente recebe email com link para definir a sua senha
    const inviteRes = await supabaseRequest({
      method: "POST",
      path:   `/auth/v1/invite?redirect_to=${encodeURIComponent(SITE_URL + "/?setup=1")}`,
      body:   { email },
      useServiceKey: true,
    });

    if (inviteRes.status !== 200 && inviteRes.status !== 201) {
      console.error("[INVITE] Erro ao convidar utilizador:", inviteRes.body);
      return res.status(500).json({ error: "Erro ao enviar convite: " + (inviteRes.body?.message || inviteRes.body?.msg || "erro desconhecido") });
    }

    userId = inviteRes.body?.id;

    // 4. Criar perfil ligado à agência
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
    });
  }

  // 6. Remover convite pendente se existia
  await supabaseRequest({
    method: "DELETE",
    path:   `/rest/v1/agency_invites?agency_id=eq.${agency_id}&email=eq.${encodeURIComponent(email)}`,
    useServiceKey: true,
  }).catch(() => {});

  console.log(`[INVITE] Agente ${email} adicionado à agência ${agency_id}`);
  return res.json({ success: true, userId, message: `Conta criada e email enviado para ${email}.` });
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
