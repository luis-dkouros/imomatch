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

// Helper: executar SQL directo (bypassa RLS)
function supabaseSQL(sql) {
  return new Promise((resolve, reject) => {
    const key  = SUPABASE_SERVICE_KEY;
    const data = JSON.stringify({ query: sql });
    const urlObj = new URL(SUPABASE_URL + "/rest/v1/rpc/exec_sql");
    // Usar endpoint de query directo
    const pgUrl = new URL(SUPABASE_URL.replace("https://", "https://") + "/rest/v1/");
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path:     "/rest/v1/rpc/exec_sql",
      method:   "POST",
      headers: {
        apikey:         key,
        Authorization:  `Bearer ${key}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = https.request(options, res => {
      let buf = "";
      res.on("data", c => (buf += c));
      res.on("end", () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

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
    // NOTA: /auth/v1/admin/users?email=X ignora o filtro — carregar todos e filtrar em código
    const existingRes = await supabaseRequest({
      method: "GET",
      path:   `/auth/v1/admin/users?page=1&per_page=1000`,
      useServiceKey: true,
    });
    const allUsers = existingRes.body?.users || [];
    const existingUser = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase().trim()) || null;
    console.log(`[INVITE] Procurar ${email} em ${allUsers.length} utilizadores → ${existingUser ? 'FOUND ' + existingUser.id : 'NOT FOUND'}`);

    let userId;

    if (existingUser) {
      // ── Utilizador já tem conta ──────────────────────────────────────────
      userId = existingUser.id;

      // Verificar se já está noutra agência
      const profileRes = await supabaseRequest({
        method: "GET",
        path:   `/rest/v1/profiles?id=eq.${userId}&select=agency_id`,
        useServiceKey: true,
      });
      const p = profileRes.body?.[0];
      if (p?.agency_id && p.agency_id !== agency_id) {
        return res.status(409).json({ error: "Este utilizador já pertence a outra agência." });
      }

      // Actualizar perfil com dados da agência
      // service_role bypassa RLS — se ainda assim falhar, usamos upsert
      const patchRes = await supabaseRequest({
        method: "PATCH",
        path:   `/rest/v1/profiles?id=eq.${userId}`,
        body:   { agency_id, agency_role: "agent", plan: "agency" },
        useServiceKey: true,
        extraHeaders:  { Prefer: "return=representation" },
      });
      console.log(`[INVITE] PATCH response: ${patchRes.status}`, JSON.stringify(patchRes.body));

      // Se PATCH não actualizou nenhuma linha, fazer upsert
      const updated = Array.isArray(patchRes.body) ? patchRes.body.length > 0 : !!patchRes.body;
      if (!updated) {
        console.log(`[INVITE] PATCH sem resultado — upsert`);
        const upsertRes = await supabaseRequest({
          method: "POST",
          path:   "/rest/v1/profiles",
          body:   { id: userId, name: email.split("@")[0], agency_id, agency_role: "agent", plan: "agency" },
          useServiceKey: true,
          extraHeaders:  { Prefer: "return=representation,resolution=merge-duplicates" },
        });
        console.log(`[INVITE] Upsert response: ${upsertRes.status}`, JSON.stringify(upsertRes.body));
      }

      console.log(`[INVITE] Utilizador existente ${email} vinculado à agência ${agency_id}`);

    } else {
      // ── Utilizador sem conta — criar com metadados ───────────────────────
      // O trigger handle_new_user() vai ler estes metadados e criar o perfil
      // directamente com plan=agency, agency_id e agency_role correctos
      const createRes = await supabaseRequest({
        method: "POST",
        path:   "/auth/v1/admin/users",
        body: {
          email,
          email_confirm: true,
          password: Math.random().toString(36).slice(2,10) + "Aa1!",
          user_metadata: {
            name: email.split("@")[0],
          },
        },
        useServiceKey: true,
      });

      console.log(`[INVITE] CREATE response: ${createRes.status}`, JSON.stringify(createRes.body));
      if (createRes.status !== 200 && createRes.status !== 201) {
        const errMsg = createRes.body?.message || createRes.body?.error_description || createRes.body?.msg || JSON.stringify(createRes.body);
        console.error("[INVITE] Erro ao criar conta:", errMsg);
        return res.status(500).json({ error: "Erro ao criar conta: " + errMsg });
      }

      userId = createRes.body?.id;
      console.log(`[INVITE] Nova conta criada para ${email} (${userId})`);

      // Actualizar perfil com dados da agência (o trigger cria o perfil básico, nós actualizamos)
      await new Promise(r => setTimeout(r, 500)); // aguardar trigger
      const newPatchRes = await supabaseRequest({
        method: "PATCH",
        path:   `/rest/v1/profiles?id=eq.${userId}`,
        body:   { agency_id, agency_role: "agent", plan: "agency" },
        useServiceKey: true,
        extraHeaders:  { Prefer: "return=representation" },
      });
      console.log(`[INVITE] Perfil actualizado: ${newPatchRes.status}`, JSON.stringify(newPatchRes.body));
    }

    // Aguardar propagação antes de gerar link (necessário para contas novas)
    await new Promise(r => setTimeout(r, 1500));

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

    // Enviar email personalizado via Resend
    if (process.env.RESEND_API_KEY) {
      // Gerar link de convite com redirect para a app
      const linkRes = await supabaseRequest({
        method: "POST",
        path:   "/auth/v1/admin/generate_link",
        body: {
          type:  "recovery",
          email,
          options: { redirect_to: `${SITE_URL}/?set-password=1` },
        },
        useServiceKey: true,
      });
      console.log("[INVITE] generate_link response:", JSON.stringify(linkRes.body));
      // O link está em properties.action_link
      const actionLink = linkRes.body?.properties?.action_link
        || linkRes.body?.action_link
        || `${SITE_URL}/?set-password=1`;

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
      ${ag.logo_url ? `<img src="${ag.logo_url}" height="48" style="margin-bottom:16px;border-radius:8px;background:#fff;padding:4px;display:block"/>` : `<div style="font-size:28px;margin-bottom:12px">🏢</div>`}
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

// ── Definir senha inicial (agentes convidados) ──────────────────────────────
app.post("/api/agencies/set-initial-password", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email e password são obrigatórios." });
  if (password.length < 6) return res.status(400).json({ error: "Password deve ter mínimo 6 caracteres." });

  try {
    // Procurar o utilizador pelo email — admin/users não filtra por email, precisamos de iterar
    // Usar a tabela de identities do Supabase que tem email indexado
    const usersRes = await supabaseRequest({
      method: "GET",
      path: `/auth/v1/admin/users?page=1&per_page=1000`,
      useServiceKey: true,
    });
    const allUsers = usersRes.body?.users || [];
    const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: "Email não encontrado." });
    console.log(`[SET-PASSWORD] Utilizador encontrado: ${user.email} (${user.id})`);

    const profileRes = await supabaseRequest({
      method: "GET",
      path: `/rest/v1/profiles?id=eq.${user.id}&select=plan,agency_id`,
      useServiceKey: true,
    });
    const profile = profileRes.body?.[0];
    if (!profile?.agency_id) return res.status(403).json({ error: "Este email não pertence a nenhuma agência." });

    // Definir a senha via admin API
    const updateRes = await supabaseRequest({
      method: "PUT",
      path: `/auth/v1/admin/users/${user.id}`,
      body: { password },
      useServiceKey: true,
    });
    console.log(`[SET-PASSWORD] PUT response: ${updateRes.status}`, JSON.stringify(updateRes.body));

    if (updateRes.status !== 200) {
      // Tentar com PATCH se PUT falhou
      const patchRes = await supabaseRequest({
        method: "PATCH",
        path: `/auth/v1/admin/users/${user.id}`,
        body: { password },
        useServiceKey: true,
      });
      console.log(`[SET-PASSWORD] PATCH response: ${patchRes.status}`, JSON.stringify(patchRes.body));
      if (patchRes.status !== 200) {
        return res.status(500).json({ error: "Erro ao definir senha: " + (patchRes.body?.message || updateRes.body?.message || "erro desconhecido") });
      }
    }

    console.log(`[SET-PASSWORD] Senha definida para ${email}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[SET-PASSWORD] Erro:", err);
    res.status(500).json({ error: "Erro interno." });
  }
});


// ── Remover agente da agência ────────────────────────────────────────────────
app.post("/api/agencies/remove-agent", async (req, res) => {
  const { member_id, agency_id } = req.body || {};
  if (!member_id || !agency_id) return res.status(400).json({ error: "member_id e agency_id são obrigatórios." });
  try {
    const r = await supabaseRequest({
      method: "PATCH",
      path:   `/rest/v1/profiles?id=eq.${member_id}&agency_id=eq.${agency_id}`,
      body:   { agency_id: null, agency_role: null, plan: "pending" },
      useServiceKey: true,
      extraHeaders: { Prefer: "return=representation" },
    });
    console.log(`[REMOVE-AGENT] ${member_id} removido da agência ${agency_id}: ${r.status}`);
    if (r.status === 200 || r.status === 204) return res.json({ ok: true });
    return res.status(500).json({ error: "Erro ao remover: " + JSON.stringify(r.body) });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ ImoPro server running on port ${PORT}`);
  console.log(`   SITE_URL: ${SITE_URL}`);
  console.log(`   Supabase: ${SUPABASE_URL ? "configurado" : "⚠️  NÃO configurado"}`);
});
