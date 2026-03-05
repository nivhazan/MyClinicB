import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Edit, User, Phone, Mail, MapPin, Calendar, FileText, AlertCircle, Users, Upload, Download, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PatientDetails({ patient, onClose, onEdit }) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileCategory, setFileCategory] = useState('אחר');
  const [fileDescription, setFileDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', patient.id],
    queryFn: () => base44.entities.Appointment.filter({ patient_id: patient.id }, '-date'),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['patient-sessions', patient.id],
    queryFn: () => base44.entities.TreatmentSession.filter({ patient_id: patient.id }, '-session_date'),
  });

  const { data: files = [] } = useQuery({
    queryKey: ['patient-files', patient.id],
    queryFn: () => base44.entities.PatientFile.filter({ patient_id: patient.id }, '-upload_date'),
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.PatientFile.create({
        patient_id: patient.id,
        patient_name: patient.full_name,
        file_url,
        file_name: file.name,
        file_type: file.type,
        category: fileCategory,
        description: fileDescription,
        upload_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-files', patient.id] });
      setUploadingFile(false);
      setFileCategory('אחר');
      setFileDescription('');
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (id) => base44.entities.PatientFile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-files', patient.id] });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
  };

  const InfoRow = ({ icon: Icon, label, value, iconColor = 'text-gray-400' }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        <Icon className={`w-5 h-5 ${iconColor} mt-0.5`} />
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-gray-800 mt-0.5">{value}</p>
        </div>
      </div>
    );
  };

  // Unified active status: prefer activity_status (new), fall back to old status field
  const isActive = patient.activity_status 
    ? patient.activity_status === 'active'
    : patient.status === 'פעיל' || !patient.status;

  const statusLabel = isActive ? 'פעיל' : 'לא פעיל';
  const statusBannerClass = isActive
    ? 'bg-green-100 text-green-800 border-green-300'
    : 'bg-gray-100 text-gray-800 border-gray-300';

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-4 rounded-lg border-2 ${statusBannerClass} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
          <div>
            <p className="text-sm font-medium">סטטוס מטופל</p>
            <p className="text-lg font-bold">{statusLabel}</p>
          </div>
        </div>
        {!isActive && patient.inactive_reason && (
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
            {patient.inactive_reason === 'completed' ? 'סיים טיפול' :
             patient.inactive_reason === 'paused' ? 'מוקפא' :
             patient.inactive_reason === 'dropped' ? 'נשר' :
             patient.inactive_reason === 'financial' ? 'תשלום' : 'אחר'}
          </span>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימה
        </Button>
        <Button onClick={() => onEdit(patient)} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <Edit className="w-4 h-4 ml-2" />
          ערוך פרטים
        </Button>
      </div>

      {/* Patient Header Card */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 text-white">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{patient.full_name}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                {patient.date_of_birth && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    גיל: {(() => { const today = new Date(); const birth = new Date(patient.date_of_birth); let age = today.getFullYear() - birth.getFullYear(); const m = today.getMonth() - birth.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--; return age; })()}
                  </span>
                )}
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {statusLabel}
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {sessions.length} טיפולים
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-0">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                פרטים אישיים
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <InfoRow icon={Phone} label="טלפון" value={patient.phone} iconColor="text-blue-500" />
              {patient.parent_phone && (
                <InfoRow icon={Phone} label="טלפון הורה" value={patient.parent_phone} iconColor="text-purple-500" />
              )}
              <InfoRow icon={Mail} label="אימייל" value={patient.email} iconColor="text-teal-500" />
              <InfoRow icon={MapPin} label="כתובת" value={patient.address} iconColor="text-green-500" />
              {patient.id_number && (
                <InfoRow icon={FileText} label="תעודת זהות" value={patient.id_number} iconColor="text-gray-500" />
              )}
              {patient.date_of_birth && (
                <InfoRow 
                  icon={Calendar} 
                  label="תאריך לידה" 
                  value={format(parseISO(patient.date_of_birth), 'dd/MM/yyyy', { locale: he })} 
                  iconColor="text-orange-500" 
                />
              )}
            </CardContent>
          </Card>

          {/* Medical Info */}
          <Card className="shadow-md border-0">
            <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-green-50">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                מידע רפואי וקלינאי
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {patient.diagnosis && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">אבחון ראשוני</p>
                  <p className="text-gray-800 bg-teal-50 p-3 rounded-lg">{patient.diagnosis}</p>
                </div>
              )}
              {patient.medical_background && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">רקע רפואי</p>
                  <p className="text-gray-800 bg-blue-50 p-3 rounded-lg">{patient.medical_background}</p>
                </div>
              )}
              {patient.referral_source && (
                <InfoRow icon={Users} label="מקור הפניה" value={patient.referral_source} iconColor="text-purple-500" />
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(patient.emergency_contact || patient.emergency_phone) && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  איש קשר לחירום
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <InfoRow icon={User} label="שם" value={patient.emergency_contact} iconColor="text-red-500" />
                <InfoRow icon={Phone} label="טלפון" value={patient.emergency_phone} iconColor="text-orange-500" />
              </CardContent>
            </Card>
          )}

          {patient.notes && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  הערות
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap">{patient.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Files */}
          <Card className="shadow-md border-0">
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-orange-600" />
                קבצים ומסמכים
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Upload Section */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="file-category">קטגוריה</Label>
                  <Select value={fileCategory} onValueChange={setFileCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="תוצאות בדיקות">תוצאות בדיקות</SelectItem>
                      <SelectItem value="אבחונים">אבחונים</SelectItem>
                      <SelectItem value="תמונות">תמונות</SelectItem>
                      <SelectItem value="מסמכים רפואיים">מסמכים רפואיים</SelectItem>
                      <SelectItem value="אחר">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file-description">תיאור (אופציונלי)</Label>
                  <Input
                    id="file-description"
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    placeholder="תיאור הקובץ"
                    className="text-right"
                  />
                </div>

                <label className="block">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadFileMutation.isPending}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploadFileMutation.isPending}
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    <Upload className="w-4 h-4 ml-2" />
                    {uploadFileMutation.isPending ? 'מעלה...' : 'העלה קובץ'}
                  </Button>
                </label>
              </div>

              {/* Files List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.length > 0 ? (
                  files.map((file) => (
                    <div key={file.id} className="p-3 bg-gradient-to-l from-orange-50 to-transparent rounded-lg border border-orange-100 group hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{file.file_name}</p>
                          {file.description && (
                            <p className="text-xs text-gray-600 mt-1">{file.description}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                              {file.category}
                            </span>
                            {file.upload_date && (
                              <span className="text-xs text-gray-500">
                                {format(parseISO(file.upload_date), 'dd/MM/yyyy', { locale: he })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-600"
                            onClick={() => {
                              if (confirm('האם למחוק את הקובץ?')) {
                                deleteFileMutation.mutate(file.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4 text-sm">אין קבצים</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-purple-600" />
                טיפולים אחרונים
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {sessions.length > 0 ? (
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="p-3 bg-gradient-to-l from-purple-50 to-transparent rounded-lg border border-purple-100">
                      <p className="text-sm font-medium text-gray-800">
                        {session.session_date && format(parseISO(session.session_date), 'dd/MM/yyyy', { locale: he })}
                      </p>
                      {session.progress && (
                        <p className="text-xs text-gray-600 mt-1">התקדמות: {session.progress}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">אין טיפולים רשומים</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md border-0">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                תורים קרובים
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {appointments.filter(apt => apt.status !== 'בוטל' && parseISO(apt.date) >= new Date()).slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {appointments.filter(apt => apt.status !== 'בוטל' && parseISO(apt.date) >= new Date()).slice(0, 5).map((apt) => (
                    <div key={apt.id} className="p-3 bg-gradient-to-l from-blue-50 to-transparent rounded-lg border border-blue-100">
                      <p className="text-sm font-medium text-gray-800">
                        {apt.date && format(parseISO(apt.date), 'dd/MM/yyyy', { locale: he })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{apt.time} - {apt.type}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">אין תורים מתוכננים</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}