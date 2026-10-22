import { type FormEvent, useState } from 'react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onTrack: () => void;
}

export function LoginPage({ onLogin, onTrack }: Props) {
  const [email, setEmail] = useState('owner@babelwash.local');
  const [password, setPassword] = useState('washday123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <img src="/brand-lockup.png" alt="BabelWash" className="auth-logo" />
        <div>
          <p className="eyebrow eyebrow-light">Laundry operations, in rhythm</p>
          <h1>Every load has a clear next step.</h1>
          <p>
            Receive orders, keep the wash queue moving, reconcile payments, and let customers follow
            progress without calling the counter.
          </p>
        </div>
        <button className="text-button text-button-light" onClick={onTrack}>
          Track a customer order →
        </button>
      </section>
      <section className="auth-panel">
        <form className="form-card auth-form" onSubmit={submit}>
          <p className="eyebrow">Staff workspace</p>
          <h2>Welcome back</h2>
          <p className="muted">Use the seeded local account to review the complete flow.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <div className="notice notice-error">{error}</div>}
          <button className="button button-primary button-wide" disabled={busy}>
            {busy ? 'Signing in…' : 'Open workspace'}
          </button>
          <div className="demo-credentials">
            <strong>Demo:</strong> owner@babelwash.local · washday123
          </div>
        </form>
      </section>
    </main>
  );
}
