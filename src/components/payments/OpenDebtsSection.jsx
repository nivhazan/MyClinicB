import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { isAppointmentEnded } from '../shared/appointmentUtils';

export default function OpenDebtsSection({ appointments, payments, patients, onPayClick }) {
  // Get unpaid per-session appointments
  const unpaidDebts = appointments
    .filter(apt => {
      // Skip cancelled/no-show
      if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return false;
      // Must have ended
      if (!isAppointmentEnded(apt)) return false;
      
      // Must be per-session (not monthly)
      const patient = patients?.find(p => p.id === apt.patient_id);
      if (patient?.billing_model === 'monthly_aggregate') return false;
      
      // No payment exists for this appointment
      const hasPayment = payments?.some(p => p.session_id === apt.id);
      return !hasPayment;
    })
    .map(apt => {
      const patient = patients?.find(p => p.id === apt.patient_id);
      const amount = (apt.amount && apt.amount > 0) ? apt.amount : patient?.session_price || 0;
      const aptDate = parseISO(apt.date);
      const now = new Date();
      
      // Determine status color
      let statusColor = 'bg-yellow-100 text-yellow-800'; // Today
      let statusText = 'היום';
      
      if (!isToday(aptDate) && isPast(aptDate)) {
        statusColor = 'bg-red-100 text-red-800';
        statusText = 'עבר';
      }
      
      return {
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patient_name,
        date: apt.date,
        time: apt.time,
        type: apt.type,
        amount,
        statusColor,
        statusText
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalDebt = unpaidDebts.reduce((sum, debt) => sum + debt.amount, 0);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle>חובות פתוחים - לפי טיפול</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{unpaidDebts.length} טיפולים לא שולמו</p>
            </div>
          </div>
          {totalDebt > 0 && (
            <Badge className="bg-red-600 text-white text-lg px-4 py-2">
              ₪{totalDebt.toLocaleString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {unpaidDebts.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">אין חובות פתוחים - כל הטיפולים שולמו! ✓</p>
          </div>
        ) : (
          <div className="divide-y">
            {unpaidDebts.map((debt) => (
              <div key={debt.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-800">{debt.patient_name}</h4>
                      <Badge className={debt.statusColor}>{debt.statusText}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(debt.date), 'd בMMMM yyyy', { locale: he })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {debt.time}
                      </div>
                      <span className="text-gray-500">{debt.type}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">₪{debt.amount.toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onPayClick({
                        id: debt.id,
                        patient_id: debt.patient_id,
                        patient_name: debt.patient_name,
                        amount: debt.amount,
                        date: debt.date,
                        time: debt.time,
                        type: 'per_session'
                      })}
                      className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                    >
                      סמן כשולם
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}