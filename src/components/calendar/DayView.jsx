import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Clock, Plus, DollarSign, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isAppointmentEnded } from '../shared/appointmentUtils';

export default function DayView({ currentDate, appointments, patients, payments, closures, onAppointmentClick, onAddAppointment, onMarkAsPaid }) {
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const isClosed = closures?.some(c => dateStr >= c.start_date && dateStr <= c.end_date);
  const closure = closures?.find(c => dateStr >= c.start_date && dateStr <= c.end_date);
  const dayAppointments = appointments
    .filter(apt => apt.date && isSameDay(parseISO(apt.date), currentDate))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // Calculate time slots dynamically based on appointments
  // Build slots: one slot per appointment (at its exact time), plus empty 45-min slots to fill the day
  const generateTimeSlots = () => {
    const aptTimesSet = new Set(
      dayAppointments
        .filter(a => a.time)
        .map(a => {
          const [h, m] = a.time.split(':').map(Number);
          return h * 60 + m;
        })
    );

    const startHour = dayAppointments.length > 0 && dayAppointments[0].time
      ? (() => { const [h, m] = dayAppointments[0].time.split(':').map(Number); return h * 60 + m; })()
      : 8 * 60;
    const endTime = 21 * 60;

    const allSlots = new Set();
    // Add all appointment times
    aptTimesSet.forEach(t => allSlots.add(t));
    // Add regular 45-min slots
    for (let t = startHour; t < endTime; t += 45) {
      allSlots.add(t);
    }

    return Array.from(allSlots).sort((a, b) => a - b);
  };

  const timeSlots = generateTimeSlots();

  const getAppointmentAtTime = (timeInMinutes) => {
    return dayAppointments.filter(apt => {
      if (!apt.time) return false;
      const [hours, minutes] = apt.time.split(':').map(Number);
      return hours * 60 + minutes === timeInMinutes;
    });
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (isClosed) {
    return (
      <Card className="shadow-md border-0 bg-gray-100">
        <CardHeader className="border-b bg-gray-200 text-center py-8">
          <CardTitle className="text-2xl">
            {closure?.type === 'holiday' ? '🎉 חג' : '🏖️ חופשה'}
          </CardTitle>
          <p className="text-lg font-semibold text-gray-700 mt-2">{closure?.reason}</p>
          <p className="text-sm text-gray-600 mt-1">הקליניקה סגורה ביום זה</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle>
          {format(currentDate, 'EEEE, d בMMMM yyyy', { locale: he })}
        </CardTitle>
        <p className="text-sm text-gray-600">{dayAppointments.length} תורים</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {timeSlots.map((timeSlot, index) => {
            const slotAppointments = getAppointmentAtTime(timeSlot);
            return (
              <div key={index} className="flex hover:bg-gray-50 transition-colors">
                <div className="w-20 p-3 text-sm text-gray-500 border-l flex items-start">
                  <Clock className="w-3 h-3 ml-1 mt-0.5" />
                  {formatTime(timeSlot)}
                </div>
                <div className="flex-1 p-3 space-y-2">
                  {slotAppointments.length > 0 ? (
                    slotAppointments.map(apt => {
                      const patient = patients?.find(p => p.id === apt.patient_id);
                      const isPastAppointment = isAppointmentEnded(apt);
                      const hasPayment = payments?.some(p => p.session_id === apt.id);
                      const isMonthlyPayer = patient?.billing_model === 'monthly_aggregate';
                      
                      let bgColor = 'bg-blue-100 hover:bg-blue-200 border-blue-200';
                      if (apt.status === 'בוטל' || apt.status === 'לא הגיע') {
                        bgColor = 'bg-gray-100 hover:bg-gray-100 border-gray-200';
                      } else if (isPastAppointment) {
                        if (hasPayment) {
                          bgColor = 'bg-green-100 hover:bg-green-200 border-green-400 border-r-4';
                        } else if (isMonthlyPayer) {
                          bgColor = 'bg-yellow-100 hover:bg-yellow-200 border-yellow-400 border-r-4';
                        } else {
                          bgColor = 'bg-red-100 hover:bg-red-200 border-red-400 border-r-4';
                        }
                      }
                      
                      return (
                        <div key={apt.id} className={`w-full flex items-center gap-2 p-3 rounded-lg ${bgColor} border`} dir="rtl">
                          <div className="flex-1 text-right">
                            <div className="font-medium text-gray-800">{apt.patient_name}</div>
                            <div className="text-sm text-gray-600">
                              {apt.time} • {apt.duration} דקות • {apt.type}
                            </div>
                          </div>
                          <div className="flex flex-row gap-1 items-center">
                            <button onClick={() => onAppointmentClick(apt)} className="text-xs text-blue-600 hover:text-blue-800 px-1">פרטים</button>
                            {patient?.phone && (
                              <button
                                onClick={() => window.open(`https://wa.me/972${patient.phone.replace(/^0/, '')}`, '_blank')}
                                className="p-1 hover:bg-black/10 rounded"
                                title="וואטסאפ"
                              >
                                <MessageSquare className="w-4 h-4 text-green-600" />
                              </button>
                            )}
                            {!hasPayment && isPastAppointment && !isMonthlyPayer && onMarkAsPaid && apt.status !== 'בוטל' && apt.status !== 'לא הגיע' && (
                              <button
                                onClick={() => onMarkAsPaid(apt, patient)}
                                className="p-1 hover:bg-black/10 rounded"
                                title="סמן כשולם"
                              >
                                <DollarSign className="w-4 h-4 text-green-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : !isClosed ? (
                    <button
                       onClick={() => onAddAppointment(format(currentDate, 'yyyy-MM-dd'), formatTime(timeSlot))}
                       className="w-full py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                     >
                       <Plus className="w-4 h-4 mx-auto" />
                     </button>
                   ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}