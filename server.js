/**
 * ImoPro – Express server com suporte a Open Graph (WhatsApp / Telegram previews)
 *
 * Lógica:
 *  - Bot/crawler visita /imovel/:id  →  devolve HTML estático com meta OG
 *  - Utilizador normal               →  serve a React SPA (index.html)
 *
 * CORRECÇÕES APLICADAS:
 *  1. Redirect JS removido da página OG — causava loop para utilizadores normais
 *  2. Detecção de bots melhorada — WhatsApp e outros crawlers reconhecidos correctamente
 *  3. Proxy de imagem robusto com fallback e headers corretos
 *  4. Cache-Control adequado para crawlers
 */

const express = require("express");
const path    = require("path");
const https   = require("https");
const http    = require("http");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Variáveis de ambiente ──────────────────────────────────────────────────
const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SITE_URL          = (process.env.REACT_APP_SITE_URL || "https://imomatch.pt").replace(/\/$/, "");

const BUILD_DIR = path.join(__dirname, "build");

// ── Detectar bots / crawlers ───────────────────────────────────────────────
// O WhatsApp envia User-Agent como "WhatsApp/2.x.x" — deve ser o PRIMEIRO a verificar
function isBot(ua = "") {
  const lower = ua.toLowerCase();
  const bots = [
    // Mensageiros (mais importantes — verificar primeiro)
    "whatsapp",
    "facebookexternalhit",
    "facebot",
    "telegrambot",
    // Redes sociais
    "twitterbot",
    "linkedinbot",
    "slackbot",
    "discordbot",
    "pinterestbot",
    "vkshare",
    // Motores de busca
    "googlebot",
    "bingbot",
    "yandexbot",
    "applebot",
    "duckduckbot",
    // Outros crawlers de preview
    "ia_archiver",
    "rogerbot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "w3c_validator",
    "redditbot",
    "ahrefsbot",
    "semrushbot",
    "iframely",
    "skypeuripreview",
    "nuzzel",
    "tumblr",
    "viber",
    "line-poker",
  ];
  return bots.some(b => lower.includes(b));
}

// ── Buscar imóvel no Supabase (sem SDK, só https nativo) ────────────────────
function fetchProperty(id) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return reject(new Error("Supabase env vars missing"));
    }

    const url = `${SUPABASE_URL}/rest/v1/properties?id=eq.${encodeURIComponent(id)}&select=id,title,price,typology,area,concelho,description,photos&limit=1`;

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

// ── Escapar HTML para meta tags ────────────────────────────────────────────
function esc(str = "") {
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/"/g,  "&quot;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/\n/g, " ");  // newlines quebram meta tags
}

// ── Gerar HTML com meta OG ─────────────────────────────────────────────────
// IMPORTANTE: NÃO incluir redirect JavaScript — o WhatsApp não executa JS
// e causaria loop para utilizadores normais.
// Os utilizadores normais são servidos pelo SPA (React) via fallback abaixo.
function buildOGHtml(property) {
  const title    = property.title    || "Imóvel";
  const price    = property.price
    ? Number(property.price).toLocaleString("pt-PT") + " €"
    : "";
  const typology = property.typology || "";
  const area     = property.area     ? `${property.area} m²` : "";
  const concelho = property.concelho || "";

  const description = property.description
    ? property.description.replace(/\n/g, " ").slice(0, 200)
    : [typology, area, concelho].filter(Boolean).join(" · ");

  // URL da imagem: usar proxy próprio para evitar bloqueios do Supabase Storage
  const photos    = property.photos || [];
  const imageUrl  = photos.length
    ? `${SITE_URL}/og-image/${encodeURIComponent(property.id)}`
    : `${SITE_URL}/og-default.png`;

  const pageUrl   = `${SITE_URL}/imovel/${encodeURIComponent(property.id)}`;
  const titleFull = price ? `${title} — ${price}` : title;
  const descFull  = [typology, area, concelho].filter(Boolean).join(" · ")
    + (description ? ` | ${description}` : "");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>

  <!-- ═══ Open Graph — WhatsApp, Facebook, Telegram, LinkedIn ═══ -->
  <meta property="og:type"         content="website"/>
  <meta property="og:site_name"    content="ImoPro"/>
  <meta property="og:url"          content="${esc(pageUrl)}"/>
  <meta property="og:title"        content="${esc(titleFull)}"/>
  <meta property="og:description"  content="${esc(descFull)}"/>
  <meta property="og:image"        content="${esc(imageUrl)}"/>
  <meta property="og:image:secure_url" content="${esc(imageUrl)}"/>
  <meta property="og:image:type"   content="image/jpeg"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:locale"       content="pt_PT"/>

  <!-- ═══ Twitter / X Card ═══ -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${esc(titleFull)}"/>
  <meta name="twitter:description" content="${esc(descFull)}"/>
  <meta name="twitter:image"       content="${esc(imageUrl)}"/>

  <!-- ═══ SEO ═══ -->
  <title>${esc(titleFull)} | ImoPro</title>
  <meta name="description" content="${esc(descFull)}"/>

  <!-- ═══ Canonical ═══ -->
  <link rel="canonical" href="${esc(pageUrl)}"/>
</head>
<body>
  <h1>${esc(titleFull)}</h1>
  <p>${esc(descFull)}</p>
  <a href="${esc(pageUrl)}">Ver imóvel completo</a>
</body>
</html>`;
}

// ── Proxy de imagem OG ─────────────────────────────────────────────────────
// Necessário porque o Supabase Storage pode bloquear crawlers externos.
// O WhatsApp crawler vai buscar esta URL directamente.
app.get("/og-image/:id", async (req, res) => {
  try {
    const property = await fetchProperty(req.params.id);
    const rawUrl   = property?.photos?.[0]?.url;

    if (!rawUrl) {
      // Sem foto → redirecionar para imagem padrão
      return res.redirect(301, `${SITE_URL}/og-default.png`);
    }

    const urlObj = new URL(rawUrl);
    const proto  = urlObj.protocol === "https:" ? https : http;

    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      headers: {
        "User-Agent": "ImoPro-OG-Proxy/1.0",
        "Accept":     "image/*",
      },
    };

    const imgReq = proto.get(options, imgRes => {
      // Seguir redirects (Supabase Storage pode redirecionar)
      if (imgRes.statusCode >= 300 && imgRes.statusCode < 400 && imgRes.headers.location) {
        return res.redirect(imgRes.headers.location);
      }

      if (imgRes.statusCode !== 200) {
        return res.redirect(301, `${SITE_URL}/og-default.png`);
      }

      res.setHeader("Content-Type",  imgRes.headers["content-type"] || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24h nos crawlers
      imgRes.pipe(res);
    });

    imgReq.on("error", () => res.redirect(301, `${SITE_URL}/og-default.png`));
    imgReq.setTimeout(8000, () => {
      imgReq.destroy();
      res.redirect(301, `${SITE_URL}/og-default.png`);
    });

  } catch (err) {
    console.error("[OG-IMAGE] Erro:", err.message);
    res.redirect(301, `${SITE_URL}/og-default.png`);
  }
});

// ── Rota de imóvel ─────────────────────────────────────────────────────────
app.get("/imovel/:id", async (req, res, next) => {
  const ua = req.headers["user-agent"] || "";

  // Utilizador normal → SPA React (index.html)
  if (!isBot(ua)) return next();

  // Bot/crawler → HTML com meta OG
  try {
    const property = await fetchProperty(req.params.id);

    if (!property) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="pt"><head>
  <meta charset="UTF-8"/>
  <meta property="og:title" content="Imóvel não encontrado | ImoPro"/>
  <title>Imóvel não encontrado | ImoPro</title>
</head><body><p>Imóvel não encontrado.</p></body></html>`);
    }

    res.setHeader("Content-Type",  "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300"); // cache 5 min
    return res.send(buildOGHtml(property));

  } catch (err) {
    console.error("[OG] Erro ao buscar imóvel:", err.message);
    return next(); // fallback → SPA
  }
});

// ── Ficheiros estáticos do React build ────────────────────────────────────
app.use(express.static(BUILD_DIR));

// ── SPA fallback ──────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(BUILD_DIR, "index.html"));
});

// ── Iniciar servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ImoPro server a correr na porta ${PORT}`);
  console.log(`   SITE_URL  : ${SITE_URL}`);
  console.log(`   Supabase  : ${SUPABASE_URL ? "✅ configurado" : "⚠️  NÃO configurado"}`);
  console.log(`   BUILD_DIR : ${BUILD_DIR}`);
});
