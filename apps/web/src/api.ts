import type { Dashboard, Inventory, Order, OrderStatus, Service, User } from './types';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4310';

export class ApiClient {
  constructor(private readonly token: string | null) {}

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.request('/api/session', { method: 'POST', body: { email, password } });
  }

  async dashboard(): Promise<Dashboard> {
    return this.request('/api/dashboard');
  }

  async services(): Promise<Service[]> {
    return this.request<{ items: Service[] }>('/api/services').then((result) => result.items);
  }

  async orders(): Promise<Order[]> {
    return this.request<{ items: Order[] }>('/api/orders').then((result) => result.items);
  }

  async createOrder(input: {
    customerName: string;
    customerPhone: string;
    serviceId: string;
    quantity: number;
    notes?: string;
  }): Promise<Order> {
    return this.request('/api/orders', { method: 'POST', body: input });
  }

  async transition(id: string, status: OrderStatus): Promise<Order> {
    return this.request(`/api/orders/${id}/status`, { method: 'POST', body: { status } });
  }

  async pay(id: string, amount: number, method: 'CASH' | 'QRIS'): Promise<void> {
    await this.request(`/api/orders/${id}/payments`, { method: 'POST', body: { amount, method } });
  }

  async inventory(): Promise<Inventory[]> {
    return this.request<{ items: Inventory[] }>('/api/inventory').then((result) => result.items);
  }

  async adjustInventory(id: string, delta: number, reason: string): Promise<Inventory> {
    return this.request(`/api/inventory/${id}/adjustments`, {
      method: 'POST',
      body: { delta, reason },
    });
  }

  async track(code: string): Promise<Record<string, unknown>> {
    return this.request(`/api/track/${encodeURIComponent(code)}`);
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown } = {},
  ): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
    const payload = (await response.json()) as T & { message?: string };
    if (!response.ok) throw new Error(payload.message ?? 'The request could not be completed.');
    return payload;
  }
}
