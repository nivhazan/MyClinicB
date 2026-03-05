import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Download, Printer, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusColors = {
  'שולם': 'bg-green-100 text-green-800',
  'ממתין לתשלום': 'bg-yellow-100 text-yellow-800',
  'שולם חלקית': 'bg-orange-100 text-orange-800'
};

export default function InvoicePreview({ invoice, onClose, onUpdate }) {
  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = (newStatus) => {
    const updates = { payment_status: newStatus };
    if (newStatus === 'שולם') {
      updates.paid_amount = invoice.total_amount;
    }
    onUpdate(updates);
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Actions Bar - Hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onClose} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>
        <div className="flex gap-2">
          <Select value={invoice.payment_status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="שולם">סמן כשולם</SelectItem>
              <SelectItem value="ממתין לתשלום">ממתין לתשלום</SelectItem>
              <SelectItem value="שולם חלקית">שולם חלקית</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            הדפס
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="shadow-2xl border-0 print:shadow-none">
        <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 print:bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">חשבונית מס / קבלה</h1>
              <p className="text-sm text-gray-600">קליניקה לקלינאות תקשורת</p>
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-green-600">#{invoice.invoice_number}</p>
              <Badge className={`${statusColors[invoice.payment_status]} mt-2 print:hidden`}>
                {invoice.payment_status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 print:p-6">
          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">חשבונית ל:</h3>
              <p className="font-semibold text-lg text-gray-800">{invoice.patient_name}</p>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">פרטי החשבונית:</h3>
              <p className="text-sm text-gray-700">
                תאריך: {invoice.issue_date && format(parseISO(invoice.issue_date), 'dd/MM/yyyy', { locale: he })}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                אמצעי תשלום: {invoice.payment_method}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-right font-semibold">תיאור</TableHead>
                  <TableHead className="text-right font-semibold w-24">כמות</TableHead>
                  <TableHead className="text-right font-semibold w-32">מחיר יחידה</TableHead>
                  <TableHead className="text-right font-semibold w-32">סה״כ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-right">{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₪{item.unit_price?.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">₪{item.total?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>סכום ביניים:</span>
                <span className="font-medium">₪{invoice.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>מע״מ (17%):</span>
                <span className="font-medium">₪{invoice.vat?.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-xl font-bold">
                <span>סה״כ לתשלום:</span>
                <span className="text-green-600">₪{invoice.total_amount?.toFixed(2)}</span>
              </div>
              {invoice.paid_amount > 0 && invoice.payment_status !== 'שולם' && (
                <div className="flex justify-between text-gray-700 text-sm">
                  <span>שולם:</span>
                  <span className="font-medium">₪{invoice.paid_amount?.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">הערות:</p>
              <p className="text-gray-800 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
            <p>תודה על הבחירה בשירותינו</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}