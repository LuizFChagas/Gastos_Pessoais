import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const localToken = localStorage.getItem("token");
  const expiry = localStorage.getItem("token_expiry");
  const sessionToken = sessionStorage.getItem("token");

  // Token local expirado → limpa e trata como não autenticado
  if (localToken && expiry && Date.now() > Number(expiry)) {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
    return <Navigate to="/" />;
  }

  const token = localToken || sessionToken;

  if (!token) {
    return <Navigate to="/" />;
  }

  return children;
}

export default PrivateRoute;