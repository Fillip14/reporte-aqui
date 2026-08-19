import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMeIndividual, updateMeCompany, deleteMe } from '../api/me';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';

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

  if (isLoading) return <p>Carregando...</p>;
  if (!profile) return <p>Não foi possível carregar o perfil.</p>;

  return (
    <div>
      <h1>Meu perfil</h1>
      <p>{profile.email}</p>

      {profile.companyProfile && <p>{VERIFICATION_LABELS[profile.companyProfile.verificationStatus]}</p>}

      {profile.role !== 'admin' && (
        <form onSubmit={handleSubmit}>
          {profile.role === 'individual' && (
            <>
              <label htmlFor="fullName">Nome completo</label>
              <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </>
          )}

          {profile.role === 'company' && (
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

          {updateMutation.isError && <p role="alert">{updateErrorMessage(updateMutation.error)}</p>}

          <button type="submit" disabled={updateMutation.isPending}>
            Salvar alterações
          </button>
        </form>
      )}

      <button onClick={handleLogout}>Sair</button>
      <button onClick={handleDelete} disabled={deleteMutation.isPending}>
        Excluir conta
      </button>
      {deleteMutation.isError && <p role="alert">{DELETE_ERROR_MESSAGE}</p>}
    </div>
  );
}
