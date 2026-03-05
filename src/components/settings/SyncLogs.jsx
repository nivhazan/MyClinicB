import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Calendar, MessageSquare, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function SyncLogs() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['syncLogs'],
    queryFn: async () => {
      const allLogs = await base44.entities.SyncLog.list('-created_date', 100);
      return allLogs.filter(log => new Date(log.created_date) >= weekAgo);
    }
  });

  const systemIcons = {
    'Google Calendar': Calendar,
    'Telegram': MessageSquare,
    'SMS': Phone,
    'WhatsApp': MessageSquare,
    'Email': Mail
  };

  const eventTypeLabels = {
    'appointment_sync': 'סנכרון תור',
    'reminder_sent': 'שליחת תזכורת',
    'summary_sent': 'שליחת סיכום',
    'invoice_sent': 'שליחת חשבונית',
    'schedule_sent': 'שליחת לו״ז'
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>תיעוד תקשורות - שבוע אחרון</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">טוען...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>תיעוד תקשורות - שבוע אחרון</CardTitle>
        <CardDescription>
          כל הניסיונות להתממשק עם מערכות חיצוניות בשבוע האחרון
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">סה״כ ניסיונות</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            <p className="text-sm text-gray-600">הצלחה</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-gray-600">כישלון</p>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין תיעוד בשבוע האחרון</p>
          ) : (
            logs.map((log) => {
              const Icon = systemIcons[log.system] || Calendar;
              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border-r-4 ${
                    log.status === 'success' 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        log.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          log.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{log.system}</span>
                          <Badge variant="outline" className="text-xs">
                            {eventTypeLabels[log.event_type] || log.event_type}
                          </Badge>
                          {log.initiated_by && (
                            <Badge variant={log.initiated_by === 'manual' ? 'default' : 'secondary'} className="text-xs">
                              {log.initiated_by === 'manual' ? 'ידני' : 'אוטומטי'}
                            </Badge>
                          )}
                        </div>
                        
                        {log.patient_name && (
                          <p className="text-sm font-medium text-blue-600 mb-1">מטופל: {log.patient_name}</p>
                        )}
                        
                        <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                        
                        {log.external_id && (
                          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-2">
                            מזהה חיצוני: {log.external_id}
                          </p>
                        )}
                        
                        {log.error_message && (
                          <details className="text-xs text-red-600 bg-red-100 p-2 rounded mb-2">
                            <summary className="cursor-pointer font-semibold">שגיאה</summary>
                            <pre className="mt-2 whitespace-pre-wrap">{log.error_message}</pre>
                          </details>
                        )}
                        
                        {(log.request_data || log.response_data) && (
                          <details className="text-xs bg-gray-50 p-2 rounded mb-2">
                            <summary className="cursor-pointer font-semibold text-gray-700">פרטים טכניים</summary>
                            <div className="mt-2 space-y-2">
                              {log.request_data && (
                                <div>
                                  <p className="font-semibold text-gray-600 mb-1">Request:</p>
                                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">{log.request_data}</pre>
                                </div>
                              )}
                              {log.response_data && (
                                <div>
                                  <p className="font-semibold text-gray-600 mb-1">Response:</p>
                                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">{log.response_data}</pre>
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span>{format(new Date(log.created_date), 'dd/MM/yyyy HH:mm:ss', { locale: he })}</span>
                          {log.duration_ms && <span>• {log.duration_ms}ms</span>}
                          {log.created_by && <span>• {log.created_by}</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      {log.status === 'success' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}