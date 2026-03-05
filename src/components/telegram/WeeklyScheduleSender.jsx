import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function WeeklyScheduleSender() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const { data: settings } = useQuery({
    queryKey: ['reminderSettings'],
    queryFn: async () => {
      const data = await base44.entities.ReminderSettings.list();
      return data[0];
    }
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list()
  });

  const generateWeeklySchedule = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // ראשון
    const nextWeekStart = addDays(weekStart, 7);
    const nextWeekEnd = addDays(nextWeekStart, 6);

    // סינון תורים לשבוע הבא
    const nextWeekAppointments = appointments.filter(apt => {
      const aptDate = parseISO(apt.date);
      return aptDate >= nextWeekStart && aptDate <= nextWeekEnd;
    });

    // מיון לפי תאריך ושעה
    nextWeekAppointments.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // בניית ההודעה
    let message = '📅 *לוז שבוע הבא*\n';
    message += `${format(nextWeekStart, 'd.M', { locale: he })} - ${format(nextWeekEnd, 'd.M.yyyy', { locale: he })}\n`;
    message += '━━━━━━━━━━━━━━━━━\n\n';

    if (nextWeekAppointments.length === 0) {
      message += '✨ אין תורים מתוכננים לשבוע הבא';
      return message;
    }

    // קיבוץ לפי ימים
    const dayGroups = {};
    nextWeekAppointments.forEach(apt => {
      const dayKey = format(parseISO(apt.date), 'EEEE d/M', { locale: he });
      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = [];
      }
      dayGroups[dayKey].push(apt);
    });

    // הדפסת התורים
    Object.entries(dayGroups).forEach(([day, apts]) => {
      message += `📌 *${day}*\n`;
      apts.forEach(apt => {
        const statusEmoji = {
          'מתוכנן': '⏰',
          'אושר': '✅',
          'בוצע': '✔️',
          'בוטל': '❌',
          'לא הגיע': '⚠️'
        }[apt.status] || '•';
        
        message += `${statusEmoji} ${apt.time} - ${apt.patient_name}`;
        if (apt.type && apt.type !== 'טיפול שוטף') {
          message += ` (${apt.type})`;
        }
        message += '\n';
      });
      message += '\n';
    });

    message += `\nסה"כ: ${nextWeekAppointments.length} תורים`;
    
    return message;
  };

  const sendWeeklySchedule = async () => {
    if (!settings?.telegram_enabled) {
      toast.error('Telegram לא מופעל בהגדרות');
      return;
    }

    if (!settings?.telegram_bot_token || !settings?.telegram_chat_id) {
      toast.error('חסרים פרטי התחברות לטלגרם');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const message = generateWeeklySchedule();
      const response = await base44.functions.invoke('sendTelegramMessage', {
        chat_id: settings.telegram_chat_id,
        message,
        parse_mode: 'Markdown'
      });

      if (response.data?.success) {
        setResult({ success: true, message: 'לוז שבועי נשלח בהצלחה!' });
        toast.success('לוז שבועי נשלח בהצלחה');
      } else {
        setResult({ success: false, message: `שגיאה: ${response.data?.error || 'שגיאה לא ידועה'}` });
        toast.error('שליחה נכשלה');
      }
    } catch (error) {
      setResult({ success: false, message: `שגיאת רשת: ${error.message}` });
      toast.error('שגיאה בשליחה');
    } finally {
      setSending(false);
    }
  };

  const nextWeekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 7);
  const nextWeekEnd = addDays(nextWeekStart, 6);
  const nextWeekAppointments = appointments.filter(apt => {
    const aptDate = parseISO(apt.date);
    return aptDate >= nextWeekStart && aptDate <= nextWeekEnd;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          שליחת לוז שבועי
        </CardTitle>
        <CardDescription>
          שלח את לוז התורים של השבוע הבא לטלגרם
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!settings?.telegram_enabled ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Telegram לא מופעל. עבור להגדרות והפעל את Telegram.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>שבוע הבא:</strong> {format(nextWeekStart, 'd.M', { locale: he })} - {format(nextWeekEnd, 'd.M.yyyy', { locale: he })}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                <strong>תורים מתוכננים:</strong> {nextWeekAppointments.length}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-600 mb-2">תצוגה מקדימה:</p>
              <pre className="text-xs whitespace-pre-wrap text-gray-700 font-mono">
                {generateWeeklySchedule()}
              </pre>
            </div>

            <Button
              onClick={sendWeeklySchedule}
              disabled={sending}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  שלח לוז שבועי עכשיו
                </>
              )}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`text-sm ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}