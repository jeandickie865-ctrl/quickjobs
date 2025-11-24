// utils/paymentsStore.ts
import { getItem, setItem } from './storage';

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'card' | 'paypal';

export type Payment = {
  id: string;
  employerId: string;
  jobId: string;
  amount: number; // in cents
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
  jobTitle?: string;
};

const PAYMENTS_KEY = '@backup:payments';

async function loadPayments(): Promise<Payment[]> {
  const stored = await getItem<Payment[]>(PAYMENTS_KEY);
  return stored ?? [];
}

async function savePayments(payments: Payment[]): Promise<void> {
  await setItem<Payment[]>(PAYMENTS_KEY, payments);
}

export async function addPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  const payments = await loadPayments();
  
  const newPayment: Payment = {
    ...payment,
    id: 'payment-' + Date.now().toString() + '-' + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  };
  
  await savePayments([...payments, newPayment]);
  return newPayment;
}

export async function getPaymentsByEmployer(employerId: string): Promise<Payment[]> {
  const payments = await loadPayments();
  return payments
    .filter(p => p.employerId === employerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPaymentByJobId(jobId: string): Promise<Payment | null> {
  const payments = await loadPayments();
  return payments.find(p => p.jobId === jobId) || null;
}

export async function updatePaymentStatus(
  paymentId: string, 
  status: PaymentStatus
): Promise<void> {
  const payments = await loadPayments();
  const updated = payments.map(p => {
    if (p.id === paymentId) {
      return {
        ...p,
        status,
        paidAt: status === 'paid' ? new Date().toISOString() : p.paidAt,
      };
    }
    return p;
  });
  await savePayments(updated);
}

export async function clearPayments(): Promise<void> {
  await savePayments([]);
}
