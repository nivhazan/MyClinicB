import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SendTelegramReminder({ appointment, onSuccess }) {
  const [sending, setSending] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['reminderSettings'],
    queryFn: async () => {
      const data = await base44.entities.ReminderSettings.list();
      return data[0];
    }
  });

  const sendReminder = async () => {
    if (!settings?.telegram_enabled) {
      toast.error('Telegram לא מופעל בהגדרות');
      return;
    }

    setSending(true);

    try {
      const message = settings.reminder_template
        .replace('{patient_name}', appointment.patient_name)
        .replace('{time}', appointment.time)
        .replace('{date}', appointment.date)
        .replace('{type}', appointment.type || 'טיפול');

      const { data } = await base44.functions.invoke('sendTelegramMessage', { message });

      if (data?.success) {
        toast.success('תזכורת נשלחה בהצלחה דרך Telegram');
        if (onSuccess) onSuccess();
      } else {
        toast.error(`שגיאה: ${data?.error || 'שגיאה לא ידועה'}`);
      }
    } catch (error) {
      toast.error('שגיאה בשליחת תזכורת');
    } finally {
      setSending(false);
    }
  };

  if (!settings?.telegram_enabled) {
    return null;
  }

  return (
    <Button
      onClick={sendReminder}
      disabled={sending}
      variant="outline"
      className="border-blue-300 hover:bg-blue-50"
    >
      {sending ? (
        <>
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          שולח...
        </>
      ) : (
        <>
          <MessageCircle className="w-4 h-4 ml-2" />
          שלח דרך Telegram
        </>
      )}
    </Button>
  );
}