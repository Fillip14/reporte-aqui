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
} from '../api/problems';
import { uploadMedia } from '../api/media';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import { LABEL_CLASSES, INPUT_CLASSES } from '../lib/formClasses';

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

  if (isLoading) return <p className="text-sm text-slate-500">Carregando...</p>;
  if (!problem) return <p className="text-sm text-slate-500">Problema não encontrado.</p>;

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
      <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← Voltar
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{problem.title}</h1>
          <StatusBadge status={problem.status} />
        </div>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">{problem.description}</p>
        <p className="mt-3 text-sm text-slate-500">Local: {problem.location}</p>
        <p className="text-sm text-slate-500">{problem.voteCount} voto(s)</p>

        {problem.media.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {problem.media.map((m) => (
              <li key={m.id} className="overflow-hidden rounded-lg border border-slate-200">
                {m.mediaType === 'image' ? (
                  <img src={m.url} alt={problem.title} className="h-32 w-full object-cover" />
                ) : (
                  <video src={m.url} controls className="h-32 w-full object-cover" />
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {canVote && (
            <Button variant="secondary" onClick={() => voteMutation.mutate()} disabled={voteMutation.isPending}>
              {problem.hasVoted ? 'Remover voto' : 'Votar'}
            </Button>
          )}

          {canCancel && (
            <Button variant="danger" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Cancelar
            </Button>
          )}

          {canResolve && (
            <Button onClick={() => resolveMutation.mutate()} disabled={resolveMutation.isPending}>
              Marcar como resolvido
            </Button>
          )}
        </div>

        <div className="mt-2 space-y-2">
          {voteMutation.isError && <Alert>{VOTE_ERROR_MESSAGE}</Alert>}
          {cancelMutation.isError && <Alert>{CANCEL_ERROR_MESSAGE}</Alert>}
          {resolveMutation.isError && <Alert>{RESOLVE_ERROR_MESSAGE}</Alert>}
        </div>
      </div>

      {canPropose && (
        <form onSubmit={handleProposalSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Propor resolução</h2>
          <div className="mt-3">
            <label htmlFor="proposalFile" className={LABEL_CLASSES}>
              Foto de evidência
            </label>
            <input
              id="proposalFile"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setProposalFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-slate-700"
            />
          </div>
          {proposalError && (
            <div className="mt-3">
              <Alert>{proposalError}</Alert>
            </div>
          )}
          <Button type="submit" disabled={proposalMutation.isPending} className="mt-4">
            Enviar proposta
          </Button>
        </form>
      )}

      {canRate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ratingMutation.mutate();
          }}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900">Avaliar resolução</h2>
          <div className="mt-3">
            <label htmlFor="score" className={LABEL_CLASSES}>
              Nota
            </label>
            <select
              id="score"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className={INPUT_CLASSES}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label htmlFor="comment" className={LABEL_CLASSES}>
              Comentário (opcional)
            </label>
            <textarea
              id="comment"
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={INPUT_CLASSES}
              rows={3}
            />
          </div>

          {ratingMutation.isError && (
            <div className="mt-3">
              <Alert>{RATING_ERROR_MESSAGE}</Alert>
            </div>
          )}

          <Button type="submit" disabled={ratingMutation.isPending} className="mt-4">
            Enviar avaliação
          </Button>
        </form>
      )}

      {problem.status === 'resolved' && problem.rating && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Avaliação</h2>
          <p className="mt-2 text-sm text-slate-700">Nota: {problem.rating.score}/5</p>
          {problem.rating.comment && <p className="mt-1 text-sm text-slate-700">{problem.rating.comment}</p>}
        </div>
      )}
    </div>
  );
}
