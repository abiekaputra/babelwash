import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient } from './api';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { OrdersPage } from './pages/OrdersPage';
import { TrackerPage } from './pages/TrackerPage';
import type { Dashboard, Inventory, Order, OrderStatus, Service, User } from './types';

type View = 'dashboard' | 'orders' | 'new-order' | 'inventory';

export function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('babelwash-token'));
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [view, setView] = useState<View>('dashboard');
  const [tracking, setTracking] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const api = useMemo(() => new ApiClient(token), [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const [nextDashboard, nextOrders, nextServices, nextInventory] = await Promise.all([
      api.dashboard(),
      api.orders(),
      api.services(),
      api.inventory(),
    ]);
    setDashboard(nextDashboard);
    setOrders(nextOrders);
    setServices(nextServices);
    setInventory(nextInventory);
  }, [api, token]);

  useEffect(() => {
    void refresh().catch(() => logout());
  }, [refresh]);

  async function login(email: string, password: string) {
    const session = await new ApiClient(null).login(email, password);
    sessionStorage.setItem('babelwash-token', session.token);
    sessionStorage.setItem('babelwash-user', JSON.stringify(session.user));
    setToken(session.token);
    setUser(session.user);
  }

  function logout() {
    sessionStorage.removeItem('babelwash-token');
    sessionStorage.removeItem('babelwash-user');
    setToken(null);
    setUser(null);
    setDashboard(null);
  }

  async function transition(order: Order, status: OrderStatus) {
    setBusyId(order.id);
    try {
      await api.transition(order.id, status);
      notify(`${order.trackingCode} moved to ${status.toLowerCase()}.`);
      await refresh();
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Status update failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function pay(order: Order, amount: number, method: 'CASH' | 'QRIS') {
    setBusyId(order.id);
    try {
      await api.pay(order.id, amount, method);
      notify(`Payment recorded for ${order.trackingCode}.`);
      await refresh();
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Payment failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function createOrder(input: Parameters<ApiClient['createOrder']>[0]) {
    const order = await api.createOrder(input);
    await refresh();
    return order;
  }

  async function adjustInventory(id: string, delta: number, reason: string) {
    await api.adjustInventory(id, delta, reason);
    await refresh();
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3_500);
  }

  if (tracking) return <TrackerPage onBack={() => setTracking(false)} />;
  if (!token || !user) return <LoginPage onLogin={login} onTrack={() => setTracking(true)} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img src="/brand-lockup.png" alt="BabelWash" className="sidebar-logo" />
        <nav aria-label="Primary navigation">
          <NavButton
            active={view === 'dashboard'}
            onClick={() => setView('dashboard')}
            label="Overview"
            icon="◫"
          />
          <NavButton
            active={view === 'orders'}
            onClick={() => setView('orders')}
            label="Wash queue"
            icon="↻"
          />
          <NavButton
            active={view === 'new-order'}
            onClick={() => setView('new-order')}
            label="New order"
            icon="＋"
          />
          <NavButton
            active={view === 'inventory'}
            onClick={() => setView('inventory')}
            label="Inventory"
            icon="▦"
          />
        </nav>
        <button className="track-shortcut" onClick={() => setTracking(true)}>
          Customer tracking ↗
        </button>
        <div className="user-card">
          <span>{user.name}</span>
          <small>{user.role.toLowerCase()}</small>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="app-content">
        {view === 'dashboard' && <DashboardPage dashboard={dashboard} />}
        {view === 'orders' && (
          <OrdersPage orders={orders} busyId={busyId} onAdvance={transition} onPay={pay} />
        )}
        {view === 'new-order' && <NewOrderPage services={services} onCreate={createOrder} />}
        {view === 'inventory' && (
          <InventoryPage items={inventory} role={user.role} onAdjust={adjustInventory} />
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick}>
      <span>{icon}</span>
      {label}
    </button>
  );
}

function readStoredUser(): User | null {
  const value = sessionStorage.getItem('babelwash-user');
  if (!value) return null;
  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}
