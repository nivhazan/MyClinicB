import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, User, Calendar, FileText, DollarSign, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function GlobalSearch({ open, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data: results = { patients: [], appointments: [], sessions: [], logs: [] }, isLoading } = useQuery({
    queryKey: ['globalSearch', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return { patients: [], appointments: [], sessions: [], logs: [] };

      const [patients, appointments, sessions, logs] = await Promise.all([
        base44.entities.Patient.list('-created_date', 50),
        base44.entities.Appointment.list('-date', 50),
        base44.entities.TreatmentSession.list('-session_date', 50),
        base44.entities.SyncLog.list('-created_date', 30)
      ]);

      const term = searchTerm.toLowerCase();

      return {
        patients: patients.filter(p => 
          p.full_name?.toLowerCase().includes(term) ||
          p.phone?.includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.id_number?.includes(term)
        ).slice(0, 10),
        appointments: appointments.filter(a =>
          a.patient_name?.toLowerCase().includes(term) ||
          a.notes?.toLowerCase().includes(term) ||
          a.date?.includes(term)
        ).slice(0, 10),
        sessions: sessions.filter(s =>
          s.patient_name?.toLowerCase().includes(term) ||
          s.summary?.toLowerCase().includes(term) ||
          s.goals?.toLowerCase().includes(term)
        ).slice(0, 10),
        logs: logs.filter(l =>
          l.patient_name?.toLowerCase().includes(term) ||
          l.details?.toLowerCase().includes(term) ||
          l.system?.toLowerCase().includes(term)
        ).slice(0, 10)
      };
    },
    enabled: searchTerm.length >= 2
  });

  const handleResultClick = (type, item) => {
    if (type === 'patient') {
      navigate(createPageUrl('Patients'));
    } else if (type === 'appointment') {
      navigate(createPageUrl('Calendar'));
    } else if (type === 'session') {
      navigate(createPageUrl('Sessions'));
    } else if (type === 'log') {
      navigate(createPageUrl('Settings'));
    }
    onClose();
  };

  const totalResults = results.patients.length + results.appointments.length + 
                       results.sessions.length + results.logs.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            חיפוש גלובלי
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="חפש מטופלים, תורים, טיפולים, לוגים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-right text-lg"
            autoFocus
          />
        </div>

        {searchTerm.length < 2 && (
          <p className="text-center text-gray-500 py-8">הקלד לפחות 2 תווים לחיפוש</p>
        )}

        {searchTerm.length >= 2 && isLoading && (
          <p className="text-center text-gray-500 py-8">מחפש...</p>
        )}

        {searchTerm.length >= 2 && !isLoading && totalResults === 0 && (
          <p className="text-center text-gray-500 py-8">לא נמצאו תוצאות</p>
        )}

        {searchTerm.length >= 2 && !isLoading && totalResults > 0 && (
          <div className="space-y-6 mt-4">
            {/* Patients */}
            {results.patients.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  מטופלים ({results.patients.length})
                </h3>
                <div className="space-y-2">
                  {results.patients.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => handleResultClick('patient', patient)}
                      className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{patient.full_name}</p>
                          <p className="text-sm text-gray-600">{patient.phone}</p>
                        </div>
                        <Badge variant="outline">{patient.status || 'פעיל'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appointments */}
            {results.appointments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  תורים ({results.appointments.length})
                </h3>
                <div className="space-y-2">
                  {results.appointments.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => handleResultClick('appointment', apt)}
                      className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{apt.patient_name}</p>
                          <p className="text-sm text-gray-600">
                            {apt.date && format(parseISO(apt.date), 'dd/MM/yyyy', { locale: he })} • {apt.time}
                          </p>
                        </div>
                        <Badge>{apt.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sessions */}
            {results.sessions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  טיפולים ({results.sessions.length})
                </h3>
                <div className="space-y-2">
                  {results.sessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => handleResultClick('session', session)}
                      className="p-3 bg-teal-50 rounded-lg hover:bg-teal-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{session.patient_name}</p>
                          <p className="text-sm text-gray-600">
                            {session.session_date && format(parseISO(session.session_date), 'dd/MM/yyyy', { locale: he })}
                          </p>
                        </div>
                        {session.progress && <Badge variant="outline">{session.progress}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logs */}
            {results.logs.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  תיעוד תקשורת ({results.logs.length})
                </h3>
                <div className="space-y-2">
                  {results.logs.map(log => (
                    <div
                      key={log.id}
                      onClick={() => handleResultClick('log', log)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{log.system}</p>
                          <p className="text-sm text-gray-600">{log.details}</p>
                        </div>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status === 'success' ? 'הצלחה' : 'כישלון'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}