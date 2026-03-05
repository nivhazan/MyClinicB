import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, Clock, ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { isUnpaidDebt } from '../shared/appointmentUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useCreatePayment } from '../payments/useCreatePayment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DebtDetailsModal from './DebtDetailsModal';
import QuickPaymentModal from '../payments/QuickPaymentModal';

export default function UnpaidDebts({ payments, patients, appointments }) {
  const [showAppointmentModal, setShowAppointmentModal] = useState(null);
  const [appointmentData, setAppointmentData] = useState({ date: '', time: '' });
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentModalData, setPaymentModalData] = useState(null);
  const queryClient = useQueryClient();

  // Get unpaid debts from appointments – only per_session patients
  const unpaidDebts = appointments
    ?.filter(apt => {
      const patient = patients?.find(p => p.id === apt.patient_id);
      if (patient?.billing_model === 'monthly_aggregate') return false;
      return isUnpaidDebt(apt, payments);
    })
    .map(apt => {
      const patient = patients.find(p => p.id === apt.patient_id);
      const amount = apt.amount && apt.amount > 0 ? apt.amount : patient?.session_price || 0;
      const existingPayment = payments.find(p => p.session_id === apt.id);
      
      return {
        appointment: apt,
        patient,
        amount,
        existingPayment
      };
    })
    .sort((a, b) => new Date(a.appointment.date) - new Date(b.appointment.date))
    .slice(0, 5) || [];

  const createPaymentMutation = useCreatePayment({
    onSuccess: () => setPaymentModalData(null),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('תור נוסף בהצלחה');
      setShowAppointmentModal(null);
      setAppointmentData({ date: '', time: '' });
    },
  });

  const handleScheduleAppointment = () => {
    const patient = patients.find(p => p.id === showAppointmentModal.patient_id);
    
    createAppointmentMutation.mutate({
      patient_id: showAppointmentModal.patient_id,
      patient_name: showAppointmentModal.patient_name,
      date: appointmentData.date,
      time: appointmentData.time,
      duration: 45,
      type: 'טיפול שוטף',
      status: 'מתוכנן'
    });
  };

  if (unpaidDebts.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
              חובות פתוחים ({unpaidDebts.length})
            </CardTitle>
            <Link to={createPageUrl('Payments')}>
              <Button variant="ghost" size="sm" className="text-blue-600">
                לכל החובות
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-3">
            {unpaidDebts.map((debt, idx) => {
              const { appointment, patient, amount } = debt;
              
              return (
                <div 
                  key={appointment.id || idx} 
                  className="relative group/debt p-4 bg-gradient-to-l from-red-50 to-transparent rounded-xl border border-red-100 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedDebt(debt)}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Debt Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold text-gray-800">{appointment.patient_name}</span>
                        <Badge variant="destructive" className="text-sm font-bold">
                          ₪{amount.toLocaleString()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {appointment.type || 'טיפול'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(parseISO(appointment.date), 'd בMMMM', { locale: he })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDebt(debt);
                        }}
                      >
                        פרטים
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Debt Details Modal */}
      {selectedDebt && !paymentModalData && (
        <DebtDetailsModal
          debt={selectedDebt}
          onPayClick={() => {
            const { appointment, patient } = selectedDebt;
            const lastPatientPayment = payments
              .filter(p => p.patient_id === patient?.id)
              .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0];
            setSelectedDebt(null);
            setPaymentModalData({ appointment, patient, lastPayment: lastPatientPayment });
          }}
          onClose={() => setSelectedDebt(null)}
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

      {/* Schedule Appointment Modal */}
      {showAppointmentModal && (
        <Dialog open={!!showAppointmentModal} onOpenChange={() => setShowAppointmentModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>שיבוץ תור למטופל: {showAppointmentModal.patient_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="apt-date">תאריך</Label>
                <Input
                  id="apt-date"
                  type="date"
                  value={appointmentData.date}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-time">שעה</Label>
                <Input
                  id="apt-time"
                  type="time"
                  value={appointmentData.time}
                  onChange={(e) => setAppointmentData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAppointmentModal(null)}>
                ביטול
              </Button>
              <Button 
                onClick={handleScheduleAppointment}
                disabled={!appointmentData.date || !appointmentData.time}
              >
                שמור תור
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}