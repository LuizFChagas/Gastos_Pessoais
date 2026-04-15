import { useEffect, useState } from "react";
import { gastosPorIntervalo } from "../api/gastosApi";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};
import { CATEGORIA_STYLE, getCategoriaStyle, capitalizar } from "../utils/categorias";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, Sector
} from "recharts";

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const toLocalISO = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const keyToLabel = (key) => {
  if (!key) return key;
  const [ano, mes] = key.split("-");
  return `${MESES_ABREV[Number(mes) - 1]}/${String(ano).slice(2)}`;
};

const fmt = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", minWidth: "150px" }}>
      <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "6px" }}>{keyToLabel(label) ?? label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.color }} />
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: "700" }}>{fmt(p.value)}</span>
          <span style={{ color: "#94a3b8", fontSize: "11px" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

const CustomTooltipSimple = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px" }}>
      <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: "#fff", fontSize: "13px", fontWeight: "700" }}>{fmt(p.value)}</div>
      ))}
    </div>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
};

const cardStyle = {
  backgroundColor: "var(--card)",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "var(--shadow-md)"
};

const Vazio = () => (
  <div style={{ color: "var(--subtext)", padding: "40px 0", textAlign: "center", fontSize: "14px" }}>
    Sem dados para o período
  </div>
);

function Relatorios() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState("6");
  const [transacoes, setTransacoes] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [activeTipo, setActiveTipo] = useState(null);

  useEffect(() => { carregar(); }, [periodo]);

  const carregar = async () => {
    try {
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - parseInt(periodo) + 1, 1, 0, 0, 0);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
      const data = await gastosPorIntervalo(toLocalISO(inicio), toLocalISO(fim));
      setTransacoes(data);
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
    }
  };

  const saidas = transacoes.filter(t => t.tipo === "saida" && t.valor > 0);

  // ── 1. Comparativo mês a mês ──────────────────────────────────────────────
  const comparativoMensal = (() => {
    const meses = {};
    transacoes.forEach(t => {
      const d = new Date(t.data_hora);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if (!meses[key]) meses[key] = { key, entrada: 0, saida: 0 };
      if (t.tipo === "entrada") meses[key].entrada += t.valor;
      else meses[key].saida += t.valor;
    });
    return Object.values(meses)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(m => ({ ...m, entrada: parseFloat(m.entrada.toFixed(2)), saida: parseFloat(m.saida.toFixed(2)) }));
  })();

  // ── 2. Saldo histórico ────────────────────────────────────────────────────
  const saldoHistorico = comparativoMensal.map(m => ({
    key: m.key,
    saldo: parseFloat((m.entrada - m.saida).toFixed(2))
  }));

  // ── 3. Evolução por categoria (top 5) ─────────────────────────────────────
  const categoriaEvolucao = (() => {
    const porMesCat = {};
    const totaisCat = {};
    saidas.forEach(t => {
      const d = new Date(t.data_hora);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const cat = t.categoria || "outros";
      if (!porMesCat[key]) porMesCat[key] = {};
      porMesCat[key][cat] = (porMesCat[key][cat] || 0) + t.valor;
      totaisCat[cat] = (totaisCat[cat] || 0) + t.valor;
    });
    const top5Cats = Object.entries(totaisCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
    const keys = [...new Set(saidas.map(t => {
      const d = new Date(t.data_hora);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    }))].sort();
    return {
      data: keys.map(key => {
        const entry = { key };
        top5Cats.forEach(cat => { entry[cat] = parseFloat(((porMesCat[key] || {})[cat] || 0).toFixed(2)); });
        return entry;
      }),
      categorias: top5Cats
    };
  })();

  // ── 4. Donut por categoria ─────────────────────────────────────────────────
  const donutCategorias = (() => {
    const acc = {};
    saidas.forEach(t => {
      const cat = (t.categoria || "outros").toLowerCase();
      acc[cat] = (acc[cat] || 0) + t.valor;
    });
    return Object.entries(acc)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  })();
  const totalCat = donutCategorias.reduce((s, d) => s + d.value, 0);

  // ── 5. Donut por tipo de pagamento ─────────────────────────────────────────
  const donutTipo = (() => {
    let pix = 0, debito = 0, credito = 0;
    saidas.forEach(t => {
      if (t.descricao?.startsWith("Pix")) pix += t.valor;
      else if (t.banco?.toLowerCase().includes("fatura")) credito += t.valor;
      else debito += t.valor;
    });
    return [
      { name: "Crédito", value: parseFloat(credito.toFixed(2)), color: "#60a5fa" },
      { name: "Pix",     value: parseFloat(pix.toFixed(2)),     color: "#a78bfa" },
      { name: "Débito",  value: parseFloat(debito.toFixed(2)),  color: "#facc15" },
    ].filter(d => d.value > 0);
  })();
  const totalTipo = donutTipo.reduce((s, d) => s + d.value, 0);

  // ── 6. Gastos por dia da semana ────────────────────────────────────────────
  const porDiaSemana = (() => {
    const totais = [0,0,0,0,0,0,0];
    const contagem = [0,0,0,0,0,0,0];
    saidas.forEach(t => {
      const dia = new Date(t.data_hora).getDay();
      totais[dia] += t.valor;
      contagem[dia]++;
    });
    return DIAS_SEMANA.map((nome, i) => ({
      dia: nome,
      total: parseFloat(totais[i].toFixed(2)),
      media: contagem[i] > 0 ? parseFloat((totais[i] / contagem[i]).toFixed(2)) : 0
    }));
  })();

  // ── 7. Ticket médio por categoria ─────────────────────────────────────────
  const ticketMedio = (() => {
    const acc = {};
    saidas.forEach(t => {
      const cat = t.categoria || "outros";
      if (!acc[cat]) acc[cat] = { total: 0, count: 0 };
      acc[cat].total += t.valor;
      acc[cat].count++;
    });
    return Object.entries(acc)
      .map(([cat, { total, count }]) => ({ cat: capitalizar(cat), catKey: cat, media: parseFloat((total / count).toFixed(2)) }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 8);
  })();

  // ── 8. Top 5 maiores gastos ────────────────────────────────────────────────
  const top5 = [...saidas].sort((a, b) => b.valor - a.valor).slice(0, 5);

  // ── 9. Projeção do mês atual ───────────────────────────────────────────────
  const projecao = (() => {
    const hoje = new Date();
    const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}`;
    const gastosDoMes = saidas.filter(t => t.data_hora?.startsWith(mesAtual));
    const total = gastosDoMes.reduce((s, t) => s + t.valor, 0);
    const diaAtual = hoje.getDate();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
    const projetado = parseFloat(((total / diaAtual) * diasNoMes).toFixed(2));
    const progresso = projetado > 0 ? Math.min((total / projetado) * 100, 100) : 0;
    return { total: parseFloat(total.toFixed(2)), projetado, diaAtual, diasNoMes, progresso };
  })();

  return (
    <div style={{ paddingBottom: "40px" }}>

      {/* HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "12px" : 0,
        marginBottom: "24px"
      }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Relatórios</h1>
          <span style={{ color: "var(--subtext)" }}>Análise detalhada dos seus gastos</span>
        </div>
        <div style={{ display: "flex", gap: "8px", width: isMobile ? "100%" : "auto" }}>
          {["3","6","12"].map(p => (
            <button key={p} onClick={() => setPeriodo(p)} style={{
              flex: isMobile ? 1 : "none",
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
              fontWeight: "600", cursor: "pointer", border: "1px solid",
              borderColor: periodo === p ? "#10b981" : "var(--border)",
              backgroundColor: periodo === p ? "rgba(16,185,129,0.12)" : "transparent",
              color: periodo === p ? "#10b981" : "var(--subtext)", transition: "all 0.15s"
            }}>
              {p} meses
            </button>
          ))}
        </div>
      </div>

      {/* ROW 1 — Comparativo mês a mês */}
      <div style={{ ...cardStyle, marginBottom: "24px" }}>
        <h3 style={{ color: "var(--text)", margin: "0 0 16px" }}>Comparativo mês a mês</h3>
        {comparativoMensal.length === 0 ? <Vazio /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparativoMensal} barGap={6} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.4} />
              <XAxis dataKey="key" stroke="var(--subtext)" tick={{ fontSize: 12 }} tickFormatter={keyToLabel} />
              <YAxis stroke="var(--subtext)" tick={{ fontSize: 12 }} width={55} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="entrada" name="Entradas" fill="#22c55e" radius={[6,6,0,0]} barSize={16} />
              <Bar dataKey="saida"   name="Gastos"   fill="#ef4444" radius={[6,6,0,0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW 2 — Saldo histórico + Evolução por categoria */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px", flexDirection: isMobile ? "column" : "row" }}>
        <div style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 16px" }}>Saldo histórico</h3>
          {saldoHistorico.length === 0 ? <Vazio /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={saldoHistorico} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <XAxis dataKey="key" stroke="var(--subtext)" tick={{ fontSize: 12 }} tickFormatter={keyToLabel} />
                <YAxis stroke="var(--subtext)" tick={{ fontSize: 12 }} width={55} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#3b82f6" fill="url(#gradSaldo)" strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--card)", stroke: "#3b82f6", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#3b82f6" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 16px" }}>Evolução por categoria</h3>
          {categoriaEvolucao.data.length === 0 ? <Vazio /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={categoriaEvolucao.data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <XAxis dataKey="key" stroke="var(--subtext)" tick={{ fontSize: 12 }} tickFormatter={keyToLabel} />
                <YAxis stroke="var(--subtext)" tick={{ fontSize: 12 }} width={55} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {categoriaEvolucao.categorias.map(cat => (
                  <Line key={cat} type="monotone" dataKey={cat} name={capitalizar(cat)}
                    stroke={CATEGORIA_STYLE[cat]?.chartColor || "#94a3b8"}
                    strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ROW 3 — Donut categorias + Donut tipo pagamento */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px", flexDirection: isMobile ? "column" : "row" }}>

        <div style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 12px" }}>Gastos por categoria</h3>
          {donutCategorias.length === 0 ? <Vazio /> : (
            <div style={{ display: "flex", alignItems: isMobile ? "center" : "center", flexDirection: isMobile ? "column" : "row", gap: "16px" }}>
              <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
                <PieChart width={180} height={180}>
                  <Pie data={donutCategorias} dataKey="value" innerRadius={48} outerRadius={76}
                    activeIndex={activeCat} activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActiveCat(i)} onMouseLeave={() => setActiveCat(null)}
                    strokeWidth={0} animationBegin={0} animationDuration={600}>
                    {donutCategorias.map((entry, i) => (
                      <Cell key={i} fill={getCategoriaStyle(entry.name).chartColor}
                        opacity={activeCat === null || activeCat === i ? 1 : 0.35} style={{ cursor: "pointer" }} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                  {activeCat !== null ? (
                    <>
                      <div style={{ color: getCategoriaStyle(donutCategorias[activeCat].name).chartColor, fontSize: "14px", fontWeight: "700" }}>
                        {((donutCategorias[activeCat].value / totalCat) * 100).toFixed(1)}%
                      </div>
                      <div style={{ color: "var(--subtext)", fontSize: "10px" }}>{capitalizar(donutCategorias[activeCat].name)}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ color: "var(--text)", fontSize: "11px", fontWeight: "700" }}>{fmt(totalCat)}</div>
                      <div style={{ color: "var(--subtext)", fontSize: "10px" }}>total</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, width: isMobile ? "100%" : "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                {donutCategorias.map((item, i) => {
                  const s = getCategoriaStyle(item.name);
                  return (
                    <div key={i} onMouseEnter={() => setActiveCat(i)} onMouseLeave={() => setActiveCat(null)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 6px", borderRadius: "6px", cursor: "pointer", backgroundColor: activeCat === i ? "rgba(255,255,255,0.06)" : "transparent" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: s.chartColor, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px" }}>{s.icon}</span>
                      <span style={{ color: "var(--text)", fontSize: "12px", flex: 1 }}>{capitalizar(item.name)}</span>
                      <span style={{ color: s.chartColor, fontSize: "11px", fontWeight: "600" }}>{fmt(item.value)}</span>
                      <span style={{ color: "var(--subtext)", fontSize: "10px", width: "32px", textAlign: "right" }}>
                        {((item.value / totalCat) * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 12px" }}>Tipo de pagamento</h3>
          {donutTipo.length === 0 ? <Vazio /> : (
            <div style={{ display: "flex", alignItems: isMobile ? "center" : "center", flexDirection: isMobile ? "column" : "row", gap: "24px" }}>
              <div style={{ position: "relative", width: 180, height: 180, flexShrink: 0 }}>
                <PieChart width={180} height={180}>
                  <Pie data={donutTipo} dataKey="value" innerRadius={48} outerRadius={76}
                    activeIndex={activeTipo} activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActiveTipo(i)} onMouseLeave={() => setActiveTipo(null)}
                    strokeWidth={0} animationBegin={0} animationDuration={600}>
                    {donutTipo.map((entry, i) => (
                      <Cell key={i} fill={entry.color}
                        opacity={activeTipo === null || activeTipo === i ? 1 : 0.35} style={{ cursor: "pointer" }} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                  {activeTipo !== null ? (
                    <>
                      <div style={{ color: donutTipo[activeTipo].color, fontSize: "14px", fontWeight: "700" }}>
                        {((donutTipo[activeTipo].value / totalTipo) * 100).toFixed(1)}%
                      </div>
                      <div style={{ color: "var(--subtext)", fontSize: "10px" }}>{donutTipo[activeTipo].name}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ color: "var(--text)", fontSize: "11px", fontWeight: "700" }}>{fmt(totalTipo)}</div>
                      <div style={{ color: "var(--subtext)", fontSize: "10px" }}>total</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                {donutTipo.map((item, i) => (
                  <div key={i} onMouseEnter={() => setActiveTipo(i)} onMouseLeave={() => setActiveTipo(null)}
                    style={{ cursor: "pointer", padding: "10px 14px", borderRadius: "12px", border: `1px solid ${activeTipo === i ? item.color : "var(--border)"}`, backgroundColor: activeTipo === i ? `${item.color}11` : "transparent", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: item.color, fontWeight: "700", fontSize: "13px" }}>{item.name}</span>
                      <span style={{ color: "var(--subtext)", fontSize: "11px" }}>{((item.value / totalTipo) * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ color: "var(--text)", fontWeight: "700", fontSize: "16px", marginTop: "2px" }}>{fmt(item.value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROW 4 — Dia da semana + Ticket médio */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px", flexDirection: isMobile ? "column" : "row" }}>

        <div style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 16px" }}>Gastos por dia da semana</h3>
          {porDiaSemana.every(d => d.total === 0) ? <Vazio /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porDiaSemana} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <XAxis dataKey="dia" stroke="var(--subtext)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--subtext)" tick={{ fontSize: 12 }} width={55} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltipSimple />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="total" name="Total" radius={[6,6,0,0]} barSize={24}>
                  {porDiaSemana.map((entry, i) => {
                    const max = Math.max(...porDiaSemana.map(d => d.total));
                    return <Cell key={i} fill={entry.total === max ? "#10b981" : "#3b82f6"} fillOpacity={entry.total === max ? 1 : 0.6} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 16px" }}>Ticket médio por categoria</h3>
          {ticketMedio.length === 0 ? <Vazio /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ticketMedio} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" stroke="var(--subtext)" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <YAxis type="category" dataKey="cat" stroke="var(--subtext)" tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={<CustomTooltipSimple />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="media" name="Ticket médio" radius={[0,6,6,0]} barSize={16}>
                  {ticketMedio.map((entry, i) => (
                    <Cell key={i} fill={CATEGORIA_STYLE[entry.catKey]?.chartColor || "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ROW 5 — Top 5 + Projeção */}
      <div style={{ display: "flex", gap: "24px", flexDirection: isMobile ? "column" : "row" }}>

        <div style={{ ...cardStyle, flex: 1 }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 16px" }}>Top 5 maiores gastos</h3>
          {top5.length === 0 ? <Vazio /> : top5.map((t, i) => {
            const s = getCategoriaStyle(t.categoria);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < top5.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--subtext)", minWidth: "28px" }}>#{i+1}</span>
                  <div>
                    <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px" }}>{t.descricao || "Sem descrição"}</div>
                    <div style={{ fontSize: "11px", color: "var(--subtext)" }}>{new Date(t.data_hora).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", backgroundColor: s.bg, color: s.color, fontWeight: "600" }}>
                    {s.icon} {capitalizar(t.categoria)}
                  </span>
                  <span style={{ fontWeight: "700", color: "#ef4444", fontSize: "15px" }}>{fmt(t.valor)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...cardStyle, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 style={{ color: "var(--text)", margin: "0 0 20px" }}>Projeção do mês atual</h3>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--subtext)", fontSize: "13px" }}>Gasto até hoje (dia {projecao.diaAtual})</span>
            <span style={{ color: "var(--text)", fontWeight: "700" }}>{fmt(projecao.total)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <span style={{ color: "var(--subtext)", fontSize: "13px" }}>Projeção até dia {projecao.diasNoMes}</span>
            <span style={{ color: "#f59e0b", fontWeight: "700" }}>{fmt(projecao.projetado)}</span>
          </div>

          <div style={{ backgroundColor: "var(--border)", borderRadius: "999px", height: "10px", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ width: `${projecao.progresso}%`, height: "100%", backgroundColor: "#10b981", borderRadius: "999px", transition: "width 0.5s ease" }} />
          </div>

          <div style={{ color: "var(--subtext)", fontSize: "12px", textAlign: "center" }}>
            Dia {projecao.diaAtual} de {projecao.diasNoMes} — média diária: {fmt(projecao.diaAtual > 0 ? projecao.total / projecao.diaAtual : 0)}
          </div>

          {projecao.total === 0 && (
            <div style={{ color: "var(--subtext)", textAlign: "center", marginTop: "16px", fontSize: "14px" }}>
              Nenhum gasto registrado este mês
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default Relatorios;
