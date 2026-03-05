import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function InvoiceForm({ patients, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    patient_id: '',
    patient_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    items: [{ description: 'טיפול קלינאי', quantity: 1, unit_price: 300, total: 300 }],
    payment_method: 'מזומן',
    payment_status: 'ממתין לתשלום',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const vat = subtotal * 0.17;
    const total = subtotal + vat;
    
    onSubmit({
      ...formData,
      subtotal,
      vat,
      total_amount: total,
      paid_amount: formData.payment_status === 'שולם' ? total : 0
    });
  };

  const handlePatientChange = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    setFormData(prev => ({
      ...prev,
      patient_id: patientId,
      patient_name: patient?.full_name || ''
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const vat = subtotal * 0.17;
    return { subtotal, vat, total: subtotal + vat };
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-5xl my-8 shadow-2xl border-0">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">חשבונית חדשה</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">מספר חשבונית</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                  className="text-right"
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patient_id">מטופל *</Label>
                <Select value={formData.patient_id} onValueChange={handlePatientChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מטופל" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="issue_date">תאריך הנפקה</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                  className="text-right"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">פריטי החשבונית</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף פריט
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-right">תיאור</TableHead>
                      <TableHead className="text-right w-24">כמות</TableHead>
                      <TableHead className="text-right w-32">מחיר יחידה</TableHead>
                      <TableHead className="text-right w-32">סה״כ</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="תיאור הפריט"
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="text-right"
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₪{item.total?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">סכום ביניים:</span>
                  <span className="font-medium">₪{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">מע״מ (17%):</span>
                  <span className="font-medium">₪{totals.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>סה״כ לתשלום:</span>
                  <span className="text-green-600">₪{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">אמצעי תשלום</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="מזומן">מזומן</SelectItem>
                    <SelectItem value="העברה בנקאית">העברה בנקאית</SelectItem>
                    <SelectItem value="אשראי">אשראי</SelectItem>
                    <SelectItem value="צ'ק">צ'ק</SelectItem>
                    <SelectItem value="ביט/פייבוקס">ביט/פייבוקס</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_status">סטטוס תשלום</Label>
                <Select 
                  value={formData.payment_status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="שולם">שולם</SelectItem>
                    <SelectItem value="ממתין לתשלום">ממתין לתשלום</SelectItem>
                    <SelectItem value="שולם חלקית">שולם חלקית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-gray-50 flex justify-end gap-3 p-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
              <Save className="w-4 h-4 ml-2" />
              הנפק חשבונית
            </Button>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  );
}