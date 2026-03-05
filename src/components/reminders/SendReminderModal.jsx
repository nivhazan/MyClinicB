import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Copy, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

export default function SendReminderModal({ appointment, patient, isOpen, onClose, reminderTemplate }) {
  const generateMessage = () => {
    if (!appointment || !patient) return '';
    
    const template = reminderTemplate || "שלום {patient_name},\n\nמזכירים לך על התור שלך מחר ב-{time}.\n\nנשמח לראותך!\nהקליניקה";
    
    return template
      .replace('{patient_name}', patient.full_name)
      .replace('{time}', appointment.time)
      .replace('{date}', format(new Date(appointment.date), 'dd/MM/yyyy', { locale: he }))
      .replace('{type}', appointment.type || 'טיפול');
  };

  const [message, setMessage] = useState(generateMessage());

  React.useEffect(() => {
    setMessage(generateMessage());
  }, [appointment, patient, reminderTemplate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('ההודעה הועתקה ללוח');
  };

  const handleSendWhatsApp = () => {
    if (!patient?.phone) {
      toast.error('לא נמצא מספר טלפון למטופל');
      return;
    }
    
    const phoneNumber = patient.phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/972${phoneNumber.substring(1)}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('נפתח WhatsApp');
    onClose();
  };

  if (!appointment || !patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            שליחת תזכורת ל{patient.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg text-sm">
            <p><strong>תאריך:</strong> {format(new Date(appointment.date), 'dd/MM/yyyy', { locale: he })}</p>
            <p><strong>שעה:</strong> {appointment.time}</p>
            <p><strong>טלפון:</strong> {patient.phone || 'לא זמין'}</p>
          </div>

          <div className="space-y-2">
            <Label>תוכן ההודעה</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            <Copy className="w-4 h-4 ml-2" />
            העתק
          </Button>
          <Button 
            onClick={handleSendWhatsApp} 
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!patient.phone}
          >
            <Send className="w-4 h-4 ml-2" />
            שלח WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}