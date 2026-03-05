import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';

export default function MonthlyBillingSection({ appointments, payments, patients, onPayClick }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
  const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));

  // Precompute paid months per patient
  const paidMonthsByPatient = {};
  payments.forEach(p => {
    if (p.billing_month && p.patient_id) {
      paidMonthsByPatient[p.patient_id] = paidMonthsByPatient[p.patient_id] || new Set();
      paidMonthsByPatient[p.patient_id].add(p.billing_month);
    }
  });

  // Find monthly billing patients with unpaid sessions (exclude sessions in months already covered)
  const monthlyDebts = appointments
    .filter(apt => {
      if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return false;
      const aptDate = parseISO(apt.date);
      if (aptDate > now) return false;
      const patient = patients.find(p => p.id === apt.patient_id);
      return patient?.billing_model === 'monthly_aggregate';
    })
    .map(apt => {
      const aptDate = parseISO(apt.date);
      const patient = patients.find(p => p.id === apt.patient_id);
      const hasPayment = payments.some(p => p.session_id === apt.id);
      const billingMonth = format(aptDate, 'yyyy-MM');
      const monthPaid = paidMonthsByPatient[apt.patient_id]?.has(billingMonth);

      // Determine status
      let statusColor = 'bg-yellow-100 text-yellow-800';
      let statusText = 'חודש זה';

      if (!isWithinInterval(aptDate, { start: monthStart, end: monthEnd }) && !hasPayment) {
        statusColor = 'bg-red-100 text-red-800';
        statusText = 'עבר להחזיר';
      }

      return {
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patient_name,
        date: apt.date,
        time: apt.time,
        billing_month: billingMonth,
        amount: patient?.session_price || 0,
        hasPayment,
        monthPaid,
        statusColor,
        statusText
      };
    })
    .filter(debt => !debt.hasPayment && !debt.monthPaid)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const pastDueDebts = monthlyDebts.filter(d => !isWithinInterval(parseISO(d.date), { start: monthStart, end: monthEnd }));
  const currentMonthDebts = monthlyDebts.filter(d => isWithinInterval(parseISO(d.date), { start: monthStart, end: monthEnd }));

  if (monthlyDebts.length === 0) {
    return (
      <Card className="shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-600" />
            משלמים חודשי
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">אין חובות חודשיים</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <CardTitle>חודשי - חובות פתוחים</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{monthlyDebts.length} טיפולים לא שולמו</p>
            </div>
          </div>
          {pastDueDebts.length > 0 && (
            <Badge className="bg-red-600 text-white text-lg px-4 py-2">
              {pastDueDebts.length} עבר להחזיר
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {/* Past Due Section */}
          {pastDueDebts.length > 0 && (
            <>
              {pastDueDebts.map((debt) => (
                <div key={debt.id} className="p-4 hover:bg-red-50 transition-colors border-l-4 border-red-500">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-800">{debt.patient_name}</h4>
                        <Badge className="bg-red-100 text-red-800">עבר להחזיר</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        חודש {format(parseISO(debt.date), 'MMMM yyyy', { locale: he })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-red-600">₪{debt.amount.toLocaleString()}</p>
                      <Button
                        size="sm"
                        onClick={() => onPayClick({
                          id: debt.id,
                          patient_id: debt.patient_id,
                          patient_name: debt.patient_name,
                          amount: debt.amount,
                          month: debt.billing_month,
                          type: 'monthly'
                        })}
                        className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                      >
                        סמן כשולם
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          
          {/* Current Month Section */}
          {currentMonthDebts.length > 0 && (
            <>
              {currentMonthDebts.map((debt) => (
                <div key={debt.id} className="p-4 hover:bg-yellow-50 transition-colors border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-800">{debt.patient_name}</h4>
                        <Badge className="bg-yellow-100 text-yellow-800">חודש נוכחי</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(parseISO(debt.date), 'd בMMMM yyyy', { locale: he })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-yellow-600">₪{debt.amount.toLocaleString()}</p>
                      <Button
                        size="sm"
                        onClick={() => onPayClick({
                          id: debt.id,
                          patient_id: debt.patient_id,
                          patient_name: debt.patient_name,
                          amount: debt.amount,
                          month: debt.billing_month,
                          type: 'monthly'
                        })}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap"
                      >
                        סמן כשולם
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}