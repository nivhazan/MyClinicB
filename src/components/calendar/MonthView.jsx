import React from 'react';
import { Card } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { Plus, DollarSign } from 'lucide-react';
import { isAppointmentEnded } from '../shared/appointmentUtils';

export default function MonthView({ currentDate, appointments, patients, payments, closures, onAppointmentClick, onAddAppointment, onMarkAsPaid }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();
  
  // Add empty cells for days before the month starts
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => null);
  const allCells = [...emptyCells, ...daysInMonth];

  const isClosed = (day) => {
    if (!day || !closures) return null;
    const dateStr = format(day, 'yyyy-MM-dd');
    return closures.find(c => dateStr >= c.start_date && dateStr <= c.end_date);
  };

  const getAppointmentsForDay = (day) => {
    if (!day) return [];
    return appointments.filter(apt => {
      if (!apt.date) return false;
      return isSameDay(parseISO(apt.date), day);
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div className="bg-white rounded-lg shadow-md border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {weekDays.map((day, idx) => (
          <div key={idx} className="p-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {allCells.map((day, idx) => {
           const dayAppointments = day ? getAppointmentsForDay(day) : [];
           const isCurrentMonth = day && isSameMonth(day, currentDate);
           const isTodayDate = day && isToday(day);
           const closure = isClosed(day);

           return (
            <div
              key={idx}
              className={`min-h-[100px] border-b border-l p-2 group ${
                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              } ${isTodayDate && !closure ? 'bg-blue-50' : ''} ${
                closure ? 'bg-gray-100 opacity-75' : ''
              }`}
              style={closure ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)' } : {}}
            >
              {day && (
               <>
                  <div className={`text-sm font-semibold mb-1 ${
                    isTodayDate && !closure ? 'text-blue-600' : isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                    {closure && <div className="text-xs text-gray-600">{closure.type === 'holiday' ? '🎉 חג' : '🏖️ חופשה'}</div>}
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => {
                      const patient = patients?.find(p => p.id === apt.patient_id);
                      const isPastAppointment = isAppointmentEnded(apt);
                      const hasPayment = payments?.some(p => p.session_id === apt.id);
                      const isMonthlyPayer = patient?.billing_model === 'monthly_aggregate';
                      
                      let bgColor = 'bg-blue-100 hover:bg-blue-200 text-blue-800';
                      if (apt.status === 'בוטל' || apt.status === 'לא הגיע') {
                        bgColor = 'bg-gray-100 hover:bg-gray-100 text-gray-600';
                      } else if (isPastAppointment) {
                        if (hasPayment) {
                          bgColor = 'bg-green-100 hover:bg-green-200 text-green-800 border-r-2 border-green-500';
                        } else if (isMonthlyPayer) {
                          bgColor = 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-r-2 border-yellow-500';
                        } else {
                          bgColor = 'bg-red-100 hover:bg-red-200 text-red-800 border-r-2 border-red-500';
                        }
                      }
                      
                      return (
                        <div key={apt.id} className="relative group/apt">
                          <button
                            onClick={() => onAppointmentClick(apt)}
                            className={`w-full text-right text-xs px-2 py-1 rounded ${bgColor} truncate transition-colors`}
                          >
                            {apt.time} {apt.patient_name}
                          </button>
                          {!hasPayment && isPastAppointment && !isMonthlyPayer && onMarkAsPaid && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsPaid(apt, patient);
                              }}
                              className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/apt:opacity-100 transition-opacity"
                              title="סמן כשולם"
                            >
                              <DollarSign className="w-3 h-3 text-green-600 hover:text-green-700" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayAppointments.length - 3} נוספים
                      </div>
                    )}
                    {isCurrentMonth && !closure && (
                       <button
                         onClick={() => onAddAppointment(format(day, 'yyyy-MM-dd'))}
                         className="w-full py-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                       >
                         <Plus className="w-3 h-3 mx-auto" />
                       </button>
                     )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}