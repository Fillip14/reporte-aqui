import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav>
      <Link to="/">Reporte Aqui</Link>
      {user ? (
        <>
          <Link to="/profile">Meu perfil</Link>
          <Link to="/problems/new">Novo problema</Link>
          <button onClick={handleLogout}>Sair</button>
        </>
      ) : (
        <>
          <Link to="/login">Entrar</Link>
          <Link to="/register">Cadastrar</Link>
        </>
      )}
    </nav>
  );
}
