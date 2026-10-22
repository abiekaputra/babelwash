import { type FormEvent, useMemo, useState } from 'react';
import { OrderCard } from '../components/OrderCard';
import type { Order, OrderStatus } from '../types';

interface Props {
  orders: Order[];
  busyId: string | null;
  onAdvance: (order: Order, status: OrderStatus) => Promise<void>;
  onPay: (order: Order, amount: number, method: 'CASH' | 'QRIS') => Promise<void>;
}

export function OrdersPage({ orders, busyId, onAdvance, onPay }: Props) {
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [query, setQuery] = useState('');
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('QRIS');
  const [paymentError, setPaymentError] = useState('');
  const visible = useMemo(() => {
    const normalized = query.toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === 'ALL' || !['COLLECTED', 'CANCELLED'].includes(order.status);
      const matchesQuery =
        !query ||
        order.customerName.toLowerCase().includes(normalized) ||
        order.trackingCode.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, orders, query]);

  function openPayment(order: Order) {
    setPayingOrder(order);
    setPaymentAmount(String(order.totalAmount - order.paidAmount));
    setPaymentError('');
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    if (!payingOrder) return;
    try {
      await onPay(payingOrder, Number(paymentAmount), paymentMethod);
      setPayingOrder(null);
    } catch (cause) {
      setPaymentError(cause instanceof Error ? cause.message : 'Payment failed.');
    }
  }

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Live workflow</p>
          <h1>Laundry queue</h1>
        </div>
        <p className="page-intro">
          Advance each load through controlled states and settle payment before collection.
        </p>
      </header>
      <div className="toolbar">
        <div className="segmented" aria-label="Order filter">
          <button
            className={filter === 'ACTIVE' ? 'active' : ''}
            onClick={() => setFilter('ACTIVE')}
          >
            Active
          </button>
          <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>
            All
          </button>
        </div>
        <input
          className="search-input"
          type="search"
          placeholder="Search customer or code"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {visible.length === 0 ? (
        <div className="empty-card">
          <strong>No matching loads.</strong>
          <span>Create an order or change the filter.</span>
        </div>
      ) : (
        <section className="orders-grid">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onAdvance={(item, status) => void onAdvance(item, status)}
              onPay={openPayment}
            />
          ))}
        </section>
      )}
      {payingOrder && (
        <div className="modal-backdrop" role="presentation">
          <form
            className="payment-modal"
            onSubmit={submitPayment}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
          >
            <div>
              <p className="eyebrow">Settle balance</p>
              <h2 id="payment-title">Record payment</h2>
              <p className="muted">
                {payingOrder.customerName} · {payingOrder.trackingCode}
              </p>
            </div>
            <label>
              Amount
              <input
                type="number"
                min="1"
                max={payingOrder.totalAmount - payingOrder.paidAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </label>
            <fieldset className="payment-methods">
              <legend>Payment method</legend>
              <label>
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === 'QRIS'}
                  onChange={() => setPaymentMethod('QRIS')}
                />{' '}
                QRIS
              </label>
              <label>
                <input
                  type="radio"
                  name="payment-method"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                />{' '}
                Cash
              </label>
            </fieldset>
            {paymentError && <div className="notice notice-error">{paymentError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setPayingOrder(null)}
              >
                Cancel
              </button>
              <button className="button button-primary" disabled={busyId === payingOrder.id}>
                Confirm payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
