import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Clock, DollarSign, FileText, AlertCircle, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function DebtDetailsModal({ debt, onPayClick, onClose }) {
  const { appointment, patient, amount, existingPayment, payments } = debt;

  // Find actual payment record if exists (passed via debt or derived)
  const paymentRecord = existingPayment;

  const getStatusBadge = (status) => {
    const statusMap = {
      'בוצע': { variant: 'default', color: 'bg-green-100 text-green-800' },
      'מתוכנן': { variant: 'outline', color: 'bg-blue-100 text-blue-800' },
      'לא הגיע': { variant: 'destructive', color: 'bg-red-100 text-red-800' },
      'בוטל': { variant: 'secondary', color: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status] || statusMap['מתוכנן'];
  };

  const statusBadge = getStatusBadge(appointment.status);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0 my-8">
          <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                <CardTitle className="text-xl">פרטי חוב</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Patient Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">מטופל</p>
              <p className="font-semibold text-gray-800 text-lg">{appointment.patient_name}</p>
            </div>

            {/* Appointment Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">תאריך טיפול</p>
                  <p className="font-medium text-gray-800">
                    {format(parseISO(appointment.date), 'd בMMMM yyyy', { locale: he })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">שעה</p>
                  <p className="font-medium text-gray-800">{appointment.time}</p>
                </div>
              </div>

              {appointment.type && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">סוג טיפול</p>
                    <p className="font-medium text-gray-800">{appointment.type}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">סטטוס טיפול</p>
                  <Badge className={`${statusBadge.color} mt-1`}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">סכום לתשלום</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">₪{amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {appointment.amount && appointment.amount > 0 
                      ? 'מחיר מותאם אישית' 
                      : 'מחיר רגיל לטיפול'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Payment status */}
            <div className={`p-4 rounded-lg border ${paymentRecord ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${paymentRecord ? 'bg-green-500' : 'bg-red-500'}`} />
                <p className={`text-sm font-medium ${paymentRecord ? 'text-green-800' : 'text-red-800'}`}>
                  {paymentRecord ? 'שולם' : 'לא שולם'}
                </p>
              </div>
            </div>

            {/* Receipt status (only if paid) */}
            {paymentRecord && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">סטטוס קבלה</p>
                  <Badge className={
                    paymentRecord.receipt_status === 'sent' ? 'bg-green-100 text-green-800' :
                    paymentRecord.receipt_status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {paymentRecord.receipt_status === 'sent' ? 'נשלחה' :
                     paymentRecord.receipt_status === 'failed' ? 'נכשלה' : 'ממתין'}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t bg-gray-50 flex justify-between gap-3 p-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              סגירה
            </Button>
            <Button
              onClick={() => {
                onPayClick();
                onClose();
              }}
              disabled={existingPayment}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <DollarSign className="w-4 h-4 ml-2" />
              רישום תשלום
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}