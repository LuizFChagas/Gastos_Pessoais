import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Landing.css";
import { FinlyLogo } from "../components/FinlyLogo";

/* ——— Tiny helpers rendered inside the preview card ——— */
function PreviewBalanceCard({ label, value, color }) {
  return (
    <div className="preview-balance-card">
      <div className="preview-balance-label">{label}</div>
      <div className="preview-balance-value" style={{ color }}>{value}</div>
    </div>
  );
}

function PreviewTx({ icon, bg, name, cat, value, positive }) {
  return (
    <div className="preview-tx">
      <div className="preview-tx-left">
        <div className="preview-tx-icon" style={{ background: bg }}>{icon}</div>
        <div>
          <div className="preview-tx-name">{name}</div>
          <div className="preview-tx-cat">{cat}</div>
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

/* ——— Main Landing ——— */
function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const storyLeftRef = useRef(null);
  const storyRightRef = useRef(null);
  const ctaRef = useRef(null);

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

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-glow-left" />
        <div className="hero-glow-right" />

        <div className="hero-inner">

          {/* Left — text */}
          <div className="hero-text">
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
              Importe seus extratos bancários, deixe a IA categorizar cada gasto
              automaticamente e acompanhe tudo num dashboard elegante — sem planilhas,
              sem dor de cabeça.
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

          {/* Right — mock app preview */}
          <div className="hero-preview">
            <div className="preview-main">
              <div className="preview-header">
                <span className="preview-title">Dashboard</span>
                <span className="preview-month">Abril 2026</span>
              </div>

              <div className="preview-balance-row">
                <PreviewBalanceCard label="Entradas" value="R$4.250"  color="#10b981" />
                <PreviewBalanceCard label="Saídas"   value="R$2.890"  color="#ef4444" />
                <PreviewBalanceCard label="Saldo"    value="+R$1.360" color="#3b82f6" />
              </div>

              <div className="preview-transactions">
                <PreviewTx
                  icon="💰" bg="rgba(16,185,129,0.15)"
                  name="Salário"     cat="Salário"      value="+R$4.250" positive
                />
                <PreviewTx
                  icon="🍔" bg="rgba(249,115,22,0.15)"
                  name="iFood"       cat="Alimentação"  value="-R$45,90"
                />
                <PreviewTx
                  icon="🚗" bg="rgba(59,130,246,0.15)"
                  name="Uber"        cat="Transporte"   value="-R$23,00"
                />
                <PreviewTx
                  icon="🔔" bg="rgba(14,165,233,0.15)"
                  name="Netflix"     cat="Assinaturas"  value="-R$39,90"
                />
              </div>
            </div>

            {/* Floating category breakdown card */}
            <div className="preview-float-card">
              <div className="preview-float-title">Por categoria</div>
              {[
                { icon: "🍔", label: "Alimentação", pct: "32%", color: "#f97316", w: "32%" },
                { icon: "🚗", label: "Transporte",  pct: "18%", color: "#3b82f6", w: "18%" },
                { icon: "🎮", label: "Lazer",        pct: "24%", color: "#8b5cf6", w: "24%" },
                { icon: "🔔", label: "Assinaturas",  pct: "14%", color: "#0ea5e9", w: "14%" },
              ].map((item) => (
                <div key={item.label} className="preview-cat-item">
                  <span style={{ fontSize: "14px" }}>{item.icon}</span>
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
              icon="🤖"
              title="Categorização com IA"
              desc="Nossa IA lê o nome de cada transação e classifica automaticamente em alimentação, transporte, lazer, assinaturas e muito mais — sem você precisar fazer nada."
            />
            <FeatureCard
              icon="📊"
              title="Dashboard Visual"
              desc="Gráficos por categoria e por dia, cards de saldo, filtros por mês, semana ou período personalizado. Entenda seus padrões de consumo de uma olhada só."
            />
            <FeatureCard
              icon="📋"
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
              Tudo começou com uma planilha cheia de fórmulas tentando entender
              para onde o dinheiro estava indo todo mês. Depois de muito tempo
              registrando cada gasto manualmente, surgiu a vontade de criar algo
              mais inteligente — mais visual, mais automatizado e feito do zero.
              <br /><br />
              O Finly nasceu assim: de uma necessidade real. Construído com
              FastAPI no backend, React no frontend e uma IA que aprende com
              os seus dados para categorizar automaticamente. Uma ferramenta
              pessoal que virou um projeto de verdade.
            </p>
          </div>

          <div className="story-right" ref={storyRightRef}>
            <div className="timeline">
              {[
                {
                  icon: "💡",
                  title: "A ideia surgiu",
                  desc: "Cansados de planilhas e apps complicados, decidimos criar algo próprio — simples, bonito e eficiente.",
                },
                {
                  icon: "⚙️",
                  title: "O desenvolvimento",
                  desc: "Backend em FastAPI com PostgreSQL, frontend em React, e uma IA baseada em palavras-chave para categorização automática.",
                },
                {
                  icon: "📊",
                  title: "O dashboard",
                  desc: "Gráficos por categoria e por dia com Recharts, filtros por mês e período, saldo em tempo real.",
                },
                {
                  icon: "📁",
                  title: "Importação de extratos",
                  desc: "Upload de CSV bancário com processamento automático, suporte a múltiplos bancos e histórico de importações.",
                },
                {
                  icon: "🚀",
                  title: "Evoluindo sempre",
                  desc: "Novas categorias, mais inteligência, melhores visualizações. O projeto cresce a cada versão.",
                },
              ].map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot">{item.icon}</div>
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
          <div className="logo-icon" style={{ width: 28, height: 28, fontSize: 14, borderRadius: 8 }}>💰</div>
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
