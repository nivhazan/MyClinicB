import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Trash2, Edit, Calendar, DollarSign, Package, FileSpreadsheet } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { he } from 'date-fns/locale';
import JSZip from 'jszip';
import { toast } from 'sonner';

export default function ExpenseList({ expenses, onEdit, onDelete, onExport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const downloadFile = async (url, filename) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadMultipleFiles = async (expensesToExport, label) => {
    if (expensesToExport.length === 0) {
      toast.error('אין קבצים לייצוא');
      return;
    }

    const expensesWithReceipts = expensesToExport.filter(e => e.receipt_url);
    if (expensesWithReceipts.length === 0) {
      toast.error('אין קבלות לייצוא');
      return;
    }

    toast.info(`מכין ${expensesWithReceipts.length} קבצים להורדה...`);

    const zip = new JSZip();
    
    for (const expense of expensesWithReceipts) {
      try {
        const response = await fetch(expense.receipt_url);
        const blob = await response.blob();
        const extension = expense.receipt_url.split('.').pop().split('?')[0];
        const filename = `${format(parseISO(expense.date), 'yyyy-MM-dd')}_${expense.vendor || 'expense'}_${expense.amount}₪.${extension}`;
        zip.file(filename, blob);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `קבלות_${label}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('הקבצים הורדו בהצלחה!');
  };

  const exportThisWeek = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 0 });
    const end = endOfWeek(now, { weekStartsOn: 0 });
    const weekExpenses = expenses.filter(e => {
      const date = parseISO(e.date);
      return date >= start && date <= end;
    });
    downloadMultipleFiles(weekExpenses, 'השבוע');
  };

  const exportThisMonth = () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const monthExpenses = expenses.filter(e => {
      const date = parseISO(e.date);
      return date >= start && date <= end;
    });
    downloadMultipleFiles(monthExpenses, format(now, 'yyyy-MM', { locale: he }));
  };

  const exportYear = (year) => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));
    const yearExpenses = expenses.filter(e => {
      const date = parseISO(e.date);
      return date >= start && date <= end;
    });
    downloadMultipleFiles(yearExpenses, year);
  };

  const exportToCSV = (expensesToExport, filename) => {
    if (expensesToExport.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    const headers = ['תאריך', 'סכום', 'קטגוריה', 'ספק', 'תיאור', 'אמצעי תשלום', 'ניכוי מס', 'הערות', 'קישור לקבלה'];
    const rows = expensesToExport.map(e => [
      format(parseISO(e.date), 'dd/MM/yyyy'),
      e.amount,
      e.category,
      e.vendor || '',
      e.description || '',
      e.payment_method,
      e.tax_deductible ? 'כן' : 'לא',
      e.notes || '',
      e.receipt_url || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('הקובץ יוצא בהצלחה!');
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchTerm || 
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Get unique years from expenses
  const years = [...new Set(expenses.map(e => new Date(e.date).getFullYear()))].sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      {/* Export Options */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5" />
            ייצוא נתונים וקבלות
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">ייצוא קבצי קבלות (ZIP)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <Button
                onClick={exportThisWeek}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Calendar className="w-4 h-4 ml-2" />
                השבוע
              </Button>
              <Button
                onClick={exportThisMonth}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <Calendar className="w-4 h-4 ml-2" />
                החודש
              </Button>
              {years.map(year => (
                <Button
                  key={year}
                  onClick={() => exportYear(year)}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Calendar className="w-4 h-4 ml-2" />
                  שנת {year}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">ייצוא דוח Excel/CSV</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <Button
                onClick={() => {
                  const now = new Date();
                  const start = startOfWeek(now, { weekStartsOn: 0 });
                  const end = endOfWeek(now, { weekStartsOn: 0 });
                  const weekExpenses = expenses.filter(e => {
                    const date = parseISO(e.date);
                    return date >= start && date <= end;
                  });
                  exportToCSV(weekExpenses, 'הוצאות_השבוע');
                }}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                השבוע
              </Button>
              <Button
                onClick={() => {
                  const now = new Date();
                  const start = startOfMonth(now);
                  const end = endOfMonth(now);
                  const monthExpenses = expenses.filter(e => {
                    const date = parseISO(e.date);
                    return date >= start && date <= end;
                  });
                  exportToCSV(monthExpenses, `הוצאות_${format(now, 'yyyy-MM')}`);
                }}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                החודש
              </Button>
              {years.map(year => (
                <Button
                  key={year}
                  onClick={() => {
                    const start = startOfYear(new Date(year, 0, 1));
                    const end = endOfYear(new Date(year, 11, 31));
                    const yearExpenses = expenses.filter(e => {
                      const date = parseISO(e.date);
                      return date >= start && date <= end;
                    });
                    exportToCSV(yearExpenses, `הוצאות_${year}`);
                  }}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <FileSpreadsheet className="w-4 h-4 ml-2" />
                  {year}
                </Button>
              ))}
              <Button
                onClick={() => exportToCSV(expenses, 'כל_ההוצאות')}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                size="sm"
              >
                <FileSpreadsheet className="w-4 h-4 ml-2" />
                הכל
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="חיפוש לפי ספק או תיאור..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
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
          <div className="mt-3 text-sm text-gray-600">
            סה"כ: <span className="font-bold text-lg text-green-600">{totalAmount.toFixed(2)} ₪</span>
            {' • '}
            {filteredExpenses.length} הוצאות
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <div className="space-y-3">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <Card key={expense.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {expense.vendor || 'ללא ספק'}
                        </h3>
                        <p className="text-sm text-gray-600">{expense.description}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-green-600">{expense.amount?.toFixed(2)} ₪</p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(expense.date), 'dd/MM/yyyy', { locale: he })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {expense.category}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {expense.payment_method}
                      </span>
                      {expense.tax_deductible && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          ניכוי מס
                        </span>
                      )}
                    </div>

                    {expense.notes && (
                      <p className="text-sm text-gray-500 italic">{expense.notes}</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    {expense.receipt_url && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(expense.receipt_url, '_blank')}
                          className="flex-1 sm:flex-none"
                        >
                          <FileText className="w-4 h-4 ml-1" />
                          קבלה
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const extension = expense.receipt_url.split('.').pop().split('?')[0];
                            const filename = `${format(parseISO(expense.date), 'yyyy-MM-dd')}_${expense.vendor || 'expense'}.${extension}`;
                            downloadFile(expense.receipt_url, filename);
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <Download className="w-4 h-4 ml-1" />
                          הורד
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(expense)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(expense.id)}
                      className="flex-1 sm:flex-none text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>אין הוצאות להצגה</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}