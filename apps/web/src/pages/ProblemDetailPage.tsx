import { useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProblem,
  toggleVote,
  cancelProblem,
  resolveProblem,
  createResolutionProposal,
  rateResolution,
  type ProblemStatus,
} from '../api/problems';
import { uploadMedia } from '../api/media';
import { useAuth } from '../auth/AuthContext';

const STATUS_LABELS: Record<ProblemStatus, string> = {
  open: 'Aberto',
  pending_verification: 'Aguardando verificação',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
};

const VOTE_ERROR_MESSAGE = 'Não foi possível registrar o voto. Tente novamente.';
const CANCEL_ERROR_MESSAGE = 'Não foi possível cancelar o problema. Tente novamente.';
const RESOLVE_ERROR_MESSAGE = 'Não foi possível marcar o problema como resolvido. Tente novamente.';
const PROPOSAL_ERROR_MESSAGE = 'Não foi possível enviar a proposta. Tente novamente.';
const RATING_ERROR_MESSAGE = 'Não foi possível enviar a avaliação. Tente novamente.';

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const problemId = id!;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: problem, isLoading } = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => getProblem(problemId),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['problem', problemId] });
    queryClient.invalidateQueries({ queryKey: ['problems'] });
  }

  const voteMutation = useMutation({ mutationFn: () => toggleVote(problemId), onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: () => cancelProblem(problemId), onSuccess: invalidate });
  const resolveMutation = useMutation({ mutationFn: () => resolveProblem(problemId), onSuccess: invalidate });

  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const proposalMutation = useMutation({
    mutationFn: async (file: File) => {
      const { objectKey } = await uploadMedia(file);
      return createResolutionProposal(problemId, objectKey);
    },
    onSuccess: () => {
      setProposalFile(null);
      invalidate();
    },
    onError: () => setProposalError(PROPOSAL_ERROR_MESSAGE),
  });

  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const ratingMutation = useMutation({
    mutationFn: () => rateResolution(problemId, { score, comment: comment || undefined }),
    onSuccess: invalidate,
  });

  if (isLoading) return <p>Carregando...</p>;
  if (!problem) return <p>Problema não encontrado.</p>;

  const isAuthor = user?.id === problem.authorId;
  const canVote =
    !!user && !isAuthor && (problem.status === 'open' || problem.status === 'pending_verification');
  const canCancel = isAuthor && problem.status === 'open';
  const canResolve = isAuthor && problem.status === 'open';
  const canPropose = !!user && !isAuthor && problem.status === 'open';
  const canRate = isAuthor && problem.status === 'resolved' && !problem.rating;

  function handleProposalSubmit(e: FormEvent) {
    e.preventDefault();
    setProposalError(null);
    if (!proposalFile) {
      setProposalError('Selecione uma foto como evidência.');
      return;
    }
    proposalMutation.mutate(proposalFile);
  }

  return (
    <div>
      <p>
        <Link to="/">Voltar</Link>
      </p>
      <h1>{problem.title}</h1>
      <p>Status: {STATUS_LABELS[problem.status]}</p>
      <p>{problem.description}</p>
      <p>Local: {problem.location}</p>
      <p>{problem.voteCount} voto(s)</p>

      <ul>
        {problem.media.map((m) => (
          <li key={m.id}>
            {m.mediaType === 'image' ? <img src={m.url} alt={problem.title} /> : <video src={m.url} controls />}
          </li>
        ))}
      </ul>

      {canVote && (
        <>
          <button onClick={() => voteMutation.mutate()} disabled={voteMutation.isPending}>
            {problem.hasVoted ? 'Remover voto' : 'Votar'}
          </button>
          {voteMutation.isError && <p role="alert">{VOTE_ERROR_MESSAGE}</p>}
        </>
      )}

      {canCancel && (
        <>
          <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
            Cancelar
          </button>
          {cancelMutation.isError && <p role="alert">{CANCEL_ERROR_MESSAGE}</p>}
        </>
      )}

      {canResolve && (
        <>
          <button onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending}>
            Marcar como resolvido
          </button>
          {resolveMutation.isError && <p role="alert">{RESOLVE_ERROR_MESSAGE}</p>}
        </>
      )}

      {canPropose && (
        <form onSubmit={handleProposalSubmit}>
          <h2>Propor resolução</h2>
          <label htmlFor="proposalFile">Foto de evidência</label>
          <input
            id="proposalFile"
            type="file"
            accept="image/*,video/*"
            onChange={(e) => setProposalFile(e.target.files?.[0] ?? null)}
          />
          {proposalError && <p role="alert">{proposalError}</p>}
          <button type="submit" disabled={proposalMutation.isPending}>
            Enviar proposta
          </button>
        </form>
      )}

      {canRate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ratingMutation.mutate();
          }}
        >
          <h2>Avaliar resolução</h2>
          <label htmlFor="score">Nota</label>
          <select id="score" value={score} onChange={(e) => setScore(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <label htmlFor="comment">Comentário (opcional)</label>
          <textarea id="comment" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />

          {ratingMutation.isError && <p role="alert">{RATING_ERROR_MESSAGE}</p>}

          <button type="submit" disabled={ratingMutation.isPending}>
            Enviar avaliação
          </button>
        </form>
      )}

      {problem.status === 'resolved' && problem.rating && (
        <div>
          <h2>Avaliação</h2>
          <p>Nota: {problem.rating.score}/5</p>
          {problem.rating.comment && <p>{problem.rating.comment}</p>}
        </div>
      )}
    </div>
  );
}
