import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Single source of truth for creating a payment.
 * Handles:
 *  - Creating the Payment record
 *  - Fetching the LATEST appointment from DB (no stale cache risk)
 *  - Marking a 'מתוכנן' appointment as 'בוצע'
 *  - Sending digital invoice (non-blocking)
 *  - Invalidating all relevant queries
 */
export function useCreatePayment({ onSuccess } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Guard: monthly and per-session are mutually exclusive
      if (data.billing_month && data.session_id) {
        throw new Error('תשלום לא יכול להיות גם חודשי וגם מקושר לטיפול');
      }

      // Ensure receipt fields are always set consistently
      const paymentData = {
        status: 'paid',
        receipt_status: 'pending',
        receipt_attempt_count: 0,
        receipt_sent_at: null,
        receipt_error: null,
        ...data,
      };

      // 0. Per-session guards
      if (data.session_id) {
        // 0a. Fetch appointment and verify it has ended
        const apt = await base44.entities.Appointment.get(data.session_id);
        if (apt) {
          if (apt.date && apt.time) {
            const start = new Date(`${apt.date}T${apt.time}`);
            const endMs = start.getTime() + Number(apt.duration || 45) * 60 * 1000;
            if (endMs > Date.now()) {
              throw new Error('לא ניתן לרשום תשלום לתור שטרם הסתיים');
            }
          }
        }

        // 0b. Duplicate check – prevent double payment for same appointment
        const existing = await base44.entities.Payment.filter({ session_id: data.session_id });
        if (existing.length > 0) {
          throw new Error('כבר קיים תשלום לטיפול זה');
        }
      }

      // 1. Create payment
      const payment = await base44.entities.Payment.create(paymentData);

      // 2. If linked to an appointment, fetch fresh from DB and update if needed
      if (paymentData.session_id) {
        try {
          const freshAppointment = await base44.entities.Appointment.get(paymentData.session_id);
          if (freshAppointment && freshAppointment.status === 'מתוכנן') {
            await base44.entities.Appointment.update(freshAppointment.id, { status: 'בוצע' });
          }
        } catch (err) {
          console.error('Failed to update appointment status:', err);
        }
      }

      // 3. Send digital invoice (non-blocking)
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