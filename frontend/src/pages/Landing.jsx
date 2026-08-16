import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Landing.css";
import { FinlyLogo } from "../components/FinlyLogo";
import {
  Wallet, Utensils, Car, Bell, Gamepad2, Bot, BarChart3,
  ClipboardList, Lightbulb, Settings, FolderOpen, Rocket,
  MousePointer2, Upload,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

/* ——— Planilha branca do Excel, gigante e vazia, que enche de dados e
   vira o app conforme o usuário rola (ver useEffect de scroll em Landing) ——— */
const EXCEL_COLS = ["A", "B", "C", "D", "E", "F"];

const EXCEL_HEADER = [{ t: "Data" }, { t: "Descrição" }, { t: "Categoria" }, { t: "Forma" }, { t: "Valor" }, { t: "Saldo" }];

const EXCEL_BODY_ROWS = [
  [{ t: "01/03" }, { t: "Salário" }, { t: "Renda" }, { t: "Pix" }, { t: "3.200,00" }, { t: "3.200,00" }],
  [{ t: "02/03" }, { t: "Aluguel" }, { t: "Casa" }, { t: "Débito" }, { t: "-1.450,00", neg: true }, { t: "1.750,00" }],
  [{ t: "03/03" }, { t: "Mercado" }, { t: "Alimentação" }, { t: "Débito" }, { t: "-284,50", neg: true }, { t: "1.465,50" }],
  [{ t: "05/03" }, { t: "Uber" }, { t: "Transporte" }, { t: "Crédito" }, { t: "-23,00", neg: true }, { t: "1.442,50", selected: true }],
  [{ t: "06/03" }, { t: "Netflix" }, { t: "Assinaturas" }, { t: "Crédito" }, { t: "-39,90", neg: true }, { t: "1.402,60" }],
  [{ t: "09/03" }, { t: "iFood" }, { t: "??" }, { t: "Crédito" }, { t: "-45,90", neg: true }, { t: "??,??", err: true }],
  [{ t: "10/03" }, { t: "?????" }, { t: "—" }, { t: "—" }, { t: "-???,??", err: true }, { t: "#REF!", err: true }],
  [{ t: "—" }, { t: "cancelado" }, { t: "—" }, { t: "—" }, { t: "-90,00", strike: true }, { t: "—", strike: true }],
  [{ t: "14/03" }, { t: "saque?!" }, { t: "—" }, { t: "—" }, { t: "-300,00", neg: true }, { t: "??,??", err: true }],
];

function ExcelBigMock({ setRowRef, gridRef, flagRef }) {
  return (
    <div className="excel-window excel-window--big">
      <div className="excel-titlebar">
        <div className="excel-dots"><span /><span /><span /></div>
        <span className="excel-filename">gastos_2026_final_v7_usar_esse.xlsx</span>
      </div>

      <div className="excel-formulabar">
        <span className="excel-namebox">D8</span>
        <span className="excel-fx">fx</span>
        <span className="excel-formula-text">=SOMA(E2:E14)</span>
      </div>

      <div className="excel-grid excel-grid--big" ref={gridRef}>
        <div className="sheet-chaos-vignette" ref={flagRef} />
        <div className="excel-colheaders">
          <span className="excel-corner" />
          {EXCEL_COLS.map((c) => <span key={c}>{c}</span>)}
        </div>

        <div className="excel-row excel-row--header">
          <span className="excel-rownum">1</span>
          {EXCEL_HEADER.map((cell, ci) => (
            <span key={ci} className="excel-cell">{cell.t}</span>
          ))}
        </div>

        {EXCEL_BODY_ROWS.map((row, ri) => (
          <div
            className="excel-row"
            key={ri}
            ref={(el) => setRowRef(el, ri)}
            style={{ opacity: 0 }}
          >
            <span className="excel-rownum">{ri + 2}</span>
            {row.map((cell, ci) => (
              <span
                key={ci}
                className={
                  "excel-cell" +
                  (cell.neg ? " neg" : "") +
                  (cell.err ? " err" : "") +
                  (cell.strike ? " strike" : "") +
                  (cell.selected ? " selected" : "")
                }
              >
                {cell.t}
                {cell.err && <i className="excel-err-flag" />}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="excel-sheettabs">
        <span className="active">Gastos</span>
        <span>Cartão</span>
        <span>+</span>
      </div>
    </div>
  );
}

/* ——— Tiny helpers rendered inside the preview card ——— */
function PreviewBalanceCard({ label, value, color }) {
  return (
    <div className="preview-balance-card">
      <div className="preview-balance-label">{label}</div>
      <div className="preview-balance-value" style={{ color }}>{value}</div>
    </div>
  );
}

function PreviewTx({ icon, bg, color, name, cat, value, positive, aiTag }) {
  return (
    <div className="preview-tx">
      <div className="preview-tx-left">
        <div className="preview-tx-icon" style={{ background: bg, color }}>{icon}</div>
        <div>
          <div className="preview-tx-name">{name}</div>
          <div className="preview-tx-cat">
            {cat}
            {aiTag && <span className="preview-tx-ai"><Bot size={9} /> IA</span>}
          </div>
        </div>
      </div>
      <div className="preview-tx-value" style={{ color: positive ? "#10b981" : "#ef4444" }}>
        {value}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feature-icon-wrap">{icon}</div>
      <h3 className="feature-name">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

/* ——— Telas reais do app, em miniatura, pra seção "recursos em ação" ——— */
const REPORT_LEGEND = [
  { label: "Moradia",      pct: 26, color: "#10b981" },
  { label: "Alimentação",  pct: 32, color: "#f97316" },
  { label: "Compras",      pct: 24, color: "#ef4444" },
  { label: "Outros",       pct: 18, color: "#8b5cf6" },
];

function PanelReports() {
  let acc = 0;
  const gradient = REPORT_LEGEND.map((l) => {
    const start = acc;
    acc += l.pct;
    return `${l.color} ${start}% ${acc}%`;
  }).join(", ");
  const bars = [30, 46, 92, 55, 22, 38, 64];

  return (
    <div className="rep-panel">
      <div className="rep-panel-title">Relatórios</div>
      <div className="rep-donut-row">
        <div className="rep-donut" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="rep-donut-hole"><strong>R$6.551</strong><span>total</span></div>
        </div>
        <div className="rep-legend">
          {REPORT_LEGEND.map((l) => (
            <div key={l.label} className="rep-legend-item">
              <span className="rep-dot" style={{ background: l.color }} />
              {l.label}<b>{l.pct}%</b>
            </div>
          ))}
        </div>
      </div>
      <div className="rep-bars-label">Gastos por dia</div>
      <div className="rep-bars">
        {bars.map((h, i) => (
          <div key={i} className="rep-bar" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

const TX_ROWS = [
  { name: "Grelha Burguer", bank: "Nubank",  pay: "Débito",  payColor: "#eab308", cat: "Lazer",        catColor: "#8b5cf6", value: "-R$15,00" },
  { name: "Sapore Cr",      bank: "Nubank",  pay: "Débito",  payColor: "#eab308", cat: "Alimentação",  catColor: "#f97316", value: "-R$4,50" },
  { name: "99Food",         bank: "Nubank",  pay: "Crédito", payColor: "#3b82f6", cat: "Alimentação",  catColor: "#f97316", value: "-R$24,68" },
];

function PanelTransactions() {
  return (
    <div className="tx-panel">
      <div className="tx-panel-title">Transações</div>
      <div className="tx-filters">
        {["Todos", "Entradas", "Saídas", "Pix"].map((f, i) => (
          <span key={f} className={"tx-filter" + (i === 0 ? " active" : "")}>{f}</span>
        ))}
      </div>
      {TX_ROWS.map((tx) => (
        <div key={tx.name} className="tx-row">
          <div className="tx-row-info">
            <div className="tx-row-name">{tx.name}</div>
            <div className="tx-row-bank">{tx.bank}</div>
          </div>
          <div className="tx-row-pills">
            <span className="tx-pill" style={{ color: tx.payColor, borderColor: tx.payColor + "55" }}>{tx.pay}</span>
            <span className="tx-pill" style={{ color: tx.catColor, borderColor: tx.catColor + "55" }}>{tx.cat}</span>
          </div>
          <div className="tx-row-value">{tx.value}</div>
        </div>
      ))}
    </div>
  );
}

function PanelImport() {
  return (
    <div className="imp-panel">
      <div className="imp-panel-title">Importar extrato</div>
      <div className="imp-dropzone">
        <Upload size={20} />
        <span>Arraste ou clique para importar</span>
        <small>Suporta CSV do seu banco</small>
      </div>
      <div className="imp-history">
        {["Nubank_2026-05-08.csv", "NU_extrato_fevereiro.csv"].map((f) => (
          <div key={f} className="imp-file">
            <ClipboardList size={13} />
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Barra de título compartilhada pelas telas do "notebook" (Excel tem a sua própria) */
function ScreenChrome({ label }) {
  return (
    <div className="app-titlebar">
      <div className="excel-dots"><span /><span /><span /></div>
      <span className="app-urlbar">{label}</span>
    </div>
  );
}

function DashboardScreen({ cursorRef, cursorAnchorRef }) {
  return (
    <div className="app-screen">
      <ScreenChrome label="app.finly.com.br/dashboard" />
      <div className="app-screen-body">
        <div className="hero-preview">
          <div className="preview-main">
            <div className="preview-header">
              <span className="preview-title">Dashboard</span>
              <span className="preview-month" ref={cursorAnchorRef}>
                Abril 2026
                <span className="preview-cursor" ref={cursorRef}>
                  <MousePointer2 size={16} />
                </span>
              </span>
            </div>

            <div className="preview-balance-row">
              <PreviewBalanceCard label="Entradas" value="R$4.250"  color="#10b981" />
              <PreviewBalanceCard label="Saídas"   value="R$2.890"  color="#ef4444" />
              <PreviewBalanceCard label="Saldo"    value="+R$1.360" color="#3b82f6" />
            </div>

            <div className="preview-transactions">
              <PreviewTx
                icon={<Wallet size={15} />} bg="rgba(16,185,129,0.15)" color="#10b981"
                name="Salário"     cat="Salário"      value="+R$4.250" positive
              />
              <PreviewTx
                icon={<Utensils size={15} />} bg="rgba(249,115,22,0.15)" color="#f97316"
                name="iFood"       cat="Alimentação"  value="-R$45,90" aiTag
              />
              <PreviewTx
                icon={<Car size={15} />} bg="rgba(59,130,246,0.15)" color="#3b82f6"
                name="Uber"        cat="Transporte"   value="-R$23,00"
              />
              <PreviewTx
                icon={<Bell size={15} />} bg="rgba(14,165,233,0.15)" color="#0ea5e9"
                name="Netflix"     cat="Assinaturas"  value="-R$39,90"
              />
            </div>
          </div>

          {/* Floating category breakdown card */}
          <div className="preview-float-card">
            <div className="preview-float-title">Por categoria</div>
            {[
              { Icon: Utensils, label: "Alimentação", pct: "32%", color: "#f97316", w: "32%" },
              { Icon: Car,      label: "Transporte",  pct: "18%", color: "#3b82f6", w: "18%" },
              { Icon: Gamepad2, label: "Lazer",        pct: "24%", color: "#8b5cf6", w: "24%" },
              { Icon: Bell,     label: "Assinaturas",  pct: "14%", color: "#0ea5e9", w: "14%" },
            ].map((item) => (
              <div key={item.label} className="preview-cat-item">
                <item.Icon size={14} color={item.color} />
                <div className="preview-cat-bar-bg">
                  <div
                    className="preview-cat-bar-fill"
                    style={{ width: item.w, background: item.color }}
                  />
                </div>
                <span className="preview-cat-pct">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsScreen() {
  return (
    <div className="app-screen">
      <ScreenChrome label="app.finly.com.br/relatorios" />
      <div className="app-screen-body"><PanelReports /></div>
    </div>
  );
}

function TransactionsScreen() {
  return (
    <div className="app-screen">
      <ScreenChrome label="app.finly.com.br/transacoes" />
      <div className="app-screen-body"><PanelTransactions /></div>
    </div>
  );
}

function ImportScreen() {
  return (
    <div className="app-screen">
      <ScreenChrome label="app.finly.com.br/importar" />
      <div className="app-screen-body"><PanelImport /></div>
    </div>
  );
}

const STORY_LINES = [
  "Sua planilha, mês após mês.",
  "Fica impossível de entender.",
  "Do caos ao controle.",
  "Tudo automático.",
  "Poucos toques, sem esforço.",
  "E já está tudo resolvido.",
];

/* ——— Main Landing ——— */
function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const storyLeftRef = useRef(null);
  const storyRightRef = useRef(null);
  const ctaRef = useRef(null);
  const storyRef = useRef(null);
  const storyStickyRef = useRef(null);
  const excelGridRef = useRef(null);
  const vignetteRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorAnchorRef = useRef(null);
  const scanLineRef = useRef(null);
  const rowRefs = useRef([]);
  const setRowRef = (el, i) => { rowRefs.current[i] = el; };
  const lineRefs = useRef([]);
  const setLineRef = (el, i) => { lineRefs.current[i] = el; };
  const screenRefs = useRef([]);
  const setScreenRef = (el, i) => { screenRefs.current[i] = el; };

  /* Redirect if already logged in */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/app");
  }, [navigate]);

  /* Scroll-triggered animations via IntersectionObserver */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    const cards = featuresRef.current?.querySelectorAll(".feature-card") || [];
    cards.forEach((el) => observer.observe(el));

    if (storyLeftRef.current)  observer.observe(storyLeftRef.current);
    if (storyRightRef.current) observer.observe(storyRightRef.current);
    if (ctaRef.current)        observer.observe(ctaRef.current);

    return () => observer.disconnect();
  }, []);

  /* A história inteira dentro da tela do notebook: a planilha enche de
     dados e fica confusa, aí a tela "atualiza" (efeito scan-line) e passa
     pro dashboard, relatórios, transações e importação, uma de cada vez.
     O headline ao lado acende linha a linha, tudo amarrado 1:1 no scroll
     (scrub), com a seção pinada (pin) do início ao fim. */
  useEffect(() => {
    const totalRows = EXCEL_BODY_ROWS.length;

    /* fases da história — não precisam somar 1, o GSAP mapeia a distância
       de scroll inteira pra duração total da timeline automaticamente */
    const HOLD_END = 0.05;      // planilha parada e vazia
    const FILL_END = 0.26;      // vai enchendo de dados conforme rola
    const CHAOS_END = 0.32;     // pausa curta no pico da bagunça
    const WIPE1_START = 0.32; const WIPE1_END = 0.40; // planilha -> dashboard
    const WIPE2_START = 0.52; const WIPE2_END = 0.60; // dashboard -> relatórios
    const WIPE3_START = 0.70; const WIPE3_END = 0.78; // relatórios -> transações
    const WIPE4_START = 0.88; const WIPE4_END = 0.96; // transações -> importar
    const END = 1.06;

    const rowDuration = 0.13;
    const rowStagger = (FILL_END - HOLD_END - rowDuration) / Math.max(1, totalRows - 1);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: storyStickyRef.current,
          start: "top top",
          end: () => "+=" + Math.round(window.innerHeight * (window.innerWidth <= 960 ? 3.4 : 4.2)),
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      /* preenche as linhas conforme o usuário rola */
      tl.fromTo(
        rowRefs.current,
        { opacity: 0, y: 14, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: rowDuration, stagger: rowStagger, ease: "none" },
        HOLD_END
      );

      /* vinheta vermelha crescendo — a planilha fica confusa */
      tl.fromTo(vignetteRef.current, { opacity: 0 }, { opacity: 0.7, duration: CHAOS_END - HOLD_END, ease: "none" }, HOLD_END);
      tl.fromTo(excelGridRef.current, { skewY: 0 }, { skewY: 0.8, duration: CHAOS_END - HOLD_END, ease: "none" }, HOLD_END);

      /* transição "atualização de tela": uma faixa de luz varre a tela de
         cima pra baixo revelando a próxima, como se o notebook trocasse
         de aba — a tela anterior fica embaixo e some coberta */
      const wipe = (screenIndex, start, end) => {
        const el = screenRefs.current[screenIndex];
        if (!el) return;
        tl.fromTo(el, { clipPath: "inset(0% 0 100% 0)" }, { clipPath: "inset(0% 0 0% 0)", duration: end - start, ease: "none" }, start);
        if (scanLineRef.current) {
          tl.fromTo(scanLineRef.current, { top: "0%", opacity: 0.95 }, { top: "100%", duration: end - start, ease: "none" }, start);
          tl.set(scanLineRef.current, { opacity: 0 }, end);
        }
      };

      wipe(1, WIPE1_START, WIPE1_END); // dashboard chega
      wipe(2, WIPE2_START, WIPE2_END); // relatórios
      wipe(3, WIPE3_START, WIPE3_END); // transações
      wipe(4, WIPE4_START, WIPE4_END); // importar

      /* cursor "clicando" no filtro de mês, logo que o dashboard assenta */
      tl.fromTo(cursorRef.current, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.02, ease: "none" }, WIPE1_END + 0.03);
      tl.to(cursorRef.current, { scale: 0.8, duration: 0.015, ease: "none" }, WIPE1_END + 0.07)
        .to(cursorRef.current, { scale: 1, duration: 0.015, ease: "none" }, WIPE1_END + 0.09);

      /* headline: cada linha aparece inteira no momento certo da história,
         nada aparece antes disso — sem estado fantasma/transparente */
      const lineStarts = [0.01, FILL_END, WIPE1_START + 0.02, WIPE2_START + 0.02, WIPE3_START + 0.02, WIPE4_START + 0.02];
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        el.textContent = STORY_LINES[i];
        tl.fromTo(el,
          { opacity: 0 },
          { opacity: 1, duration: 0.05, ease: "none" },
          lineStarts[i]
        );
      });

      tl.to({}, { duration: END - WIPE4_END }); // segura a última tela por um instante
    }, storyRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-root">

      {/* ===== NAVBAR ===== */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <FinlyLogo size={32} />
          Finly
        </div>
        <div className="landing-nav-links">
          <Link to="/login"    className="nav-btn-outline">Entrar</Link>
          <Link to="/cadastro" className="nav-btn-green">Criar conta</Link>
        </div>
      </nav>

      {/* ===== HERO — só o texto, limpo ===== */}
      <section className="hero">
        <div className="hero-glow-left" />
        <div className="hero-glow-right" />

        <div className="hero-inner hero-inner--solo">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Controle financeiro com IA
          </div>

          <h1 className="hero-title">
            Suas finanças,<br />
            <span className="accent">finalmente</span><br />
            no lugar certo.
          </h1>

          <p className="hero-subtitle">
            Importe seus extratos bancários e deixe a IA categorizar cada gasto
            automaticamente. Você acompanha tudo num dashboard elegante, sem
            planilha e sem dor de cabeça.
          </p>

          <div className="hero-buttons">
            <Link to="/cadastro" className="btn-primary">
              Começar grátis →
            </Link>
            <Link to="/login" className="btn-ghost">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ===== A HISTÓRIA NO NOTEBOOK — seção única com scroll fixo (pin via GSAP) ===== */}
      <section className="story-scroll" ref={storyRef}>
        <div className="story-scroll-sticky" ref={storyStickyRef}>
          <div className="story-scroll-inner">

            <div className="story-headline">
              {STORY_LINES.map((line, i) => (
                <span key={line} className="story-line" ref={(el) => setLineRef(el, i)} />
              ))}
            </div>

            <div className="story-laptop-wrap">
              <div className="laptop">
                <div className="laptop-screen-frame">
                  <div className="laptop-notch" />
                  <div className="laptop-screen">
                    <div className="screen-panel" ref={(el) => setScreenRef(el, 0)}>
                      <ExcelBigMock setRowRef={setRowRef} gridRef={excelGridRef} flagRef={vignetteRef} />
                    </div>
                    <div className="screen-panel" ref={(el) => setScreenRef(el, 1)} style={{ clipPath: "inset(0% 0 100% 0)" }}>
                      <DashboardScreen cursorRef={cursorRef} cursorAnchorRef={cursorAnchorRef} />
                    </div>
                    <div className="screen-panel" ref={(el) => setScreenRef(el, 2)} style={{ clipPath: "inset(0% 0 100% 0)" }}>
                      <ReportsScreen />
                    </div>
                    <div className="screen-panel" ref={(el) => setScreenRef(el, 3)} style={{ clipPath: "inset(0% 0 100% 0)" }}>
                      <TransactionsScreen />
                    </div>
                    <div className="screen-panel" ref={(el) => setScreenRef(el, 4)} style={{ clipPath: "inset(0% 0 100% 0)" }}>
                      <ImportScreen />
                    </div>
                    <div className="scan-line" ref={scanLineRef} />
                  </div>
                </div>
                <div className="laptop-base" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features-wrapper">
        <div className="features-inner" ref={featuresRef}>
          <div className="section-eyebrow">Funcionalidades</div>
          <h2 className="section-heading">
            Tudo que você precisa<br />em um só lugar
          </h2>
          <p className="section-sub">
            Desenvolvido para quem quer ter controle real do dinheiro,
            sem complicação e sem aprender uma nova ferramenta do zero.
          </p>

          <div className="features-grid">
            <FeatureCard
              icon={<Bot size={24} color="#10b981" />}
              title="Categorização com IA"
              desc="Nossa IA lê o nome de cada transação e já classifica em alimentação, transporte, lazer, assinaturas e muito mais. Você não precisa fazer nada."
            />
            <FeatureCard
              icon={<BarChart3 size={24} color="#10b981" />}
              title="Dashboard Visual"
              desc="Gráficos por categoria e por dia, cards de saldo, filtros por mês, semana ou período personalizado. Entenda seus padrões de consumo de uma olhada só."
            />
            <FeatureCard
              icon={<ClipboardList size={24} color="#10b981" />}
              title="Importação de Extrato"
              desc="Faça upload do CSV do seu banco com um clique. O sistema processa, categoriza e registra tudo automaticamente. Histórico completo de importações salvo."
            />
          </div>
        </div>
      </section>

      {/* ===== STORY ===== */}
      <section className="story-section">
        <div className="story-inner">

          <div className="story-left" ref={storyLeftRef}>
            <div className="section-eyebrow">A história</div>
            <h2 className="section-heading">
              Uma ideia que<br />nasceu de planilhas
            </h2>
            <p className="story-body">
              Tudo começou com uma planilha cheia de fórmulas, tentando entender
              para onde o dinheiro estava indo todo mês. Depois de muito tempo
              registrando cada gasto na mão, veio a vontade de criar algo mais
              inteligente, mais visual e automatizado, feito do zero.
              <br /><br />
              O Finly nasceu de uma necessidade real. Construímos com FastAPI
              no backend, React no frontend e uma IA que aprende com os seus
              dados para categorizar tudo sozinha. Uma ferramenta pessoal que
              virou um projeto de verdade.
            </p>
          </div>

          <div className="story-right" ref={storyRightRef}>
            <div className="timeline">
              {[
                {
                  Icon: Lightbulb,
                  title: "A ideia surgiu",
                  desc: "Cansados de planilhas e apps complicados, decidimos criar algo próprio, simples, bonito e eficiente.",
                },
                {
                  Icon: Settings,
                  title: "O desenvolvimento",
                  desc: "Backend em FastAPI com PostgreSQL, frontend em React, e uma IA baseada em palavras-chave para categorização automática.",
                },
                {
                  Icon: BarChart3,
                  title: "O dashboard",
                  desc: "Gráficos por categoria e por dia com Recharts, filtros por mês e período, saldo em tempo real.",
                },
                {
                  Icon: FolderOpen,
                  title: "Importação de extratos",
                  desc: "Upload de CSV bancário com processamento automático, suporte a múltiplos bancos e histórico de importações.",
                },
                {
                  Icon: Rocket,
                  title: "Evoluindo sempre",
                  desc: "Novas categorias, mais inteligência, melhores visualizações. O projeto cresce a cada versão.",
                },
              ].map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" style={{ color: "#10b981" }}><item.Icon size={15} /></div>
                  <div className="timeline-content">
                    <div className="timeline-title">{item.title}</div>
                    <p className="timeline-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="cta-section" ref={ctaRef}>
        <div className="cta-glow" />
        <h2 className="cta-title">
          Pronto para ter<br />controle de verdade?
        </h2>
        <p className="cta-subtitle">
          Crie sua conta gratuitamente e comece a entender
          seus gastos hoje mesmo. Sem cartão, sem complicação.
        </p>
        <div className="cta-buttons">
          <Link to="/cadastro" className="btn-primary">
            Criar conta grátis →
          </Link>
          <Link to="/login" className="btn-ghost">
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <div className="logo-icon" style={{ width: 28, height: 28, borderRadius: 8, color: "white" }}><Wallet size={14} /></div>
          Finly
        </div>
        <span className="footer-text">
          Feito com código, design e vontade de ter controle financeiro de verdade.
        </span>
      </footer>

    </div>
  );
}

export default Landing;
