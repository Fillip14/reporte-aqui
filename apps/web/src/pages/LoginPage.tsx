import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { LABEL_CLASSES, INPUT_CLASSES } from '../lib/formClasses';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await login({ email, password });
      setSession(result);
      navigate('/');
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'invalid_credentials'
          ? 'E-mail ou senha inválidos.'
          : 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className={LABEL_CLASSES}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label htmlFor="password" className={LABEL_CLASSES}>
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          Entrar
        </Button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Não tem conta?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
