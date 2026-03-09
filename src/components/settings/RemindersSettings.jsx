import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Save, MessageSquare, Send, MessageCircle, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function RemindersSettings() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['reminderSettings'],
    queryFn: async () => {
      const data = await base44.entities.ReminderSettings.list();
      return data[0] || {
        reminder_template: "שלום {patient_name},\n\nמזכירים לך על התור שלך מחר ב-{time}.\n\nנשמח לראותך!\nהקליניקה",
        auto_send_enabled: false,
        hours_before: 24,
        daily_update_enabled: false,
        admin_daily_summary: true,
        admin_weekly_summary: true,
        admin_phone: '',
        telegram_enabled: false,
        telegram_bot_token: '',
        telegram_chat_id: '',
        sms_enabled: false,
        sms_provider: 'twilio',
        sms_api_key: ''
      };
    }
  });

  const [formData, setFormData] = useState(settings || {});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return await base44.entities.ReminderSettings.update(settings.id, data);
      } else {
        return await base44.entities.ReminderSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminderSettings'] });
      toast.success('ההגדרות נשמרו בהצלחה');
    }
  });

  const [testingReminder, setTestingReminder] = useState(false);
  const [testingDaily, setTestingDaily] = useState(false);

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleTestReminders = async () => {
    setTestingReminder(true);
    try {
      const res = await base44.functions.invoke('sendReminder', {});
      if (res.data?.success) {
        toast.success(`תזכורות נשלחו: ${res.data.sent} מטופלים`);
      } else {
        toast.error(res.data?.message || 'לא נשלחו תזכורות');
      }
    } catch (e) {
      toast.error('שגיאה בשליחת תזכורות');
    }
    setTestingReminder(false);
  };

  const handleTestDailyUpdate = async () => {
    setTestingDaily(true);
    try {
      const res = await base44.functions.invoke('sendDailyUpdate', {});
      if (res.data?.success) {
        toast.success('עדכון יומי נשלח לטלגרם');
      } else {
        toast.error(res.data?.message || 'לא נשלח עדכון');
      }
    } catch (e) {
      toast.error('שגיאה בשליחת עדכון יומי');
    }
    setTestingDaily(false);
  };

  if (!formData) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            תבנית תזכורת למטופלים
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            ניתן להשתמש במשתנים: {'{patient_name}'}, {'{time}'}, {'{date}'}, {'{type}'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-2">
            <Label>תוכן ההודעה</Label>
            <Textarea
              value={formData.reminder_template}
              onChange={(e) => setFormData({ ...formData, reminder_template: e.target.value })}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium">שליחה אוטומטית</p>
              <p className="text-sm text-gray-600">שליחת תזכורות אוטומטית למטופלים כל יום בשעה 16:00</p>
            </div>
            <Switch
              checked={formData.auto_send_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_send_enabled: checked })}
            />
          </div>

          {formData.auto_send_enabled && (
            <Button
              variant="outline"
              onClick={handleTestReminders}
              disabled={testingReminder}
              className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Play className="w-4 h-4 ml-2" />
              {testingReminder ? 'שולח...' : 'שלח תזכורות עכשיו (בדיקה)'}
            </Button>
          )}

          <div className="space-y-2">
            <Label>כמה שעות לפני התור</Label>
            <Input
              type="number"
              value={formData.hours_before}
              onChange={(e) => setFormData({ ...formData, hours_before: parseInt(e.target.value) })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            תזכורות לאדמין
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            קבלת סיכומים על התורים שלך
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-2">
            <Label>מספר טלפון (WhatsApp/Telegram)</Label>
            <Input
              value={formData.admin_phone}
              onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
              placeholder="05xxxxxxxx"
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="font-medium">עדכון יומי לאדמין</p>
              <p className="text-sm text-gray-600">קבל כל ערב בשעה 16:00 את רשימת המטופלים למחרת</p>
            </div>
            <Switch
              checked={formData.daily_update_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, daily_update_enabled: checked })}
            />
          </div>

          {formData.daily_update_enabled && (
            <Button
              variant="outline"
              onClick={handleTestDailyUpdate}
              disabled={testingDaily}
              className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Play className="w-4 h-4 ml-2" />
              {testingDaily ? 'שולח...' : 'שלח עדכון יומי עכשיו (בדיקה)'}
            </Button>
          )}

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium">סיכום שבועי</p>
              <p className="text-sm text-gray-600">קבל בתחילת כל שבוע את לוז התורים</p>
            </div>
            <Switch
              checked={formData.admin_weekly_summary}
              onCheckedChange={(checked) => setFormData({ ...formData, admin_weekly_summary: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            ערוצי תקשורת
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            הגדר דרך אילו ערוצים תישלחנה התזכורות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Telegram Settings */}
          <div className="space-y-4 border-b pb-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Telegram</p>
                  <p className="text-sm text-gray-600">שליחת הודעות דרך בוט טלגרם</p>
                </div>
              </div>
              <Switch
                checked={formData.telegram_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, telegram_enabled: checked })}
              />
            </div>

            {formData.telegram_enabled && (
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label>Telegram Bot Token</Label>
                  <Input
                    value={formData.telegram_bot_token}
                    onChange={(e) => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500">
                    צור בוט ב-@BotFather בטלגרם וקבל את הטוקן
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Telegram Chat ID</Label>
                  <Input
                    value={formData.telegram_chat_id}
                    onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                    placeholder="123456789"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500">
                    שלח הודעה לבוט וקבל את ה-Chat ID דרך @userinfobot
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SMS Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-sm text-gray-600">שליחת הודעות טקסט SMS</p>
                </div>
              </div>
              <Switch
                checked={formData.sms_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, sms_enabled: checked })}
              />
            </div>

            {formData.sms_enabled && (
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label>ספק SMS</Label>
                  <Select 
                    value={formData.sms_provider} 
                    onValueChange={(value) => setFormData({ ...formData, sms_provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="nexmo">Nexmo (Vonage)</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    value={formData.sms_api_key}
                    onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
                    placeholder="הזן את מפתח ה-API"
                    type="password"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500">
                    מפתח API מחשבון הספק שלך
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>שימו לב:</strong> שליחה אוטומטית של תזכורות דרך Telegram ו-SMS דורשת הפעלת Backend Functions במערכת.
          כרגע ניתן לשלוח תזכורות באופן ידני מלוח התורים.
        </p>
      </div>

      <Button 
        onClick={handleSave} 
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-sm sm:text-base"
        disabled={saveMutation.isPending}
      >
        <Save className="w-4 h-4 ml-2" />
        {saveMutation.isPending ? 'שומר...' : 'שמור הגדרות'}
      </Button>
    </div>
  );
}