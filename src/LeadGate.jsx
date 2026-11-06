import { useState } from "react";
import { saveLead, nationalPhone, maskPhone, writeUnlocked } from "./leads.js";

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";
const RED = "#DC2626";

/*
  Formulário obrigatório antes do resultado.
  ferramenta: "quiz-perfil" | "simulador-aposentadoria" | "calculadora-taxas"
  getResultado(): objeto com o resultado a gravar junto com o lead
  onUnlock(nome): chamado depois do envio (mesmo se o banco falhar, o visitante vê o resultado)
*/
export default function LeadGate({ ferramenta, titulo, subtitulo, botao = "VER MEU RESULTADO", getResultado, onUnlock }) {
  const [nome, setNome] = useState("");
  const [fone, setFone] = useState("");
  const [consent, setConsent] = useState(false);
  const [site, setSite] = useState("");
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    const numero = nationalPhone(fone);
    const novo = {};
    if (nomeLimpo.length < 2) novo.nome = "Digite seu nome.";
    if (!numero) novo.fone = "Digite o WhatsApp com DDD. Exemplo: (41) 99999-0000.";
    if (!consent) novo.consent = "Marque a autorização para ver o resultado.";
    setErros(novo);
    if (Object.keys(novo).length) return;

    if (site) { onUnlock(nomeLimpo); return; }

    setEnviando(true);
    try {
      await saveLead({
        ferramenta,
        nome: nomeLimpo.slice(0, 80),
        whatsapp: "55" + numero,
        consentimento: true,
        resultado: getResultado(),
      });
    } catch (err) {
      console.warn("Lead não salvo", err);
    }
    try { if (window.fbq) window.fbq("track", "Lead", { content_name: ferramenta }); } catch { /* sem pixel */ }
    writeUnlocked(ferramenta, nomeLimpo);
    setEnviando(false);
    onUnlock(nomeLimpo);
  };

  const input = (temErro) => ({
    width: "100%", padding: "0.85rem 1rem", fontSize: "1rem", color: NAVY,
    border: `2px solid ${temErro ? RED : "#E5E7EB"}`, borderRadius: "10px",
    background: "white", fontFamily: "'DM Sans', sans-serif", outline: "none",
  });
  const label = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: NAVY, marginBottom: "0.35rem" };
  const erro = { fontSize: "0.78rem", color: RED, marginTop: "0.35rem" };

  return (
    <div style={{ background: "white", borderRadius: "16px", padding: "1.8rem 1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)", border: `2px solid ${GOLD}40` }}>
      <div style={{ fontSize: "0.7rem", letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
        Seu resultado está pronto
      </div>
      <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "1.35rem", color: NAVY, fontWeight: 400, lineHeight: 1.3, marginBottom: "0.4rem" }}>
        {titulo}
      </h2>
      {subtitulo && <p style={{ fontSize: "0.88rem", color: "#6B7280", lineHeight: 1.55, marginBottom: "1.3rem" }}>{subtitulo}</p>}

      <form onSubmit={submit} noValidate style={{ display: "grid", gap: "1rem" }}>
        <div>
          <label htmlFor={`${ferramenta}-nome`} style={label}>Nome</label>
          <input id={`${ferramenta}-nome`} type="text" autoComplete="name" maxLength={80}
            value={nome} onChange={(e) => setNome(e.target.value)}
            aria-invalid={!!erros.nome} style={input(erros.nome)} />
          {erros.nome && <div style={erro}>{erros.nome}</div>}
        </div>

        <div>
          <label htmlFor={`${ferramenta}-whatsapp`} style={label}>WhatsApp com DDD</label>
          <input id={`${ferramenta}-whatsapp`} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20}
            placeholder="(41) 99999-0000" value={fone} onChange={(e) => setFone(maskPhone(e.target.value))}
            aria-invalid={!!erros.fone} style={input(erros.fone)} />
          {erros.fone && <div style={erro}>{erros.fone}</div>}
        </div>

        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor={`${ferramenta}-site`}>Site</label>
          <input id={`${ferramenta}-site`} type="text" tabIndex={-1} autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} />
        </div>

        <div>
          <label htmlFor={`${ferramenta}-consent`} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", cursor: "pointer", fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.5 }}>
            <input id={`${ferramenta}-consent`} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: NAVY }} />
            <span>Autorizo a Gabriel Investe a guardar estes dados e falar comigo pelo WhatsApp sobre este resultado e sobre seus serviços.</span>
          </label>
          {erros.consent && <div style={erro}>{erros.consent}</div>}
        </div>

        <button type="submit" disabled={enviando}
          style={{
            padding: "0.95rem 1.5rem", border: "none", borderRadius: "10px",
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD}DD)`, color: NAVY,
            fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.04em",
            cursor: enviando ? "wait" : "pointer", opacity: enviando ? 0.7 : 1,
            fontFamily: "'DM Sans', sans-serif",
          }}>
          {enviando ? "ABRINDO SEU RESULTADO..." : botao}
        </button>

        <p style={{ fontSize: "0.72rem", color: "#9CA3AF", lineHeight: 1.5, textAlign: "center" }}>
          Não vendemos seus dados. Para corrigir ou apagar, peça pelo WhatsApp +55 41 99881-7220.
        </p>
      </form>
    </div>
  );
}
