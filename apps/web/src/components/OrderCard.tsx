import type { Order, OrderStatus } from '../types';
import { StatusBadge } from './StatusBadge';

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  RECEIVED: 'WASHING',
  WASHING: 'DRYING',
  DRYING: 'READY',
  READY: 'COLLECTED',
};

interface Props {
  order: Order;
  busy: boolean;
  onAdvance: (order: Order, status: OrderStatus) => void;
  onPay: (order: Order) => void;
}

export function OrderCard({ order, busy, onAdvance, onPay }: Props) {
  const balance = order.totalAmount - order.paidAmount;
  const next = nextStatus[order.status];
  return (
    <article className="order-card">
      <div className="order-card-heading">
        <div>
          <p className="eyebrow">{order.trackingCode}</p>
          <h3>{order.customerName}</h3>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <dl className="order-facts">
        <div>
          <dt>Service</dt>
          <dd>{order.service.name}</dd>
        </div>
        <div>
          <dt>Load</dt>
          <dd>
            {order.quantity} {order.service.unit === 'KILOGRAM' ? 'kg' : 'item'}
          </dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{formatDate(order.dueAt)}</dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd className={balance > 0 ? 'balance-due' : 'balance-paid'}>{rupiah(balance)}</dd>
        </div>
      </dl>
      <div className="order-actions">
        {balance > 0 && order.status !== 'CANCELLED' && (
          <button className="button button-quiet" disabled={busy} onClick={() => onPay(order)}>
            Record payment
          </button>
        )}
        {next && (
          <button
            className="button button-primary"
            disabled={busy || (next === 'COLLECTED' && balance > 0)}
            onClick={() => onAdvance(order, next)}
          >
            Move to {next.toLowerCase()}
          </button>
        )}
      </div>
    </article>
  );
}

export function rupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
