import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Send, Mail } from 'lucide-react';
import { format, parseISO, addDays, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ReminderSystem({ appointments }) {
  const [sending, setSending] = useState(false);

  const sendReminder = async (appointment) => {
    setSending(true);
    
    try {
      const patient = await base44.entities.Patient.filter({ id: appointment.patient_id });
      const patientData = patient[0];
      
      if (!patientData?.email) {
        toast.error('למטופל אין כתובת אימייל');
        setSending(false);
        return;
      }

      const aptDate = parseISO(appointment.date);
      const dayText = isToday(aptDate) ? 'היום' : isTomorrow(aptDate) ? 'מחר' : format(aptDate, 'd בMMMM', { locale: he });

      await base44.integrations.Core.SendEmail({
        to: patientData.email,
        subject: `תזכורת לתור בקליניקה - ${dayText}`,
        body: `
שלום ${appointment.patient_name},

זוהי תזכורת לתור שלך בקליניקה:

📅 תאריך: ${format(aptDate, 'd בMMMM yyyy', { locale: he })}
🕐 שעה: ${appointment.time}
⏱️ משך: ${appointment.duration} דקות
📋 סוג: ${appointment.type}

נשמח לראותך!

בברכה,
הקליניקה לקלינאות תקשורת
        `
      });

      // Update reminder sent flag
      await base44.entities.Appointment.update(appointment.id, { reminder_sent: true });
      
      toast.success('תזכורת נשלחה בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בשליחת התזכורת');
    }
    
    setSending(false);
  };

  const sendBulkReminders = async () => {
    setSending(true);
    
    const tomorrow = addDays(new Date(), 1);
    const tomorrowAppointments = appointments.filter(apt => {
      if (!apt.date || apt.reminder_sent || apt.status === 'בוטל') return false;
      return isTomorrow(parseISO(apt.date));
    });

    // Send reminders to patients
    for (const apt of tomorrowAppointments) {
      await sendReminder(apt);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 sec between emails
    }
    
    // Send summary to therapist
    try {
      const user = await base44.auth.me();
      if (user?.email) {
        const summaryList = tomorrowAppointments.map((apt, idx) => 
          `${idx + 1}. ${apt.patient_name} - ${apt.time} (${apt.duration} דק׳)`
        ).join('<br>');
        
        await base44.integrations.Core.SendEmail({
          to: user.email,
          subject: `סיכום תורים למחר - ${format(tomorrow, 'd בMMMM', { locale: he })}`,
          body: `
שלום ${user.full_name || 'מטפל/ת'},<br><br>

סיכום התורים שלך למחר (${format(tomorrow, 'd בMMMM yyyy', { locale: he })}):<br><br>

${summaryList}<br><br>

סה״כ: ${tomorrowAppointments.length} תורים<br><br>

בהצלחה!
          `
        });
      }
    } catch (error) {
      console.error('Failed to send summary email:', error);
    }
    
    setSending(false);
    toast.success(`נשלחו ${tomorrowAppointments.length} תזכורות + אימייל סיכום אליך!`);
  };

  const upcomingAppointments = appointments.filter(apt => {
    if (!apt.date || apt.status === 'בוטל') return false;
    const aptDate = parseISO(apt.date);
    return (isToday(aptDate) || isTomorrow(aptDate)) && !apt.reminder_sent;
  });

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          תזכורות אוטומטיות
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {upcomingAppointments.length > 0 ? (
          <>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                {upcomingAppointments.length} תורים ממתינים לתזכורת
              </p>
              <Button
                onClick={sendBulkReminders}
                disabled={sending}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Send className="w-4 h-4 ml-2" />
                {sending ? 'שולח...' : 'שלח לכולם'}
              </Button>
            </div>
            
            <div className="space-y-2">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100 gap-2 sm:gap-0">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{apt.patient_name}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {apt.date && format(parseISO(apt.date), 'dd/MM', { locale: he })} • {apt.time}
                    </p>
                  </div>
                  <Button
                    onClick={() => sendReminder(apt)}
                    disabled={sending}
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Mail className="w-4 h-4 ml-2" />
                    שלח תזכורת
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>אין תורים הדורשים תזכורת</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}