import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function RealtimeNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to appointment changes
    const unsubscribeAppointments = base44.entities.Appointment.subscribe((event) => {
      if (event.type === 'create') {
        const apt = event.data;
        const aptDate = parseISO(apt.date);
        const dateLabel = isToday(aptDate) ? 'היום' : isTomorrow(aptDate) ? 'מחר' : format(aptDate, 'dd/MM', { locale: he });
        
        toast.success(`תור חדש נוסף`, {
          description: `${apt.patient_name} • ${dateLabel} ${apt.time}`,
          icon: <Calendar className="w-4 h-4" />
        });
      } else if (event.type === 'update') {
        const apt = event.data;
        if (apt.status === 'בוטל') {
          toast.error(`תור בוטל`, {
            description: `${apt.patient_name}`,
            icon: <AlertCircle className="w-4 h-4" />
          });
        }
      }
    });

    // Subscribe to sync logs for real-time sync status
    const unsubscribeLogs = base44.entities.SyncLog.subscribe((event) => {
      if (event.type === 'create') {
        const log = event.data;
        if (log.status === 'failed' && log.system === 'Google Calendar') {
          toast.error(`סנכרון נכשל`, {
            description: `לא הצלחנו לסנכרן את התור לגוגל קלנדר`,
            icon: <AlertCircle className="w-4 h-4" />
          });
        }
      }
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeLogs();
    };
  }, []);

  return null; // This component only manages toasts
}