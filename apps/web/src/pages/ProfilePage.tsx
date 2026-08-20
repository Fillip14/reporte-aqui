import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMeIndividual, updateMeCompany, deleteMe } from '../api/me';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { LABEL_CLASSES, INPUT_CLASSES } from '../lib/formClasses';

const VERIFICATION_LABELS = {
  pending: 'Verificação pendente',
  approved: 'Verificada',
  rejected: 'Verificação rejeitada',
};

function updateErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.code === 'invalid_input') {
    return 'Verifique os dados informados.';
  }
  return 'Não foi possível salvar as alterações. Tente novamente.';
}

const DELETE_ERROR_MESSAGE = 'Não foi possível excluir a conta. Tente novamente.';

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.individualProfile?.fullName ?? '');
    setCompanyName(profile.companyProfile?.companyName ?? '');
    setCnpj(profile.companyProfile?.cnpj ?? '');
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      profile?.role === 'company' ? updateMeCompany({ companyName, cnpj }) : updateMeIndividual({ fullName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMe,
    onSuccess: async () => {
      await logout();
      navigate('/');
    },
  });

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  function handleDelete() {
    if (window.confirm('Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.')) {
      deleteMutation.mutate();
    }
  }

  if (isLoading) return <p className="text-sm text-slate-500">Carregando...</p>;
  if (!profile) return <p className="text-sm text-slate-500">Não foi possível carregar o perfil.</p>;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900">Meu perfil</h1>
      <p className="mt-1 text-sm text-slate-500">{profile.email}</p>

      {profile.companyProfile && (
        <p className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          {VERIFICATION_LABELS[profile.companyProfile.verificationStatus]}
        </p>
      )}

      {profile.role !== 'admin' && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          {profile.role === 'individual' && (
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
          )}

          {profile.role === 'company' && (
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

          {updateMutation.isError && <Alert>{updateErrorMessage(updateMutation.error)}</Alert>}

          <Button type="submit" disabled={updateMutation.isPending}>
            Salvar alterações
          </Button>
        </form>
      )}

      <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6">
        <Button variant="secondary" onClick={handleLogout}>
          Sair
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
          Excluir conta
        </Button>
      </div>
      {deleteMutation.isError && (
        <div className="mt-3">
          <Alert>{DELETE_ERROR_MESSAGE}</Alert>
        </div>
      )}
    </div>
  );
}
