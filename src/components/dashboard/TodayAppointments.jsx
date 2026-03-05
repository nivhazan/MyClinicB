import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, XCircle, X, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';
import { isAppointmentEnded } from '../shared/appointmentUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useCreatePayment } from '../payments/useCreatePayment';
import QuickPaymentModal from '../payments/QuickPaymentModal';
import FinishTreatmentWizard from '../appointments/FinishTreatmentWizard';

// Helper: Calculate payment badge for an appointment
function getPaymentBadge(apt, payments, patients) {
  if (payments.some(p => p.session_id === apt.id)) {
    return { text: 'שולם', color: 'bg-green-100 text-green-800' };
  }

  if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return null;

  const patient = patients?.find(p => p.id === apt.patient_id);

  if (patient?.billing_model === 'monthly_aggregate') {
    if (isAppointmentEnded(apt)) {
      return { text: 'ממתין חודשי', color: 'bg-yellow-100 text-yellow-800' };
    }
    return null;
  }

  if (isAppointmentEnded(apt)) {
    const aptDate = apt.date ? parseISO(apt.date) : null;
    if (aptDate && isToday(aptDate)) {
      return { text: 'היום', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'חוב', color: 'bg-red-100 text-red-800' };
  }

  return null;
}

export default function TodayAppointments({ appointments, patients, payments }) {
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [wizardData, setWizardData] = useState(null);
  const queryClient = useQueryClient();

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('התור עודכן בהצלחה');
    },
  });

  const createPaymentMutation = useCreatePayment({
    onSuccess: () => setPaymentModalData(null),
  });

  const handleOpenWizard = (apt) => {
    const patient = patients.find(p => p.id === apt.patient_id);
    setWizardData({ appointment: apt, patient });
  };
  
  const handleOpenPaymentModal = (apt, patient) => {
    const existingPayment = payments.find(p => p.session_id === apt.id);
    if (existingPayment) {
      toast.error('כבר קיים תשלום לטיפול זה');
      return;
    }
    if (!isAppointmentEnded(apt)) {
      toast.error('לא ניתן לרשום תשלום לטיפול שטרם הסתיים');
      return;
    }
    
    const lastPatientPayment = payments
      .filter(p => p.patient_id === patient.id)
      .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
    
    setPaymentModalData({ appointment: apt, patient, lastPayment: lastPatientPayment });
  };

  // Separate active (scheduled) and completed appointments
  const activeAppointments = appointments.filter(apt => apt.status === 'מתוכנן');
  const completedAppointments = appointments.filter(apt => 
    apt.status === 'בוצע' || apt.status === 'לא הגיע' || apt.status === 'בוטל'
  );

  if (appointments.length === 0) {
    return (
      <Card className="shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
            תורים היום
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>אין תורים היום</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderAppointment = (apt) => {
    const patient = patients.find(p => p.id === apt.patient_id);
    const paymentBadge = getPaymentBadge(apt, payments, patients);
    
    return (
      <div 
        key={apt.id} 
        className="relative group/apt p-3 md:p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 hover:shadow-md transition-all"
      >
        <div className="flex flex-col md:flex-row-reverse md:items-start gap-2 md:gap-3">
          {/* Time & Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
              <span className="text-base md:text-lg font-bold text-blue-600">{apt.time}</span>
              <span className="text-sm md:text-base font-semibold text-gray-800">{apt.patient_name}</span>
              
              {/* Status Badge */}
              <Badge variant={
                apt.status === 'בוצע' ? 'default' :
                apt.status === 'לא הגיע' ? 'destructive' :
                apt.status === 'בוטל' ? 'secondary' :
                'outline'
              } className="text-xs">
                {apt.status}
              </Badge>
              
              {/* Payment Badge */}
              {paymentBadge && (
                <Badge className={`text-xs ${paymentBadge.color}`}>
                  {paymentBadge.text}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2 mt-1 text-xs md:text-sm text-gray-600 flex-wrap justify-end">
              <span>{apt.type}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {apt.status === 'מתוכנן' && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs md:text-sm text-green-600 border-green-300 hover:bg-green-50 px-2 md:px-3 py-1 md:py-2"
                onClick={() => handleOpenWizard(apt)}
              >
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                <span className="hidden sm:inline">סיימתי טיפול</span>
                <span className="sm:hidden">סיום</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-blue-600" />
          תורים היום ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-4">
        {/* Active (Scheduled) Appointments */}
        {activeAppointments.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              נותרו להיום ({activeAppointments.length})
            </h3>
            <div className="space-y-3">
              {activeAppointments.map(renderAppointment)}
            </div>
          </div>
        )}

        {/* Completed Appointments (Collapsible) */}
        {completedAppointments.length > 0 && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50 flex-row-reverse"
            >
              <span>הסתיימו היום ({completedAppointments.length})</span>
              {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showCompleted && (
              <div className="space-y-3 mt-3">
                {completedAppointments.map(renderAppointment)}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Wizard Modal */}
      {wizardData && (
        <FinishTreatmentWizard
          appointment={wizardData.appointment}
          patient={wizardData.patient}
          payments={payments}
          onClose={() => setWizardData(null)}
        />
      )}
    </Card>
  );
}