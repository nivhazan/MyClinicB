import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Copy, Send } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AdminSummaryGenerator() {
  const tomorrow = addDays(new Date(), 1);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

  const { data: tomorrowAppointments } = useQuery({
    queryKey: ['tomorrowAppointments'],
    queryFn: async () => {
      const apps = await base44.entities.Appointment.list();
      return apps.filter(a => a.date === format(tomorrow, 'yyyy-MM-dd')).sort((a, b) => a.time.localeCompare(b.time));
    }
  });

  const { data: weekAppointments } = useQuery({
    queryKey: ['weekAppointments'],
    queryFn: async () => {
      const apps = await base44.entities.Appointment.list();
      return apps.filter(a => {
        const date = new Date(a.date);
        return date >= weekStart && date <= weekEnd;
      }).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
    }
  });

  const generateDailySummary = () => {
    if (!tomorrowAppointments?.length) {
      return `📅 סיכום תורים למחר - ${format(tomorrow, 'dd/MM/yyyy', { locale: he })}\n\nאין תורים מתוכננים למחר.`;
    }

    let summary = `📅 סיכום תורים למחר - ${format(tomorrow, 'dd/MM/yyyy', { locale: he })}\n`;
    summary += `\nסה"כ ${tomorrowAppointments.length} תורים:\n\n`;

    tomorrowAppointments.forEach((app, index) => {
      summary += `${index + 1}. ${app.time} - ${app.patient_name}`;
      if (app.type) summary += ` (${app.type})`;
      summary += '\n';
    });

    return summary;
  };

  const generateWeeklySummary = () => {
    if (!weekAppointments?.length) {
      return `📆 סיכום שבועי - ${format(weekStart, 'dd/MM', { locale: he })} - ${format(weekEnd, 'dd/MM', { locale: he })}\n\nאין תורים מתוכננים השבוע.`;
    }

    let summary = `📆 סיכום שבועי - ${format(weekStart, 'dd/MM', { locale: he })} - ${format(weekEnd, 'dd/MM', { locale: he })}\n`;
    summary += `\nסה"כ ${weekAppointments.length} תורים:\n\n`;

    const groupedByDate = weekAppointments.reduce((acc, app) => {
      if (!acc[app.date]) acc[app.date] = [];
      acc[app.date].push(app);
      return acc;
    }, {});

    Object.entries(groupedByDate).forEach(([date, apps]) => {
      summary += `▫️ ${format(new Date(date), 'EEEE dd/MM', { locale: he })}:\n`;
      apps.forEach(app => {
        summary += `   ${app.time} - ${app.patient_name}`;
        if (app.type) summary += ` (${app.type})`;
        summary += '\n';
      });
      summary += '\n';
    });

    return summary;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('הטקסט הועתק ללוח');
  };

  const handleSendWhatsApp = (text) => {
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    toast.success('נפתח WhatsApp');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            סיכום יומי למחר
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="bg-gray-50 p-3 rounded-lg whitespace-pre-wrap text-sm font-mono">
            {generateDailySummary()}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => handleCopy(generateDailySummary())} 
              variant="outline"
              className="flex-1"
            >
              <Copy className="w-4 h-4 ml-2" />
              העתק
            </Button>
            <Button 
              onClick={() => handleSendWhatsApp(generateDailySummary())}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 ml-2" />
              שלח WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            סיכום שבועי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <div className="bg-gray-50 p-3 rounded-lg whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
            {generateWeeklySummary()}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => handleCopy(generateWeeklySummary())} 
              variant="outline"
              className="flex-1"
            >
              <Copy className="w-4 h-4 ml-2" />
              העתק
            </Button>
            <Button 
              onClick={() => handleSendWhatsApp(generateWeeklySummary())}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 ml-2" />
              שלח WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}