import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { isAppointmentEnded } from '../shared/appointmentUtils';

export default function PaymentForm({ payment, patients, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(payment || {
    patient_id: '',
    patient_name: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    payment_method: 'מזומן',
    notes: ''
  });
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const selectedPatient = patients.find(p => p.id === formData.patient_id);
  // determine mode: if billing_month present it's monthly; else if session_id selected it's per-session
  const isMonthly = !!formData.billing_month || (!formData.session_id && selectedPatient?.billing_model === 'monthly_aggregate');

  // a helper that will hide/show the type selector defaulting based on formData
  const paymentType = formData.billing_month ? 'monthly' : 'per_session';

  // Load past (ended) appointments for selected per_session patient
  useEffect(() => {
    if (!formData.patient_id || isMonthly) {
      setPatientAppointments([]);
      return;
    }
    setLoadingAppointments(true);
    base44.entities.Appointment.filter({ patient_id: formData.patient_id })
      .then(apts => {
        // Only include appointments that have truly ended and are not cancelled/no-show
        const eligible = apts
          .filter(a => a.status !== 'בוטל' && a.status !== 'לא הגיע')
          .filter(a => isAppointmentEnded(a));
        eligible.sort((a, b) => b.date.localeCompare(a.date));
        setPatientAppointments(eligible);
      })
      .finally(() => setLoadingAppointments(false));
  }, [formData.patient_id, isMonthly]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // validation
    if (paymentType === 'monthly' && !formData.billing_month) {
      alert('יש לבחור חודש לתשלום חודשי');
      return;
    }
    if (paymentType === 'per_session' && !formData.session_id) {
      alert('יש לבחור תור לתשלום טיפול');
      return;
    }

    // if per-session, ensure selected appointment has ended
    if (paymentType === 'per_session' && formData.session_id) {
      const apt = patientAppointments.find(a => a.id === formData.session_id);
      if (apt && !isAppointmentEnded(apt)) {
        alert('לא ניתן לרשום תשלום לתור שטרם הסתיים');
        return;
      }
    }

    const data = { ...formData };
    if (paymentType === 'monthly') {
      delete data.session_id;
      data.billing_type = 'monthly_aggregate';
    } else {
      delete data.billing_month;
      data.billing_type = 'per_session';
    }
    onSubmit(data);
  };

  const handlePatientChange = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      setFormData({
        ...formData,
        patient_id: patientId,
        patient_name: patient.full_name,
        amount: patient.session_price || '',
        session_id: '',
        billing_month: '',
        // reset type when changing patient
        payment_type: ''
      });
    }
  };

  const handleAppointmentChange = (appointmentId) => {
    const apt = patientAppointments.find(a => a.id === appointmentId);
    setFormData({ ...formData, session_id: appointmentId, payment_date: apt?.date || formData.payment_date });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl border-0 my-8">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-teal-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {payment ? 'עריכת תשלום' : 'תשלום חדש'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>מטופל *</Label>
              <Select
                value={formData.patient_id}
                onValueChange={handlePatientChange}
                disabled={!!payment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מטופל" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>תאריך תשלום *</Label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>סכום *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <Label>אמצעי תשלום</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="מזומן">מזומן</SelectItem>
                  <SelectItem value="העברה בנקאית">העברה בנקאית</SelectItem>
                  <SelectItem value="אשראי">אשראי</SelectItem>
                  <SelectItem value="צ'ק">צ'ק</SelectItem>
                  <SelectItem value="ביט/פייבוקס">ביט/פייבוקס</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.patient_id && (
              <div className="p-3 rounded-lg bg-blue-50 text-sm text-blue-700">
                סוג חיוב: <strong>{paymentType === 'monthly' ? 'חודשי מצטבר' : 'לפי טיפול'}</strong>
              </div>
            )}

            {/* allow switch between session and monthly when applicable */}
            {formData.patient_id && (
              <div>
                <Label>סוג תשלום</Label>
                <Select
                  value={paymentType}
                  onValueChange={(val) => {
                    setFormData(prev => {
                      const updated = { ...prev };
                      if (val === 'monthly') {
                        updated.billing_month = '';
                        delete updated.session_id;
                      } else {
                        updated.session_id = '';
                        delete updated.billing_month;
                      }
                      return updated;
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_session">לפי טיפול</SelectItem>
                    <SelectItem value="monthly">חודשי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.patient_id && paymentType === 'monthly' && (
              <div>
                <Label>חודש חיוב *</Label>
                <Input
                  type="month"
                  value={formData.billing_month || ''}
                  onChange={(e) => setFormData({ ...formData, billing_month: e.target.value })}
                  required
                />
              </div>
            )}

            {formData.patient_id && paymentType === 'per_session' && (
              <div>
                <Label>תור לתשלום *</Label>
                <Select
                  value={formData.session_id || ''}
                  onValueChange={handleAppointmentChange}
                  disabled={loadingAppointments}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAppointments ? 'טוען...' : 'בחר תור'} />
                  </SelectTrigger>
                  <SelectContent>
                    {patientAppointments.map(apt => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.date} {apt.time} — {apt.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>הערות</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות נוספות..."
                rows={3}
              />
            </div>
          </CardContent>

          <CardFooter className="border-t bg-gray-50 flex justify-end gap-3 p-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              {payment ? 'עדכן תשלום' : 'שמור תשלום'}
            </Button>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  );
}