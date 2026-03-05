import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calendar, DollarSign, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { isAppointmentEnded } from '../shared/appointmentUtils';

export default function UnpaidSessionsTracker({ appointments, payments, patients }) {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedPatient, setExpandedPatient] = useState(null);

  // Get current month boundaries
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Calculate unpaid sessions for each patient
  const unpaidData = appointments
    .filter(apt => {
      // Skip canceled or no-show appointments
      if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return false;
      
      const aptDate = parseISO(apt.date);
      // Must have ended (skip future/in-progress or missing data)
      if (!isAppointmentEnded(apt)) return false;

      // Check if payment exists for this appointment
      const hasPayment = payments?.some(p => p.session_id === apt.id);
      
      const patient = patients?.find(p => p.id === apt.patient_id);

      // If monthly payer, skip if month already paid
      if (patient?.billing_model === 'monthly_aggregate') {
        const monthKey = format(aptDate, 'yyyy-MM');
        const monthPaid = payments?.some(p => p.patient_id === patient.id && p.billing_month === monthKey);
        if (monthPaid) return false;

        const isCurrentMonth = isWithinInterval(aptDate, { start: monthStart, end: monthEnd });
        // If current month, don't count as unpaid yet
        // If past month, count as unpaid
        return !hasPayment && !isCurrentMonth;
      }
      
      // For per-session payers, count if no payment
      return !hasPayment;
    })
    .reduce((acc, apt) => {
      const patient = patients?.find(p => p.id === apt.patient_id);
      const patientId = apt.patient_id;
      
      if (!acc[patientId]) {
        acc[patientId] = {
          patient_name: apt.patient_name,
          patient_id: patientId,
          is_monthly: patient?.billing_model === 'monthly_aggregate',
          session_price: patient?.session_price || 0,
          sessions: [],
          total_debt: 0
        };
      }
      
      acc[patientId].sessions.push({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        type: apt.type
      });
      acc[patientId].total_debt += patient?.session_price || 0;
      
      return acc;
    }, {});

  // Separate monthly payers from per-session payers
  const unpaidArray = Object.values(unpaidData);
  const perSessionUnpaid = unpaidArray.filter(p => !p.is_monthly);
  const monthlyUnpaid = unpaidArray.filter(p => p.is_monthly);

  // Current month sessions for monthly payers (not yet considered "unpaid")
  const monthlyCurrentMonth = appointments
    .filter(apt => {
      if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return false;
      const aptDate = parseISO(apt.date);
      if (aptDate > now) return false;
      
      const patient = patients?.find(p => p.id === apt.patient_id);
      if (patient?.billing_model !== 'monthly_aggregate') return false;
      
      const isCurrentMonth = isWithinInterval(aptDate, { start: monthStart, end: monthEnd });
      const hasPayment = payments?.some(p => p.session_id === apt.id);
      
      return !hasPayment && isCurrentMonth;
    })
    .reduce((acc, apt) => {
      const patientId = apt.patient_id;
      if (!acc[patientId]) {
        const patient = patients?.find(p => p.id === apt.patient_id);
        acc[patientId] = {
          patient_name: apt.patient_name,
          patient_id: patientId,
          sessions: []
        };
      }
      acc[patientId].sessions.push({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        type: apt.type
      });
      return acc;
    }, {});

  const monthlyCurrentMonthArray = Object.values(monthlyCurrentMonth);

  const totalPerSessionDebt = perSessionUnpaid.reduce((sum, p) => sum + p.total_debt, 0);
  const totalMonthlyDebt = monthlyUnpaid.reduce((sum, p) => sum + p.total_debt, 0);
  const totalDebt = totalPerSessionDebt + totalMonthlyDebt;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Unpaid Counter */}
        <Card 
          className="shadow-md border-0 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowDetails(!showDetails)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">חובות לא שולמו</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {perSessionUnpaid.length + monthlyUnpaid.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">מטופלים</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-lg font-semibold text-red-600">
                ₪{totalDebt.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">סה"כ חוב</p>
            </div>
          </CardContent>
        </Card>

        {/* Per-Session Payers Unpaid */}
        <Card className="shadow-md border-0 bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">תשלום לפי טיפול</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {perSessionUnpaid.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">מטופלים לא שילמו</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-orange-200">
              <p className="text-lg font-semibold text-orange-600">
                ₪{totalPerSessionDebt.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">חוב לפי טיפול</p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payers - Current Month */}
        <Card className="shadow-md border-0 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">משלמים חודשי</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">
                  {monthlyCurrentMonthArray.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">ממתינים לסוף חודש</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-xs text-gray-600">
                {monthlyUnpaid.length > 0 && (
                  <span className="text-red-600 font-semibold">
                    {monthlyUnpaid.length} חודשיים שלא שילמו חודש קודם
                  </span>
                )}
                {monthlyUnpaid.length === 0 && (
                  <span className="text-green-600">✓ כולם שילמו</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="min-h-screen py-8 flex items-center justify-center">
            <Card className="w-full max-w-4xl shadow-2xl border-0 my-8">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">פירוט חובות - טיפולים שלא שולמו</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowDetails(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Per-Session Payers */}
                {perSessionUnpaid.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      מטופלים לפי טיפול ({perSessionUnpaid.length})
                    </h3>
                    <div className="space-y-3">
                      {perSessionUnpaid.map((patient) => (
                        <Card key={patient.patient_id} className="border border-red-200">
                          <CardHeader 
                            className="p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedPatient(expandedPatient === patient.patient_id ? null : patient.patient_id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-semibold text-gray-800">{patient.patient_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {patient.sessions.length} טיפולים לא שולמו
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge className="bg-red-100 text-red-800 text-lg px-3 py-1">
                                  ₪{patient.total_debt.toLocaleString()}
                                </Badge>
                                {expandedPatient === patient.patient_id ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          {expandedPatient === patient.patient_id && (
                            <CardContent className="p-4 pt-0 space-y-2">
                              {patient.sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {format(parseISO(session.date), 'd בMMMM yyyy', { locale: he })}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {session.time} • {session.type}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-red-600">
                                    ₪{patient.session_price}
                                  </Badge>
                                </div>
                              ))}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly Payers - Past Due */}
                {monthlyUnpaid.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      מטופלים חודשיים - חודשים עבר ({monthlyUnpaid.length})
                    </h3>
                    <div className="space-y-3">
                      {monthlyUnpaid.map((patient) => (
                        <Card key={patient.patient_id} className="border border-orange-200">
                          <CardHeader 
                            className="p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedPatient(expandedPatient === patient.patient_id ? null : patient.patient_id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-semibold text-gray-800">{patient.patient_name}</p>
                                  <p className="text-sm text-gray-600">
                                    {patient.sessions.length} טיפולים מחודש קודם
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge className="bg-orange-100 text-orange-800 text-lg px-3 py-1">
                                  ₪{patient.total_debt.toLocaleString()}
                                </Badge>
                                {expandedPatient === patient.patient_id ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          {expandedPatient === patient.patient_id && (
                            <CardContent className="p-4 pt-0 space-y-2">
                              {patient.sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {format(parseISO(session.date), 'd בMMMM yyyy', { locale: he })}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {session.time} • {session.type}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-orange-600">
                                    ₪{patient.session_price}
                                  </Badge>
                                </div>
                              ))}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly Payers - Current Month (Info Only) */}
                {monthlyCurrentMonthArray.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                      מטופלים חודשיים - חודש נוכחי ({monthlyCurrentMonthArray.length})
                      <Badge className="bg-yellow-100 text-yellow-800">ממתינים לסוף חודש</Badge>
                    </h3>
                    <div className="space-y-3">
                      {monthlyCurrentMonthArray.map((patient) => (
                        <Card key={patient.patient_id} className="border border-yellow-200 bg-yellow-50/30">
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-800">{patient.patient_name}</p>
                                <p className="text-sm text-gray-600">
                                  {patient.sessions.length} טיפולים החודש
                                </p>
                              </div>
                              <Badge variant="outline" className="text-yellow-600">
                                מחיר חודשי: ₪{patient.monthly_price || 0}
                              </Badge>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {perSessionUnpaid.length === 0 && monthlyUnpaid.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-800">אין חובות!</p>
                    <p className="text-gray-600 mt-1">כל המטופלים שילמו עבור הטיפולים שלהם</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}