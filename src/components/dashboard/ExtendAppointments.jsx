import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { schedulePatientAppointments } from '../patients/AutoScheduleAppointments';

export default function ExtendAppointments() {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [extending, setExtending] = useState(false);
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.filter({ status: 'פעיל' })
  });

  const patientsWithSchedule = patients.filter(p => p.regular_day && p.regular_time);

  const handleExtend = async () => {
    if (!selectedPatient) {
      toast.error('בחר מטופל');
      return;
    }

    setExtending(true);
    try {
      const patient = patients.find(p => p.id === selectedPatient);
      const result = await schedulePatientAppointments(patient, 1);
      
      if (result.success) {
        toast.success(`הוארך! ${result.message}`);
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        setSelectedPatient('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('שגיאה בהארכת תורים');
    } finally {
      setExtending(false);
    }
  };

  const handleExtendAll = async () => {
    setExtending(true);
    let totalCreated = 0;

    try {
      for (const patient of patientsWithSchedule) {
        const result = await schedulePatientAppointments(patient, 1);
        if (result.success) {
          totalCreated += result.count;
        }
      }

      toast.success(`הוארכו תורים לכל המטופלים! נוצרו ${totalCreated} תורים חדשים`);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setSelectedPatient('');
    } catch (error) {
      toast.error('שגיאה בהארכת תורים');
    } finally {
      setExtending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-500" />
          הארכת תורים קבועים
        </CardTitle>
        <CardDescription>
          הוסף עוד חודש של תורים למטופלים עם יום קבוע
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>{patientsWithSchedule.length}</strong> מטופלים עם שיבוץ קבוע
          </p>
        </div>

        <div className="space-y-2">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger>
              <SelectValue placeholder="בחר מטופל להארכה" />
            </SelectTrigger>
            <SelectContent>
              {patientsWithSchedule.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.full_name} - {patient.regular_day} {patient.regular_time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleExtend}
            disabled={!selectedPatient || extending}
            className="w-full bg-teal-500 hover:bg-teal-600"
          >
            {extending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מאריך...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 ml-2" />
                הארך חודש למטופל זה
              </>
            )}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">או</span>
          </div>
        </div>

        <Button
          onClick={handleExtendAll}
          disabled={extending}
          variant="outline"
          className="w-full border-teal-300 hover:bg-teal-50"
        >
          {extending ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              מאריך...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 ml-2" />
              הארך חודש לכל המטופלים
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}