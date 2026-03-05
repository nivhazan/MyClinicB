import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import QuickPaymentModal from '../components/payments/QuickPaymentModal';
import { useCreatePayment } from '../components/payments/useCreatePayment';
import QuickReceiptButton from '../components/expenses/QuickReceiptButton';
import AdvancedKPIs from '../components/dashboard/AdvancedKPIs';
import Forecasts from '../components/dashboard/Forecasts';
import NotificationCenter from '../components/dashboard/NotificationCenter';
import ExtendAppointments from '../components/dashboard/ExtendAppointments';
import QuickExpense from '../components/dashboard/QuickExpense';
import SummaryBar from '../components/dashboard/SummaryBar';
import WorkTable from '../components/dashboard/WorkTable';
import NextUp from '../components/dashboard/NextUp';
import { toast } from 'sonner';

export default function Dashboard() {
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date'),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.TreatmentSession.list('-session_date', 10),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list(),
  });

  const createPaymentMutation = useCreatePayment({
    onSuccess: () => setPaymentModalData(null),
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });

  const activePatients = patients.filter(p => p.status === 'פעיל').length;
  
  const todayAppointments = appointments.filter(apt => {
    if (!apt.date) return false;
    return isToday(parseISO(apt.date)) && apt.status !== 'בוטל';
  });

  const upcomingAppointments = appointments.filter(apt => {
    if (!apt.date) return false;
    const aptDate = parseISO(apt.date);
    return (isToday(aptDate) || isTomorrow(aptDate)) && apt.status !== 'בוטל';
  }).slice(0, 5);

  const thisMonthSessions = sessions.filter(s => {
    if (!s.session_date) return false;
    const sessionDate = parseISO(s.session_date);
    const now = new Date();
    return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    {
      title: 'מטופלים פעילים',
      value: activePatients,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      link: 'Patients'
    },
    {
      title: 'תורים היום',
      value: todayAppointments.length,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      link: 'Calendar'
    },
    {
      title: 'טיפולים החודש',
      value: thisMonthSessions,
      icon: FileText,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50',
      link: 'Sessions'
    },
    {
      title: 'סה״כ מטופלים',
      value: patients.length,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    }
  ];

  const handleStatusChange = (apt, newStatus) => {
    updateAppointmentMutation.mutate({
      id: apt.id,
      data: { ...apt, status: newStatus },
    });
    const statusLabel = {
      בוצע: 'סמן כבוצע',
      'לא הגיע': 'סמן כלא הגיע',
      בוטל: 'בוטל',
    }[newStatus];
    toast.success(statusLabel);
  };

  const handleRetryReceipt = (payment) => {
    updatePaymentMutation.mutate({
      id: payment.id,
      data: {
        ...payment,
        receipt_status: 'pending',
        receipt_attempt_count: (payment.receipt_attempt_count || 0) + 1,
      },
    });
    toast.success('בקשה לשליחת קבלה חדשה נשלחה');
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <SummaryBar
        appointments={appointments}
        patients={patients}
        payments={payments}
        onFilterClick={setActiveTab}
        activeTab={activeTab}
      />

      {/* Next Up */}
      <NextUp
        appointments={appointments}
        patients={patients}
        payments={payments}
        onStatusChange={handleStatusChange}
        onPayment={setPaymentModalData}
      />

      {/* Work Table */}
      <WorkTable
        appointments={appointments}
        patients={patients}
        payments={payments}
        onStatusChange={handleStatusChange}
        onPayment={(apt, patient) => {
          const lastPatientPayment = payments
            .filter((p) => p.patient_id === patient.id)
            .sort(
              (a, b) =>
                new Date(b.payment_date) - new Date(a.payment_date)
            )[0];
          setPaymentModalData({
            appointment: apt,
            patient,
            lastPayment: lastPatientPayment,
          });
        }}
        onRetryReceipt={handleRetryReceipt}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Quick Expense */}
      <QuickExpense expenses={expenses} />

      {/* Additional Features */}
      <details className="mt-8">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 p-4 bg-gray-50 rounded-lg">
          הצג מידע נוסף (סטטיסטיקות, גרפים, ועוד)
        </summary>
        <div className="mt-4 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden hover:shadow-lg transition-all border-0"
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon
                          className={`w-5 h-5 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                          style={{ WebkitTextFillColor: 'transparent' }}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-800">
                        {stat.value}
                      </p>
                      {stat.link && (
                        <Link
                          to={createPageUrl(stat.link)}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          צפייה
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Advanced KPIs */}
          <AdvancedKPIs
            payments={payments}
            appointments={appointments}
            patients={patients}
          />

          {/* Forecasts */}
          <Forecasts payments={payments} appointments={appointments} />

          {/* Notification Center */}
          <NotificationCenter
            payments={payments}
            appointments={appointments}
            sessions={sessions}
            tasks={tasks}
            patients={patients}
          />

          {/* Extend Appointments */}
          <ExtendAppointments />
        </div>
      </details>

      {/* Quick Receipt FAB */}
      <QuickReceiptButton />

      {/* Quick Payment Modal */}
      {paymentModalData && (
        <QuickPaymentModal
          appointment={paymentModalData.appointment}
          patient={paymentModalData.patient}
          lastPayment={paymentModalData.lastPayment}
          prefill={null}
          onSubmit={(paymentData) => {
            createPaymentMutation.mutate(paymentData);
          }}
          onCancel={() => setPaymentModalData(null)}
        />
      )}
    </div>
  );
}