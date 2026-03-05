import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Sparkles, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { analyzeReceiptWithAI } from '@/lib/receiptAnalysis';
import { toast } from 'sonner';

export default function ExpenseForm({ expense, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(expense || {
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'אחר',
    vendor: '',
    description: '',
    receipt_url: '',
    payment_method: 'כרטיס אשראי',
    notes: '',
    tax_deductible: true
  });
  
  useEffect(() => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'אחר',
        vendor: '',
        description: '',
        receipt_url: '',
        payment_method: 'כרטיס אשראי',
        notes: '',
        tax_deductible: true
      });
    }
  }, [expense]);
  
  const [uploadingFile, setUploadingFile] = useState(false);
  const [analyzingReceipt, setAnalyzingReceipt] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef(null);
  const useAIRef = useRef(false);

  const handleFileUpload = async (e) => {
    const useAI = useAIRef.current;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadedFileName(file.name);

    // Upload file
    let file_url;
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      file_url = result.file_url;
      setFormData(prev => ({ ...prev, receipt_url: file_url }));
      toast.success('הקובץ הועלה בהצלחה');
    } catch (error) {
      toast.error('שגיאה בהעלאת הקובץ');
      console.error(error);
      setUploadingFile(false);
      return;
    }
    setUploadingFile(false);

    // AI Analysis if requested
    if (useAI) {
      setAnalyzingReceipt(true);
      toast.info('מנתח את הקבלה...');
      try {
        const result = await analyzeReceiptWithAI(file);

        setFormData(prev => ({
          ...prev,
          amount: result.amount || prev.amount,
          vendor: result.vendor || prev.vendor,
          date: result.date || prev.date,
          description: result.description || prev.description,
          category: result.category || prev.category
        }));
        toast.success('הקבלה זוהתה בהצלחה!');
      } catch (error) {
        toast.error('שגיאה בזיהוי הקבלה – הקובץ נשמר, מלא את הפרטים ידנית');
        console.error(error);
      } finally {
        setAnalyzingReceipt(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-green-50 to-teal-50">
        <CardTitle className="flex items-center gap-2">
          {expense ? 'עריכת הוצאה' : 'הוצאה חדשה'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>העלאת קבלה</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingFile || analyzingReceipt}
                  className="cursor-pointer w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => { useAIRef.current = false; fileInputRef.current?.click(); }}
                disabled={uploadingFile || analyzingReceipt}
                className="whitespace-nowrap"
              >
                {uploadingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מעלה...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-2" />
                    העלאה ידנית
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => { useAIRef.current = true; fileInputRef.current?.click(); }}
                disabled={uploadingFile || analyzingReceipt}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 whitespace-nowrap"
              >
                {analyzingReceipt ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מזהה...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 ml-2" />
                    זיהוי אוטומטי
                  </>
                )}
              </Button>
            </div>
            {uploadedFileName && (
              <p className="text-sm text-gray-600">קובץ: {uploadedFileName}</p>
            )}
            {formData.receipt_url && (
              <a
                href={formData.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline block"
              >
                צפייה בקבלה
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">תאריך *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">סכום *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">קטגוריה *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ציוד קליני">ציוד קליני</SelectItem>
                  <SelectItem value="חומרי משרד">חומרי משרד</SelectItem>
                  <SelectItem value="שכר דירה">שכר דירה</SelectItem>
                  <SelectItem value="חשמל ומים">חשמל ומים</SelectItem>
                  <SelectItem value="אינטרנט וטלפון">אינטרנט וטלפון</SelectItem>
                  <SelectItem value="שיווק ופרסום">שיווק ופרסום</SelectItem>
                  <SelectItem value="השתלמויות">השתלמויות</SelectItem>
                  <SelectItem value="ביטוח">ביטוח</SelectItem>
                  <SelectItem value="אחזקה ותיקונים">אחזקה ותיקונים</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">שם הספק/עסק</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">אמצעי תשלום</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="מזומן">מזומן</SelectItem>
                <SelectItem value="כרטיס אשראי">כרטיס אשראי</SelectItem>
                <SelectItem value="העברה בנקאית">העברה בנקאית</SelectItem>
                <SelectItem value="צ'ק">צ'ק</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tax_deductible"
              checked={formData.tax_deductible}
              onChange={(e) => setFormData({ ...formData, tax_deductible: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="tax_deductible" className="cursor-pointer">
              זכאי לניכוי מס
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
              {expense ? 'עדכן' : 'שמור'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}