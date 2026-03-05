import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, AlertCircle, TrendingDown, Clock } from 'lucide-react';
import { parseISO, isAfter, isSameDay } from 'date-fns';
import { isAppointmentEnded } from '../shared/appointmentUtils';
export default function SummaryBar({
  appointments,
  patients,
  payments,
  onFilterClick,
  activeTab,
}) {

  const getPaymentStatus = (apt) => {
    return payments.find(p => p.session_id === apt.id);
  };

  const isDebt = (apt) => {
    if (!isAppointmentEnded(apt)) return false;
    if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return false;
    const patient = patients.find(p => p.id === apt.patient_id);
    if (patient?.billing_model !== 'per_session') return false;
    return !getPaymentStatus(apt);
  };

  const isMonthlyPending = (apt) => {
    if (!isAppointmentEnded(apt)) return false;
    if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return false;
    const patient = patients.find(p => p.id === apt.patient_id);
    if (patient?.billing_model !== 'monthly_aggregate') return false;
    return !getPaymentStatus(apt);
  };

  const isException = (apt) => {
    if (!isAppointmentEnded(apt)) return false;
    if (apt.status !== 'מתוכנן') return false;
    return !(!apt.date || !apt.time);
  };

  const todayCount = appointments.filter(
    (a) =>
      a.date &&
      a.time &&
      isSameDay(parseISO(a.date), new Date()) &&
      a.status !== 'בוטל'
  ).length;

  const debtsCount = appointments.filter((a) => a.date && a.time && isDebt(a))
    .length;
  const debtAmount = appointments
    .filter((a) => a.date && a.time && isDebt(a))
    .reduce((sum, a) => {
      const patient = patients.find((p) => p.id === a.patient_id);
      return sum + (patient?.session_price || 0);
    }, 0);

  const monthlyCount = appointments.filter(
    (a) => a.date && a.time && isMonthlyPending(a)
  ).length;

  const exceptionsCount = appointments.filter(
    (a) => a.date && a.time && isException(a)
  ).length;

  const cards = [
    {
      label: 'תורים היום',
      value: todayCount,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      tab: 'today',
    },
    {
      label: 'חובות פתוחים',
      value: debtsCount,
      subtitle: `₪${debtAmount}`,
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      tab: 'debts',
    },
    {
      label: 'ממתין חודשי',
      value: monthlyCount,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      tab: 'monthly',
    },
    {
      label: 'חריגים',
      value: exceptionsCount,
      icon: AlertCircle,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      tab: 'exceptions',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTab === card.tab;
        return (
          <button
            key={card.label}
            onClick={() => onFilterClick(card.tab)}
            className={`text-left transition-all ${
              isActive ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <Card className="hover:shadow-md cursor-pointer border-0">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {card.value}
                    </p>
                    {card.subtitle && (
                      <p className="text-xs text-gray-500">{card.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon
                      className={`w-5 h-5 bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}
                      style={{ WebkitTextFillColor: 'transparent' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}