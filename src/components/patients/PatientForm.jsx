import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';

export default function PatientForm({ patient, onSubmit, onCancel, overlayZClass = 'z-50' }) {
  const [formData, setFormData] = useState(() => {
    if (patient) {
      // Existing patient - migrate old status if needed
      const migrated = { ...patient };
      if (!migrated.activity_status) {
        if (migrated.status === 'פעיל') {
          migrated.activity_status = 'active';
          migrated.inactive_reason = null;
          migrated.inactive_note = '';
        } else if (migrated.status === 'לא פעיל') {
          migrated.activity_status = 'inactive';
          migrated.inactive_reason = 'paused';
          migrated.inactive_note = '';
        } else if (migrated.status === 'הושלם טיפול') {
          migrated.activity_status = 'inactive';
          migrated.inactive_reason = 'completed';
          migrated.inactive_note = '';
        }
      }
      return migrated;
    }
    
    // New patient defaults
    return {
      full_name: '',
      id_number: '',
      date_of_birth: '',
      phone: '',
      parent_phone: '',
      email: '',
      address: '',
      diagnosis: '',
      medical_background: '',
      referral_source: '',
      emergency_contact: '',
      emergency_phone: '',
      activity_status: 'active',
      inactive_reason: null,
      inactive_note: '',
      status: 'פעיל',
      regular_day: '',
      regular_time: '',
      months_ahead: 4,
      billing_model: 'per_session',
      session_price: 0,
      notes: ''
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation: if inactive, must have a reason
    if (formData.activity_status === 'inactive' && !formData.inactive_reason) {
      alert('יש לבחור סיבת אי-פעילות');
      return;
    }
    
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Business logic: if activity_status becomes active, clear inactive fields
      if (field === 'activity_status' && value === 'active') {
        updated.inactive_reason = null;
        updated.inactive_note = '';
      }
      
      return updated;
    });
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${overlayZClass} overflow-y-auto`}>
      <div className="min-h-screen py-4 px-2 md:p-8">
        <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg md:text-2xl">
                {patient ? 'עריכת מטופל' : 'הוספת מטופל חדש'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
        
          <form onSubmit={handleSubmit}>
            <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">פרטים אישיים</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">שם מלא *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    required
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="id_number">תעודת זהות</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => handleChange('id_number', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">תאריך לידה</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="activity_status">סטטוס פעילות *</Label>
                  <Select value={formData.activity_status} onValueChange={(value) => handleChange('activity_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="inactive">לא פעיל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.activity_status === 'inactive' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="inactive_reason">סיבת אי-פעילות *</Label>
                      <Select value={formData.inactive_reason || ''} onValueChange={(value) => handleChange('inactive_reason', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סיבה" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">סיים טיפול</SelectItem>
                          <SelectItem value="paused">מוקפא/בהפסקה</SelectItem>
                          <SelectItem value="dropped">הפסיק באמצע</SelectItem>
                          <SelectItem value="financial">הופסק בגלל תשלום</SelectItem>
                          <SelectItem value="other">אחר</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="inactive_note">הערה (אופציונלי)</Label>
                      <Input
                        id="inactive_note"
                        value={formData.inactive_note || ''}
                        onChange={(e) => handleChange('inactive_note', e.target.value)}
                        className="text-right"
                        placeholder="פרטים נוספים על הסיבה..."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">פרטי התקשרות</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">טלפון הורה</Label>
                  <Input
                    id="parent_phone"
                    type="tel"
                    value={formData.parent_phone}
                    onChange={(e) => handleChange('parent_phone', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">כתובת</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">מידע רפואי</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">אבחון ראשוני</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) => handleChange('diagnosis', e.target.value)}
                    className="text-right h-20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medical_background">רקע רפואי</Label>
                  <Textarea
                    id="medical_background"
                    value={formData.medical_background}
                    onChange={(e) => handleChange('medical_background', e.target.value)}
                    className="text-right h-20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referral_source">מקור הפניה</Label>
                  <Input
                    id="referral_source"
                    value={formData.referral_source}
                    onChange={(e) => handleChange('referral_source', e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

              {/* Regular Appointment */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">שיבוץ קבוע שבועי</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regular_day">יום קבוע</Label>
                    <Select value={formData.regular_day} onValueChange={(value) => handleChange('regular_day', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר יום" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ראשון">ראשון</SelectItem>
                        <SelectItem value="שני">שני</SelectItem>
                        <SelectItem value="שלישי">שלישי</SelectItem>
                        <SelectItem value="רביעי">רביעי</SelectItem>
                        <SelectItem value="חמישי">חמישי</SelectItem>
                        <SelectItem value="שישי">שישי</SelectItem>
                        <SelectItem value="שבת">שבת</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regular_time">שעה קבועה</Label>
                    <Input
                      id="regular_time"
                      type="time"
                      value={formData.regular_time}
                      onChange={(e) => handleChange('regular_time', e.target.value)}
                      className="text-right"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="months_ahead">חודשים קדימה</Label>
                    <Input
                      id="months_ahead"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.months_ahead || 4}
                      onChange={(e) => handleChange('months_ahead', parseInt(e.target.value) || 4)}
                      className="text-right"
                    />
                  </div>
                </div>
                {formData.regular_day && formData.regular_time && (
                  <p className="text-sm text-blue-600 mt-2">
                    💡 תורים יתווספו אוטומטית ל-{formData.months_ahead || 4} חודשים קדימה
                  </p>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">איש קשר לחירום</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">שם איש קשר</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={(e) => handleChange('emergency_contact', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">טלפון חירום</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={formData.emergency_phone}
                    onChange={(e) => handleChange('emergency_phone', e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
            </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">פרטי תשלום</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billing_model">מודל חיוב</Label>
                    <Select value={formData.billing_model || 'per_session'} onValueChange={(value) => handleChange('billing_model', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_session">לפי טיפול</SelectItem>
                        <SelectItem value="monthly_aggregate">חיוב חודשי מצטבר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="session_price">מחיר טיפול (₪)</Label>
                    <Input
                      id="session_price"
                      type="number"
                      value={formData.session_price || ''}
                      onChange={(e) => handleChange('session_price', parseFloat(e.target.value) || 0)}
                      className="text-right"
                      placeholder="0"
                    />
                  </div>
                </div>
                {formData.billing_model === 'monthly_aggregate' && (
                  <p className="text-sm text-blue-600 mt-2">
                    💡 חיוב חודשי יחושב לפי מספר הטיפולים בפועל × מחיר טיפול
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">הערות כלליות</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="text-right h-24"
                />
              </div>
            </CardContent>
            
            <CardFooter className="border-t bg-gray-50 flex justify-end gap-3 p-4 md:p-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                ביטול
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Save className="w-4 h-4 ml-2" />
                {patient ? 'עדכן' : 'שמור'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}