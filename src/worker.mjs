import tls from "node:tls";
import { Buffer } from "node:buffer";
import { generateKeyPairSync } from "node:crypto";

const API_HOST = "api.cloudflareclient.com";
const API_VERSION = "v0a5641";
const USER_AGENT = "1.1.1.1/6.38.9-5641 (Android 16.0.0)";
const CLIENT_VERSION = "a-6.38.9-5641";
const DEVICE_MODEL = "Fire TV Stick 4K Max 2nd Gen";
const DEVICE_NAME = "Fire TV Stick 4K Max 2nd Gen";
const KEEPALIVE = 25;
const RATE_LIMIT_SECONDS = 45;
const MAX_BODY = 32 * 1024;
const BUILD = "worker-fix-1.1";

const html = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>WARP Config Generator</title>
  <style>
    :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#090b10;color:#f4f6fb}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 20% 0%,rgba(90,113,255,.20),transparent 35%),radial-gradient(circle at 90% 90%,rgba(246,130,31,.15),transparent 35%),#090b10}
    .card{width:min(100%,560px);padding:38px;border:1px solid #242a38;border-radius:24px;background:rgba(16,19,27,.94);box-shadow:0 30px 80px rgba(0,0,0,.45)}
    .badge{display:inline-block;padding:6px 10px;border:1px solid #343b4c;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.12em;color:#b8c1d8}
    h1{margin:16px 0 8px;font-size:clamp(30px,7vw,44px);line-height:1.03}.intro{margin:0 0 24px;color:#aeb6c8;font-size:17px;line-height:1.55}
    .notice{display:grid;gap:4px;padding:16px;margin-bottom:20px;border:1px solid #283044;border-radius:14px;background:#121722}.notice span{color:#aeb6c8;font-size:14px;line-height:1.45}
    .terms{display:flex;align-items:flex-start;gap:12px;color:#c9cfda;font-size:14px;line-height:1.5;cursor:pointer}.terms input{margin-top:4px;width:18px;height:18px;accent-color:#7084ff}
    button{width:100%;margin-top:22px;padding:15px 18px;border:0;border-radius:12px;background:#f6821f;color:#111318;font:inherit;font-weight:800;cursor:pointer}button:hover:not(:disabled){filter:brightness(1.08)}button:disabled{opacity:.45;cursor:not-allowed}
    .status{min-height:24px;margin:16px 0 0;text-align:center;font-size:14px}.working{color:#b9c3ff}.success{color:#81e6b1}.error{color:#ff8f98}
    .small{margin:24px 0 0;color:#818a9d;font-size:13px;line-height:1.5;text-align:center}.links{margin:12px 0 0;text-align:center;font-size:13px}a{color:#aebcff}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}@media(max-width:520px){.card{padding:26px 20px;border-radius:18px}}
  </style>
</head>
<body>
  <main class="card">
    <div class="badge">WIREGUARD</div>
    <h1>WARP Config Generator</h1>
    <p class="intro">Create a fresh Cloudflare WARP WireGuard configuration for your device.</p>
    <div class="notice"><strong>Generated in memory</strong><span>This site does not save the generated WireGuard private key or profile to application storage.</span></div>
    <label class="terms"><input id="terms" type="checkbox"><span>I agree to Cloudflare’s applicable Terms of Service and understand this is an unofficial, non-affiliated generator.</span></label>
    <button id="generate" type="button" disabled>Create &amp; Download Config</button>
    <p id="status" class="status" aria-live="polite"></p>
    <p class="small">Each click creates a new WARP registration. Use the downloaded <code>.conf</code> file with a compatible WireGuard client.</p>
    <p class="links"><a href="https://www.cloudflare.com/application/terms/" target="_blank" rel="noreferrer">Cloudflare Terms</a> · <a href="https://github.com/ViRb3/wgcf" target="_blank" rel="noreferrer">wgcf reference implementation</a></p>
  </main>
  <script>
    const terms=document.querySelector('#terms'),button=document.querySelector('#generate'),status=document.querySelector('#status');
    terms.addEventListener('change',()=>button.disabled=!terms.checked);
    button.addEventListener('click',async()=>{
      if(!terms.checked)return;button.disabled=true;terms.disabled=true;status.className='status working';status.textContent='Creating your fresh WARP configuration…';
      try{
        const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({acceptTerms:true})});
        if(!response.ok){let message='Could not create the configuration.';try{const data=await response.json();if(data?.error)message=data.error}catch{}throw new Error(message)}
        const blob=await response.blob();const disposition=response.headers.get('content-disposition')||'';const match=disposition.match(/filename="([^"]+)"/i);const filename=match?.[1]||'wgcf-profile.conf';
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
        status.className='status success';status.textContent='Done — your config has been downloaded.';
      }catch(err){status.className='status error';status.textContent=err?.message||'Something went wrong.'}finally{terms.disabled=false;button.disabled=!terms.checked}
    });
  </script>
</body>
</html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "public, max-age=300",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          "content-security-policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, apiVersion: API_VERSION, build: BUILD });
    }

    if (request.method === "POST" && url.pathname === "/api/generate") {
      return generateHandler(request, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function generateHandler(request, ctx) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY) return jsonError("Request too large.", 413);

    let body;
    try { body = await request.json(); } catch { return jsonError("Invalid request.", 400); }
    if (body?.acceptTerms !== true) return jsonError("You must accept Cloudflare's applicable Terms of Service first.", 400);

    const limited = await basicRateLimit(request, ctx);
    if (limited) return jsonError(`Please wait ${RATE_LIMIT_SECONDS} seconds before creating another configuration.`, 429);

    const { privateKey, publicKey } = makeWireGuardKeys();
    const registration = await warpRequest("POST", `/${API_VERSION}/reg`, {
      install_id: "",
      fcm_token: "",
      key: publicKey,
      locale: "en_US",
      model: DEVICE_MODEL,
      tos: new Date().toISOString(),
      serial_number: "",
      os_version: "16.0.0",
      key_type: "curve25519",
      tunnel_type: "wireguard",
    });

    const deviceId = registration?.id;
    const token = registration?.token;
    if (!deviceId || !token) throw new WarpError("Cloudflare returned an incomplete registration response.", 502);

    // Current WARP registration responses normally include the WireGuard config.
    // Using it directly avoids two extra API calls, which makes Workers much more
    // reliable and reduces the chance of registration throttling. Fall back to a
    // GET only if Cloudflare omits the config.
    let config = registration?.config;
    if (!config) {
      const device = await warpRequest("GET", `/${API_VERSION}/reg/${encodeURIComponent(deviceId)}`, null, token);
      config = device?.config;
    }

    // Naming the device is cosmetic. Do it in the background and never allow a
    // failed name update to prevent the customer receiving a usable profile.
    ctx.waitUntil(
      warpRequest("PATCH", `/${API_VERSION}/reg/${encodeURIComponent(deviceId)}`, { name: DEVICE_NAME }, token).catch(() => {})
    );
    const iface = config?.interface;
    const peer = config?.peers?.[0];
    const v4 = iface?.addresses?.v4;
    const v6 = iface?.addresses?.v6;
    const peerKey = peer?.public_key;
    const endpoint = getEndpoint(peer?.endpoint);

    if (!v4 || !v6 || !peerKey || !endpoint) {
      throw new WarpError("Cloudflare did not return a complete WireGuard configuration.", 502);
    }

    const profile = buildProfile({ privateKey, v4, v6, peerKey, endpoint, keepalive: KEEPALIVE });
    return new Response(profile, {
      status: 200,
      headers: {
        "content-type": "application/octet-stream",
        "content-disposition": 'attachment; filename="wgcf-profile.conf"',
        "cache-control": "no-store, no-cache, must-revalidate",
        "pragma": "no-cache",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    console.error("WARP generation error", err);
    if (err instanceof WarpError) return jsonError(err.message, err.status);
    return jsonError(`Could not create the WARP configuration: ${safeError(err)}`, 500);
  }
}

async function basicRateLimit(request, ctx) {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip || typeof caches === "undefined" || !caches.default) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  const key = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  const cacheUrl = new URL(request.url);
  cacheUrl.pathname = `/__rate/${key}`;
  cacheUrl.search = "";
  const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
  if (await caches.default.match(cacheKey)) return true;
  ctx.waitUntil(caches.default.put(cacheKey, new Response("1", { headers: { "cache-control": `public, max-age=${RATE_LIMIT_SECONDS}` } })));
  return false;
}

export function makeWireGuardKeys() {
  const { publicKey, privateKey } = generateKeyPairSync("x25519");
  const privateJwk = privateKey.export({ format: "jwk" });
  const publicJwk = publicKey.export({ format: "jwk" });
  return {
    privateKey: base64UrlToBase64(privateJwk.d),
    publicKey: base64UrlToBase64(publicJwk.x),
  };
}

function base64UrlToBase64(value) {
  return Buffer.from(value, "base64url").toString("base64");
}

export function buildProfile({ privateKey, v4, v6, peerKey, endpoint, keepalive = 25 }) {
  return `[Interface]\nPrivateKey = ${privateKey}\nAddress = ${stripCidr(v4)}/32, ${stripCidr(v6)}/128\nDNS = 1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001\nMTU = 1280\n\n[Peer]\nPublicKey = ${peerKey}\nAllowedIPs = 0.0.0.0/0, ::/0\nEndpoint = ${endpoint}\nPersistentKeepalive = ${keepalive}\n`;
}

function stripCidr(value) { return String(value).split("/")[0]; }

export function getEndpoint(endpoint) {
  if (!endpoint) return null;
  if (endpoint.host) return endpoint.host;
  const raw = endpoint.v4 || endpoint.v6;
  if (!raw) return null;
  const port = Array.isArray(endpoint.ports) && endpoint.ports.length ? endpoint.ports[0] : 2408;
  const host = removePort(raw);
  return host.includes(":") ? `[${host}]:${port}` : `${host}:${port}`;
}

function removePort(value) {
  const s = String(value);
  if (s.startsWith("[")) {
    const close = s.indexOf("]");
    return close > 0 ? s.slice(1, close) : s;
  }
  const colonCount = (s.match(/:/g) || []).length;
  if (colonCount === 1) return s.split(":")[0];
  return s;
}

async function warpRequest(method, path, jsonBody = null, bearer = null) {
  const body = jsonBody == null ? "" : JSON.stringify(jsonBody);
  let response;
  let rawFailure = null;

  // First try node:tls. With the Wrangler compatibility flag in this fixed
  // build, Workers ignores TLS knobs it cannot implement instead of throwing.
  // The options it does support move the handshake closer to wgcf's TLS 1.2
  // Android profile.
  try {
    response = await rawTlsHttp(makeRawHttpRequest(method, path, body, jsonBody != null, bearer));
  } catch (err) {
    rawFailure = err;
  }

  // A standard Worker fetch has a different TLS stack. It is worth trying when
  // the raw socket path is rejected (403) or unavailable in a particular POP.
  if (!response || response.status === 403) {
    try {
      const fallback = await workerFetchHttp(method, path, body, jsonBody != null, bearer);
      if (!response || fallback.status !== 403) response = fallback;
    } catch (err) {
      if (!response) {
        throw new WarpError(`WARP connection failed before a response was received: ${safeError(rawFailure || err)}`, 502);
      }
    }
  }

  if (!response) {
    throw new WarpError(`WARP connection failed before a response was received: ${safeError(rawFailure)}`, 502);
  }

  let parsed = null;
  if (response.body.length) {
    try { parsed = JSON.parse(response.body.toString("utf8")); } catch {}
  }

  if (response.status >= 200 && response.status < 300) return parsed ?? {};
  if (response.status === 429) throw new WarpError("Cloudflare is temporarily rate-limiting new WARP registrations. Please try again later.", 429);
  if (response.status === 403) {
    const hint = extractWarpErrorHint(response.body);
    throw new WarpError(`Cloudflare WARP rejected the Worker connection (HTTP 403${hint ? `: ${hint}` : ""}). This build has tried both available Worker TLS paths.`, 502);
  }
  if (response.status >= 400 && response.status < 500) {
    const hint = extractWarpErrorHint(response.body);
    throw new WarpError(`Cloudflare refused the registration request (HTTP ${response.status}${hint ? `: ${hint}` : ""}).`, 502);
  }
  throw new WarpError(`Cloudflare WARP API error (HTTP ${response.status}).`, 502);
}

function makeRawHttpRequest(method, path, body, hasJsonBody, bearer) {
  const bodyBytes = Buffer.byteLength(body, "utf8");
  const headers = [
    `Host: ${API_HOST}`,
    `User-Agent: ${USER_AGENT}`,
    `CF-Client-Version: ${CLIENT_VERSION}`,
    "Connection: Keep-Alive",
  ];
  if (bearer) headers.push(`Authorization: Bearer ${bearer}`);
  if (hasJsonBody) {
    headers.push("Content-Type: application/json; charset=UTF-8");
    headers.push(`Content-Length: ${bodyBytes}`);
  }
  return `${method} ${path} HTTP/1.1\r\n${headers.join("\r\n")}\r\n\r\n${body}`;
}

async function workerFetchHttp(method, path, body, hasJsonBody, bearer) {
  const headers = new Headers();
  headers.set("User-Agent", USER_AGENT);
  headers.set("CF-Client-Version", CLIENT_VERSION);
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  if (hasJsonBody) headers.set("Content-Type", "application/json; charset=UTF-8");

  const r = await fetch(`https://${API_HOST}${path}`, {
    method,
    headers,
    body: hasJsonBody ? body : undefined,
    redirect: "manual",
  });
  const bytes = Buffer.from(await r.arrayBuffer());
  return { status: r.status, headers: new Map(r.headers), body: bytes };
}

function extractWarpErrorHint(body) {
  if (!body?.length) return "";
  const text = body.toString("utf8").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const code = text.match(/(?:error\s*)?(?:code\s*)?[:#]?\s*(10\d{2})\b/i)?.[1];
  if (code) return `Cloudflare error ${code}`;
  if (/access denied/i.test(text)) return "access denied";
  return "";
}

function safeError(err) {
  if (!err) return "unknown error";
  const code = typeof err.code === "string" ? `${err.code}: ` : "";
  const msg = String(err.message || err).replace(/[\r\n\t]+/g, " ").slice(0, 240);
  return `${code}${msg}`;
}

async function rawTlsHttp(rawRequest) {
  const optionSets = [
    {
      host: API_HOST,
      port: 443,
      servername: API_HOST,
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.2",
      ciphers: "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384",
      ecdhCurve: "X25519:P-256:P-384",
      sigalgs: "ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512:rsa_pkcs1_sha1",
      ALPNProtocols: ["http/1.1"],
    },
    {
      host: API_HOST,
      port: 443,
      servername: API_HOST,
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.2",
      ALPNProtocols: ["http/1.1"],
    },
  ];

  let lastErr;
  for (const opts of optionSets) {
    try { return await socketRequest(opts, rawRequest); } catch (err) {
      lastErr = err;
      if (!looksLikeUnsupportedTlsOption(err)) throw err;
    }
  }
  throw lastErr || new Error("TLS connection failed");
}

function looksLikeUnsupportedTlsOption(err) {
  const text = String(err?.code || "") + " " + String(err?.message || "");
  return /OPTION_NOT_IMPLEMENTED|not implemented|unsupported option/i.test(text);
}

function socketRequest(options, rawRequest) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let socket;
    let received = Buffer.alloc(0);
    const timeout = setTimeout(() => finish(new Error("WARP API connection timed out.")), 12000);

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try { socket?.destroy(); } catch {}
      err ? reject(err) : resolve(result);
    };

    try {
      socket = tls.connect(options, () => {
        try { socket.write(rawRequest); } catch (err) { finish(err); }
      });
    } catch (err) {
      finish(err);
      return;
    }

    socket.on("data", (chunk) => {
      received = Buffer.concat([received, Buffer.from(chunk)]);
      try {
        const result = parseHttpResponseIfComplete(received);
        if (result) finish(null, result);
      } catch (err) { finish(err); }
    });
    socket.on("error", (err) => finish(err));
    socket.on("end", () => {
      if (settled) return;
      try {
        const result = parseHttpResponseIfComplete(received, true);
        result ? finish(null, result) : finish(new Error("Incomplete WARP API response."));
      } catch (err) { finish(err); }
    });
  });
}

export function parseHttpResponseIfComplete(buffer, ended = false) {
  const marker = buffer.indexOf("\r\n\r\n");
  if (marker < 0) return ended ? null : null;
  const headerText = buffer.subarray(0, marker).toString("latin1");
  const lines = headerText.split("\r\n");
  const statusMatch = lines.shift()?.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})/i);
  if (!statusMatch) throw new Error("Invalid HTTP response from WARP API.");
  const headers = new Map();
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > 0) headers.set(line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim());
  }
  const rawBody = buffer.subarray(marker + 4);
  const transfer = (headers.get("transfer-encoding") || "").toLowerCase();
  if (transfer.includes("chunked")) {
    const decoded = decodeChunked(rawBody);
    if (!decoded.complete) return ended ? null : null;
    return { status: Number(statusMatch[1]), headers, body: decoded.body };
  }
  const lengthHeader = headers.get("content-length");
  if (lengthHeader != null) {
    const length = Number(lengthHeader);
    if (!Number.isFinite(length) || length < 0) throw new Error("Invalid Content-Length from WARP API.");
    if (rawBody.length < length) return ended ? null : null;
    return { status: Number(statusMatch[1]), headers, body: rawBody.subarray(0, length) };
  }
  if (!ended) return null;
  return { status: Number(statusMatch[1]), headers, body: rawBody };
}

function decodeChunked(buffer) {
  let pos = 0;
  const chunks = [];
  while (true) {
    const lineEnd = buffer.indexOf("\r\n", pos);
    if (lineEnd < 0) return { complete: false };
    const sizeText = buffer.subarray(pos, lineEnd).toString("ascii").split(";", 1)[0].trim();
    const size = parseInt(sizeText, 16);
    if (!Number.isFinite(size)) throw new Error("Invalid chunked response from WARP API.");
    pos = lineEnd + 2;
    if (size === 0) {
      if (buffer.length < pos + 2) return { complete: false };
      return { complete: true, body: Buffer.concat(chunks) };
    }
    if (buffer.length < pos + size + 2) return { complete: false };
    chunks.push(buffer.subarray(pos, pos + size));
    pos += size;
    if (buffer.subarray(pos, pos + 2).toString("ascii") !== "\r\n") throw new Error("Invalid chunk terminator from WARP API.");
    pos += 2;
  }
}

class WarpError extends Error {
  constructor(message, status = 500) { super(message); this.status = status; }
}

function jsonError(message, status) {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}
