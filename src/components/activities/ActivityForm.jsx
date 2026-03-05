import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

export default function ActivityForm({ activity, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(activity || {
    title: '',
    description: '',
    category: 'שפה',
    age_range: '3-6',
    diagnosis: [],
    goals: '',
    materials: '',
    duration: 15,
    is_favorite: false
  });

  const [diagnosisInput, setDiagnosisInput] = useState('');

  const handleAddDiagnosis = () => {
    if (diagnosisInput.trim() && !formData.diagnosis.includes(diagnosisInput.trim())) {
      setFormData({
        ...formData,
        diagnosis: [...formData.diagnosis, diagnosisInput.trim()]
      });
      setDiagnosisInput('');
    }
  };

  const handleRemoveDiagnosis = (diag) => {
    setFormData({
      ...formData,
      diagnosis: formData.diagnosis.filter(d => d !== diag)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{activity ? 'עריכת פעילות' : 'פעילות חדשה'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם הפעילות *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>קטגוריה *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="שפה">שפה</SelectItem>
                  <SelectItem value="דיבור">דיבור</SelectItem>
                  <SelectItem value="הבנה">הבנה</SelectItem>
                  <SelectItem value="תקשורת חברתית">תקשורת חברתית</SelectItem>
                  <SelectItem value="אוצר מילים">אוצר מילים</SelectItem>
                  <SelectItem value="קריאה">קריאה</SelectItem>
                  <SelectItem value="כתיבה">כתיבה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>טווח גילאים</Label>
              <Select value={formData.age_range} onValueChange={(val) => setFormData({...formData, age_range: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-3">0-3 שנים</SelectItem>
                  <SelectItem value="3-6">3-6 שנים</SelectItem>
                  <SelectItem value="6-12">6-12 שנים</SelectItem>
                  <SelectItem value="12-18">12-18 שנים</SelectItem>
                  <SelectItem value="18+">18+ שנים</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>משך זמן (דקות)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div>
            <Label>תיאור הפעילות</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div>
            <Label>מטרות הפעילות</Label>
            <Textarea
              value={formData.goals}
              onChange={(e) => setFormData({...formData, goals: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>חומרים נדרשים</Label>
            <Textarea
              value={formData.materials}
              onChange={(e) => setFormData({...formData, materials: e.target.value})}
              rows={2}
            />
          </div>

          <div>
            <Label>אבחונים מתאימים</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={diagnosisInput}
                onChange={(e) => setDiagnosisInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDiagnosis())}
                placeholder="הקלד אבחון ולחץ Enter"
              />
              <Button type="button" onClick={handleAddDiagnosis}>הוסף</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.diagnosis.map((diag, idx) => (
                <div key={idx} className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="text-sm">{diag}</span>
                  <button type="button" onClick={() => handleRemoveDiagnosis(diag)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              ביטול
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500">
              {activity ? 'עדכן' : 'צור פעילות'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}