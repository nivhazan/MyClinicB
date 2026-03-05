import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, DollarSign, FileText, AlertCircle, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NotificationCenter({ payments, appointments, sessions, tasks, patients }) {
  const notifications = [];

  // תשלומים שטרם נגבו - חיפוש תורים שבוצעו אבל אין תשלום מקושר
  const completedAppointments = appointments.filter(a => a.status === 'בוצע');
  const unpaidSessions = completedAppointments.filter(appointment => {
    const hasPayment = payments.some(p => 
      p.patient_id === appointment.patient_id && 
      p.payment_date === appointment.date
    );
    return !hasPayment;
  });

  if (unpaidSessions.length > 0) {
    notifications.push({
      id: 'unpaid',
      title: 'תשלומים שטרם נגבו',
      description: `${unpaidSessions.length} פגישות שבוצעו ללא תשלום רשום`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      count: unpaidSessions.length,
      link: createPageUrl('Payments'),
      severity: 'high'
    });
  }

  // תורים ללא תיעוד - תורים שבוצעו אבל אין להם דוח טיפולי
  const appointmentsWithoutSession = completedAppointments.filter(appointment => {
    const hasSession = sessions.some(s => s.appointment_id === appointment.id);
    return !hasSession;
  });

  if (appointmentsWithoutSession.length > 0) {
    notifications.push({
      id: 'no-documentation',
      title: 'תורים ללא תיעוד',
      description: `${appointmentsWithoutSession.length} פגישות חסרות דוח טיפולי`,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: appointmentsWithoutSession.length,
      link: createPageUrl('Sessions'),
      severity: 'medium'
    });
  }

  // משימות מאחרות
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'הושלם') return false;
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    return dueDate < today;
  });

  if (overdueTasks.length > 0) {
    notifications.push({
      id: 'overdue-tasks',
      title: 'משימות מאחרות',
      description: `${overdueTasks.length} משימות שעברו את מועד היעד`,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      count: overdueTasks.length,
      link: createPageUrl('Tasks'),
      severity: 'medium'
    });
  }

  // מטופלים שלא הגיעו זמן רב - 60 יום
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const inactivePatients = patients.filter(patient => {
    if (patient.status !== 'פעיל') return false;
    const patientAppointments = appointments.filter(a => 
      a.patient_id === patient.id && 
      a.status === 'בוצע'
    );
    if (patientAppointments.length === 0) return false;
    
    const lastAppointment = patientAppointments.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0];
    
    return new Date(lastAppointment.date) < sixtyDaysAgo;
  });

  if (inactivePatients.length > 0) {
    notifications.push({
      id: 'inactive-patients',
      title: 'מטופלים לא פעילים',
      description: `${inactivePatients.length} מטופלים לא הגיעו מעל 60 יום`,
      icon: UserX,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: inactivePatients.length,
      link: createPageUrl('Patients'),
      severity: 'low'
    });
  }

  // מיון לפי חומרה
  const sortedNotifications = notifications.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          מרכז התראות
          {notifications.length > 0 && (
            <Badge className="bg-red-500 text-white">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">אין התראות כרגע</p>
            <p className="text-gray-400 text-xs mt-1">כל העבודה מעודכנת! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Link 
                  key={notification.id}
                  to={notification.link}
                  className="block"
                >
                  <div className={`p-4 rounded-lg ${notification.bgColor} hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-gray-200`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white`}>
                        <Icon className={`w-5 h-5 ${notification.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {notification.count}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{notification.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}