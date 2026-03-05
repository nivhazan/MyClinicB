import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function DigitalInvoiceSettings() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['digitalInvoiceSettings'],
    queryFn: async () => {
      const result = await base44.entities.DigitalInvoiceSettings.list();
      return result[0] || null;
    },
  });

  const [formData, setFormData] = useState({
    api_key: '',
    business_name: '',
    business_id: '',
    address: '',
    phone: '',
    email: '',
    auto_send_enabled: false,
    include_vat: true,
    vat_rate: 17
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return await base44.entities.DigitalInvoiceSettings.update(settings.id, data);
      } else {
        return await base44.entities.DigitalInvoiceSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalInvoiceSettings'] });
      toast.success('ההגדרות נשמרו בהצלחה');
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const isConnected = formData.api_key && formData.business_name;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Alert */}
      {isConnected ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            מחובר לחשבונית דיגיטלית - חשבוניות יישלחו אוטומטית למטופלים
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            עדיין לא מחובר לחשבונית דיגיטלית. מלא את הפרטים למטה כדי להתחבר.
          </AlertDescription>
        </Alert>
      )}

      {/* Setup Instructions */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            איך להתחבר לחשבונית דיגיטלית?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-4 sm:p-6">
          <ol className="list-decimal mr-5 space-y-2 text-sm">
            <li>
              היכנס ל-
              <a 
                href="https://digitalinvoice.co.il/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mx-1"
              >
                digitalinvoice.co.il
              </a>
              והתחבר/הירשם לחשבון
            </li>
            <li>עבור להגדרות החשבון שלך</li>
            <li>מצא את ה-API Key (מפתח API) - בדרך כלל בהגדרות מתקדמות או אינטגרציות</li>
            <li>העתק את ה-API Key והדבק אותו בשדה למטה</li>
            <li>מלא את פרטי העסק שלך</li>
            <li>לחץ "שמור הגדרות"</li>
          </ol>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              <strong>לתשומת לב:</strong> כדי שהשליחה האוטומטית תעבוד, יש צורך להפעיל Backend Functions 
              בהגדרות האפליקציה. ללא זה, תוכל לראות את החשבוניות במערכת אבל לא לשלוח אותן אוטומטית.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">פרטי חיבור</CardTitle>
          <CardDescription className="text-xs sm:text-sm">הזן את פרטי ה-API של חשבונית דיגיטלית</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="api_key">מפתח API *</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => handleChange('api_key', e.target.value)}
              placeholder="הדבק את ה-API Key כאן"
              className="text-right font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">פרטי העסק</CardTitle>
          <CardDescription className="text-xs sm:text-sm">פרטים אלו יופיעו בכל החשבוניות</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">שם העסק *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder="קליניקת תקשורת"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_id">ח.פ / ע.מ *</Label>
              <Input
                id="business_id"
                value={formData.business_id}
                onChange={(e) => handleChange('business_id', e.target.value)}
                placeholder="123456789"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="050-1234567"
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
                placeholder="clinic@example.com"
                className="text-right"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="רחוב העצמאות 1, תל אביב"
                className="text-right"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">הגדרות חשבוניות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>שליחה אוטומטית</Label>
              <p className="text-sm text-gray-500">שלח חשבוניות אוטומטית למטופלים במייל</p>
            </div>
            <Switch
              checked={formData.auto_send_enabled}
              onCheckedChange={(checked) => handleChange('auto_send_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>כולל מע"מ</Label>
              <p className="text-sm text-gray-500">הוסף מע"מ לחשבוניות</p>
            </div>
            <Switch
              checked={formData.include_vat}
              onCheckedChange={(checked) => handleChange('include_vat', checked)}
            />
          </div>

          {formData.include_vat && (
            <div className="space-y-2">
              <Label htmlFor="vat_rate">אחוז מע"מ</Label>
              <Input
                id="vat_rate"
                type="number"
                value={formData.vat_rate}
                onChange={(e) => handleChange('vat_rate', parseFloat(e.target.value))}
                className="text-right w-32"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-sm sm:text-base"
      >
        <FileText className="w-4 h-4 ml-2" />
        {saveMutation.isPending ? 'שומר...' : 'שמור הגדרות'}
      </Button>
    </div>
  );
}