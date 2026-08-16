import { Navigate } from "react-router-dom";

/* A sessão de verdade é o cookie httpOnly que o backend controla — essa
   checagem é só uma marcação leve (sem dado sensível) pra decidir na hora
   se mostra a rota ou manda pro /login. Se o cookie já tiver expirado, a
   primeira chamada de API vai voltar 401 e o interceptor cuida do resto. */
function PrivateRoute({ children }) {
  const autenticado = localStorage.getItem("finly_auth") || sessionStorage.getItem("finly_auth");

  if (!autenticado) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoute;