import type { OrderStatus } from '../types';

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{formatStatus(status)}</span>;
}

export function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
