import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';

export default function AppointmentForm({ appointment, patients, selectedDate, existingAppointments = [], onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => {
    const defaults = {
      patient_id: '',
      patient_name: '',
      date: selectedDate || '',
      time: '',
      duration: 45,
      type: 'טיפול שוטף',
      status: 'מתוכנן',
      notes: ''
    };
    
    return appointment ? { ...defaults, ...appointment } : defaults;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate patient selection
    if (!formData.patient_id) {
      alert('יש לבחור מטופל');
      return;
    }
    
    // Check for time conflicts with other appointments (overlap detection)
    const parseTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const newStart = parseTime(formData.time);
    const newEnd = newStart + (formData.duration || 45);

    const conflict = existingAppointments.find(apt => {
      if (apt.id === appointment?.id) return false; // skip self when editing
      if (apt.date !== formData.date) return false;
      if (apt.status === 'בוטל') return false;
      const aptStart = parseTime(apt.time);
      const aptEnd = aptStart + (apt.duration || 45);
      return newStart < aptEnd && newEnd > aptStart;
    });
    
    if (conflict) {
      alert(`כבר קיים תור ל${conflict.patient_name} באותה שעה`);
      return;
    }
    
    // Validate status based on date
    const appointmentDate = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();
    
    if (formData.status === 'בוצע' && appointmentDate > now) {
      alert('לא ניתן לסמן תור עתידי כ"בוצע"');
      return;
    }
    
    if (formData.status === 'לא הגיע' && appointmentDate > now) {
      alert('לא ניתן לסמן תור עתידי כ"לא הגיע"');
      return;
    }
    
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill patient name when patient is selected
      if (field === 'patient_id') {
        const patient = patients.find(p => p.id === value);
        if (patient) {
          updated.patient_name = patient.full_name;
        }
      }
      
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl border-0 my-8">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {appointment ? 'עריכת תור' : 'תור חדש'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="patient_id">מטופל *</Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.patient_id} 
                  onValueChange={(value) => handleChange('patient_id', value)}
                  required
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="בחר מטופל" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                 type="button" 
                 variant="outline"
                 onClick={async () => {
                   const name = prompt('שם המטופל החדש:');
                   if (name) {
                     const newPatient = await base44.entities.Patient.create({ full_name: name });
                     setFormData(prev => ({ ...prev, patient_id: newPatient.id, patient_name: newPatient.full_name }));
                   }
                 }}
                >
                 +
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">תאריך *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                  className="text-right"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">שעה *</Label>
                <Input
                  id="time"
                  type="text"
                  placeholder="__:__"
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  maxLength="5"
                  value={formData.time}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d:]/g, '');
                    if (value.length === 2 && !value.includes(':')) {
                      value = value + ':';
                    }
                    if (value.length <= 5) {
                      handleChange('time', value);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value.length === 5) {
                      const [h, m] = value.split(':');
                      if (parseInt(h) > 23) {
                        handleChange('time', '23:' + m);
                      }
                    }
                  }}
                  required
                  className="text-center font-mono text-lg"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">סוג פגישה</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="הערכה ראשונית">הערכה ראשונית</SelectItem>
                    <SelectItem value="טיפול שוטף">טיפול שוטף</SelectItem>
                    <SelectItem value="מעקב">מעקב</SelectItem>
                    <SelectItem value="התייעצות">התייעצות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">משך (דקות)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="מתוכנן">מתוכנן</SelectItem>
                  <SelectItem value="בוצע">בוצע</SelectItem>
                  <SelectItem value="בוטל">בוטל</SelectItem>
                  <SelectItem value="לא הגיע">לא הגיע</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="text-right h-20"
              />
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-gray-50 flex justify-end gap-3 p-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Save className="w-4 h-4 ml-2" />
              {appointment ? 'עדכן' : 'שמור'}
            </Button>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  );
}