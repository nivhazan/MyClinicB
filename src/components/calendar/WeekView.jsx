import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, isSameDay, parseISO, addDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Plus, MessageSquare, Clock, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { isAppointmentEnded } from '../shared/appointmentUtils';

const WORK_START = 7 * 60;  // 07:00
const WORK_END = 21 * 60;   // 21:00

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function hasConflict(appointments, aptId, date, time, duration = 45) {
  const start = timeToMinutes(time);
  const end = start + duration;
  return appointments.some(a => {
    if (a.id === aptId || a.date !== date || a.status === 'בוטל') return false;
    const aStart = timeToMinutes(a.time || '00:00');
    const aEnd = aStart + (a.duration || 45);
    return start < aEnd && end > aStart;
  });
}

function InlineTimeEditor({ appointment, appointments, onSave, onCancel }) {
  const [time, setTime] = useState(appointment.time || '');
  const conflict = time && time !== appointment.time && hasConflict(
    appointments, appointment.id, appointment.date, time, appointment.duration || 45
  );

  return (
    <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
      <Input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        className={`h-7 text-xs px-1 w-24 ${conflict ? 'border-red-400' : ''}`}
        autoFocus
      />
      {conflict && <span className="text-red-500 text-xs">התנגשות!</span>}
      <Button size="sm" className="h-6 px-2 text-xs" disabled={conflict || !time} onClick={() => onSave(time)}>
        ✓
      </Button>
      <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" onClick={onCancel}>✕</Button>
    </div>
  );
}

export default function WeekView({
  weekDays,
  appointments,
  patients,
  payments,
  closures,
  onAppointmentClick,
  onAddAppointment,
  onMarkAsPaid,
  onReschedule,
  setReminderModalData,
  onEdit,
  onDelete,
}) {
  const [editingTimeId, setEditingTimeId] = useState(null);

  const isClosed = (day) => {
    if (!closures) return null;
    const dateStr = format(day, 'yyyy-MM-dd');
    return closures.find(c => dateStr >= c.start_date && dateStr <= c.end_date);
  };

  const getAppointmentsForDay = (day) =>
    appointments.filter(apt => apt.date && isSameDay(parseISO(apt.date), day))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;

    const apt = appointments.find(a => a.id === draggableId);
    if (!apt) return;

    const newDate = destination.droppableId; // format yyyy-MM-dd

    // Check work hours
    if (apt.time) {
      const mins = timeToMinutes(apt.time);
      if (mins < WORK_START || mins >= WORK_END) {
        toast.error('מחוץ לשעות עבודה');
        return;
      }
    }

    // Check conflict on new date
    if (apt.time && hasConflict(appointments, apt.id, newDate, apt.time, apt.duration || 45)) {
      toast.error('התנגשות עם תור קיים ביום היעד');
      return;
    }

    const oldDate = apt.date;
    onReschedule(apt, { date: newDate }, () => {
      // undo callback
      onReschedule(apt, { date: oldDate });
    });
  };

  const handleTimeChange = (apt, newTime) => {
    const conflict = hasConflict(appointments, apt.id, apt.date, newTime, apt.duration || 45);
    if (conflict) {
      toast.error('התנגשות עם תור קיים');
      return;
    }
    const oldTime = apt.time;
    setEditingTimeId(null);
    onReschedule(apt, { time: newTime }, () => {
      onReschedule(apt, { time: oldTime });
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 md:gap-4">
        {weekDays.map((day) => {
           const dayAppointments = getAppointmentsForDay(day);
           const isToday = isSameDay(day, new Date());
           const dateStr = format(day, 'yyyy-MM-dd');
           const closure = isClosed(day);

           return (
             <Droppable key={dateStr} droppableId={dateStr}>
               {(provided, snapshot) => (
                 <Card
                   className={`shadow-md border-0 ${isToday && !closure ? 'ring-2 ring-blue-500' : ''} ${snapshot.isDraggingOver ? 'bg-blue-50' : ''} ${closure ? 'opacity-60' : ''}`}
                 >
                   <CardHeader className={`p-3 md:p-4 border-b ${
                     isToday && !closure ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : closure ? 'bg-gray-300 text-gray-600' : 'bg-gray-50'
                   }`}>
                    <CardTitle className="text-center">
                       <p className="text-xs md:text-sm font-medium">{format(day, 'EEEE', { locale: he })}</p>
                       <p className={`text-xl md:text-2xl font-bold ${isToday && !closure ? 'text-white' : closure ? 'text-gray-600' : 'text-gray-800'}`}>
                         {format(day, 'd')}
                       </p>
                       <p className="text-xs opacity-80">{format(day, 'MMMM', { locale: he })}</p>
                       {closure && <div className="text-xs mt-1">{closure.type === 'holiday' ? '🎉 חג' : '🏖️ חופשה'}</div>}
                     </CardTitle>
                  </CardHeader>

                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="p-2 md:p-3 space-y-2 min-h-[150px] md:min-h-[200px]"
                  >
                    {dayAppointments.map((apt, index) => {
                      const patient = patients.find(p => p.id === apt.patient_id);
                      // determine whether appointment has finished according to date/time/duration
                      const ended = isAppointmentEnded(apt);
                      const hasPayment = payments.some(p => p.session_id === apt.id);
                      const isMonthly = patient?.billing_model === 'monthly_aggregate';

                      let colorClass = 'bg-blue-50 border-blue-200';
                      // cancelled or no-show should always be grey
                      if (apt.status === 'בוטל' || apt.status === 'לא הגיע') {
                        colorClass = 'bg-gray-100 border-gray-200';
                      } else if (ended) {
                        if (hasPayment) {
                          colorClass = 'bg-green-50 border-green-300 border-r-4';
                        } else if (isMonthly) {
                          colorClass = 'bg-yellow-50 border-yellow-300 border-r-4';
                        } else {
                          colorClass = 'bg-red-50 border-red-300 border-r-4';
                        }
                      }

                      return (
                        <Draggable key={apt.id} draggableId={apt.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`rounded-lg border p-2 text-xs ${colorClass} ${dragSnapshot.isDragging ? 'shadow-lg opacity-90 rotate-1' : ''}`}
                            >
                              {/* Drag handle + name row */}
                              <div className="flex items-start gap-1">
                                <span
                                  {...dragProvided.dragHandleProps}
                                  className="text-gray-400 hover:text-gray-600 cursor-grab mt-0.5 flex-shrink-0"
                                  title="גרור להזזה"
                                >
                                  <GripVertical className="w-3 h-3" />
                                </span>
                                <button
                                  onClick={() => onAppointmentClick(apt)}
                                  className="flex-1 text-right font-medium text-gray-800 leading-tight"
                                >
                                  {apt.patient_name}
                              {/* mark as paid button only when ended, not paid, and not a monthly patient */}
                                </button>
                              </div>

                              {/* Time row – click to edit */}
                              {editingTimeId === apt.id ? (
                                <InlineTimeEditor
                                  appointment={apt}
                                  appointments={appointments}
                                  onSave={(t) => handleTimeChange(apt, t)}
                                  onCancel={() => setEditingTimeId(null)}
                                />
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingTimeId(apt.id); }}
                                  className="flex items-center gap-1 text-gray-500 hover:text-blue-600 mt-0.5 group"
                                  title="לחץ לשינוי שעה"
                                >
                                  <Clock className="w-3 h-3 group-hover:text-blue-500" />
                                  {apt.time} · {apt.duration || 45} דק'
                                </button>
                              )}

                              {/* Action links */}
                              <div className="flex gap-1 mt-1.5 border-t pt-1 border-gray-200">
                                <button onClick={() => onAppointmentClick(apt)} className="flex-1 text-blue-600 hover:text-blue-800 text-center">פרטים</button>
                                <button
                                  onClick={() => setReminderModalData({ appointment: apt, patient })}
                                  className="flex-1 text-green-600 hover:text-green-800 flex items-center justify-center gap-0.5"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {!closure && (
                      <button
                        onClick={() => onAddAppointment(dateStr)}
                        className="w-full p-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600"
                      >
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}