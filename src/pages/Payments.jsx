import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import PaymentForm from '../components/payments/PaymentForm';
import { useCreatePayment } from '../components/payments/useCreatePayment';
import { useRetryReceipt } from '../components/payments/useRetryReceipt';
import QuickPaymentModal from '../components/payments/QuickPaymentModal';
import AllDebtsTable from '../components/payments/AllDebtsTable';
import MonthlyDebtsTable from '../components/payments/MonthlyDebtsTable';
import PaymentHistorySection from '../components/payments/PaymentHistorySection';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Payments() {
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [quickPaymentDebt, setQuickPaymentDebt] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-payment_date'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date'),
  });

  const createMutation = useCreatePayment({
    onSuccess: () => {
      setShowForm(false);
      setEditingPayment(null);
      setQuickPaymentDebt(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowForm(false);
      setEditingPayment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Payment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  const retryReceiptMutation = useRetryReceipt();

  const handleSubmit = (data) => {
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleQuickPayment = (paymentData) => {
    // Backend handles duplicate check, future appointment block, etc.
    createMutation.mutate(paymentData);
  };

  const handleRetryReceipt = (paymentId) => {
    retryReceiptMutation.mutate(paymentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ניהול תשלומים</h1>
          <p className="text-gray-600 mt-1">מעקב אחר חובות פתוחים</p>
        </div>
      </div>

      {/* P0: Open Debts List (Per-Session Only) */}
      <AllDebtsTable
        appointments={appointments}
        payments={payments}
        patients={patients}
        onPayClick={(debt) => setQuickPaymentDebt(debt)}
      />

      {/* P2: Monthly Debts */}
      <MonthlyDebtsTable
        appointments={appointments}
        payments={payments}
        patients={patients}
        onPayClick={(debt) => setQuickPaymentDebt(debt)}
      />

      {/* P1: Payment History (Collapsed) */}
      <div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full justify-between mb-4"
        >
          <span>היסטוריית תשלומים</span>
          {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>
        
        {showHistory && (
          <PaymentHistorySection
            payments={payments}
            onRetryReceipt={handleRetryReceipt}
          />
        )}
      </div>

      {/* Payment Form Modal */}
      {showForm && (
        <PaymentForm
          payment={editingPayment}
          patients={patients}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPayment(null);
          }}
        />
      )}

      {/* Quick Payment Modal */}
      {quickPaymentDebt && (
        <QuickPaymentModal
          appointment={quickPaymentDebt.date ? quickPaymentDebt : null}
          patient={patients.find(p => p.id === quickPaymentDebt.patient_id)}
          lastPayment={payments.filter(p => p.patient_id === quickPaymentDebt.patient_id).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]}
          prefill={quickPaymentDebt.type === 'monthly' ? quickPaymentDebt : null}
          onSubmit={handleQuickPayment}
          onCancel={() => setQuickPaymentDebt(null)}
        />
      )}
    </div>
  );
}