import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function QuickPaymentModal({ appointment, patient, lastPayment, onSubmit, onCancel, prefill }) {
  const getDefaultAmount = () => {
    if (prefill?.amount && prefill.amount > 0) return prefill.amount;
    if (appointment?.amount && appointment.amount > 0) return appointment.amount;
    return patient?.session_price || 0;
  };

  const [paymentData, setPaymentData] = useState({
    amount: getDefaultAmount(),
    payment_method: prefill?.payment_method || lastPayment?.payment_method || 'מזומן',
    payment_date: prefill?.payment_date || format(new Date(), 'yyyy-MM-dd'),
    notes: prefill?.notes || (appointment?.date ? `תשלום עבור תור מתאריך ${format(parseISO(appointment.date), 'd/M/yyyy', { locale: he })}` : '')
  });

  const paymentMethods = ['מזומן', 'העברה בנקאית', 'אשראי', 'צ\'ק', 'ביט/פייבוקס'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!paymentData.amount || paymentData.amount <= 0) {
      alert('יש להזין סכום תשלום גדול מ-0');
      return;
    }

    const submitData = {
      patient_id: appointment?.patient_id || prefill?.patient_id,
      patient_name: appointment?.patient_name || prefill?.patient_name,
      payment_type: prefill?.type === 'monthly' ? 'תשלום חודשי' : 'תשלום טיפול',
      billing_type: prefill?.type === 'monthly' ? 'monthly_aggregate' : 'per_session',
      status: 'paid',
      ...paymentData
    };
    
    // CRITICAL: Only set session_id for per-session payments (NOT monthly)
    if (prefill?.type === 'monthly') {
      if (prefill?.month) {
        submitData.billing_month = prefill.month;
      }
    } else {
      // Per-session payment
      if (appointment?.id) {
        submitData.session_id = appointment.id;
      }
    }
    
    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl border-0 my-8">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-teal-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <CardTitle className="text-xl">רישום תשלום</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600">מטופל</p>
              <p className="font-semibold text-gray-800">{appointment?.patient_name || prefill?.patient_name}</p>
              {appointment?.date && (
                <p className="text-xs text-gray-500 mt-1">
                  תור מתאריך {format(parseISO(appointment.date), 'd בMMMM yyyy', { locale: he })} בשעה {appointment.time}
                </p>
              )}
              {prefill?.type === 'monthly' && (
                <p className="text-xs text-gray-500 mt-1">
                  חיוב חודשי עבור {prefill.month}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">סכום לתשלום</Label>
              <Input
                id="amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                className="text-lg font-semibold"
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_method">אמצעי תשלום</Label>
              <select
                id="payment_method"
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="payment_date">תאריך תשלום</Label>
              <Input
                id="payment_date"
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">הערות (אופציונלי)</Label>
              <Input
                id="notes"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="הערות נוספות"
              />
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-gray-50 flex justify-between gap-3 p-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
            >
              <DollarSign className="w-4 h-4 ml-2" />
              אישור תשלום
            </Button>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  );
}