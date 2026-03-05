import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, UserX, AlertTriangle, Calendar } from 'lucide-react';

export default function AdvancedKPIs({ payments, appointments, patients }) {
  // ממוצע רווח למטופל
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activePatients = patients.filter(p => p.status === 'פעיל').length;
  const avgRevenuePerPatient = activePatients > 0 ? (totalRevenue / activePatients) : 0;

  // שיעור ביטולים
  const canceledAppointments = appointments.filter(a => a.status === 'בוטל').length;
  const cancellationRate = appointments.length > 0 ? ((canceledAppointments / appointments.length) * 100) : 0;

  // שיעור אי-הגעה
  const noShowAppointments = appointments.filter(a => a.status === 'לא הגיע').length;
  const noShowRate = appointments.length > 0 ? ((noShowAppointments / appointments.length) * 100) : 0;

  // תפוסה שבועית - תורים שבוצעו/אושרו מתוך כלל התורים השבוע
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const weekAppointments = appointments.filter(a => {
    const appointmentDate = new Date(a.date);
    return appointmentDate >= thisWeekStart && appointmentDate < thisWeekEnd;
  });

  const completedWeekAppointments = weekAppointments.filter(a => 
    a.status === 'בוצע' || a.status === 'אושר'
  ).length;
  
  const weekOccupancy = weekAppointments.length > 0 ? ((completedWeekAppointments / weekAppointments.length) * 100) : 0;

  const kpis = [
    {
      title: 'ממוצע רווח למטופל',
      value: `₪${avgRevenuePerPatient.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'הכנסה ממוצעת לכל מטופל פעיל'
    },
    {
      title: 'שיעור ביטולים',
      value: `${cancellationRate.toFixed(1)}%`,
      icon: UserX,
      color: cancellationRate > 15 ? 'text-red-600' : 'text-orange-600',
      bgColor: cancellationRate > 15 ? 'bg-red-50' : 'bg-orange-50',
      description: `${canceledAppointments} ביטולים מתוך ${appointments.length} תורים`
    },
    {
      title: 'שיעור אי-הגעה',
      value: `${noShowRate.toFixed(1)}%`,
      icon: AlertTriangle,
      color: noShowRate > 10 ? 'text-red-600' : 'text-yellow-600',
      bgColor: noShowRate > 10 ? 'bg-red-50' : 'bg-yellow-50',
      description: `${noShowAppointments} אי-הגעות`
    },
    {
      title: 'תפוסה שבועית',
      value: `${weekOccupancy.toFixed(0)}%`,
      icon: Calendar,
      color: weekOccupancy > 80 ? 'text-blue-600' : 'text-gray-600',
      bgColor: weekOccupancy > 80 ? 'bg-blue-50' : 'bg-gray-50',
      description: `${completedWeekAppointments} מתוך ${weekAppointments.length} תורים`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}