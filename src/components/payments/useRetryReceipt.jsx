import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Hook for retrying failed receipt sending.
 * Only works if receipt_status === 'failed'
 */
export function useRetryReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId) => {
      // Fetch the latest payment to confirm receipt_status
      const payment = await base44.entities.Payment.get(paymentId);
      
      if (payment.receipt_status !== 'failed') {
        throw new Error('ניתן לנסות שנית רק לקבלות שנכשלו');
      }

      // Update receipt status to pending and increment attempt count
      await base44.entities.Payment.update(paymentId, {
        receipt_status: 'pending',
        receipt_error: null,
        receipt_attempt_count: (payment.receipt_attempt_count || 0) + 1,
      });

      // Send digital invoice again (stub — logs to SyncLog on backend;
      // wire to real email/Telegram service when ready)
      await base44.functions.invoke('sendDigitalInvoice', {
        payment_id: paymentId,
        patient_id: payment.patient_id,
        patient_name: payment.patient_name,
        amount: payment.amount,
        payment_date: payment.payment_date,
      });

      return payment;
    },
    onError: (err) => {
      toast.error(err.message || 'שגיאה בעדכון ניסיון שליחה');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('ניסיון שליחה חדש נרשם');
    },
  });
}