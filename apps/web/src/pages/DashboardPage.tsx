import type { Dashboard } from '../types';
import { rupiah } from '../components/OrderCard';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage({ dashboard }: { dashboard: Dashboard | null }) {
  if (!dashboard) return <div className="loading-card">Loading today’s wash queue…</div>;
  const metrics = [
    ['Active orders', dashboard.activeOrders],
    ['Ready to collect', dashboard.readyOrders],
    ['Due within 24h', dashboard.dueSoon],
    ['Outstanding', rupiah(dashboard.outstandingAmount)],
  ];
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>Today at BabelWash</h1>
        </div>
        <p className="page-intro">
          A compact view of queue pressure, collection readiness, and stock risk.
        </p>
      </header>
      <section className="metrics-grid" aria-label="Operational metrics">
        {metrics.map(([label, value]) => (
          <article className="metric-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <div className="two-column">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2>Recent orders</h2>
            </div>
          </div>
          {dashboard.recentOrders.length === 0 ? (
            <p className="empty-state">The queue is empty. Create the first laundry order.</p>
          ) : (
            <div className="compact-list">
              {dashboard.recentOrders.map((order) => (
                <div className="compact-row" key={order.id}>
                  <div>
                    <strong>{order.customerName}</strong>
                    <span>{order.trackingCode}</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="panel panel-tint">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Supply watch</p>
              <h2>Low stock</h2>
            </div>
          </div>
          {dashboard.lowStock.length === 0 ? (
            <p className="empty-state">All supplies are above their reorder level.</p>
          ) : (
            <div className="compact-list">
              {dashboard.lowStock.map((item) => (
                <div className="compact-row" key={item.id}>
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity} {item.unit} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
