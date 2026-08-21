import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Button from './Button';

const NAV_LINK_CLASSES = 'text-sm font-medium text-slate-600 hover:text-slate-900';
const PRIMARY_LINK_CLASSES =
  'inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-indigo-600">
          Reporte Aqui
        </Link>
        <div className="flex items-center gap-5">
          {user ? (
            <>
              <Link to="/profile" className={NAV_LINK_CLASSES}>
                Meu perfil
              </Link>
              <Link to="/problems/new" className={NAV_LINK_CLASSES}>
                Novo problema
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={NAV_LINK_CLASSES}>
                  Admin
                </Link>
              )}
              <Button variant="secondary" onClick={handleLogout}>
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={NAV_LINK_CLASSES}>
                Entrar
              </Link>
              <Link to="/register" className={PRIMARY_LINK_CLASSES}>
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
