import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';
import AISessionSummary from './AISessionSummary';

export default function SessionForm({ session, patients, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(session || {
    patient_id: '',
    patient_name: '',
    session_date: new Date().toISOString().split('T')[0],
    session_number: '',
    goals: '',
    activities: '',
    progress: '',
    patient_cooperation: '',
    summary: '',
    homework: '',
    next_session_plan: '',
    recommendations: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
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
        <Card className="w-full max-w-4xl my-8 shadow-2xl border-0">
        <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-green-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {session ? 'עריכת תיעוד טיפול' : 'תיעוד טיפול חדש'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">פרטי הפגישה</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="patient_id">מטופל *</Label>
                  <Select 
                    value={formData.patient_id} 
                    onValueChange={(value) => handleChange('patient_id', value)}
                    required
                  >
                    <SelectTrigger>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session_number">מספר פגישה</Label>
                  <Input
                    id="session_number"
                    type="number"
                    value={formData.session_number}
                    onChange={(e) => handleChange('session_number', parseInt(e.target.value))}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session_date">תאריך הפגישה *</Label>
                  <Input
                    id="session_date"
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => handleChange('session_date', e.target.value)}
                    required
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            {/* Goals and Activities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">תוכן הפגישה</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goals">מטרות הפגישה</Label>
                  <Textarea
                    id="goals"
                    value={formData.goals}
                    onChange={(e) => handleChange('goals', e.target.value)}
                    className="text-right h-24"
                    placeholder="מה היו מטרות הפגישה?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="activities">פעילויות שבוצעו</Label>
                  <Textarea
                    id="activities"
                    value={formData.activities}
                    onChange={(e) => handleChange('activities', e.target.value)}
                    className="text-right h-24"
                    placeholder="אילו פעילויות ותרגילים בוצעו?"
                  />
                </div>
              </div>
            </div>

            {/* Progress and Cooperation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">הערכה</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="progress">רמת התקדמות</Label>
                  <Select value={formData.progress} onValueChange={(value) => handleChange('progress', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר רמת התקדמות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="משמעותית">משמעותית</SelectItem>
                      <SelectItem value="טובה">טובה</SelectItem>
                      <SelectItem value="מתונה">מתונה</SelectItem>
                      <SelectItem value="מינימלית">מינימלית</SelectItem>
                      <SelectItem value="ללא שינוי">ללא שינוי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patient_cooperation">שיתוף פעולה</Label>
                  <Select value={formData.patient_cooperation} onValueChange={(value) => handleChange('patient_cooperation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר רמת שיתוף פעולה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="מצוינת">מצוינת</SelectItem>
                      <SelectItem value="טובה">טובה</SelectItem>
                      <SelectItem value="סבירה">סבירה</SelectItem>
                      <SelectItem value="מוגבלת">מוגבלת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <AISessionSummary 
              formData={formData}
              onApplySummary={(summary) => handleChange('summary', summary)}
            />

            {/* Summary and Homework */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">סיכום ותכנון</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="summary">סיכום הפגישה</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleChange('summary', e.target.value)}
                    className="text-right h-24"
                    placeholder="סיכום כללי של הפגישה..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="homework">משימות לבית</Label>
                  <Textarea
                    id="homework"
                    value={formData.homework}
                    onChange={(e) => handleChange('homework', e.target.value)}
                    className="text-right h-20"
                    placeholder="תרגילים ומשימות לביצוע בבית..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="next_session_plan">תכנית לפגישה הבאה</Label>
                  <Textarea
                    id="next_session_plan"
                    value={formData.next_session_plan}
                    onChange={(e) => handleChange('next_session_plan', e.target.value)}
                    className="text-right h-20"
                    placeholder="מה מתוכנן לפגישה הבאה?"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recommendations">המלצות</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => handleChange('recommendations', e.target.value)}
                    className="text-right h-20"
                    placeholder="המלצות נוספות..."
                  />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t bg-gray-50 flex justify-end gap-3 p-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600">
              <Save className="w-4 h-4 ml-2" />
              {session ? 'עדכן' : 'שמור'}
            </Button>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  );
}