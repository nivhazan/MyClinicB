import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Loader2, Sparkles, X, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { analyzeReceiptWithAI } from '@/lib/receiptAnalysis';
import { toast } from 'sonner';

const CATEGORIES = [
  'ציוד קליני', 'חומרי משרד', 'שכר דירה', 'חשמל ומים',
  'אינטרנט וטלפון', 'שיווק ופרסום', 'השתלמויות', 'ביטוח', 'אחזקה ותיקונים', 'אחר'
];

export default function QuickReceiptButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'form'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    vendor: '',
    description: '',
    category: 'אחר',
    payment_method: 'כרטיס אשראי',
    tax_deductible: true,
  });
  const fileRef = useRef();

  const handleClose = () => {
    setOpen(false);
    setStep('upload');
    setReceiptUrl('');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      vendor: '',
      description: '',
      category: 'אחר',
      payment_method: 'כרטיס אשראי',
      tax_deductible: true,
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReceiptUrl(file_url);

      toast.info('מנתח קבלה עם AI...');
      const result = await analyzeReceiptWithAI(file);

      setFormData(prev => ({
        ...prev,
        amount: result.amount ?? prev.amount,
        vendor: result.vendor ?? prev.vendor,
        date: result.date ?? prev.date,
        description: result.description ?? prev.description,
        category: result.category ?? prev.category,
      }));
      toast.success('הקבלה זוהתה בהצלחה!');
      setStep('form');
    } catch (err) {
      toast.error('שגיאה בניתוח הקבלה');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error('יש להזין סכום');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.Expense.create({ ...formData, receipt_url: receiptUrl });
      toast.success('ההוצאה נשמרה בהצלחה');
      handleClose();
    } catch (err) {
      toast.error('שגיאה בשמירת ההוצאה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all text-sm font-medium"
      >
        <Camera className="w-5 h-5" />
        קבלה מהירה
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">קבלה מהירה</h2>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {step === 'upload' && (
                <div className="text-center py-6 space-y-4">
                  {loading ? (
                    <div className="space-y-3">
                      <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
                      <p className="text-gray-600">מעלה ומנתח קבלה עם AI...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8 text-purple-500" />
                      </div>
                      <p className="text-gray-600">צלם או העלה קבלה – AI יחלץ את הפרטים אוטומטית</p>
                      <Button
                        onClick={() => fileRef.current?.click()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full"
                      >
                        <Camera className="w-4 h-4 ml-2" />
                        בחר / צלם קבלה
                      </Button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </>
                  )}
                </div>
              )}

              {step === 'form' && (
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-2 text-sm text-purple-700">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    הפרטים זוהו על ידי AI – ניתן לערוך לפני השמירה
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>סכום ₪</Label>
                      <Input
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                        className="text-lg font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>תאריך</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>ספק / עסק</Label>
                    <Input
                      value={formData.vendor}
                      onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="שם העסק"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>תיאור</Label>
                    <Input
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="מה נקנה"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>קטגוריה</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>אמצעי תשלום</Label>
                    <Select value={formData.payment_method} onValueChange={v => setFormData({ ...formData, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="מזומן">מזומן</SelectItem>
                        <SelectItem value="כרטיס אשראי">כרטיס אשראי</SelectItem>
                        <SelectItem value="העברה בנקאית">העברה בנקאית</SelectItem>
                        <SelectItem value="צ'ק">צ'ק</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {step === 'form' && (
              <div className="flex gap-3 p-5 border-t">
                <Button variant="outline" onClick={handleClose} className="flex-1">ביטול</Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                  שמור הוצאה
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}