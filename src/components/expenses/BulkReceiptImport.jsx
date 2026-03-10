import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Sparkles, Loader2, X, Check, Trash2 } from 'lucide-react';
import { analyzeReceiptWithAI } from '@/lib/receiptAnalysis';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = [
  'ציוד קליני', 'חומרי משרד', 'שכר דירה', 'חשמל ומים',
  'אינטרנט וטלפון', 'שיווק ופרסום', 'השתלמויות', 'ביטוח',
  'אחזקה ותיקונים', 'אחר',
];
const PAYMENT_METHODS = ["כרטיס אשראי", "מזומן", "העברה בנקאית", "צ'ק"];

function emptyData(file) {
  return {
    date: new Date().toISOString().split('T')[0],
    amount: '',
    vendor: file?.name?.replace(/\.[^.]+$/, '') || '',
    category: 'אחר',
    description: '',
    payment_method: 'כרטיס אשראי',
    tax_deductible: true,
    notes: '',
  };
}

export default function BulkReceiptImport({ onSaveAll, onCancel }) {
  const [items, setItems] = useState([]); // { file, status, data, error }
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (!valid.length) { toast.error('נא לבחור קבצי תמונה או PDF'); return; }
    setItems((prev) => [
      ...prev,
      ...valid.map((file) => ({ file, status: 'pending', data: null, error: null })),
    ]);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!processing) addFiles(e.dataTransfer.files);
  };

  const analyzeAll = async () => {
    const pending = items.filter((it) => it.status === 'pending');
    if (!pending.length) { toast.info('אין קבלות חדשות לניתוח'); return; }
    setProcessing(true);

    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== 'pending') continue;

      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'analyzing' } : it))
      );

      try {
        // Upload file first, then analyze in parallel
        const [uploadResult, aiResult] = await Promise.allSettled([
          base44.integrations.Core.UploadFile({ file: items[i].file }),
          analyzeReceiptWithAI(items[i].file),
        ]);

        const receipt_url = uploadResult.status === 'fulfilled' ? uploadResult.value.file_url : '';
        const ai = aiResult.status === 'fulfilled' ? aiResult.value : {};

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'done',
                  data: {
                    date: ai.date || new Date().toISOString().split('T')[0],
                    amount: ai.amount ?? '',
                    vendor: ai.vendor || '',
                    category: ai.category || 'אחר',
                    description: ai.description || '',
                    payment_method: 'כרטיס אשראי',
                    tax_deductible: true,
                    notes: '',
                    receipt_url,
                  },
                }
              : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'error', error: err.message, data: emptyData(it.file) } : it
          )
        );
      }

      if (i < items.length - 1) await new Promise((r) => setTimeout(r, 350));
    }

    setProcessing(false);
    toast.success('ניתוח הקבלות הסתיים');
  };

  const updateField = (idx, key, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, data: { ...it.data, [key]: value } } : it))
    );
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveAll = () => {
    const ready = items.filter((it) => (it.status === 'done' || it.status === 'error') && it.data);
    if (!ready.length) { toast.error('אין הוצאות מוכנות לשמירה'); return; }
    const invalid = ready.filter((it) => !it.data.amount || !it.data.date);
    if (invalid.length) { toast.error('נא למלא סכום ותאריך לכל ההוצאות'); return; }
    onSaveAll(ready.map((it) => it.data));
  };

  const pendingCount = items.filter((it) => it.status === 'pending').length;
  const doneCount = items.filter((it) => it.status === 'done' || it.status === 'error').length;
  const analyzingIdx = items.findIndex((it) => it.status === 'analyzing');

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          ייבוא קבלות מרובות
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !processing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/30'}
            ${processing ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="font-medium text-gray-700">גררו קבלות לכאן או לחצו לבחירה</p>
          <p className="text-sm text-gray-500 mt-1">JPG, PNG, PDF — ניתן לבחור מספר קבצים בבת אחת</p>
        </div>

        {/* File list */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {items.length} קבלות | {doneCount} מנותחות
              </span>
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <Button
                    size="sm"
                    onClick={analyzeAll}
                    disabled={processing}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {processing ? (
                      <><Loader2 className="w-3 h-3 ml-1 animate-spin" />מנתח...</>
                    ) : (
                      <><Sparkles className="w-3 h-3 ml-1" />נתח הכל ({pendingCount})</>
                    )}
                  </Button>
                )}
                {doneCount > 0 && (
                  <Button size="sm" onClick={saveAll} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-3 h-3 ml-1" />
                    שמור הכל ({doneCount})
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {processing && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.round((doneCount / items.length) * 100)}%` }}
                />
              </div>
            )}

            {/* Rows */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 text-sm
                    ${item.status === 'analyzing' ? 'border-purple-200 bg-purple-50' : ''}
                    ${item.status === 'done' ? 'border-green-200 bg-green-50/40' : ''}
                    ${item.status === 'error' ? 'border-orange-200 bg-orange-50/40' : ''}
                    ${item.status === 'pending' ? 'border-gray-200 bg-gray-50' : ''}`}
                >
                  {/* File header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.status === 'analyzing' && <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin shrink-0" />}
                      {item.status === 'done' && <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                      {item.status === 'error' && <span className="text-orange-500 text-xs shrink-0">⚠</span>}
                      {item.status === 'pending' && <span className="w-3.5 h-3.5 shrink-0 inline-block" />}
                      <span className="truncate text-gray-600 text-xs" title={item.file.name}>{item.file.name}</span>
                    </div>
                    <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 shrink-0 ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Editable fields (shown once analyzed or on error with empty data) */}
                  {item.data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">תאריך</label>
                        <input
                          type="date"
                          value={item.data.date}
                          onChange={(e) => updateField(idx, 'date', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">סכום *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.data.amount}
                          onChange={(e) => updateField(idx, 'amount', parseFloat(e.target.value) || '')}
                          className="w-full border rounded px-2 py-1 text-xs bg-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">ספק</label>
                        <input
                          type="text"
                          value={item.data.vendor}
                          onChange={(e) => updateField(idx, 'vendor', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">קטגוריה</label>
                        <select
                          value={item.data.category}
                          onChange={(e) => updateField(idx, 'category', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs bg-white"
                        >
                          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">תיאור</label>
                        <input
                          type="text"
                          value={item.data.description}
                          onChange={(e) => updateField(idx, 'description', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs bg-white col-span-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">אמצעי תשלום</label>
                        <select
                          value={item.data.payment_method}
                          onChange={(e) => updateField(idx, 'payment_method', e.target.value)}
                          className="w-full border rounded px-2 py-1 text-xs bg-white"
                        >
                          {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end pb-1 gap-1">
                        <input
                          type="checkbox"
                          id={`tax-${idx}`}
                          checked={item.data.tax_deductible}
                          onChange={(e) => updateField(idx, 'tax_deductible', e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <label htmlFor={`tax-${idx}`} className="text-xs text-gray-600 cursor-pointer">ניכוי מס</label>
                      </div>
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <p className="text-xs text-gray-400 mt-1">ממתין לניתוח...</p>
                  )}
                  {item.status === 'analyzing' && (
                    <p className="text-xs text-purple-500 mt-1">מנתח באמצעות AI...</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t">
          <Button variant="outline" onClick={onCancel} className="flex-1">ביטול</Button>
          {doneCount > 0 && (
            <Button onClick={saveAll} className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
              <Check className="w-4 h-4 ml-2" />
              שמור {doneCount} הוצאות
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
