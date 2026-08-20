import type { ProblemStatus } from '../api/problems';

export const STATUS_LABELS: Record<ProblemStatus, string> = {
  open: 'Aberto',
  pending_verification: 'Aguardando verificação',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
};

export const STATUS_BADGE_CLASSES: Record<ProblemStatus, string> = {
  open: 'bg-emerald-100 text-emerald-800',
  pending_verification: 'bg-amber-100 text-amber-800',
  resolved: 'bg-indigo-100 text-indigo-800',
  cancelled: 'bg-slate-200 text-slate-600',
};
