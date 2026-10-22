import { type FormEvent, useState } from 'react';
import { ApiClient } from '../api';
import { formatStatus } from '../components/StatusBadge';

interface Props {
  onBack: () => void;
}

interface TrackingResult {
  trackingCode: string;
  customerName: string;
  serviceName: string;
  status: string;
  dueAt: string;
  timeline: Array<{ status: string; createdAt: string }>;
}

export function TrackerPage({ onBack }: Props) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      setResult((await new ApiClient(null).track(code)) as unknown as TrackingResult);
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : 'Tracking failed.');
    }
  }

  return (
    <main className="tracker-layout">
      <header className="tracker-header">
        <img src="/brand-lockup.png" alt="BabelWash" />
        <button className="text-button" onClick={onBack}>
          Staff sign in
        </button>
      </header>
      <section className="tracker-hero">
        <p className="eyebrow eyebrow-light">No phone call needed</p>
        <h1>Where is my laundry?</h1>
        <p>Enter the code on your receipt to see the latest verified status.</p>
        <form onSubmit={submit} className="tracker-search">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="BW-261022-AB12"
          />
          <button className="button button-accent">Track order</button>
        </form>
        {error && <div className="notice notice-error">{error}</div>}
      </section>
      {result && (
        <section className="tracking-result">
          <div className="tracking-summary">
            <div>
              <p className="eyebrow">{result.trackingCode}</p>
              <h2>{result.customerName}</h2>
              <span>{result.serviceName}</span>
            </div>
            <div className="tracking-current">
              <span>Current status</span>
              <strong>{formatStatus(result.status)}</strong>
            </div>
          </div>
          <div className="timeline">
            {result.timeline.map((event) => (
              <div className="timeline-item" key={`${event.status}-${event.createdAt}`}>
                <span className="timeline-dot" />
                <div>
                  <strong>{formatStatus(event.status)}</strong>
                  <span>{new Date(event.createdAt).toLocaleString('en-GB')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
