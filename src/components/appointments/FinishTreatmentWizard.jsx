import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import QuickPaymentModal from '../payments/QuickPaymentModal';
import { useCreatePayment } from '../payments/useCreatePayment';
import { isAppointmentEnded } from '../shared/appointmentUtils';
import AppointmentForm from '../calendar/AppointmentForm';
import { addDays, parseISO } from 'date-fns';

export default function FinishTreatmentWizard({ appointment, patient, payments = [], onClose }) {
  const [step, setStep] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('בוצע');
  const [notes, setNotes] = useState({ what_done: '', how_went: '', homework: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdPayment, setCreatedPayment] = useState(null);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const queryClient = useQueryClient();

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Appointment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      // toast is shown by caller (handleStatusSubmit) so we don't close automatically
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData) => {
      return await base44.entities.TreatmentSession.create(sessionData);
    },
    onError: (err) => console.error('Failed to create session:', err)
  });

  const createPaymentMutation = useCreatePayment({
    onSuccess: (payment) => {
      // keep the drawer open and move to summary step
      setCreatedPayment(payment);
      setShowPaymentModal(false);
      setStep(4);
      toast.success('התור הסתיים בהצלחה');
    }
  });

  const handleStatusSubmit = async () => {
    await updateAppointmentMutation.mutateAsync({
      id: appointment.id,
      data: { status: selectedStatus }
    });

    if (selectedStatus === 'בוצע') {
      setStep(2);
    } else {
      // show summary step even if the appointment was cancelled/no-show
      toast.success('התור עודכן בהצלחה');
      setStep(4);
    }
  };

  const handleNotesSubmit = async () => {
    if (notes.what_done || notes.how_went || notes.homework) {
      await createSessionMutation.mutateAsync({
        patient_id: appointment.patient_id,
        patient_name: appointment.patient_name,
        appointment_id: appointment.id,
        session_date: appointment.date,
        activities: notes.what_done,
        summary: notes.how_went,
        homework: notes.homework
      });
    }
    setStep(3);
  };

  const handlePaymentSubmit = (paymentData) => {
    createPaymentMutation.mutate(paymentData);
  };

  const skipToFinish = () => {
    // proceed to final summary without payment
    setShowPaymentModal(false);
    setStep(4);
    toast.success('התור הסתיים');
  };

  // Step 1: Status Selection
  if (step === 1) {
    return (
      <Drawer open={true} onOpenChange={(open) => !open && onClose?.()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>סיימתי טיפול - {appointment.patient_name}</DrawerTitle>
          </DrawerHeader>

          <div className="p-6 space-y-6 max-w-md mx-auto">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-gray-600">בחר סטטוס לתור:</p>
                <RadioGroup value={selectedStatus} onValueChange={setSelectedStatus}>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 bg-green-50 rounded-lg border border-green-200">
                    <RadioGroupItem value="בוצע" id="completed" />
                    <Label htmlFor="completed" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-green-900">בוצע</div>
                      <p className="text-xs text-green-700">הטיפול הסתיים בהצלחה</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <RadioGroupItem value="לא הגיע" id="noshow" />
                    <Label htmlFor="noshow" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-orange-900">לא הגיע</div>
                      <p className="text-xs text-orange-700">המטופל לא הגיע</p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse p-3 bg-red-50 rounded-lg border border-red-200">
                    <RadioGroupItem value="בוטל" id="cancelled" />
                    <Label htmlFor="cancelled" className="flex-1 cursor-pointer">
                      <div className="font-semibold text-red-900">בוטל</div>
                      <p className="text-xs text-red-700">התור בוטל</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <DrawerFooter className="flex flex-row gap-2 justify-between">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              onClick={handleStatusSubmit}
              disabled={updateAppointmentMutation.isPending}
            >
              {updateAppointmentMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <ChevronLeft className="w-4 h-4 ml-2" />
              )}
              {selectedStatus === 'בוצע' ? 'המשך' : 'שמור וסגור'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Step 2: Documentation
  if (step === 2) {
    return (
      <Drawer open={true} onOpenChange={(open) => !open && onClose?.()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>תיעוד קצר - {appointment.patient_name}</DrawerTitle>
          </DrawerHeader>

          <div className="p-6 space-y-4 max-w-md mx-auto">
            <div className="space-y-2">
              <Label htmlFor="what_done">מה עשינו בטיפול?</Label>
              <Textarea
                id="what_done"
                placeholder="לדוגמה: עבדנו על הפליטה וגם על הבלוטות"
                value={notes.what_done}
                onChange={(e) => setNotes({ ...notes, what_done: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="how_went">איך הלך הטיפול?</Label>
              <Textarea
                id="how_went"
                placeholder="לדוגמה: המטופל שיתוף פעולה טוב, ראינו התקדמות"
                value={notes.how_went}
                onChange={(e) => setNotes({ ...notes, how_went: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="homework">מה לבית?</Label>
              <Textarea
                id="homework"
                placeholder="לדוגמה: תרגול 3 פעמים ביום"
                value={notes.homework}
                onChange={(e) => setNotes({ ...notes, homework: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                💡 כל השדות אופציונליים. אתה יכול לדלג לתשלום.
              </p>
            </div>
          </div>

          <DrawerFooter className="flex flex-row gap-2 justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronRight className="w-4 h-4 ml-2" />
              חזור
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNotesSubmit}>
                דלג
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={handleNotesSubmit}
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <ChevronLeft className="w-4 h-4 ml-2" />
                )}
                המשך
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Step 4: Summary / follow-up
  if (step === 3) {
    return (
      <>
        <Drawer open={true} onOpenChange={(open) => !open && onClose?.()}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>רישום תשלום - {appointment.patient_name}</DrawerTitle>
            </DrawerHeader>

            <div className="p-6 max-w-md mx-auto">
              {patient?.billing_model === 'monthly_aggregate' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⏳ מטופל זה על חיוב חודשי — התשלום יתועד בסוף החודש.
                  </p>
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    onClick={skipToFinish}
                  >
                    סיים
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                  onClick={() => setShowPaymentModal(true)}
                >
                  רשום תשלום
                </Button>
              )}
            </div>

            <DrawerFooter className="flex flex-row gap-2 justify-between">
              <Button variant="outline" onClick={skipToFinish}>
                דלג לסוף
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {showPaymentModal && (
          <QuickPaymentModal
            appointment={appointment}
            patient={patient}
            lastPayment={payments.filter(p => p.patient_id === patient?.id).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]}
            prefill={null}
            onSubmit={handlePaymentSubmit}
            onCancel={() => setShowPaymentModal(false)}
          />
        )}
      </>
    );
  }

  // Step 4: Summary / follow-up
  if (step === 4) {
    return (
      <>
        <Drawer open={true} onOpenChange={(open) => !open && onClose?.()}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>התור הסתיים</DrawerTitle>
            </DrawerHeader>

            <div className="p-6 max-w-md mx-auto space-y-4">
              <p>סטטוס: {selectedStatus}</p>
              {createdPayment ? (
                <p>נרשם תשלום בתאריך {createdPayment.payment_date} בסך {createdPayment.amount}₪.</p>
              ) : (
                <p>לא נרשם תשלום.</p>
              )}
              {patient?.billing_model === 'monthly_aggregate' && (
                <p className="text-sm text-yellow-700">מטופל חודשי, החיוב יתועד בסוף החודש.</p>
              )}
            </div>

            <DrawerFooter className="flex flex-row gap-2 justify-between">
              <Button variant="outline" onClick={() => onClose?.()}>
                סגור
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={() => setShowFollowUpForm(true)}
              >
                קבע תור המשך
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        {showFollowUpForm && (
          <AppointmentForm
            appointment={null}
            patients={patient ? [patient] : []}
            selectedDate={appointment.date ? addDays(parseISO(appointment.date), 7) : ''}
            existingAppointments={[]}
            onSubmit={async (data) => {
              try {
                await base44.entities.Appointment.create(data);
                toast.success('תור המשך נוצר');
              } catch (err) {
                toast.error(err.message || 'שגיאה ביצירת תור');
              }
              setShowFollowUpForm(false);
              onClose?.();
            }}
            onCancel={() => {
              setShowFollowUpForm(false);
            }}
          />
        )}
      </>
    );
  }
}