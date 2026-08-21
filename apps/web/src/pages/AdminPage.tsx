import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPendingCompanies,
  approveCompany,
  rejectCompany,
  listPendingResolutionProposals,
  approveResolutionProposal,
  rejectResolutionProposal,
} from '../api/admin';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { LABEL_CLASSES, INPUT_CLASSES } from '../lib/formClasses';

const COMPANY_ACTION_ERROR = 'Não foi possível atualizar a empresa. Tente novamente.';
const PROPOSAL_ACTION_ERROR = 'Não foi possível atualizar a proposta. Tente novamente.';

export default function AdminPage() {
  const queryClient = useQueryClient();

  const companiesQuery = useQuery({ queryKey: ['admin', 'companies'], queryFn: listPendingCompanies });
  const proposalsQuery = useQuery({ queryKey: ['admin', 'proposals'], queryFn: listPendingResolutionProposals });

  function invalidateCompanies() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
  }
  function invalidateProposals() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'proposals'] });
  }

  const approveCompanyMutation = useMutation({ mutationFn: approveCompany, onSuccess: invalidateCompanies });
  const rejectCompanyMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectCompany(id, reason),
    onSuccess: invalidateCompanies,
  });

  const approveProposalMutation = useMutation({
    mutationFn: approveResolutionProposal,
    onSuccess: invalidateProposals,
  });
  const rejectProposalMutation = useMutation({
    mutationFn: rejectResolutionProposal,
    onSuccess: invalidateProposals,
  });

  const [rejectingCompanyId, setRejectingCompanyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  function startRejectCompany(id: string) {
    setRejectingCompanyId(id);
    setRejectReason('');
  }

  function confirmRejectCompany() {
    if (!rejectingCompanyId || !rejectReason.trim()) return;
    rejectCompanyMutation.mutate(
      { id: rejectingCompanyId, reason: rejectReason },
      { onSuccess: () => setRejectingCompanyId(null) },
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Administração</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900">Empresas pendentes</h2>
        {companiesQuery.isLoading && <p className="mt-2 text-sm text-slate-500">Carregando...</p>}
        {companiesQuery.isError && (
          <div className="mt-2">
            <Alert>Não foi possível carregar as empresas pendentes.</Alert>
          </div>
        )}
        {companiesQuery.data?.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">Nenhuma empresa pendente.</p>
        )}

        <ul className="mt-3 space-y-3">
          {companiesQuery.data?.map((company) => (
            <li key={company.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">{company.companyName}</p>
              <p className="text-sm text-slate-500">CNPJ: {company.cnpj}</p>
              <p className="text-sm text-slate-500">{company.user.email}</p>

              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  onClick={() => approveCompanyMutation.mutate(company.id)}
                  disabled={approveCompanyMutation.isPending}
                >
                  Aprovar
                </Button>
                <Button variant="danger" onClick={() => startRejectCompany(company.id)}>
                  Rejeitar
                </Button>
              </div>

              {rejectingCompanyId === company.id && (
                <div className="mt-3">
                  <label htmlFor={`reject-reason-${company.id}`} className={LABEL_CLASSES}>
                    Motivo da rejeição
                  </label>
                  <textarea
                    id={`reject-reason-${company.id}`}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className={INPUT_CLASSES}
                    rows={2}
                  />
                  <Button
                    variant="danger"
                    className="mt-2"
                    onClick={confirmRejectCompany}
                    disabled={rejectCompanyMutation.isPending || !rejectReason.trim()}
                  >
                    Confirmar rejeição
                  </Button>
                </div>
              )}

              {rejectCompanyMutation.isError && rejectingCompanyId === company.id && (
                <div className="mt-2">
                  <Alert>{COMPANY_ACTION_ERROR}</Alert>
                </div>
              )}
            </li>
          ))}
        </ul>

        {approveCompanyMutation.isError && (
          <div className="mt-2">
            <Alert>{COMPANY_ACTION_ERROR}</Alert>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Propostas de resolução pendentes</h2>
        {proposalsQuery.isLoading && <p className="mt-2 text-sm text-slate-500">Carregando...</p>}
        {proposalsQuery.isError && (
          <div className="mt-2">
            <Alert>Não foi possível carregar as propostas pendentes.</Alert>
          </div>
        )}
        {proposalsQuery.data?.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">Nenhuma proposta pendente.</p>
        )}

        <ul className="mt-3 space-y-3">
          {proposalsQuery.data?.map((proposal) => (
            <li key={proposal.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">{proposal.problem.title}</p>
              <a
                href={proposal.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Ver evidência
              </a>

              <div className="mt-3 flex flex-wrap gap-3">
                <Button
                  onClick={() => approveProposalMutation.mutate(proposal.id)}
                  disabled={approveProposalMutation.isPending}
                >
                  Aprovar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => rejectProposalMutation.mutate(proposal.id)}
                  disabled={rejectProposalMutation.isPending}
                >
                  Rejeitar
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {(approveProposalMutation.isError || rejectProposalMutation.isError) && (
          <div className="mt-2">
            <Alert>{PROPOSAL_ACTION_ERROR}</Alert>
          </div>
        )}
      </section>
    </div>
  );
}
