import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, X, Calendar } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { isAppointmentEnded } from '../shared/appointmentUtils';
import { he } from 'date-fns/locale';

function MonthlyDebtDetailModal({ patient, debt, onClose, onPayClick }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl border-0 my-8">
          <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{patient.full_name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">פירוט חוב חודשי</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Summary */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">חוב כולל</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    ₪{debt.totalAmount.toLocaleString()}
                  </p>
                </div>
                <Badge className="bg-red-600 text-white">
                  {debt.months.length} {debt.months.length === 1 ? 'חודש' : 'חודשים'}
                </Badge>
              </div>
            </div>

            {/* Monthly breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">פירוט לפי חודשים</h3>
              {debt.months.map((month, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-800">{month.monthLabel}</p>
                      <p className="text-xs text-gray-600">{month.sessionCount} טיפולים</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">₪{month.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          
          <div className="border-t bg-gray-50 p-6">
            <Button
              onClick={() => {
                const notesLines = [`תשלום חודשי עבור ${debt.months.map(m => m.monthLabel).join(', ')}:`];
                debt.months.forEach(m => {
                  m.sessionDates.forEach(date => notesLines.push(date));
                });
                
                onPayClick({
                  patient_id: patient.id,
                  patient_name: patient.full_name,
                  amount: debt.totalAmount,
                  type: 'monthly',
                  month: debt.months[0].month, // Primary month
                  notes: notesLines.join('\n')
                });
                onClose();
              }}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              ✅ רישום תשלום
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function MonthlyDebtsTable({ appointments, payments, patients, onPayClick }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const now = new Date();

  // Calculate monthly debts
  const monthlyDebts = patients
    ?.filter(p => p.billing_model === 'monthly_aggregate')
    .map(patient => {
      const patientAppointments = appointments.filter(apt => 
        apt.patient_id === patient.id && 
        apt.status !== 'בוטל' && 
        apt.status !== 'לא הגיע'
      );

      // Group appointments by month
      const monthlyGroups = {};
      patientAppointments.forEach(apt => {
        if (!isAppointmentEnded(apt, now)) return; // Skip future / in-progress
        const aptDate = parseISO(apt.date);
        
        const monthKey = format(aptDate, 'yyyy-MM');
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = {
            month: monthKey,
            monthLabel: format(aptDate, 'MMMM yyyy', { locale: he }),
            sessions: [],
            sessionDates: [],
            aptDate: aptDate
          };
        }
        monthlyGroups[monthKey].sessions.push(apt);
        monthlyGroups[monthKey].sessionDates.push(format(aptDate, 'dd/MM/yyyy'));
      });

      // Find unpaid months (only past months)
      const unpaidMonths = Object.values(monthlyGroups).filter(group => {
        const monthEnd = endOfMonth(group.aptDate);
        if (monthEnd >= startOfMonth(now)) return false; // Current month - not a debt yet
        
        // Month is closed ONLY if there's a monthly payment with billing_month for this patient+month
        const hasPayment = payments?.some(p =>
          p.patient_id === patient.id &&
          p.billing_month === group.month
        );
        
        return !hasPayment;
      });

      if (unpaidMonths.length === 0) return null;

      // Calculate total debt: per month = unpaid sessions * session_price
      // A session is "paid" if there's a per-session payment with session_id matching it
      const totalAmount = unpaidMonths.reduce((sum, group) => {
        const paidSessionsInMonth = group.sessions.filter(apt =>
          payments?.some(p => p.session_id === apt.id)
        ).length;
        const unpaidCount = group.sessions.length - paidSessionsInMonth;
        return sum + (unpaidCount * (patient.session_price || 0));
      }, 0);

      return {
        patient_id: patient.id,
        patient_name: patient.full_name,
        months: unpaidMonths.map(m => {
          const paidCount = m.sessions.filter(apt =>
            payments?.some(p => p.session_id === apt.id)
          ).length;
          const unpaidCount = m.sessions.length - paidCount;
          return {
            month: m.month,
            monthLabel: m.monthLabel,
            sessionCount: unpaidCount,
            sessionDates: m.sessionDates,
            amount: unpaidCount * (patient.session_price || 0)
          };
        }).filter(m => m.sessionCount > 0),
        totalAmount
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.patient_name.localeCompare(b.patient_name));

  if (!monthlyDebts || monthlyDebts.length === 0) {
    return null; // Don't show the section if no monthly debts
  }

  const totalDebt = monthlyDebts.reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <>
      <Card className="shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>חובות חודשיים</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {monthlyDebts.length} מטופלים חודשיים עם חובות
                </p>
              </div>
            </div>
            {totalDebt > 0 && (
              <Badge className="bg-orange-600 text-white text-lg px-4 py-2">
                ₪{totalDebt.toLocaleString()}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">מטופל</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">חודש חייב</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">סכום חוב</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">סטטוס</th>
                  <th className="text-center p-4 text-sm font-semibold text-gray-700">פעולה</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyDebts.map((debt) => (
                  <tr 
                    key={debt.patient_id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      const patient = patients.find(p => p.id === debt.patient_id);
                      setSelectedPatient({ patient, debt });
                    }}
                  >
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{debt.patient_name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700">
                        {debt.months.length === 1 
                          ? debt.months[0].monthLabel
                          : `${debt.months.length} חודשים`}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-orange-600">
                        ₪{debt.totalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-red-100 text-red-800">עבר</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          const patient = patients.find(p => p.id === debt.patient_id);
                          setSelectedPatient({ patient, debt });
                        }}
                      >
                        פירוט
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <MonthlyDebtDetailModal
          patient={selectedPatient.patient}
          debt={selectedPatient.debt}
          onClose={() => setSelectedPatient(null)}
          onPayClick={onPayClick}
        />
      )}
    </>
  );
}