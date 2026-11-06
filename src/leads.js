/* Chave pública: a tabela só aceita inserção, nunca leitura. */
const SUPABASE_URL = "https://ptfrfbnkkbvqyrrbuvpp.supabase.co";
const SUPABASE_KEY = "sb_publishable_IIXdjoxZPrChq_GUg2va7Q_5rMvLRIV";

export function trackingData() {
  const q = new URLSearchParams(window.location.search);
  return {
    utm_source: q.get("utm_source"),
    utm_medium: q.get("utm_medium"),
    utm_campaign: q.get("utm_campaign"),
    utm_content: q.get("utm_content"),
    referrer: document.referrer ? document.referrer.slice(0, 500) : null,
  };
}

export async function saveLead(row) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads_ferramentas`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ ...row, ...trackingData() }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  } finally {
    clearTimeout(timer);
  }
}

/* Aceita DDD + número (10 ou 11 dígitos), com ou sem 55. Devolve o número nacional ou null. */
export function nationalPhone(text) {
  let d = String(text).replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  if (Number(d.slice(0, 2)) < 11) return null;
  if (d.length === 11 && d.charAt(2) !== "9") return null;
  return d;
}

export function maskPhone(text) {
  const d = String(text).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  const cut = d.length === 11 ? 7 : 6;
  if (d.length <= cut) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, cut)}-${d.slice(cut)}`;
}

const KEY = "gi_lead_liberado";

export function readUnlocked(ferramenta) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    return saved[ferramenta] || null;
  } catch {
    return null;
  }
}

export function writeUnlocked(ferramenta, nome) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    saved[ferramenta] = { nome };
    window.localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* navegador sem armazenamento: só pede de novo na próxima visita */
  }
}
