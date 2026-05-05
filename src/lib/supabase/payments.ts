import { createClient } from './server';
import type { Payment, PaymentType } from '@/types';
import { generatePaymentReference } from '@/lib/utils';

export async function createPaymentRecord(data: {
  user_id: string;
  amount_ugx: number;
  payment_type: PaymentType;
  reference_id: string;
}): Promise<Payment> {
  const supabase = await createClient();
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      ...data,
      status: 'pending',
      reference: generatePaymentReference(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return payment as Payment;
}

export async function getUserPayments(userId: string): Promise<Payment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Payment[]) ?? [];
}
