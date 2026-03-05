import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, parseISO, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { isUnpaidDebt, getAppointmentEndDate } from '../shared/appointmentUtils';

export default function AllDebtsTable({ appointments, payments, patients, onPayClick }) {
  // Build unpaid debts at appointment level (per-session only, exclude monthly patients)
  const unpaidDebts = appointments
    .filter(apt => {
      const patient = patients?.find(p => p.id === apt.patient_id);
      if (patient?.billing_model === 'monthly_aggregate') return false;
      return isUnpaidDebt(apt, payments);
    })
    .map(apt => {
      const patient = patients?.find(p => p.id === apt.patient_id);
      const amount = (apt.amount && apt.amount > 0) ? apt.amount : patient?.session_price || 0;
      const aptDate = parseISO(apt.date);
      
      const isEndedToday = apt.date && isToday(aptDate);
      const statusColor = isEndedToday ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
      const statusText = isEndedToday ? 'היום' : 'עבר';
      const sortKey = isEndedToday ? 1 : 0;
      
      return {
        id: apt.id,
        patient_id: apt.patient_id,
        patient_name: apt.patient_name,
        date: apt.date,
        time: apt.time,
        type: apt.type,
        amount,
        statusColor,
        statusText,
        sortKey,
        dateObj: aptDate
      };
    })
    .sort((a, b) => {
      // Sort by status first (red before yellow)
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      // Then by date (oldest first)
      return a.dateObj - b.dateObj;
    });

  const totalDebt = unpaidDebts.reduce((sum, d) => sum + d.amount, 0);

  if (unpaidDebts.length === 0) {
    return (
      <Card className="shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <CardTitle>חובות פתוחים</CardTitle>
              <p className="text-sm text-gray-600 mt-1">אין חובות פתוחים כרגע</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-600 text-lg">כל הטיפולים שולמו! ✓</p>
            <Link to={createPageUrl('Calendar')}>
              <Button variant="outline">עבור ללוח תורים</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">מטופל</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">תאריך ושעה</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">סוג</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">סכום</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">סטטוס</th>
                <th className="text-center p-4 text-sm font-semibold text-gray-700">פעולה</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {unpaidDebts.map((debt) => (
                <tr key={debt.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{debt.patient_name}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(debt.date), 'd בMMMM yyyy', { locale: he })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        {debt.time}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-700">{debt.type}</td>
                  <td className="p-4">
                    <div className="font-semibold text-green-600">
                      ₪{debt.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={debt.statusColor}>{debt.statusText}</Badge>
                  </td>
                  <td className="p-4 text-center">
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
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      סמן כשולם
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}