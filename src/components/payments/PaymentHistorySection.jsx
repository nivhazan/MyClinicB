import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PaymentHistorySection({ payments, onRetryReceipt }) {
  const paymentMethodColors = {
    'מזומן': 'bg-green-100 text-green-800',
    'העברה בנקאית': 'bg-blue-100 text-blue-800',
    'אשראי': 'bg-purple-100 text-purple-800',
    'צ\'ק': 'bg-orange-100 text-orange-800',
    'ביט/פייבוקס': 'bg-pink-100 text-pink-800'
  };

  const receiptStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const receiptStatusText = (status) => {
    switch (status) {
      case 'sent': return 'נשלח';
      case 'failed': return 'נכשל';
      default: return 'ממתין';
    }
  };

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-600" />
          היסטוריית תשלומים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">אין תשלומים להצגה</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">מטופל</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">תאריך</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">סכום</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">אמצעי</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">סוג</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-700">קבלה</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{payment.patient_name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(payment.payment_date), 'd בMMMM yyyy', { locale: he })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-green-600">
                        ₪{payment.amount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={paymentMethodColors[payment.payment_method]}>
                        {payment.payment_method}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{payment.payment_type}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {receiptStatusIcon(payment.receipt_status)}
                          <span className="text-sm text-gray-600">{receiptStatusText(payment.receipt_status)}</span>
                        </div>
                        {payment.receipt_status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRetryReceipt(payment.id)}
                            className="h-6 w-6 p-0"
                            title="נסה שוב"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}