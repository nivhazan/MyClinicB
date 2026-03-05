import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Edit2, Trash2, Calendar, Clock, User, FileText, DollarSign, CheckCircle } from 'lucide-react';
import { isAppointmentEnded } from '../shared/appointmentUtils';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import SendTelegramReminder from './SendTelegramReminder';
import FinishTreatmentWizard from '../appointments/FinishTreatmentWizard';

export default function AppointmentDetailsModal({ appointment, patient, isPaid, onClose, onEdit, onDelete, onMarkAsPaid, payments = [] }) {
  const [showWizard, setShowWizard] = useState(false);
  if (!appointment) return null;

  const statusColors = {
    'מתוכנן': 'bg-blue-100 text-blue-800',
    'אושר': 'bg-green-100 text-green-800',
    'בוצע': 'bg-purple-100 text-purple-800',
    'בוטל': 'bg-red-100 text-red-800',
    'לא הגיע': 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-2xl border-0 my-8">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">פרטי התור</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">מטופל</p>
              <p className="text-lg font-semibold">{appointment.patient_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">תאריך</p>
              <p className="font-semibold">
                {appointment.date && format(parseISO(appointment.date), 'd בMMMM yyyy', { locale: he })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">שעה ומשך</p>
              <p className="font-semibold">{appointment.time} • {appointment.duration} דקות</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">סוג</p>
              <p className="font-semibold">{appointment.type}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">סטטוס</p>
            <Badge className={statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}>
              {appointment.status}
            </Badge>
          </div>

          {appointment.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-2">הערות</p>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{appointment.notes}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t bg-gray-50 flex flex-col gap-3 p-6">
          <div className="flex gap-2 w-full">
            <SendTelegramReminder appointment={appointment} />
          </div>
          <div className="flex justify-between gap-3 w-full flex-wrap">
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm('האם למחוק את התור?')) {
                    onDelete(appointment.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                מחק
              </Button>
              <Button
                onClick={() => {
                  onEdit(appointment);
                  onClose();
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Edit2 className="w-4 h-4 ml-2" />
                ערוך
              </Button>
            </div>
          <div className="flex gap-2">
            {appointment.status === 'מתוכנן' && (
              <Button
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                onClick={() => setShowWizard(true)}
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                סיימתי טיפול
              </Button>
            )}
            {!isPaid && isAppointmentEnded(appointment) && patient?.billing_model !== 'monthly_aggregate' && appointment.status !== 'מתוכנן' && (
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                onClick={() => {
                  onMarkAsPaid(appointment, patient);
                  onClose();
                }}
              >
                <DollarSign className="w-4 h-4 ml-2" />
                רשום תשלום
              </Button>
            )}
            {isPaid && (
              <Badge className="bg-green-100 text-green-800 px-4 py-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                שולם
              </Badge>
            )}
            {patient?.billing_model === 'monthly_aggregate' && isAppointmentEnded(appointment) && (
              <Badge className="bg-yellow-100 text-yellow-800 px-4 py-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                תשלום חודשי
              </Badge>
            )}
            </div>
          </div>
        </CardFooter>
        </Card>
      </div>

      {showWizard && (
        <FinishTreatmentWizard
          appointment={appointment}
          patient={patient}
          payments={payments}
          onClose={() => {
            setShowWizard(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}