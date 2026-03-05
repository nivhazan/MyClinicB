import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText, TrendingUp, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import SessionForm from '../components/sessions/SessionForm';
import SessionDetails from '../components/sessions/SessionDetails';

export default function Sessions() {
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.TreatmentSession.list('-session_date'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TreatmentSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setShowForm(false);
      setEditingSession(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TreatmentSession.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setShowForm(false);
      setEditingSession(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const progressColors = {
    'משמעותית': 'bg-green-100 text-green-800 border-green-200',
    'טובה': 'bg-blue-100 text-blue-800 border-blue-200',
    'מתונה': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'מינימלית': 'bg-orange-100 text-orange-800 border-orange-200',
    'ללא שינוי': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  if (selectedSession) {
    return (
      <SessionDetails
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onEdit={(session) => {
          setEditingSession(session);
          setShowForm(true);
          setSelectedSession(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">תיעוד טיפולים</h1>
          <p className="text-gray-600 mt-1">רישום ומעקב אחר פגישות טיפול</p>
        </div>
        <Button
          onClick={() => {
            setEditingSession(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 shadow-md"
        >
          <Plus className="w-5 h-5 ml-2" />
          תעד טיפול חדש
        </Button>
      </div>

      {/* Search */}
      <Card className="shadow-md border-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="חיפוש לפי שם מטופל..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Form */}
      {showForm && (
        <SessionForm
          session={editingSession}
          patients={patients}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSession(null);
          }}
        />
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="hover:shadow-xl transition-all cursor-pointer border-0 bg-white/80 backdrop-blur-sm group"
              onClick={() => setSelectedSession(session)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">{session.patient_name}</CardTitle>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {session.session_date && format(parseISO(session.session_date), 'dd MMMM yyyy', { locale: he })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {session.session_number && (
                      <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        פגישה #{session.session_number}
                      </span>
                    )}
                    {session.progress && (
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${progressColors[session.progress]}`}>
                        {session.progress}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {session.goals && (
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                    <p className="text-xs text-teal-600 font-medium mb-1">מטרות הפגישה:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{session.goals}</p>
                  </div>
                )}
                
                {session.summary && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium mb-1">סיכום:</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{session.summary}</p>
                  </div>
                )}
                
                {session.patient_cooperation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>שיתוף פעולה: {session.patient_cooperation}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'לא נמצאו טיפולים התואמים לחיפוש' : 'אין טיפולים רשומים'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}