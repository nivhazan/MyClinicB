import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import FinancialCharts from './FinancialCharts';

export default function TaxReports() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: payments = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list(),
  });

  // חישובים לשנה נבחרת
  const yearPayments = payments.filter(p => 
    new Date(p.payment_date).getFullYear().toString() === selectedYear
  );

  const yearExpenses = expenses.filter(e => 
    new Date(e.date).getFullYear().toString() === selectedYear
  );

  const totalIncome = yearPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpenses = yearExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const taxDeductibleExpenses = yearExpenses
    .filter(e => e.tax_deductible !== false)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // רווח (ללא מע"ם - עוסק פטור)
  const profit = totalIncome - taxDeductibleExpenses;

  // יצירת דוח CSV מפורט
  const generateDetailedReport = () => {
    let csv = '\uFEFF'; // UTF-8 BOM for Hebrew support
    csv += `דוח שנתי לשנת ${selectedYear} - עוסק פטור\n\n`;
    
    // סיכום כללי
    csv += 'סיכום כללי\n';
    csv += 'תיאור,סכום\n';
    csv += `הכנסות,${totalIncome.toFixed(2)}\n`;
    csv += `הוצאות מוכרות,${taxDeductibleExpenses.toFixed(2)}\n`;
    csv += `רווח,${profit.toFixed(2)}\n\n`;

    // פירוט הכנסות
    csv += 'פירוט הכנסות\n';
    csv += 'תאריך,שם מטופל,סכום,אמצעי תשלום,סוג תשלום\n';
    yearPayments
      .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date))
      .forEach(p => {
        csv += `${format(new Date(p.payment_date), 'dd/MM/yyyy')},`;
        csv += `${p.patient_name || ''},`;
        csv += `${(p.amount || 0).toFixed(2)},`;
        csv += `${p.payment_method || ''},`;
        csv += `${p.payment_type || ''}\n`;
      });

    csv += '\n';

    // פירוט הוצאות
    csv += 'פירוט הוצאות\n';
    csv += 'תאריך,קטגוריה,ספק,תיאור,סכום,אמצעי תשלום,זכאי לניכוי\n';
    yearExpenses
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(e => {
        csv += `${format(new Date(e.date), 'dd/MM/yyyy')},`;
        csv += `${e.category || ''},`;
        csv += `${e.vendor || ''},`;
        csv += `${e.description || ''},`;
        csv += `${(e.amount || 0).toFixed(2)},`;
        csv += `${e.payment_method || ''},`;
        csv += `${e.tax_deductible !== false ? 'כן' : 'לא'}\n`;
      });

    // פירוט לפי קטגוריות הוצאות
    csv += '\n';
    csv += 'פירוט הוצאות לפי קטגוריות\n';
    csv += 'קטגוריה,סכום\n';
    
    const expensesByCategory = yearExpenses.reduce((acc, e) => {
      const category = e.category || 'אחר';
      acc[category] = (acc[category] || 0) + (e.amount || 0);
      return acc;
    }, {});

    Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, amount]) => {
        csv += `${category},${amount.toFixed(2)}\n`;
      });

    // הורדת הקובץ
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `דוח_מס_${selectedYear}.csv`;
    link.click();
    toast.success('הדוח הורד בהצלחה');
  };

  // רשימת שנים זמינות
  const availableYears = Array.from(
    new Set([
      ...payments.map(p => new Date(p.payment_date).getFullYear()),
      ...expenses.map(e => new Date(e.date).getFullYear()),
      currentYear
    ])
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* גרפים */}
      <FinancialCharts payments={payments} expenses={expenses} />

      {/* בחירת שנה */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            דוח מס שנתי - עוסק פטור
          </CardTitle>
          <CardDescription>
            דוח מפורט של הכנסות והוצאות לצורכי מס (ללא מע"ם)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={generateDetailedReport}
              className="bg-gradient-to-r from-green-500 to-teal-500"
            >
              <Download className="w-4 h-4 ml-2" />
              ייצוא דוח מלא (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* סיכום כספי */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              סך הכנסות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              ₪{totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {yearPayments.length} תשלומים
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              סך הוצאות מוכרות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              ₪{taxDeductibleExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {yearExpenses.filter(e => e.tax_deductible !== false).length} הוצאות
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              רווח
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${profit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              ₪{profit.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((profit / totalIncome) * 100).toFixed(1)}% שולי רווח
            </p>
          </CardContent>
        </Card>
      </div>



      {/* פילוח הוצאות לפי קטגוריות */}
      <Card>
        <CardHeader>
          <CardTitle>פילוח הוצאות לפי קטגוריות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(
              yearExpenses.reduce((acc, e) => {
                const category = e.category || 'אחר';
                acc[category] = (acc[category] || 0) + (e.amount || 0);
                return acc;
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-gray-700">{category}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${(amount / totalExpenses) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-800 w-24 text-left">
                      ₪{amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 w-12 text-left">
                      {((amount / totalExpenses) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* הערות לרואה חשבון */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">📋 הערות לרואה חשבון</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-900 space-y-2">
          <p>• הדוח כולל את כל ההכנסות וההוצאות המתועדות במערכת לשנת {selectedYear}</p>
          <p>• דוח זה מתאים לעוסק פטור (ללא מע"ם)</p>
          <p>• הוצאות שסומנו כ"לא זכאי לניכוי" לא נכללות בחישוב ההוצאות המוכרות</p>
          <p>• מומלץ להעביר את קובץ ה-CSV המפורט לרואה החשבון לצורך הגשת הדוח השנתי</p>
          <p>• קבלות ומסמכים מצורפים זמינים בעמוד ההוצאות</p>
        </CardContent>
      </Card>
    </div>
  );
}