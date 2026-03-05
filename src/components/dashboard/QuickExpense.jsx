import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function QuickExpense({ expenses }) {
  const thisMonthExpenses = expenses?.filter(exp => {
    if (!exp.date) return false;
    const expDate = new Date(exp.date);
    const now = new Date();
    return expDate.getMonth() === now.getMonth() && 
           expDate.getFullYear() === now.getFullYear();
  }) || [];

  const totalThisMonth = thisMonthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="w-5 h-5 text-orange-600" />
          הוצאות
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {thisMonthExpenses.length > 0 && (
            <p className="text-sm text-gray-600">
              הוצאות החודש: <span className="font-bold text-gray-800">₪{totalThisMonth}</span>
            </p>
          )}
          <Link to={createPageUrl('Expenses') + '?new=true'}>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Plus className="w-4 h-4 ml-2" />
              הוסף הוצאה
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}