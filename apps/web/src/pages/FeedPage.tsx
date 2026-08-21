import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProblems, toggleVote, type ProblemStatus } from '../api/problems';
import { listCompanies } from '../api/companies';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import { LABEL_CLASSES, INPUT_CLASSES } from '../lib/formClasses';

const VOTE_ERROR_MESSAGE = 'Não foi possível registrar o voto. Tente novamente.';

function canVoteOn(problem: { authorId: string; status: ProblemStatus }, userId: string | undefined): boolean {
  return (
    !!userId &&
    userId !== problem.authorId &&
    (problem.status === 'open' || problem.status === 'pending_verification')
  );
}

export default function FeedPage() {
  const [status, setStatus] = useState<ProblemStatus | ''>('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'top'>('newest');
  const [companyId, setCompanyId] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: listCompanies });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['problems', { status, q, sort, companyId }],
    queryFn: () => listProblems({ status: status || undefined, q: q || undefined, sort, companyId: companyId || undefined }),
  });

  const voteMutation = useMutation({
    mutationFn: toggleVote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems'] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Problemas reportados</h1>
        {user && (
          <Link
            to="/problems/new"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Reportar problema
          </Link>
        )}
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <div>
          <label htmlFor="search" className={LABEL_CLASSES}>
            Buscar
          </label>
          <input id="search" value={q} onChange={(e) => setQ(e.target.value)} className={INPUT_CLASSES} />
        </div>

        <div>
          <label htmlFor="status" className={LABEL_CLASSES}>
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProblemStatus | '')}
            className={INPUT_CLASSES}
          >
            <option value="">Todos</option>
            <option value="open">Aberto</option>
            <option value="pending_verification">Aguardando verificação</option>
            <option value="resolved">Resolvido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div>
          <label htmlFor="sort" className={LABEL_CLASSES}>
            Ordenar por
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'top')}
            className={INPUT_CLASSES}
          >
            <option value="newest">Mais recentes</option>
            <option value="top">Mais votados</option>
          </select>
        </div>

        <div>
          <label htmlFor="companyId" className={LABEL_CLASSES}>
            Empresa
          </label>
          <select
            id="companyId"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="">Todas</option>
            {companiesQuery.data?.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="mt-4 space-y-2">
        {isLoading && <p className="text-sm text-slate-500">Carregando...</p>}
        {isError && <Alert>Não foi possível carregar os problemas.</Alert>}
        {!isLoading && !isError && data?.items.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum problema encontrado.</p>
        )}
        {voteMutation.isError && <Alert>{VOTE_ERROR_MESSAGE}</Alert>}
      </div>

      <ul className="mt-4 space-y-3">
        {data?.items.map((problem) => (
          <li
            key={problem.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <Link
                to={`/problems/${problem.id}`}
                className="font-medium text-slate-900 hover:text-indigo-600"
              >
                {problem.title}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <StatusBadge status={problem.status} />
                <span>{problem.voteCount} voto(s)</span>
                {problem.responsibleCompany && <span>· {problem.responsibleCompany.companyName}</span>}
              </div>
            </div>
            {canVoteOn(problem, user?.id) && (
              <Button
                variant="secondary"
                onClick={() => voteMutation.mutate(problem.id)}
                disabled={voteMutation.isPending}
                className="shrink-0"
              >
                {problem.hasVoted ? 'Remover voto' : 'Votar'}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
