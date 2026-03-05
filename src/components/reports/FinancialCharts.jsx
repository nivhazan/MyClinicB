import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

export default function FinancialCharts({ payments, expenses }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [timeframe, setTimeframe] = useState('monthly');

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  // סינון לפי שנה
  const yearPayments = payments.filter(p => 
    new Date(p.payment_date).getFullYear().toString() === selectedYear
  );
  const yearExpenses = expenses.filter(e => 
    new Date(e.date).getFullYear().toString() === selectedYear
  );

  // גרף הכנסות לאורך זמן
  const getIncomeOverTime = () => {
    const startDate = new Date(`${selectedYear}-01-01`);
    const endDate = new Date(`${selectedYear}-12-31`);

    let intervals;
    let formatStr;

    if (timeframe === 'daily') {
      intervals = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
      formatStr = 'd/M';
    } else if (timeframe === 'weekly') {
      intervals = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 0 });
      formatStr = 'd/M';
    } else if (timeframe === 'monthly') {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      formatStr = 'MMM';
    } else {
      // yearly - last 5 years
      const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);
      return years.map(year => ({
        name: year.toString(),
        הכנסות: payments
          .filter(p => new Date(p.payment_date).getFullYear() === year)
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        הוצאות: expenses
          .filter(e => new Date(e.date).getFullYear() === year)
          .reduce((sum, e) => sum + (e.amount || 0), 0)
      }));
    }

    return intervals.map(date => {
      const dateStr = format(date, formatStr, { locale: he });
      
      let income, expenseAmount;
      
      if (timeframe === 'weekly') {
        const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
        income = yearPayments
          .filter(p => {
            const pDate = new Date(p.payment_date);
            return pDate >= date && pDate <= weekEnd;
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        expenseAmount = yearExpenses
          .filter(e => {
            const eDate = new Date(e.date);
            return eDate >= date && eDate <= weekEnd;
          })
          .reduce((sum, e) => sum + (e.amount || 0), 0);
      } else {
        income = yearPayments
          .filter(p => format(new Date(p.payment_date), formatStr, { locale: he }) === dateStr)
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        expenseAmount = yearExpenses
          .filter(e => format(new Date(e.date), formatStr, { locale: he }) === dateStr)
          .reduce((sum, e) => sum + (e.amount || 0), 0);
      }

      return {
        name: dateStr,
        הכנסות: income,
        הוצאות: expenseAmount
      };
    });
  };

  // פילוח הכנסות לפי סוג טיפול
  const getIncomeByType = () => {
    const byType = yearPayments.reduce((acc, p) => {
      const type = p.payment_type || 'אחר';
      acc[type] = (acc[type] || 0) + (p.amount || 0);
      return acc;
    }, {});

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  };

  // תחזית הכנסות לחודש הבא
  const getForecast = () => {
    // חישוב ממוצע 3 חודשים אחרונים
    const lastThreeMonths = [0, 1, 2].map(i => subMonths(new Date(), i));
    const avgIncome = lastThreeMonths.reduce((sum, month) => {
      const monthIncome = payments
        .filter(p => {
          const pDate = new Date(p.payment_date);
          return pDate.getMonth() === month.getMonth() && pDate.getFullYear() === month.getFullYear();
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      return sum + monthIncome;
    }, 0) / 3;

    const nextMonth = addMonths(new Date(), 1);
    const currentMonth = new Date();
    const previousMonth = subMonths(new Date(), 1);

    return [
      {
        name: format(previousMonth, 'MMM', { locale: he }),
        סכום: payments
          .filter(p => {
            const pDate = new Date(p.payment_date);
            return pDate.getMonth() === previousMonth.getMonth() && pDate.getFullYear() === previousMonth.getFullYear();
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        סוג: 'בפועל'
      },
      {
        name: format(currentMonth, 'MMM', { locale: he }),
        סכום: payments
          .filter(p => {
            const pDate = new Date(p.payment_date);
            return pDate.getMonth() === currentMonth.getMonth() && pDate.getFullYear() === currentMonth.getFullYear();
          })
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        סוג: 'בפועל'
      },
      {
        name: format(nextMonth, 'MMM', { locale: he }),
        סכום: avgIncome,
        סוג: 'תחזית'
      }
    ];
  };

  const incomeOverTime = getIncomeOverTime();
  const incomeByType = getIncomeByType();
  const forecast = getForecast();

  const availableYears = Array.from(
    new Set([
      ...payments.map(p => new Date(p.payment_date).getFullYear()),
      ...expenses.map(e => new Date(e.date).getFullYear()),
      currentYear
    ])
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* בקרות */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
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

            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">יומי (חודש נוכחי)</SelectItem>
                <SelectItem value="weekly">שבועי</SelectItem>
                <SelectItem value="monthly">חודשי</SelectItem>
                <SelectItem value="yearly">שנתי</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* גרף הכנסות והוצאות לאורך זמן */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            הכנסות והוצאות לאורך זמן
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₪${value.toLocaleString()}`}
                contentStyle={{ direction: 'rtl' }}
              />
              <Legend />
              <Line type="monotone" dataKey="הכנסות" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="הוצאות" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* פילוח הכנסות לפי סוג */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              פילוח הכנסות לפי סוג
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ₪${entry.value.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* תחזית הכנסות */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              תחזית הכנסות (ממוצע 3 חודשים)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `₪${value.toLocaleString()}`}
                  contentStyle={{ direction: 'rtl' }}
                />
                <Legend />
                <Bar dataKey="סכום" fill="#8b5cf6">
                  {forecast.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.סוג === 'תחזית' ? '#f59e0b' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm">
              <p className="text-amber-800">
                💡 תחזית החודש הבא מבוססת על ממוצע ההכנסות של 3 החודשים האחרונים
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}