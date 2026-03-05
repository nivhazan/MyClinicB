import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Edit, Trash2, DollarSign, CheckCircle, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AppointmentCard({ appointment, isPast, isPaid, isMonthlyPayer, onEdit, onDelete, onMarkAsPaid }) {
  const [syncing, setSyncing] = useState(false);

  const handleSyncToGoogle = async (e) => {
    e.stopPropagation();
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncToGoogleCalendar', {
        event: { type: 'create', entity_name: 'Appointment', entity_id: appointment.id },
        data: appointment,
        initiated_by: 'manual'
      });
      if (response.data.success) {
        toast.success('התור סונכרן בהצלחה לגוגל קלנדר');
      } else {
        toast.error('שגיאה בסנכרון לגוגל קלנדר');
      }
    } catch (error) {
      toast.error('שגיאה בסנכרון: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const statusColors = {
    'מתוכנן': 'bg-blue-100 text-blue-800 border-blue-200',
    'בוצע': 'bg-gray-100 text-gray-800 border-gray-200',
    'בוטל': 'bg-red-100 text-red-800 border-red-200',
    'לא הגיע': 'bg-orange-100 text-orange-800 border-orange-200'
  };

  const typeColors = {
    'הערכה ראשונית': 'bg-purple-50 border-purple-200',
    'טיפול שוטף': 'bg-blue-50 border-blue-200',
    'מעקב': 'bg-teal-50 border-teal-200',
    'התייעצות': 'bg-green-50 border-green-200'
  };

  // Determine payment status colors
  let cardColors = typeColors[appointment.type] || 'bg-gray-50 border-gray-200';
  if (isPast) {
    if (isPaid) {
      cardColors = 'bg-green-50 border-green-400';
    } else if (isMonthlyPayer) {
      cardColors = 'bg-yellow-50 border-yellow-400';
    } else {
      cardColors = 'bg-red-50 border-red-400';
    }
  }

  return (
    <div className={`p-2 md:p-3 rounded-lg border-r-4 ${cardColors} hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between gap-1 md:gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-xs md:text-sm truncate">{appointment.patient_name}</p>
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
            <Clock className="w-3 h-3" />
            <span>{appointment.time}</span>
            {appointment.duration && <span>({appointment.duration} דק׳)</span>}
          </div>
        </div>
        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={handleSyncToGoogle}
            disabled={syncing}
            title="סנכרן לגוגל קלנדר"
          >
            <Calendar className="w-3 h-3" />
          </Button>
          {!isPaid && isPast && !isMonthlyPayer && onMarkAsPaid && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsPaid(appointment);
              }}
              title="סמן כשולם"
            >
              <DollarSign className="w-3 h-3" />
            </Button>
          )}
          {isPaid && (
            <div className="h-6 w-6 flex items-center justify-center" title="שולם">
              <CheckCircle className="w-3 h-3 text-green-600" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(appointment);
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('האם אתה בטוח שברצונך למחוק את התור?')) {
                onDelete(appointment.id);
              }
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[appointment.status] || statusColors['מתוכנן']}`}>
          {appointment.status}
        </span>
      </div>
      
      {appointment.notes && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{appointment.notes}</p>
      )}
    </div>
  );
}