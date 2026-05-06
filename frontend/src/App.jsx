import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import VerificarEmail from "./pages/VerificarEmail";
import Duo from "./pages/Duo";
import Transacoes from "./pages/Transacoes";
import Importar from "./pages/Importar";
import Relatorios from "./pages/Relatorios";
import Investimentos from "./pages/Investimentos";
import Perfil from "./pages/Perfil";

import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

function App() {

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const temaSalvo = localStorage.getItem("theme");

    if (temaSalvo === "dark") {
      document.body.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setDarkMode(!darkMode);
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* Página inicial pública */}
        <Route path="/" element={<Landing />} />

        <Route path="/login"           element={<Login />} />
        <Route path="/cadastro"        element={<Cadastro />} />
        <Route path="/esqueci-senha"   element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/verificar-email" element={<VerificarEmail />} />

        {/* App autenticado */}
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <Layout toggleTheme={toggleTheme} darkMode={darkMode}>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/app/transacoes"
          element={
            <PrivateRoute>
              <Layout toggleTheme={toggleTheme} darkMode={darkMode}>
                <Transacoes />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/app/relatorios"
          element={
            <PrivateRoute>
              <Layout toggleTheme={toggleTheme} darkMode={darkMode}>
                <Relatorios />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/app/investimentos"
          element={
            <PrivateRoute>
              <Layout toggleTheme={toggleTheme} darkMode={darkMode}>
                <Investimentos />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/app/perfil"
          element={
            <PrivateRoute>
              <Layout toggleTheme={toggleTheme} darkMode={darkMode}>
                <Perfil />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/app/duo"
          element={
            <PrivateRoute>
              <Layout toggleTheme={toggleTheme} darkMode={darkMode}>
                <Duo />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/app/importar"
          element={
            <PrivateRoute>
              <Layout toggleTheme={toggleTheme} darkMode={darkMode}>
                <Importar />
              </Layout>
            </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
