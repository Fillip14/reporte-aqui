import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerIndividual, registerCompany } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { LABEL_CLASSES, INPUT_CLASSES } from '../lib/formClasses';

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
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Criar conta</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <fieldset className="space-y-2">
          <legend className={LABEL_CLASSES}>Tipo de conta</legend>
          <div className="flex gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="accountType"
                value="individual"
                checked={accountType === 'individual'}
                onChange={() => setAccountType('individual')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              Pessoa física
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="accountType"
                value="company"
                checked={accountType === 'company'}
                onChange={() => setAccountType('company')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              Empresa
            </label>
          </div>
        </fieldset>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        {accountType === 'individual' ? (
          <div>
            <label htmlFor="fullName" className={LABEL_CLASSES}>
              Nome completo
            </label>
            <input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={INPUT_CLASSES}
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="companyName" className={LABEL_CLASSES}>
                Nome da empresa
              </label>
              <input
                id="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label htmlFor="cnpj" className={LABEL_CLASSES}>
                CNPJ
              </label>
              <input
                id="cnpj"
                required
                pattern="\d{14}"
                maxLength={14}
                inputMode="numeric"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>
          </>
        )}

        {error && <Alert>{error}</Alert>}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          Criar conta
        </Button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
