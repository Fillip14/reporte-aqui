import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProblems, toggleVote, type ProblemStatus } from '../api/problems';
import { useAuth } from '../auth/AuthContext';

const STATUS_LABELS: Record<ProblemStatus, string> = {
  open: 'Aberto',
  pending_verification: 'Aguardando verificação',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
};

export default function FeedPage() {
  const [status, setStatus] = useState<ProblemStatus | ''>('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'top'>('newest');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['problems', { status, q, sort }],
    queryFn: () => listProblems({ status: status || undefined, q: q || undefined, sort }),
  });

  const voteMutation = useMutation({
    mutationFn: toggleVote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['problems'] }),
  });

  return (
    <div>
      <h1>Problemas reportados</h1>

      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search">Buscar</label>
        <input id="search" value={q} onChange={(e) => setQ(e.target.value)} />

        <label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as ProblemStatus | '')}>
          <option value="">Todos</option>
          <option value="open">Aberto</option>
          <option value="pending_verification">Aguardando verificação</option>
          <option value="resolved">Resolvido</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <label htmlFor="sort">Ordenar por</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'top')}>
          <option value="newest">Mais recentes</option>
          <option value="top">Mais votados</option>
        </select>
      </form>

      {user && (
        <p>
          <Link to="/problems/new">Reportar problema</Link>
        </p>
      )}

      {isLoading && <p>Carregando...</p>}
      {isError && <p role="alert">Não foi possível carregar os problemas.</p>}
      {!isLoading && !isError && data?.items.length === 0 && <p>Nenhum problema encontrado.</p>}

      <ul>
        {data?.items.map((problem) => (
          <li key={problem.id}>
            <Link to={`/problems/${problem.id}`}>{problem.title}</Link>
            <span> — {STATUS_LABELS[problem.status]}</span>
            <span> — {problem.voteCount} voto(s)</span>
            {user && user.id !== problem.authorId && (
              <button onClick={() => voteMutation.mutate(problem.id)} disabled={voteMutation.isPending}>
                {problem.hasVoted ? 'Remover voto' : 'Votar'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
