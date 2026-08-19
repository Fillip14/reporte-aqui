import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerIndividual, registerCompany } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type AccountType = 'individual' | 'company';

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'email_already_registered':
        return 'Este e-mail já está cadastrado.';
      case 'cnpj_already_registered':
        return 'Este CNPJ já está cadastrado.';
      case 'invalid_input':
        return 'Verifique os dados informados.';
      default:
        return 'Não foi possível completar o cadastro. Tente novamente.';
    }
  }
  return 'Não foi possível completar o cadastro. Tente novamente.';
}

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result =
        accountType === 'individual'
          ? await registerIndividual({ email, password, fullName })
          : await registerCompany({ email, password, companyName, cnpj });
      setSession(result);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Tipo de conta</legend>
          <label>
            <input
              type="radio"
              name="accountType"
              value="individual"
              checked={accountType === 'individual'}
              onChange={() => setAccountType('individual')}
            />
            Pessoa física
          </label>
          <label>
            <input
              type="radio"
              name="accountType"
              value="company"
              checked={accountType === 'company'}
              onChange={() => setAccountType('company')}
            />
            Empresa
          </label>
        </fieldset>

        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {accountType === 'individual' ? (
          <>
            <label htmlFor="fullName">Nome completo</label>
            <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </>
        ) : (
          <>
            <label htmlFor="companyName">Nome da empresa</label>
            <input
              id="companyName"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <label htmlFor="cnpj">CNPJ</label>
            <input
              id="cnpj"
              required
              pattern="\d{14}"
              maxLength={14}
              inputMode="numeric"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
            />
          </>
        )}

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          Criar conta
        </button>
      </form>

      <p>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
