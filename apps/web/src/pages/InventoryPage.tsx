import { type FormEvent, useState } from 'react';
import type { Inventory, Role } from '../types';

interface Props {
  items: Inventory[];
  role: Role;
  onAdjust: (id: string, delta: number, reason: string) => Promise<void>;
}

export function InventoryPage({ items, role, onAdjust }: Props) {
  const [selected, setSelected] = useState(items[0]?.id ?? '');
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState('Stock count correction');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      await onAdjust(selected, delta, reason);
      setMessage('Stock adjustment recorded.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Adjustment failed.');
    }
  }

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Consumable control</p>
          <h1>Supply inventory</h1>
        </div>
        <p className="page-intro">
          Reorder warnings are driven by each material’s configured threshold.
        </p>
      </header>
      <section className="inventory-grid">
        {items.map((item) => (
          <article className={`inventory-card ${item.isLow ? 'inventory-low' : ''}`} key={item.id}>
            <div>
              <p className="eyebrow">{item.isLow ? 'Reorder soon' : 'In stock'}</p>
              <h2>{item.name}</h2>
            </div>
            <strong>
              {item.quantity}
              <small>{item.unit}</small>
            </strong>
            <span>
              Reorder at {item.reorderLevel} {item.unit}
            </span>
          </article>
        ))}
      </section>
      <form className="form-card stock-form" onSubmit={submit}>
        <div>
          <p className="eyebrow">Audited adjustment</p>
          <h2>Record stock movement</h2>
        </div>
        {role !== 'OWNER' ? (
          <div className="notice">Owner access is required to change stock.</div>
        ) : (
          <>
            <div className="form-grid">
              <label>
                Material
                <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity change
                <input
                  type="number"
                  step="0.1"
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value))}
                />
              </label>
            </div>
            <label>
              Reason
              <input
                minLength={3}
                maxLength={120}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {message && <div className="notice">{message}</div>}
            <button className="button button-primary" disabled={!selected || delta === 0}>
              Record adjustment
            </button>
          </>
        )}
      </form>
    </div>
  );
}
