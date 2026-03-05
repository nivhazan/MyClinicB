import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Lightbulb, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Forecasts({ payments, appointments }) {
  // תחזית הכנסות - חישוב ממוצע חודשי והכפלה
  const monthlyPayments = {};
  payments.forEach(p => {
    const date = new Date(p.payment_date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthlyPayments[monthKey]) {
      monthlyPayments[monthKey] = 0;
    }
    monthlyPayments[monthKey] += p.amount || 0;
  });

  const months = Object.values(monthlyPayments);
  const avgMonthlyRevenue = months.length > 0 ? (months.reduce((a, b) => a + b, 0) / months.length) : 0;
  const forecastNextMonth = avgMonthlyRevenue;
  const forecastNextQuarter = avgMonthlyRevenue * 3;

  // ניתוח עונתיות - לפי חודש בשנה
  const seasonalData = {};
  payments.forEach(p => {
    const month = new Date(p.payment_date).getMonth();
    if (!seasonalData[month]) {
      seasonalData[month] = 0;
    }
    seasonalData[month] += p.amount || 0;
  });

  const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const bestMonth = Object.entries(seasonalData).sort((a, b) => b[1] - a[1])[0];
  const worstMonth = Object.entries(seasonalData).sort((a, b) => a[1] - b[1])[0];

  // המלצות לאופטימיזציה
  const recommendations = [];
  
  // בדיקת תפוסה
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const thisMonthAppointments = appointments.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const completedThisMonth = thisMonthAppointments.filter(a => a.status === 'בוצע').length;
  const occupancyRate = thisMonthAppointments.length > 0 ? (completedThisMonth / thisMonthAppointments.length) * 100 : 0;

  if (occupancyRate < 70) {
    recommendations.push({
      text: 'תפוסה נמוכה החודש - שקול להוסיף שעות קבלה או קידום שיווקי',
      type: 'warning'
    });
  }

  // בדיקת ביטולים
  const canceledRate = thisMonthAppointments.filter(a => a.status === 'בוטל').length / thisMonthAppointments.length * 100;
  if (canceledRate > 15) {
    recommendations.push({
      text: 'שיעור ביטולים גבוה - שקול מדיניות ביטול מחמירה יותר',
      type: 'alert'
    });
  }

  // המלצה כללית
  if (avgMonthlyRevenue > 0) {
    recommendations.push({
      text: `ממוצע ההכנסות החודשי: ₪${avgMonthlyRevenue.toLocaleString('he-IL', { maximumFractionDigits: 0 })} - שמור על קצב זה`,
      type: 'success'
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* תחזית הכנסות */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            תחזית הכנסות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700 mb-1">חודש הבא</p>
            <p className="text-2xl font-bold text-blue-900">₪{forecastNextMonth.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-purple-700 mb-1">רבעון הבא</p>
            <p className="text-2xl font-bold text-purple-900">₪{forecastNextQuarter.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</p>
          </div>
          <p className="text-xs text-gray-500">
            מבוסס על ממוצע של {months.length} חודשים אחרונים
          </p>
        </CardContent>
      </Card>

      {/* ניתוח עונתיות */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            ניתוח עונתיות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bestMonth && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-700 mb-1">חודש חזק ביותר</p>
              <p className="text-lg font-bold text-green-900">{monthNames[parseInt(bestMonth[0])]}</p>
              <p className="text-sm text-green-700">₪{bestMonth[1].toLocaleString('he-IL', { maximumFractionDigits: 0 })}</p>
            </div>
          )}
          {worstMonth && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-xs text-orange-700 mb-1">חודש חלש ביותר</p>
              <p className="text-lg font-bold text-orange-900">{monthNames[parseInt(worstMonth[0])]}</p>
              <p className="text-sm text-orange-700">₪{worstMonth[1].toLocaleString('he-IL', { maximumFractionDigits: 0 })}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* המלצות */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            המלצות לאופטימיזציה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-500">אין המלצות כרגע</p>
          ) : (
            recommendations.map((rec, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${
                rec.type === 'success' ? 'bg-green-50' : 
                rec.type === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <p className={`text-xs ${
                  rec.type === 'success' ? 'text-green-800' : 
                  rec.type === 'warning' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {rec.text}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}