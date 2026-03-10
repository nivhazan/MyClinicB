import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, isAfter, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Check, CreditCard, XCircle, Trash2, RotateCcw, AlertCircle } from 'lucide-react';


import { toast } from 'sonner';
import { isAppointmentEnded } from '../shared/appointmentUtils';

export default function WorkTable({
  appointments,
  patients,
  payments,
  onStatusChange,
  onPayment,
  onRetryReceipt,
  activeTab,
  onTabChange,
}) {
  // use shared helper for consistency
  // function isAppointmentEnded is imported above

  const getPaymentStatus = (apt) => {
    const payment = payments.find(p => p.session_id === apt.id);
    if (!payment) return null;
    return payment;
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
    // skip sessions in months that already have a monthly payment
    const monthKey = format(parseISO(apt.date), 'yyyy-MM');
    const monthPaid = payments.some(p => p.patient_id === patient.id && p.billing_month === monthKey);
    if (monthPaid) return false;
    return !getPaymentStatus(apt);
  };

  const isException = (apt) => {
    if (!isAppointmentEnded(apt)) return false;
    if (apt.status !== 'מתוכנן') return false;
    return !(!apt.date || !apt.time);
  };

  const filterAppointments = (tab) => {
    let filtered = appointments.filter(a => a.date && a.time);

    if (tab === 'today') {
      return filtered.filter(a => isSameDay(parseISO(a.date), new Date()));
    } else if (tab === 'debts') {
      return filtered.filter(isDebt);
    } else if (tab === 'monthly') {
      return filtered.filter(isMonthlyPending);
    } else if (tab === 'exceptions') {
      return filtered.filter(isException);
    }
    return filtered;
  };

  const filteredData = filterAppointments(activeTab);

  const getStatusInfo = (apt) => {
    const iEnded = isAppointmentEnded(apt);
    if (!iEnded) return { label: 'מתוכנן', cls: 'bg-gray-100 text-gray-500' };
    if (apt.status === 'לא הגיע') return { label: 'לא הגיע', cls: 'bg-gray-100 text-gray-500' };
    if (apt.status === 'בוטל') return { label: 'בוטל', cls: 'bg-gray-100 text-gray-400' };

    const payment = getPaymentStatus(apt);
    const patient = patients.find(p => p.id === apt.patient_id);

    if (payment) return { label: `${payment.amount}₪`, cls: 'bg-green-100 text-green-700' };
    if (patient?.billing_model === 'monthly_aggregate') return { label: 'חודשי', cls: 'bg-yellow-100 text-yellow-700' };

    const price = patient?.session_price || 0;
    return { label: `${price}₪`, cls: 'bg-red-100 text-red-600' };
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle>ניהול טיפולים</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredData.length === 0 ? (
            <div className="p-8 text-center text-gray-400">אין פריטים</div>
          ) : (
            filteredData.map((apt) => {
                    const patient = patients.find(p => p.id === apt.patient_id);
                    const payment = getPaymentStatus(apt);
                    const isEnded = isAppointmentEnded(apt);

                    return (
                      <div
                        key={apt.id}
                        dir="rtl"
                        className="flex items-center gap-1 md:gap-2 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all overflow-x-auto"
                      >
                        {/* Patient — rightmost */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base text-gray-800 truncate">{apt.patient_name}</div>
                          {patient?.notes && (
                            <div className="text-xs text-gray-500 line-clamp-1 hidden md:block">
                              📌 {patient.notes}
                            </div>
                          )}
                        </div>

                        {/* Time */}
                        <div className="flex flex-col gap-0.5 min-w-fit text-xs md:text-sm">
                          <span className="text-[10px] md:text-xs text-gray-500">
                            {format(parseISO(apt.date), 'd/MM')}
                          </span>
                          <span className="font-semibold">{apt.time}</span>
                        </div>

                        {/* Status + Amount combined */}
                        {(() => { const s = getStatusInfo(apt); return (
                          <span className={`min-w-fit text-xs font-medium select-none px-2 py-0.5 rounded-full pointer-events-none ${s.cls}`}>{s.label}</span>
                        ); })()}

                        {/* Quick Actions */}
                        <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
                          {isEnded && apt.status === 'מתוכנן' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 md:p-2 h-auto"
                              onClick={() => onStatusChange(apt, 'בוצע')}
                              title="סמן כבוצע"
                            >
                              <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                            </Button>
                          )}

                          {apt.status !== 'בוטל' &&
                            apt.status !== 'לא הגיע' &&
                            isEnded &&
                            !payment && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 md:p-2 h-auto"
                                onClick={() => onPayment(apt, patient)}
                                title="קבל תשלום"
                              >
                                <CreditCard className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                              </Button>
                            )}

                          {isEnded && apt.status === 'בוצע' && !payment && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 md:p-2 h-auto"
                              onClick={() =>
                                onStatusChange(apt, 'לא הגיע')
                              }
                              title="סמן כלא הגיע"
                            >
                              <XCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                            </Button>
                          )}

                          {payment && payment.receipt_status !== 'sent' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 md:p-2 h-auto hidden sm:inline-flex"
                              onClick={() => onRetryReceipt(payment)}
                              title="שלח קבלה מחדש"
                            >
                              <RotateCcw className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                            </Button>
                          )}

                          {apt.status !== 'בוטל' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 md:p-2 h-auto hidden sm:inline-flex"
                              onClick={() => onStatusChange(apt, 'בוטל')}
                              title="בטל"
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
          )}
        </div>
      </CardContent>
    </Card>
  );
}