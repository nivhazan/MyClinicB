import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User, Phone, Mail, Calendar, FileText, Grid, List } from 'lucide-react';
import PatientForm from '../components/patients/PatientForm';
import PatientDetails from '../components/patients/PatientDetails';
import DataTable from '../components/shared/DataTable';
import { schedulePatientAppointments } from '../components/patients/AutoScheduleAppointments';
import { toast } from 'sonner';

export default function Patients() {
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  const queryClient = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const patient = await base44.entities.Patient.create(data);
      
      // אם יש יום ושעה קבועים - צור תורים אוטומטית
      if (data.regular_day && data.regular_time) {
        const result = await schedulePatientAppointments(patient);
        if (result.success) {
          toast.success(`מטופל נוסף בהצלחה! ${result.message}`);
        }
      }
      
      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setEditingPatient(null);
      toast.success('מטופל נוסף בהצלחה');
    },
    onError: (err) => {
      toast.error(err.message || 'שגיאה בשמירת מטופל');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.Patient.update(id, data);
      
      // אם שונו יום או שעה קבועים - עדכן תורים עתידיים
      if (data.regular_day && data.regular_time) {
        const result = await schedulePatientAppointments(updated);
        if (result.count > 0) {
          toast.success(`מטופל עודכן! ${result.message}`);
        }
      }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setEditingPatient(null);
      setSelectedPatient(null);
      toast.success('מטופל עודכן בהצלחה');
    },
    onError: (err) => {
      toast.error(err.message || 'שגיאה בעדכון מטופל');
    },
  });

  const handleSubmit = (data) => {
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm) ||
    patient.id_number?.includes(searchTerm)
  );

  const statusColors = {
    'פעיל': 'bg-green-100 text-green-800 border-green-200',
    'לא פעיל': 'bg-gray-100 text-gray-800 border-gray-200',
    'הושלם טיפול': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const tableColumns = [
    { key: 'full_name', label: 'שם מלא', sortable: true },
    { key: 'phone', label: 'טלפון', sortable: false },
    { key: 'email', label: 'אימייל', sortable: false },
    { 
      key: 'date_of_birth', 
      label: 'גיל', 
      sortable: true,
      render: (val) => {
        if (!val) return '-';
        const today = new Date();
        const birth = new Date(val);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
      }
    },
    { 
      key: 'activity_status', 
      label: 'סטטוס', 
      sortable: true,
      render: (val, patient) => (
        <div className="flex flex-wrap gap-1">
          <Badge className={val === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {val === 'active' ? 'פעיל' : 'לא פעיל'}
          </Badge>
          {val === 'inactive' && patient.inactive_reason && (
            <Badge className="bg-orange-100 text-orange-800 text-[10px]">
              {patient.inactive_reason === 'completed' ? 'סיים' :
               patient.inactive_reason === 'paused' ? 'מוקפא' :
               patient.inactive_reason === 'dropped' ? 'נשר' :
               patient.inactive_reason === 'financial' ? 'תשלום' : 'אחר'}
            </Badge>
          )}
        </div>
      )
    },
    { key: 'diagnosis', label: 'אבחון', sortable: false },
  ];

  if (selectedPatient) {
    return (
      <PatientDetails
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        onEdit={(patient) => {
          setEditingPatient(patient);
          setShowForm(true);
          setSelectedPatient(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ניהול מטופלים</h1>
          <p className="text-gray-600 mt-1">רשימת כל המטופלים בקליניקה ({filteredPatients.length})</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={() => {
              setEditingPatient(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            הוסף מטופל חדש
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="shadow-md border-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="חיפוש לפי שם, טלפון או ת.ז..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Form Modal */}
      {showForm && (
        <PatientForm
          patient={editingPatient}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPatient(null);
          }}
        />
      )}

      {/* Patients View */}
      {viewMode === 'table' ? (
        <Card className="shadow-md border-0">
          <CardContent className="p-6">
            <DataTable
              data={filteredPatients}
              columns={tableColumns}
              onRowClick={(patient) => setSelectedPatient(patient)}
              selectable={false}
              itemsPerPage={20}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <Card
              key={patient.id}
              className="hover:shadow-xl transition-all cursor-pointer border-0 bg-white/80 backdrop-blur-sm group"
              onClick={() => setSelectedPatient(patient)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">{patient.full_name}</CardTitle>
                      {patient.date_of_birth && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          גיל: {(() => { const today = new Date(); const birth = new Date(patient.date_of_birth); let age = today.getFullYear() - birth.getFullYear(); const m = today.getMonth() - birth.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--; return age; })()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${patient.activity_status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {patient.activity_status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </span>
                    {patient.activity_status === 'inactive' && patient.inactive_reason && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[10px]">
                        {patient.inactive_reason === 'completed' ? 'סיים טיפול' :
                         patient.inactive_reason === 'paused' ? 'מוקפא' :
                         patient.inactive_reason === 'dropped' ? 'נשר' :
                         patient.inactive_reason === 'financial' ? 'תשלום' : 'אחר'}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span>{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                {patient.diagnosis && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4 text-teal-500 mt-0.5" />
                    <span className="line-clamp-2">{patient.diagnosis}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'לא נמצאו מטופלים התואמים לחיפוש' : 'אין מטופלים במערכת'}
            </p>
          </div>
        )}
        </div>
      )}
    </div>
  );
}