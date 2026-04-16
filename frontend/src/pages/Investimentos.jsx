import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  listarInvestimentos,
  criarInvestimento,
  editarInvestimento,
  deletarInvestimento,
} from "../api/investimentosApi";
import { gastosPorIntervalo } from "../api/gastosApi";

/* ── Configuração de tipos ── */
const TIPOS = [
  { value: "renda_fixa", label: "Renda Fixa", color: "#10b981" },
  { value: "acoes",      label: "Ações",      color: "#3b82f6" },
  { value: "fiis",       label: "FIIs",       color: "#f59e0b" },
  { value: "cripto",     label: "Cripto",     color: "#8b5cf6" },
  { value: "outros",     label: "Outros",     color: "#94a3b8" },
];

const getTipo = (value) => TIPOS.find((t) => t.value === value) || TIPOS[4];

const fmt = (v) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v) => {
  const n = Number(v || 0);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
};

/* ── Catálogo de ativos ── */
const CATALOGO = [
  // Ações BR
  { ticker: "PETR4",  nome: "Petrobras PN",           tipo: "acoes", fonte: "brapi" },
  { ticker: "VALE3",  nome: "Vale ON",                 tipo: "acoes", fonte: "brapi" },
  { ticker: "ITUB4",  nome: "Itaú Unibanco PN",        tipo: "acoes", fonte: "brapi" },
  { ticker: "BBDC4",  nome: "Bradesco PN",             tipo: "acoes", fonte: "brapi" },
  { ticker: "BBAS3",  nome: "Banco do Brasil ON",      tipo: "acoes", fonte: "brapi" },
  { ticker: "WEGE3",  nome: "WEG ON",                  tipo: "acoes", fonte: "brapi" },
  { ticker: "ABEV3",  nome: "Ambev ON",                tipo: "acoes", fonte: "brapi" },
  { ticker: "MGLU3",  nome: "Magazine Luiza ON",       tipo: "acoes", fonte: "brapi" },
  { ticker: "LREN3",  nome: "Lojas Renner ON",         tipo: "acoes", fonte: "brapi" },
  { ticker: "SUZB3",  nome: "Suzano ON",               tipo: "acoes", fonte: "brapi" },
  { ticker: "BPAC11", nome: "BTG Pactual UNT",         tipo: "acoes", fonte: "brapi" },
  { ticker: "JBSS3",  nome: "JBS ON",                  tipo: "acoes", fonte: "brapi" },
  { ticker: "RENT3",  nome: "Localiza ON",             tipo: "acoes", fonte: "brapi" },
  { ticker: "EGIE3",  nome: "Engie Brasil ON",         tipo: "acoes", fonte: "brapi" },
  { ticker: "RDOR3",  nome: "Rede D'Or ON",            tipo: "acoes", fonte: "brapi" },
  { ticker: "PRIO3",  nome: "PetroRio ON",             tipo: "acoes", fonte: "brapi" },
  { ticker: "EMBR3",  nome: "Embraer ON",              tipo: "acoes", fonte: "brapi" },
  { ticker: "CPLE6",  nome: "Copel PNB",               tipo: "acoes", fonte: "brapi" },
  // Ações EUA
  { ticker: "AAPL",   nome: "Apple",                   tipo: "acoes", fonte: "brapi" },
  { ticker: "MSFT",   nome: "Microsoft",               tipo: "acoes", fonte: "brapi" },
  { ticker: "GOOGL",  nome: "Alphabet (Google)",       tipo: "acoes", fonte: "brapi" },
  { ticker: "AMZN",   nome: "Amazon",                  tipo: "acoes", fonte: "brapi" },
  { ticker: "TSLA",   nome: "Tesla",                   tipo: "acoes", fonte: "brapi" },
  { ticker: "NVDA",   nome: "NVIDIA",                  tipo: "acoes", fonte: "brapi" },
  { ticker: "META",   nome: "Meta (Facebook)",         tipo: "acoes", fonte: "brapi" },
  { ticker: "NFLX",   nome: "Netflix",                 tipo: "acoes", fonte: "brapi" },
  { ticker: "BRKB",   nome: "Berkshire Hathaway B",   tipo: "acoes", fonte: "brapi" },
  { ticker: "JPM",    nome: "JPMorgan Chase",          tipo: "acoes", fonte: "brapi" },
  // ETFs
  { ticker: "IVVB11", nome: "iShares S&P 500 (BR)",   tipo: "acoes", fonte: "brapi" },
  { ticker: "BOVA11", nome: "iShares Ibovespa",        tipo: "acoes", fonte: "brapi" },
  { ticker: "SPY",    nome: "SPDR S&P 500 ETF",        tipo: "acoes", fonte: "brapi" },
  { ticker: "QQQ",    nome: "Invesco QQQ (Nasdaq)",    tipo: "acoes", fonte: "brapi" },
  // FIIs
  { ticker: "MXRF11", nome: "Maxi Renda FII",          tipo: "fiis",  fonte: "brapi" },
  { ticker: "HGLG11", nome: "CSHG Logística FII",      tipo: "fiis",  fonte: "brapi" },
  { ticker: "KNRI11", nome: "Kinea Renda Imob.",        tipo: "fiis",  fonte: "brapi" },
  { ticker: "VISC11", nome: "Vinci Shopping Centers",  tipo: "fiis",  fonte: "brapi" },
  { ticker: "XPML11", nome: "XP Malls FII",            tipo: "fiis",  fonte: "brapi" },
  { ticker: "BTLG11", nome: "BTG Logística FII",       tipo: "fiis",  fonte: "brapi" },
  { ticker: "RECR11", nome: "REC Recebíveis Imob.",    tipo: "fiis",  fonte: "brapi" },
  { ticker: "HCTR11", nome: "Hectare CE FII",          tipo: "fiis",  fonte: "brapi" },
  // Moedas
  { ticker: "USD",    nome: "Dólar Americano",         tipo: "outros", fonte: "moeda", par: "USD-BRL" },
  { ticker: "EUR",    nome: "Euro",                    tipo: "outros", fonte: "moeda", par: "EUR-BRL" },
  { ticker: "GBP",    nome: "Libra Esterlina",         tipo: "outros", fonte: "moeda", par: "GBP-BRL" },
  { ticker: "CHF",    nome: "Franco Suíço",            tipo: "outros", fonte: "moeda", par: "CHF-BRL" },
  // Cripto
  { ticker: "BTC",    nome: "Bitcoin",                 tipo: "cripto", fonte: "coingecko", id: "bitcoin" },
  { ticker: "ETH",    nome: "Ethereum",                tipo: "cripto", fonte: "coingecko", id: "ethereum" },
  { ticker: "BNB",    nome: "BNB",                     tipo: "cripto", fonte: "coingecko", id: "binancecoin" },
  { ticker: "SOL",    nome: "Solana",                  tipo: "cripto", fonte: "coingecko", id: "solana" },
  { ticker: "XRP",    nome: "XRP",                     tipo: "cripto", fonte: "coingecko", id: "ripple" },
  { ticker: "ADA",    nome: "Cardano",                 tipo: "cripto", fonte: "coingecko", id: "cardano" },
  { ticker: "DOGE",   nome: "Dogecoin",                tipo: "cripto", fonte: "coingecko", id: "dogecoin" },
  { ticker: "AVAX",   nome: "Avalanche",               tipo: "cripto", fonte: "coingecko", id: "avalanche-2" },
  { ticker: "DOT",    nome: "Polkadot",                tipo: "cripto", fonte: "coingecko", id: "polkadot" },
  // Renda Fixa
  { ticker: "CDB",           nome: "CDB",              tipo: "renda_fixa", fonte: "manual" },
  { ticker: "LCI",           nome: "LCI",              tipo: "renda_fixa", fonte: "manual" },
  { ticker: "LCA",           nome: "LCA",              tipo: "renda_fixa", fonte: "manual" },
  { ticker: "TESOURO-SELIC", nome: "Tesouro Selic",    tipo: "renda_fixa", fonte: "manual" },
  { ticker: "TESOURO-IPCA",  nome: "Tesouro IPCA+",    tipo: "renda_fixa", fonte: "manual" },
  { ticker: "TESOURO-PRE",   nome: "Tesouro Prefixado",tipo: "renda_fixa", fonte: "manual" },
  { ticker: "DEBENTURE",     nome: "Debênture",        tipo: "renda_fixa", fonte: "manual" },
];

async function buscarPreco(ativo) {
  try {
    if (ativo.fonte === "brapi") {
      const res = await fetch(`https://brapi.dev/api/quote/${ativo.ticker}`);
      const data = await res.json();
      const q = data?.results?.[0];
      if (!q) return null;
      return {
        preco: q.regularMarketPrice,
        variacao_dia: q.regularMarketChangePercent,
        variacao_ano: q.regularMarketChangePercent52Week ?? null,
      };
    }
    if (ativo.fonte === "coingecko") {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ativo.id}&vs_currencies=brl&include_24h_vol=false&include_24hr_change=true`
      );
      const data = await res.json();
      const q = data?.[ativo.id];
      if (!q) return null;
      return { preco: q.brl, variacao_dia: q.brl_24h_change, variacao_ano: null };
    }
    if (ativo.fonte === "moeda") {
      const res = await fetch(`https://economia.awesomeapi.com.br/last/${ativo.par}`);
      const data = await res.json();
      const key = ativo.par.replace("-", "");
      const q = data?.[key];
      if (!q) return null;
      return { preco: parseFloat(q.bid), variacao_dia: parseFloat(q.pctChange), variacao_ano: null };
    }
  } catch { }
  return null;
}

/* ── Modal de adicionar/editar ── */
function Modal({ item, onSave, onClose }) {
  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "10px",
    border: "1px solid var(--border)", backgroundColor: "var(--input)",
    color: "var(--text)", fontSize: "14px", outline: "none",
    boxSizing: "border-box", fontFamily: "Inter, sans-serif",
  };
  const labelStyle = { fontSize: "12px", fontWeight: "500", color: "var(--subtext)", marginBottom: "5px", display: "block" };

  // modo edição: mantém campos manuais
  if (item) {
    const [form, setForm] = useState({ ...item });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    return (
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
        <div style={{ backgroundColor: "var(--card)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, color: "var(--text)", fontSize: "17px" }}>Editar posição</h3>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--subtext)", fontSize: "18px" }}>✕</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 2 }}><label style={labelStyle}>Nome</label><input value={form.nome} onChange={e => set("nome", e.target.value)} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Ticker</label><input value={form.ticker} onChange={e => set("ticker", e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Valor investido (R$)</label><input type="number" value={form.valor_investido} onChange={e => set("valor_investido", e.target.value)} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Valor atual (R$)</label><input type="number" value={form.valor_atual} onChange={e => set("valor_atual", e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Rentab. mês (%)</label><input type="number" value={form.rentabilidade_mes} onChange={e => set("rentabilidade_mes", e.target.value)} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>Rentab. ano (%)</label><input type="number" value={form.rentabilidade_ano} onChange={e => set("rentabilidade_ano", e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--subtext)", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => onSave(form)} style={{ flex: 2, padding: "11px", borderRadius: "10px", border: "none", backgroundColor: "#10b981", color: "white", fontWeight: "700", cursor: "pointer" }}>Salvar</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // modo adição: busca inteligente
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativoSelecionado, setAtivoSelecionado] = useState(null);
  const [precoLive, setPrecoLive] = useState(null);
  const [carregandoPreco, setCarregandoPreco] = useState(false);
  const [valorInvestido, setValorInvestido] = useState("");
  const [precoMedio, setPrecoMedio] = useState("");
  const [rentMes, setRentMes] = useState("");
  const [rentAno, setRentAno] = useState("");

  const semAcento = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const q = semAcento(busca);
  const filtrados = busca.length >= 1
    ? CATALOGO.filter(a =>
        semAcento(a.ticker).includes(q) ||
        semAcento(a.nome).includes(q)
      ).slice(0, 8)
    : [];

  const selecionarAtivo = async (ativo) => {
    setAtivoSelecionado(ativo);
    setBusca(`${ativo.ticker} — ${ativo.nome}`);
    setAberto(false);
    setPrecoLive(null);
    if (ativo.fonte !== "manual") {
      setCarregandoPreco(true);
      const p = await buscarPreco(ativo);
      setPrecoLive(p);
      if (p?.variacao_dia != null) setRentMes(p.variacao_dia.toFixed(2));
      if (p?.variacao_ano != null) setRentAno(p.variacao_ano.toFixed(2));
      setCarregandoPreco(false);
    }
  };

  const tipo = ativoSelecionado ? TIPOS.find(t => t.value === ativoSelecionado.tipo) : null;

  const calcularValorAtual = () => {
    const vi = parseFloat(valorInvestido) || 0;
    const pm = parseFloat(precoMedio) || 0;
    if (precoLive?.preco && pm > 0 && vi > 0) {
      const qtd = vi / pm;
      return qtd * precoLive.preco;
    }
    return vi; // sem preço vivo ou sem preço médio, valor atual = investido
  };

  const handleSalvar = () => {
    if (!ativoSelecionado) return;
    onSave({
      nome: ativoSelecionado.nome,
      ticker: ativoSelecionado.ticker,
      tipo: ativoSelecionado.tipo,
      valor_investido: parseFloat(valorInvestido) || 0,
      valor_atual: calcularValorAtual(),
      rentabilidade_mes: parseFloat(rentMes) || 0,
      rentabilidade_ano: parseFloat(rentAno) || 0,
    });
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "var(--card)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, color: "var(--text)", fontSize: "17px" }}>Adicionar posição</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--subtext)", fontSize: "18px" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* BUSCA DE ATIVO */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Buscar ativo</label>
            <input
              value={busca}
              onChange={e => { setBusca(e.target.value); setAberto(true); setAtivoSelecionado(null); setPrecoLive(null); }}
              onFocus={() => setAberto(true)}
              placeholder="Ex: PETR4, Bitcoin, CDB..."
              style={inputStyle}
              autoComplete="off"
            />
            {aberto && filtrados.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                backgroundColor: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "10px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
              }}>
                {filtrados.map(a => {
                  const t = TIPOS.find(t => t.value === a.tipo);
                  return (
                    <div key={a.ticker} onMouseDown={() => selecionarAtivo(a)} style={{
                      padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                      borderBottom: "1px solid var(--border)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--input)"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <span style={{ fontSize: "11px", fontWeight: "700", backgroundColor: t?.color + "22", color: t?.color, padding: "2px 7px", borderRadius: "6px" }}>{a.ticker}</span>
                      <span style={{ fontSize: "13px", color: "var(--text)", flex: 1 }}>{a.nome}</span>
                      <span style={{ fontSize: "11px", color: "var(--subtext)" }}>{t?.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INFO DO ATIVO SELECIONADO */}
          {ativoSelecionado && (
            <div style={{
              backgroundColor: "var(--input)", borderRadius: "10px", padding: "12px 16px",
              border: `1px solid ${tipo?.color}44`, display: "flex", alignItems: "center", gap: "12px"
            }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: tipo?.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "13px", fontWeight: "800", color: tipo?.color }}>{ativoSelecionado.ticker.slice(0, 3)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>{ativoSelecionado.nome}</div>
                <div style={{ fontSize: "11px", color: "var(--subtext)" }}>{tipo?.label}</div>
              </div>
              {carregandoPreco && <span style={{ fontSize: "12px", color: "var(--subtext)" }}>Buscando preço...</span>}
              {precoLive && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>
                    {precoLive.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                  {precoLive.variacao_dia != null && (
                    <div style={{ fontSize: "11px", fontWeight: "600", color: precoLive.variacao_dia >= 0 ? "#10b981" : "#ef4444" }}>
                      {precoLive.variacao_dia >= 0 ? "▲" : "▼"} {Math.abs(precoLive.variacao_dia).toFixed(2)}% hoje
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VALOR INVESTIDO */}
          {ativoSelecionado && (
            <>
              <div>
                <label style={labelStyle}>Valor investido (R$)</label>
                <input type="number" placeholder="0,00" value={valorInvestido} onChange={e => setValorInvestido(e.target.value)} style={inputStyle} />
              </div>

              {/* PREÇO MÉDIO — só para ativos com preço vivo */}
              {ativoSelecionado.fonte !== "manual" && (
                <div>
                  <label style={labelStyle}>
                    Preço médio de compra (R$)
                    <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: "400" }}>
                      — opcional, para calcular valor atual
                    </span>
                  </label>
                  <input type="number" placeholder="0,00" value={precoMedio} onChange={e => setPrecoMedio(e.target.value)} style={inputStyle} />
                  {precoLive && precoMedio && valorInvestido && (
                    <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--subtext)" }}>
                      Quantidade: {(parseFloat(valorInvestido) / parseFloat(precoMedio)).toFixed(4)} unid.
                      {" · "}Valor atual estimado:{" "}
                      <span style={{ fontWeight: "700", color: calcularValorAtual() >= parseFloat(valorInvestido) ? "#10b981" : "#ef4444" }}>
                        {calcularValorAtual().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* RENTABILIDADE — editável mas pré-preenchida */}
              {ativoSelecionado.fonte === "manual" && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Rentab. mês (%)</label><input type="number" placeholder="0,00" value={rentMes} onChange={e => setRentMes(e.target.value)} style={inputStyle} /></div>
                  <div style={{ flex: 1 }}><label style={labelStyle}>Rentab. ano (%)</label><input type="number" placeholder="0,00" value={rentAno} onChange={e => setRentAno(e.target.value)} style={inputStyle} /></div>
                </div>
              )}
            </>
          )}

          {/* BOTÕES */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid var(--border)", backgroundColor: "transparent", color: "var(--subtext)", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
            <button
              onClick={handleSalvar}
              disabled={!ativoSelecionado || !valorInvestido}
              style={{ flex: 2, padding: "11px", borderRadius: "10px", border: "none", backgroundColor: !ativoSelecionado || !valorInvestido ? "var(--border)" : "#10b981", color: "white", fontWeight: "700", cursor: !ativoSelecionado || !valorInvestido ? "not-allowed" : "pointer" }}
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Painel de mercado ── */
const QUOTES = [
  { key: "USD-BRL", label: "Dólar",   symbol: "USD",  flag: "🇺🇸" },
  { key: "EUR-BRL", label: "Euro",    symbol: "EUR",  flag: "🇪🇺" },
  { key: "BTC-USD", label: "Bitcoin", symbol: "BTC",  flag: "₿"  },
  { key: "ETH-USD", label: "Ethereum",symbol: "ETH",  flag: "Ξ"  },
];

function Sparkline({ data, isPositive }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100, H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const color = isPositive ? "#10b981" : "#ef4444";
  const last = data[data.length - 1];
  const yLast = H - ((last - min) / range) * (H - 2) - 1;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`${pts} ${W},${H} 0,${H}`}
        fill={`url(#sg-${color.replace("#","")})`}
        stroke="none"
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={W} cy={yLast} r="2" fill={color} />
    </svg>
  );
}

function MarketTicker({ posicoes }) {
  const [cotacoes, setCotacoes] = useState({});
  const [historico, setHistorico] = useState({});
  const [carregando, setCarregando] = useState(true);

  const buscarCotacoes = async () => {
    try {
      const keys = QUOTES.map(q => q.key).join(",");
      const res = await fetch(`https://economia.awesomeapi.com.br/last/${keys}`);
      const data = await res.json();
      setCotacoes(data);
    } catch { }
    finally { setCarregando(false); }
  };

  const buscarHistorico = async () => {
    const novo = {};
    await Promise.all(QUOTES.map(async ({ key }) => {
      try {
        const res = await fetch(`https://economia.awesomeapi.com.br/json/daily/${key}/10`);
        const data = await res.json();
        novo[key] = data.reverse().map(d => parseFloat(d.bid));
      } catch { }
    }));
    setHistorico(novo);
  };

  useEffect(() => {
    buscarCotacoes();
    buscarHistorico();
    const id = setInterval(buscarCotacoes, 60000);
    return () => clearInterval(id);
  }, []);

  const acoes = posicoes.filter(p => p.ticker);

  return (
    <div style={{
      display: "flex", gap: "16px", flexWrap: "wrap",
      backgroundColor: "var(--card)", borderRadius: "14px",
      border: "1px solid var(--border)", overflow: "hidden",
      boxShadow: "var(--shadow-md)"
    }}>

      {/* LADO ESQUERDO — MERCADO */}
      <div style={{ flex: "1 1 340px", padding: "18px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 6px #10b981", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--subtext)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Mercado ao vivo
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px", flex: 1 }}>
          {QUOTES.map(({ key, label, flag }) => {
            const normKey = key.replace("-", "");
            const q = cotacoes[normKey];
            const pct = q ? parseFloat(q.pctChange) : null;
            const bid = q ? parseFloat(q.bid) : null;
            const isPositive = pct !== null && pct >= 0;

            return (
              <div key={key} style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: "var(--input)",
                borderRadius: "10px",
                padding: "16px 16px",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}>
                {/* Label topo */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "13px", lineHeight: 1 }}>{flag}</span>
                  <span style={{ fontSize: "11px", color: "var(--subtext)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
                </div>

                {/* Preço + variação */}
                {carregando || !q ? (
                  <div>
                    <div style={{ height: "22px", backgroundColor: "var(--border)", borderRadius: "4px", width: "75%", animation: "pulse 1.5s infinite", marginBottom: "6px" }} />
                    <div style={{ height: "14px", backgroundColor: "var(--border)", borderRadius: "4px", width: "40%", animation: "pulse 1.5s infinite" }} />
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "17px", fontWeight: "700", color: "var(--text)", lineHeight: 1.2 }}>
                      {key.endsWith("BRL")
                        ? `R$ ${bid?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `$ ${bid?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: isPositive ? "#10b981" : "#ef4444", marginTop: "4px" }}>
                      {isPositive ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                    </div>
                  </div>
                )}

                {/* Sparkline */}
                <div style={{ marginTop: "4px" }}>
                  <Sparkline data={historico[key]} isPositive={isPositive ?? true} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DIVISOR */}
      <div style={{ width: "1px", backgroundColor: "var(--border)", margin: "16px 0" }} />

      {/* LADO DIREITO — MINHAS AÇÕES */}
      <div style={{ flex: "1 1 260px", padding: "18px 24px" }}>
        <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--subtext)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>
          Minhas posições
        </div>

        {acoes.length === 0 ? (
          <p style={{ color: "var(--subtext)", fontSize: "13px", margin: 0 }}>
            Adicione posições com ticker para visualizá-las aqui.
          </p>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", gap: "8px",
            maxHeight: "228px", overflowY: acoes.length > 3 ? "auto" : "visible",
            paddingRight: acoes.length > 3 ? "4px" : 0
          }}>
            {acoes.map(p => {
              const resultado = p.valor_atual - p.valor_investido;
              const pct = p.valor_investido > 0 ? (resultado / p.valor_investido) * 100 : 0;
              const isPos = resultado >= 0;
              const tipo = TIPOS.find(t => t.value === p.tipo);

              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  backgroundColor: "var(--input)", borderRadius: "10px",
                  padding: "10px 14px", border: "1px solid var(--border)"
                }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: tipo?.color || "#94a3b8", flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>{p.ticker}</div>
                    <div style={{ fontSize: "11px", color: "var(--subtext)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{fmt(p.valor_atual)}</div>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: isPos ? "#10b981" : "#ef4444" }}>
                      {isPos ? "+" : ""}{pct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}

/* ── Página principal ── */
export default function Investimentos() {
  const [posicoes, setPosicoes] = useState([]);
  const [saldoMensal, setSaldoMensal] = useState([]);
  const [modal, setModal] = useState(null); // null | "novo" | {item}
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { carregar(); carregarSaldoMensal(); }, []);

  const carregar = async () => {
    try { setPosicoes(await listarInvestimentos()); } catch { }
  };

  /* Busca o ano atual e calcula saldo livre por mês (Janeiro → mês atual) */
  const carregarSaldoMensal = async () => {
    try {
      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth(); // 0-indexed

      const inicio = new Date(anoAtual, 0, 1);  // 1 de Janeiro
      const fim    = new Date(agora);

      const gastos = await gastosPorIntervalo(inicio.toISOString(), fim.toISOString());

      const porMes = {};
      gastos.forEach((g) => {
        const d = new Date(g.data_hora);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!porMes[chave]) porMes[chave] = { entradas: 0, saidas: 0 };
        if (g.tipo === "entrada") porMes[chave].entradas += g.valor;
        else if (g.tipo === "saida") porMes[chave].saidas += g.valor;
      });

      const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

      /* Janeiro até o mês atual, zeros para meses sem dados */
      const dados = Array.from({ length: mesAtual + 1 }, (_, i) => {
        const chave = `${anoAtual}-${String(i + 1).padStart(2, "0")}`;
        const v = porMes[chave] || { entradas: 0, saidas: 0 };
        return {
          mes: MESES[i],
          saldo: Math.max(0, v.entradas - v.saidas),
          entradas: v.entradas,
          saidas: v.saidas,
        };
      });

      setSaldoMensal(dados);
    } catch { }
  };

  const handleSave = async (form) => {
    const dados = {
      nome:              form.nome,
      ticker:            form.ticker || null,
      tipo:              form.tipo,
      valor_investido:   Number(form.valor_investido) || 0,
      valor_atual:       Number(form.valor_atual) || 0,
      rentabilidade_mes: Number(form.rentabilidade_mes) || 0,
      rentabilidade_ano: Number(form.rentabilidade_ano) || 0,
    };
    try {
      if (modal?.id) await editarInvestimento(modal.id, dados);
      else await criarInvestimento(dados);
      setModal(null);
      carregar();
    } catch { alert("Erro ao salvar"); }
  };

  const handleDelete = async () => {
    try {
      await deletarInvestimento(confirmDelete);
      setConfirmDelete(null);
      carregar();
    } catch { alert("Erro ao excluir"); }
  };

  /* ── Cálculos ── */
  const patrimonioTotal  = posicoes.reduce((a, p) => a + p.valor_atual, 0);
  const totalInvestido   = posicoes.reduce((a, p) => a + p.valor_investido, 0);
  const resultadoTotal   = patrimonioTotal - totalInvestido;
  const rentMediaMes     = posicoes.length
    ? posicoes.reduce((a, p) => a + p.rentabilidade_mes, 0) / posicoes.length : 0;
  const rentMediaAno     = posicoes.length
    ? posicoes.reduce((a, p) => a + p.rentabilidade_ano, 0) / posicoes.length : 0;

  /* Alocação por tipo */
  const alocacao = TIPOS.map((t) => {
    const total = posicoes.filter((p) => p.tipo === t.value).reduce((a, p) => a + p.valor_atual, 0);
    return { ...t, total, pct: patrimonioTotal ? (total / patrimonioTotal) * 100 : 0 };
  }).filter((t) => t.total > 0);

  const cardStyle = {
    backgroundColor: "var(--card)", borderRadius: "14px",
    padding: "20px 24px", boxShadow: "var(--shadow-md)",
    border: "1px solid var(--border)"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Investimentos</h1>
          <span style={{ color: "var(--subtext)", fontSize: "14px" }}>
            {posicoes.length} {posicoes.length === 1 ? "posição" : "posições"}
          </span>
        </div>
        <button
          onClick={() => setModal("novo")}
          style={{
            backgroundColor: "#10b981", color: "white", border: "none",
            padding: "10px 20px", borderRadius: "10px",
            fontWeight: "600", cursor: "pointer", fontSize: "14px"
          }}
        >
          + Adicionar posição
        </button>
      </div>

      {/* ── MARKET TICKER ── */}
      <MarketTicker posicoes={posicoes} />

      {/* ── PATRIMÔNIO + ALOCAÇÃO ── */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

        {/* Card patrimônio */}
        <div style={{
          flex: "1 1 280px",
          background: "linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%)",
          borderRadius: "16px", padding: "28px 24px",
          color: "white", boxShadow: "0 8px 30px rgba(16,185,129,0.35)"
        }}>
          <div style={{ fontSize: "13px", fontWeight: "500", opacity: 0.85, marginBottom: "8px" }}>
            Patrimônio total
          </div>
          <div style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: "800", letterSpacing: "-1px", marginBottom: "20px" }}>
            {fmt(patrimonioTotal)}
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.75, marginBottom: "4px" }}>Rentab. mês</div>
              <div style={{ fontSize: "16px", fontWeight: "700" }}>{fmtPct(rentMediaMes)}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.75, marginBottom: "4px" }}>Rentab. ano</div>
              <div style={{ fontSize: "16px", fontWeight: "700" }}>{fmtPct(rentMediaAno)}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.75, marginBottom: "4px" }}>Resultado total</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: resultadoTotal >= 0 ? "#d1fae5" : "#fecaca" }}>
                {resultadoTotal >= 0 ? "+" : ""}{fmt(resultadoTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Alocação */}
        <div style={{ ...cardStyle, flex: "1 1 280px" }}>
          <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>Alocação</h3>

          {alocacao.length === 0 ? (
            <p style={{ color: "var(--subtext)", fontSize: "14px" }}>Nenhuma posição cadastrada.</p>
          ) : (
            <>
              {/* Barra de alocação */}
              <div style={{ display: "flex", height: "10px", borderRadius: "99px", overflow: "hidden", marginBottom: "16px" }}>
                {alocacao.map((t) => (
                  <div key={t.value} style={{ width: `${t.pct}%`, backgroundColor: t.color, transition: "width 0.4s" }} />
                ))}
              </div>

              {/* Legenda */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
                {alocacao.map((t) => (
                  <div key={t.value} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: t.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text)", fontWeight: "500" }}>{t.label}</span>
                    <span style={{ color: "var(--subtext)" }}>{t.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>

              {/* Donut */}
              <div style={{ marginTop: "8px" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={alocacao} dataKey="total" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {alocacao.map((t) => <Cell key={t.value} fill={t.color} />)}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={{
                            backgroundColor: "var(--card)", border: "1px solid var(--border)",
                            borderRadius: "10px", padding: "10px 14px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                              <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: d.color }} />
                              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{d.label}</span>
                            </div>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: d.color }}>{fmt(d.total)}</div>
                            <div style={{ fontSize: "11px", color: "var(--subtext)", marginTop: "2px" }}>{d.pct.toFixed(1)}% da carteira</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SOBRA MENSAL ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>
              Dinheiro não gasto por mês
            </h3>
            <span style={{ fontSize: "13px", color: "var(--subtext)" }}>
              O que sobrou de cada mês (ganhos − gastos) — potencial para investir
            </span>
          </div>
          {saldoMensal.length > 0 && (() => {
            const ultimo = saldoMensal[saldoMensal.length - 1]?.saldo || 0;
            const penultimo = saldoMensal[saldoMensal.length - 2]?.saldo || 0;
            const tendencia = penultimo > 0
              ? (((ultimo - penultimo) / penultimo) * 100).toFixed(1)
              : null;
            return tendencia !== null ? (
              <span style={{
                fontSize: "15px", fontWeight: "700",
                color: Number(tendencia) >= 0 ? "#10b981" : "#ef4444"
              }}>
                {Number(tendencia) >= 0 ? "+" : ""}{tendencia}%
              </span>
            ) : null;
          })()}
        </div>

        {saldoMensal.length === 0 ? (
          <p style={{ color: "var(--subtext)", fontSize: "14px", marginTop: "16px" }}>Nenhum dado encontrado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={saldoMensal} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="mes"
                tick={{ fill: "var(--subtext)", fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [fmt(v), "Sobrou"]}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text)",
                  fontSize: "13px"
                }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="saldo" radius={[6, 6, 0, 0]}>
                {saldoMensal.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === saldoMensal.length - 1 ? "#10b981" : "#1e3a5f"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── POSIÇÕES ── */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: "15px", fontWeight: "600" }}>
          Posições
        </h3>

        {posicoes.length === 0 ? (
          <p style={{ color: "var(--subtext)", fontSize: "14px" }}>
            Nenhuma posição cadastrada. Clique em "+ Adicionar posição" para começar.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {posicoes.map((p, i) => {
              const tipo = getTipo(p.tipo);
              const resultado = p.valor_atual - p.valor_investido;
              const positivo = resultado >= 0;
              return (
                <div key={p.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 4px",
                  borderBottom: i < posicoes.length - 1 ? "1px solid var(--border)" : "none"
                }}>
                  {/* Esquerda — ticker + nome */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "12px",
                      backgroundColor: `${tipo.color}20`,
                      border: `1px solid ${tipo.color}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: "700", color: tipo.color, flexShrink: 0
                    }}>
                      {p.ticker || p.nome.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: "600", color: "var(--text)", fontSize: "14px" }}>{p.nome}</div>
                      <div style={{ fontSize: "12px", color: "var(--subtext)", marginTop: "2px" }}>
                        {fmtPct(p.rentabilidade_ano)} ao ano · {tipo.label}
                      </div>
                    </div>
                  </div>

                  {/* Direita — valor + ações */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "700", color: "var(--text)", fontSize: "15px" }}>
                        {fmt(p.valor_atual)}
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: positivo ? "#10b981" : "#ef4444", marginTop: "2px" }}>
                        {positivo ? "+" : ""}{fmt(resultado)}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => setModal(p)}
                        style={{
                          padding: "6px 10px", borderRadius: "8px",
                          border: "1px solid var(--border)", backgroundColor: "transparent",
                          color: "var(--subtext)", cursor: "pointer", display: "flex", alignItems: "center"
                        }}
                      ><Pencil size={14} /></button>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        style={{
                          padding: "6px 10px", borderRadius: "8px",
                          border: "1px solid var(--border)", backgroundColor: "transparent",
                          color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center"
                        }}
                      ><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ADICIONAR/EDITAR ── */}
      {modal && (
        <Modal
          item={modal === "novo" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── MODAL CONFIRMAR DELETE ── */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "var(--card)", borderRadius: "16px", padding: "28px",
            width: "320px", textAlign: "center", boxShadow: "var(--shadow-md)"
          }}>
            <h3 style={{ color: "var(--text)", margin: "0 0 10px" }}>Excluir posição</h3>
            <p style={{ color: "var(--subtext)", margin: "0 0 24px", fontSize: "14px" }}>
              Tem certeza que deseja excluir essa posição?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "1px solid var(--border)", backgroundColor: "transparent",
                  color: "var(--subtext)", fontWeight: "600", cursor: "pointer"
                }}
              >Cancelar</button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: "none", backgroundColor: "#dc2626",
                  color: "white", fontWeight: "700", cursor: "pointer"
                }}
              >Excluir</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
