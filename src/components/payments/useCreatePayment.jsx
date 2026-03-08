import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Single source of truth for creating a payment.
 * Validation (duplicate check, future appointment block, billing model
 * mutual exclusion) and side-effects (auto-fix appointment status) are
 * handled server-side by the Express backend.
 */
export function useCreatePayment({ onSuccess } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const paymentData = {
        status: 'paid',
        ...data,
      };

      // Create payment — backend handles all validation & side-effects
      const payment = await base44.entities.Payment.create(paymentData);

      // Send digital invoice (non-blocking, stub for now)
      if (payment.id) {
        base44.functions.invoke('sendDigitalInvoice', {
          payment_id: payment.id,
          patient_id: payment.patient_id,
          patient_name: payment.patient_name,
          amount: payment.amount,
          payment_date: payment.payment_date
        }).catch(err => console.error('Failed to send invoice:', err));
      }

      return payment;
    },
    onError: (err) => {
      toast.error(err.message || 'שגיאה ביצירת תשלום');
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('התשלום נרשם');
      onSuccess?.(payment);
    },
  });
}