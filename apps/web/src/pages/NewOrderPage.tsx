import { type FormEvent, useMemo, useState } from 'react';
import type { Order, Service } from '../types';
import { rupiah } from '../components/OrderCard';

interface Props {
  services: Service[];
  onCreate: (input: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    quantity: number;
    notes?: string;
  }) => Promise<Order>;
}

export function NewOrderPage({ services, onCreate }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [quantity, setQuantity] = useState(3);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const selected = services.find((service) => service.id === serviceId) ?? services[0];
  const estimate = useMemo(
    () => (selected ? Math.max(quantity, selected.minimumQuantity) * selected.unitPrice : 0),
    [quantity, selected],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const order = await onCreate({
        customerName,
        customerPhone,
        serviceId,
        quantity,
        ...(notes.trim() ? { notes } : {}),
      });
      setMessage(`Order ${order.trackingCode} created successfully.`);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Order could not be created.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Counter intake</p>
          <h1>Receive a new load</h1>
        </div>
        <p className="page-intro">
          Price and due time are calculated from the selected service policy.
        </p>
      </header>
      <form className="form-card order-form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Customer name
            <input
              required
              minLength={2}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <label>
            WhatsApp / phone
            <input
              required
              pattern="\+?[0-9]{9,15}"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </label>
          <label>
            Service
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((service) => (
                <option value={service.id} key={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity {selected?.unit === 'KILOGRAM' ? '(kg)' : '(item)'}
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Care notes <span className="optional">Optional</span>
          <textarea
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Stain, fragrance, or handling notes"
          />
        </label>
        <div className="price-summary">
          <div>
            <span>Estimated total</span>
            <strong>{rupiah(estimate)}</strong>
          </div>
          <p>
            Minimum billable quantity: {selected?.minimumQuantity ?? 0}{' '}
            {selected?.unit === 'KILOGRAM' ? 'kg' : 'item'}
          </p>
        </div>
        {message && <div className="notice">{message}</div>}
        <button className="button button-primary" disabled={busy || !serviceId}>
          {busy ? 'Creating…' : 'Create order'}
        </button>
      </form>
    </div>
  );
}
