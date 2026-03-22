import { useState } from "react";
import { cadastro } from "../api/authApi";
import { useNavigate } from "react-router-dom";

function Cadastro() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();

    try {
      await cadastro(email, senha);

      alert("Conta criada com sucesso!");
      navigate("/login");

    } catch (error) {
      alert("Erro ao cadastrar usuário");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Criar conta</h2>

      <form
        onSubmit={handleCadastro}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "200px"
        }}
      >
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
}

export default Cadastro;