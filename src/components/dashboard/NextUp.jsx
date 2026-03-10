import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, isAfter } from 'date-fns';
import { isAppointmentEnded } from '../shared/appointmentUtils';import { he } from 'date-fns/locale';
import { Clock, Check, CreditCard } from 'lucide-react';

export default function NextUp({
  appointments,
  patients,
  payments,
  onStatusChange,
  onPayment,
}) {
  const now = new Date();

  const nextAppointment = appointments
    .filter((a) => a.date && a.time && a.status !== 'בוטל')
    .sort((a, b) => {
      const aTime = new Date(`${a.date}T${a.time}`);
      const bTime = new Date(`${b.date}T${b.time}`);
      return aTime.getTime() - bTime.getTime();
    })
    .find((a) => {
      const aTime = new Date(`${a.date}T${a.time}`);
      return isAfter(aTime, now);
    });

  if (!nextAppointment) return null;

  const patient = patients.find((p) => p.id === nextAppointment.patient_id);
  // leverage shared helper
  const isEnded = isAppointmentEnded(nextAppointment);

  return (
    <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-600 mb-1">התור הקרוב</p>
            <h3 className="text-lg font-bold text-gray-800">
              {nextAppointment.patient_name}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {format(parseISO(nextAppointment.date), 'EEEE, d MMMM', {
                  locale: he,
                })}
              </span>
              <span className="font-semibold">{nextAppointment.time}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {isEnded && nextAppointment.status === 'מתוכנן' && (
              <Button
                onClick={() => onStatusChange(nextAppointment, 'בוצע')}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" /> סימון בוצע
              </Button>
            )}

            {isEnded &&
              nextAppointment.status !== 'בוטל' &&
              nextAppointment.status !== 'לא הגיע' &&
              !payments.find((p) => p.session_id === nextAppointment.id) && (
                <Button
                  onClick={() => onPayment(nextAppointment, patient)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="w-4 h-4" /> תשלום
                </Button>
              )}

            {!isEnded && (
              <p className="text-sm text-gray-500 px-4 py-2">
                {(() => {
                  const diffMin = Math.round(
                    (new Date(`${nextAppointment.date}T${nextAppointment.time}`).getTime() - now.getTime()) / 60000
                  );
                  if (diffMin < 60) return `בעוד ${diffMin} דקות`;
                  const h = Math.floor(diffMin / 60);
                  const m = diffMin % 60;
                  return m > 0 ? `בעוד ${h} שעות ו-${m} דקות` : `בעוד ${h} שעות`;
                })()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}