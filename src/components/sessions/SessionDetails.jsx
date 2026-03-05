import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, FileText, Target, Activity, TrendingUp, Home, Calendar as CalendarIcon, Lightbulb } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

export default function SessionDetails({ session, onClose, onEdit }) {
  const progressColors = {
    'משמעותית': 'bg-green-100 text-green-800',
    'טובה': 'bg-blue-100 text-blue-800',
    'מתונה': 'bg-yellow-100 text-yellow-800',
    'מינימלית': 'bg-orange-100 text-orange-800',
    'ללא שינוי': 'bg-gray-100 text-gray-800'
  };

  const cooperationColors = {
    'מצוינת': 'bg-green-100 text-green-800',
    'טובה': 'bg-blue-100 text-blue-800',
    'סבירה': 'bg-yellow-100 text-yellow-800',
    'מוגבלת': 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          חזרה לרשימה
        </Button>
        <Button onClick={() => onEdit(session)} className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600">
          <Edit className="w-4 h-4 ml-2" />
          ערוך תיעוד
        </Button>
      </div>

      {/* Session Header */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-teal-500 via-green-500 to-emerald-500 text-white">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{session.patient_name}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                {session.session_date && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {format(parseISO(session.session_date), 'dd MMMM yyyy', { locale: he })}
                  </span>
                )}
                {session.session_number && (
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    פגישה #{session.session_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goals */}
          {session.goals && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  מטרות הפגישה
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{session.goals}</p>
              </CardContent>
            </Card>
          )}

          {/* Activities */}
          {session.activities && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  פעילויות שבוצעו
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{session.activities}</p>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {session.summary && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-green-50">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  סיכום הפגישה
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{session.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Homework */}
          {session.homework && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-orange-600" />
                  משימות לבית
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{session.homework}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress & Cooperation */}
          <Card className="shadow-md border-0">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                הערכה
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {session.progress && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">רמת התקדמות</p>
                  <span className={`inline-block px-4 py-2 rounded-lg font-medium ${progressColors[session.progress]}`}>
                    {session.progress}
                  </span>
                </div>
              )}
              {session.patient_cooperation && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">שיתוף פעולה</p>
                  <span className={`inline-block px-4 py-2 rounded-lg font-medium ${cooperationColors[session.patient_cooperation]}`}>
                    {session.patient_cooperation}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Session Plan */}
          {session.next_session_plan && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  תכנית לפגישה הבאה
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{session.next_session_plan}</p>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {session.recommendations && (
            <Card className="shadow-md border-0">
              <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-600" />
                  המלצות
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{session.recommendations}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}