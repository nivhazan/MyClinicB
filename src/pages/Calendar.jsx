import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, addMonths, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import AppointmentForm from '../components/calendar/AppointmentForm';
import AppointmentCard from '../components/calendar/AppointmentCard';
import WeekView from '../components/calendar/WeekView';
import ReminderSystem from '../components/reminders/ReminderSystem';
import CalendarViewToggle from '../components/calendar/CalendarViewToggle';
import MonthView from '../components/calendar/MonthView';
import DayView from '../components/calendar/DayView';
import AppointmentDetailsModal from '../components/calendar/AppointmentDetailsModal';
import QuickPaymentModal from '../components/payments/QuickPaymentModal';
import SendReminderModal from '../components/reminders/SendReminderModal';
import { useCreatePayment } from '../components/payments/useCreatePayment';
import { toast } from 'sonner';

export default function Calendar() {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [reminderModalData, setReminderModalData] = useState(null);

  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.filter({ activity_status: 'active' }),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list(),
  });

  const { data: reminderSettings } = useQuery({
    queryKey: ['reminderSettings'],
    queryFn: async () => {
      const data = await base44.entities.ReminderSettings.list();
      return data[0];
    }
  });

  const { data: closures = [] } = useQuery({
    queryKey: ['closures'],
    queryFn: () => base44.entities.ClinicClosure.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setEditingAppointment(null);
      setSelectedDate(null);
    },
  });

  const createPaymentMutation = useCreatePayment({
    onSuccess: () => setPaymentModalData(null),
  });

  const createPatientMutation = useMutation({
    mutationFn: (data) => base44.entities.Patient.create(data),
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setEditingAppointment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Appointment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const handleReschedule = (apt, changes, undoFn) => {
    const label = changes.date
      ? `הועבר ל-${format(parseISO(changes.date), 'd בMMMM', { locale: he })}`
      : `שעה שונתה ל-${changes.time}`;
    rescheduleMutation.mutate({ id: apt.id, data: { ...apt, ...changes } });
    toast.success(label, {
      action: {
        label: 'בטל',
        onClick: () => undoFn && undoFn(),
      },
      duration: 5000,
    });
  };

  const handleSubmit = (data) => {
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  React.useEffect(() => {
    const handleCreateNewPatient = async (e) => {
      const { name, date } = e.detail;
      try {
        await createPatientMutation.mutateAsync({
          full_name: name,
          activity_status: 'active',
          status: 'פעיל'
        });
      } catch (error) {
        alert('שגיאה בהוספת המטופל');
      }
    };

    window.addEventListener('createNewPatient', handleCreateNewPatient);
    return () => window.removeEventListener('createNewPatient', handleCreateNewPatient);
  }, [createPatientMutation]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => {
      if (!apt.date) return false;
      return isSameDay(parseISO(apt.date), day);
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const handleNavigate = (direction) => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, direction));
    } else if (view === 'week') {
      setCurrentWeekStart(addDays(currentWeekStart, direction * 7));
    } else if (view === 'month') {
      setCurrentDate(addMonths(currentDate, direction));
    }
  };

  const getNavigationLabel = () => {
    if (view === 'day') {
      return format(currentDate, 'd בMMMM yyyy', { locale: he });
    } else if (view === 'week') {
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
      return `${format(weekDays[0], 'd MMMM', { locale: he })} - ${format(weekDays[6], 'd MMMM yyyy', { locale: he })}`;
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: he });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">לוח תורים</h1>
          <p className="text-gray-600 mt-1">ניהול תורים ופגישות</p>
        </div>
        <div className="flex gap-3">
          <CalendarViewToggle view={view} onViewChange={setView} />
          <Button
            onClick={() => {
              setEditingAppointment(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            תור חדש
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <Card className="shadow-md border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate(-1)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">
                {getNavigationLabel()}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate(1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Form */}
      {showForm && (
        <AppointmentForm
          appointment={editingAppointment ? editingAppointment : (selectedDate || selectedTime) ? { date: selectedDate, time: selectedTime } : null}
          patients={patients}
          selectedDate={selectedDate}
          existingAppointments={appointments}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAppointment(null);
            setSelectedDate(null);
            setSelectedTime(null);
          }}
        />
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          patient={patients.find(p => p.id === selectedAppointment.patient_id)}
          payments={payments}
          isPaid={payments.some(p => p.session_id === selectedAppointment.id)}
          onClose={() => setSelectedAppointment(null)}
          onEdit={(apt) => {
            setEditingAppointment(apt);
            setShowForm(true);
          }}
          onDelete={(id) => deleteMutation.mutate(id)}
          onMarkAsPaid={(appointment, patient) => {
            const lastPatientPayment = payments
              .filter(p => p.patient_id === patient.id)
              .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];
            setPaymentModalData({ appointment, patient, lastPayment: lastPatientPayment });
          }}
        />
      )}

      {/* Calendar Views */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          appointments={appointments}
          patients={patients}
          payments={payments}
          closures={closures}
          onAppointmentClick={(apt) => setSelectedAppointment(apt)}
          onAddAppointment={(date) => {
            setSelectedDate(date);
            setShowForm(true);
          }}
          onMarkAsPaid={(appointment, patient) => {
            const lastPatientPayment = payments
              .filter(p => p.patient_id === patient.id)
              .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
            setPaymentModalData({ appointment, patient, lastPayment: lastPatientPayment });
          }}
        />
      )}

      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          appointments={appointments}
          patients={patients}
          payments={payments}
          closures={closures}
          onAppointmentClick={(apt) => setSelectedAppointment(apt)}
          onAddAppointment={(date, time) => {
            setSelectedDate(date);
            setSelectedTime(time);
            setShowForm(true);
          }}
          onMarkAsPaid={(appointment, patient) => {
            const lastPatientPayment = payments
              .filter(p => p.patient_id === patient.id)
              .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
            setPaymentModalData({ appointment, patient, lastPayment: lastPatientPayment });
          }}
        />
      )}

      {view === 'week' && (
        <WeekView
          weekDays={weekDays}
          appointments={appointments}
          patients={patients}
          payments={payments}
          closures={closures}
          onAppointmentClick={(apt) => setSelectedAppointment(apt)}
          onAddAppointment={(date) => { setSelectedDate(date); setShowForm(true); }}
          onMarkAsPaid={(appointment, patient) => {
            const lastPatientPayment = payments
              .filter(p => p.patient_id === patient.id)
              .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
            setPaymentModalData({ appointment, patient, lastPayment: lastPatientPayment });
          }}
          onReschedule={handleReschedule}
          setReminderModalData={setReminderModalData}
          onEdit={(apt) => { setEditingAppointment(apt); setShowForm(true); }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}

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

      {/* Send Reminder Modal */}
      {reminderModalData && (
        <SendReminderModal
          appointment={reminderModalData.appointment}
          patient={reminderModalData.patient}
          reminderTemplate={reminderSettings?.reminder_template}
          isOpen={!!reminderModalData}
          onClose={() => setReminderModalData(null)}
        />
      )}

      {/* Reminder System */}
      {appointments.length > 0 && <ReminderSystem appointments={appointments} />}
    </div>
  );
}