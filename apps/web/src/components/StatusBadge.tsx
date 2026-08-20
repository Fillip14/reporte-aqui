import type { ProblemStatus } from '../api/problems';
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '../lib/status';

export default function StatusBadge({ status }: { status: ProblemStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
