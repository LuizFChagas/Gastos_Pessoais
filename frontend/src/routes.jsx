import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Transacoes from "./pages/Transacoes";
import Importar from "./pages/Importar";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transacoes" element={<Transacoes />} />
          <Route path="/importar" element={<Importar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;