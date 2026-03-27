import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Transacoes from "./pages/Transacoes";
import Importar from "./pages/Importar";

import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* CADASTRO */}
        <Route path="/cadastro" element={<Cadastro />} />

        {/* DASHBOARD */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* TRANSAÇÕES */}
        <Route
          path="/transacoes"
          element={
            <PrivateRoute>
              <Layout>
                <Transacoes />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* IMPORTAR */}
        <Route
          path="/importar"
          element={
            <PrivateRoute>
              <Layout>
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