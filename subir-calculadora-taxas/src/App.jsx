import { useState, useEffect, useRef } from "react";
import LeadGate from "./LeadGate.jsx";
import { readUnlocked } from "./leads.js";

const GOLD = "#C9A84C";
const NAVY = "#0D1B2A";
const TEAL = "#2EC4B6";
const RED = "#DC2626";
const LIGHT = "#F8F7F4";

function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function AnimatedNumber({ value, color = NAVY, size = "2rem" }) {
  const [displayed, setDisplayed] = useState(value);
  useEffect(() => {
    const start = displayed;
    const diff = value - start;
    if (Math.abs(diff) < 1) { setDisplayed(value); return; }
    const duration = 600;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span style={{ color, fontSize: size, fontWeight: 800, fontFamily: "'DM Serif Display', Georgia, serif", letterSpacing: "-0.02em" }}>
      {formatBRL(displayed)}
    </span>
  );
}

function Slider({ label, value, onChange, min, max, step, format, icon, sublabel }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: "1.8rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", color: "#6B7280", fontWeight: "500", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>
          {icon} {label}
        </span>
        <span style={{ fontSize: "1.15rem", fontWeight: "700", color: NAVY, fontFamily: "'DM Serif Display', Georgia, serif" }}>
          {format(value)}
        </span>
      </div>
      {sublabel && <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginBottom: "0.4rem", fontFamily: "'DM Sans', sans-serif" }}>{sublabel}</div>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: "6px", appearance: "none", borderRadius: "3px",
          background: `linear-gradient(to right, ${TEAL} 0%, ${GOLD} ${pct}%, #E5E7EB ${pct}%, #E5E7EB 100%)`,
          cursor: "pointer", outline: "none",
        }}
      />
    </div>
  );
}

function MiniChart({ dataConsultor, dataAssessor, years }) {
  const w = 400, h = 180, pad = 40;
  const maxVal = Math.max(...dataConsultor, ...dataAssessor);
  const minVal = Math.min(...dataConsultor, ...dataAssessor) * 0.9;
  const range = maxVal - minVal || 1;
  const toX = (i) => pad + (i / years) * (w - pad * 2);
  const toY = (v) => h - pad - ((v - minVal) / range) * (h - pad * 2);

  const pathC = dataConsultor.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const pathA = dataAssessor.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", maxWidth: "420px" }}>
      <defs>
        <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TEAL} stopOpacity="0.25" />
          <stop offset="100%" stopColor={TEAL} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={RED} stopOpacity="0.15" />
          <stop offset="100%" stopColor={RED} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
        const y = pad + (h - pad * 2) * (1 - pct);
        const val = minVal + range * pct;
        return (
          <g key={i}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
            <text x={pad - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#9CA3AF" fontFamily="DM Sans, sans-serif">
              {val >= 1e6 ? `${(val/1e6).toFixed(1)}M` : `${(val/1e3).toFixed(0)}k`}
            </text>
          </g>
        );
      })}
      {Array.from({ length: years + 1 }, (_, i) => i).filter(i => i % 5 === 0 || i === years).map(i => (
        <text key={i} x={toX(i)} y={h - pad + 14} textAnchor="middle" fontSize="7" fill="#9CA3AF" fontFamily="DM Sans, sans-serif">{i}a</text>
      ))}
      <path d={pathC + ` L${toX(years)},${h - pad} L${toX(0)},${h - pad} Z`} fill="url(#gradC)" />
      <path d={pathA + ` L${toX(years)},${h - pad} L${toX(0)},${h - pad} Z`} fill="url(#gradA)" />
      <path d={pathA} fill="none" stroke={RED} strokeWidth="2" strokeDasharray="6,3" opacity="0.7" />
      <path d={pathC} fill="none" stroke={TEAL} strokeWidth="2.5" />
      <circle cx={toX(years)} cy={toY(dataConsultor[years])} r="4" fill={TEAL} stroke="white" strokeWidth="1.5" />
      <circle cx={toX(years)} cy={toY(dataAssessor[years])} r="4" fill={RED} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export default function App() {
  const [patrimonio, setPatrimonio] = useState(500000);
  const [aporte, setAporte] = useState(3000);
  const [taxaAssessor, setTaxaAssessor] = useState(2.0);
  const [taxaConsultor, setTaxaConsultor] = useState(1.0);
  const [horizonte, setHorizonte] = useState(20);
  const [retornoBruto, setRetornoBruto] = useState(12);
  const [showCTA, setShowCTA] = useState(false);
  const [lead, setLead] = useState(() => readUnlocked("calculadora-taxas"));

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const calcProjection = (taxaAnual) => {
    const retLiq = (retornoBruto - taxaAnual) / 100;
    const retMensal = Math.pow(1 + retLiq, 1/12) - 1;
    const meses = horizonte * 12;
    let acc = patrimonio;
    const data = [patrimonio];
    for (let m = 1; m <= meses; m++) {
      acc = acc * (1 + retMensal) + aporte;
      if (m % 12 === 0) data.push(acc);
    }
    return data;
  };

  const dataConsultor = calcProjection(taxaConsultor);
  const dataAssessor = calcProjection(taxaAssessor);
  const finalConsultor = dataConsultor[horizonte];
  const finalAssessor = dataAssessor[horizonte];
  const perdaTotal = finalConsultor - finalAssessor;
  const perdaPct = (perdaTotal / finalConsultor) * 100;
  const totalInvestido = patrimonio + aporte * 12 * horizonte;

  return (
    <div style={{ minHeight: "100vh", background: LIGHT, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: 0, margin: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${LIGHT}; }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none; width: 22px; height: 22px; border-radius: 50%;
          background: ${NAVY}; border: 3px solid ${GOLD}; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: transform 0.15s;
        }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.15); }
        input[type="range"]::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%; border: 3px solid ${GOLD};
          background: ${NAVY}; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", background: NAVY, padding: "1.2rem 1rem", textAlign: "center", borderBottom: `3px solid ${GOLD}` }}>
        <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: GOLD, textTransform: "uppercase", marginBottom: "0.3rem", fontWeight: "600" }}>
          Gabriel Investe — Consultoria Independente — CVM
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", color: "white", fontSize: "clamp(1.3rem, 4vw, 1.8rem)", margin: 0, fontWeight: "400" }}>
          Calculadora de Impacto de Taxas
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "0.8rem", margin: "0.3rem 0 0" }}>
          Descubra quanto as taxas ocultas estão custando ao seu patrimônio
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: "880px", padding: "1.5rem 1rem", display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* Inputs */}
        <div style={{ background: "white", borderRadius: "16px", padding: "1.8rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "4px", height: "24px", background: GOLD, borderRadius: "2px" }} />
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: NAVY, letterSpacing: "0.04em", textTransform: "uppercase" }}>Seus Dados</h2>
          </div>

          <Slider label="Patrimônio Atual" value={patrimonio} onChange={setPatrimonio}
            min={50000} max={5000000} step={50000} icon="💰"
            format={(v) => formatBRL(v)} sublabel="Quanto você tem investido hoje" />
          <Slider label="Aporte Mensal" value={aporte} onChange={setAporte}
            min={0} max={50000} step={500} icon="📥"
            format={(v) => formatBRL(v)} sublabel="Quanto investe por mês" />
          <Slider label="Retorno Bruto Anual" value={retornoBruto} onChange={setRetornoBruto}
            min={6} max={18} step={0.5} icon="📈"
            format={(v) => `${v.toFixed(1)}% a.a.`} sublabel="Retorno estimado antes das taxas" />
          <Slider label="Taxa Total do Assessor" value={taxaAssessor} onChange={setTaxaAssessor}
            min={0.5} max={4} step={0.1} icon="🏦"
            format={(v) => `${v.toFixed(1)}% a.a.`} sublabel="Administração + performance + rebate + spread" />
          <Slider label="Taxa do Consultor Independente" value={taxaConsultor} onChange={setTaxaConsultor}
            min={0.1} max={2.5} step={0.1} icon="🎯"
            format={(v) => `${v.toFixed(1)}% a.a.`} sublabel="Fee-only, sem comissão" />
          <Slider label="Horizonte" value={horizonte} onChange={setHorizonte}
            min={5} max={30} step={1} icon="⏳"
            format={(v) => `${v} anos`} />
        </div>

        {/* Results */}
        {!lead ? (
          <LeadGate
            ferramenta="calculadora-taxas"
            titulo="Informe seu nome e WhatsApp para ver quanto as taxas custam ao seu patrimônio."
            subtitulo="Ajuste os valores acima quando quiser. Depois de liberado, o cálculo atualiza na hora."
            botao="VER MEU CÁLCULO"
            getResultado={() => ({
              patrimonio, aporte_mensal: aporte, retorno_bruto: retornoBruto,
              taxa_assessor: taxaAssessor, taxa_consultor: taxaConsultor, horizonte,
              final_consultor: Math.round(finalConsultor), final_assessor: Math.round(finalAssessor),
              perda_total: Math.round(perdaTotal), perda_pct: Math.round(perdaPct),
            })}
            onUnlock={(nome) => setLead({ nome })}
          />
        ) : (
        <div style={{ background: "white", borderRadius: "16px", padding: "1.8rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)", border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.2rem" }}>
            <div style={{ width: "4px", height: "24px", background: TEAL, borderRadius: "2px" }} />
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: NAVY, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Projeção em {horizonte} Anos
            </h2>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <MiniChart dataConsultor={dataConsultor} dataAssessor={dataAssessor} years={horizonte} />
          </div>

          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", marginBottom: "1.5rem", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "18px", height: "3px", background: TEAL, borderRadius: "2px" }} />
              <span style={{ color: "#6B7280" }}>Com consultor</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "18px", height: "3px", background: RED, borderRadius: "2px" }} />
              <span style={{ color: "#6B7280" }}>Com assessor</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1rem" }}>
            <div style={{ background: `linear-gradient(135deg, ${NAVY}08, ${TEAL}12)`, borderRadius: "12px", padding: "1rem", border: `1px solid ${TEAL}30`, textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem", fontWeight: "600" }}>Com Consultor</div>
              <AnimatedNumber value={finalConsultor} color={TEAL} size="clamp(1.1rem, 3vw, 1.5rem)" />
            </div>
            <div style={{ background: `linear-gradient(135deg, ${RED}08, ${RED}06)`, borderRadius: "12px", padding: "1rem", border: `1px solid ${RED}25`, textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem", fontWeight: "600" }}>Com Assessor</div>
              <AnimatedNumber value={finalAssessor} color={RED} size="clamp(1.1rem, 3vw, 1.5rem)" />
            </div>
          </div>

          <div style={{ background: `linear-gradient(135deg, ${RED}08, ${NAVY}05)`, borderRadius: "12px", padding: "1.2rem", textAlign: "center", border: `2px solid ${RED}30`, marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.72rem", color: RED, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "700", marginBottom: "0.3rem" }}>
              Quanto você perde com taxas desnecessárias
            </div>
            <AnimatedNumber value={perdaTotal} color={RED} size="clamp(1.6rem, 5vw, 2.2rem)" />
            <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "0.3rem" }}>
              equivale a <strong style={{ color: RED }}>{perdaPct.toFixed(0)}%</strong> do patrimônio final
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.2rem" }}>
            {[
              { label: "Total investido", value: formatBRL(totalInvestido), color: "#6B7280" },
              { label: "Perda mensal média", value: formatBRL(perdaTotal / (horizonte * 12)), color: RED },
              { label: "Diferença de taxa", value: `${(taxaAssessor - taxaConsultor).toFixed(1)}% a.a.`, color: GOLD },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: "center", padding: "0.6rem 0.3rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{item.label}</div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            background: NAVY, borderRadius: "12px", padding: "1.5rem", textAlign: "center",
            opacity: showCTA ? 1 : 0, transform: showCTA ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.6s ease",
          }}>
            <div style={{ fontSize: "0.85rem", color: GOLD, fontWeight: "600", marginBottom: "0.5rem" }}>
              Quer saber exatamente quanto você está perdendo?
            </div>
            <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginBottom: "1rem", lineHeight: "1.5" }}>
              Faço um diagnóstico completo e gratuito da sua carteira.<br/>
              15 anos de experiência. CVM registrado. Fee-only.
            </div>
            <a
              href={`https://wa.me/5541998817220?text=${encodeURIComponent(
                `Olá Gabriel! ${lead ? `Aqui é ${lead.nome}. ` : ""}Usei a Calculadora de Impacto de Taxas e quero um diagnóstico da minha carteira.\n\n` +
                `📊 Meus dados:\n` +
                `• Patrimônio atual: ${formatBRL(patrimonio)}\n` +
                `• Aporte mensal: ${formatBRL(aporte)}\n` +
                `• Taxa atual (assessor): ${taxaAssessor.toFixed(1)}% a.a.\n` +
                `• Horizonte: ${horizonte} anos\n\n` +
                `📈 Resultado da simulação:\n` +
                `• Com consultor: ${formatBRL(finalConsultor)}\n` +
                `• Com assessor: ${formatBRL(finalAssessor)}\n` +
                `• Perda em taxas: ${formatBRL(perdaTotal)}\n\n` +
                `Gostaria de agendar uma conversa!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.85rem 2rem", textDecoration: "none",
                background: "#25D366",
                color: "white", fontWeight: "700", fontSize: "0.85rem",
                borderRadius: "8px", cursor: "pointer", letterSpacing: "0.04em",
                boxShadow: "0 4px 14px rgba(37,211,102,0.4)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              FALAR COM GABRIEL NO WHATSAPP
            </a>
            <div style={{ fontSize: "0.65rem", color: "#6B7280", marginTop: "0.8rem" }}>
              Seus dados da simulação já vão junto na mensagem
            </div>
            <div style={{ borderTop: "1px solid #ffffff15", marginTop: "0.8rem", paddingTop: "0.8rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
              <a href="https://www.instagram.com/gabrielinveste_" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "0.72rem", color: GOLD, textDecoration: "none", fontWeight: "600" }}>
                📸 Instagram
              </a>
            </div>
          </div>
        </div>
        )}

        {/* Disclaimer */}
        <div style={{ fontSize: "0.65rem", color: "#9CA3AF", textAlign: "center", padding: "0.5rem 1rem", lineHeight: "1.6" }}>
          Esta calculadora é uma ferramenta educacional e não constitui recomendação de investimento.
          Resultados são projeções baseadas em premissas e não garantem rentabilidade futura.
          Gabriel Investe — Consultoria Independente registrada na CVM.
        </div>
      </div>
    </div>
  );
}
