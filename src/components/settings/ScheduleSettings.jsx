import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ClosureSettings from './ClosureSettings';

export default function ScheduleSettings() {
  const queryClient = useQueryClient();
  
  const { data: settings } = useQuery({
    queryKey: ['reminderSettings'],
    queryFn: async () => {
      const data = await base44.entities.ReminderSettings.list();
      return data[0];
    }
  });

  const [formData, setFormData] = useState({
    weekly_schedule_enabled: false,
    weekly_schedule_day: 'שבת',
    weekly_schedule_time: '20:00',
    daily_update_enabled: false,
    daily_update_time: '18:00'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        weekly_schedule_enabled: settings.weekly_schedule_enabled || false,
        weekly_schedule_day: settings.weekly_schedule_day || 'שבת',
        weekly_schedule_time: settings.weekly_schedule_time || '20:00',
        daily_update_enabled: settings.daily_update_enabled || false,
        daily_update_time: settings.daily_update_time || '18:00'
      });
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
      toast.success('הגדרות נשמרו בהצלחה');
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <Tabs defaultValue="schedule" className="space-y-4 sm:space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="schedule">לוז שבועי ועדכון יומי</TabsTrigger>
        <TabsTrigger value="closures">חופשות וחגים</TabsTrigger>
      </TabsList>

      <TabsContent value="schedule" className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              לוז שבועי אוטומטי
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              שליחה אוטומטית של לוז התורים של השבוע הבא
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">הפעל שליחה שבועית</Label>
                <p className="text-sm text-gray-500">שלח לוז כל שבוע ביום ובשעה קבועים</p>
              </div>
              <Switch
                checked={formData.weekly_schedule_enabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, weekly_schedule_enabled: checked })
                }
              />
            </div>

            {formData.weekly_schedule_enabled && (
              <>
                <div className="space-y-2">
                  <Label>יום שליחה</Label>
                  <Select
                    value={formData.weekly_schedule_day}
                    onValueChange={(value) => 
                      setFormData({ ...formData, weekly_schedule_day: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>שעת שליחה</Label>
                  <Input
                    type="time"
                    value={formData.weekly_schedule_time}
                    onChange={(e) => 
                      setFormData({ ...formData, weekly_schedule_time: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              עדכון יומי
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              שליחה אוטומטית של לוז מעודכן למחרת
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">הפעל עדכון יומי</Label>
                <p className="text-sm text-gray-500">שלח כל יום לוז מעודכן ליום הבא</p>
              </div>
              <Switch
                checked={formData.daily_update_enabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, daily_update_enabled: checked })
                }
              />
            </div>

            {formData.daily_update_enabled && (
              <div className="space-y-2">
                <Label>שעת שליחה</Label>
                <Input
                  type="time"
                  value={formData.daily_update_time}
                  onChange={(e) => 
                    setFormData({ ...formData, daily_update_time: e.target.value })
                  }
                />
                <p className="text-xs text-gray-500">
                  ההודעה תשלח כל יום בשעה הזו עם לוז מעודכן למחרת
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-800">
            ⚠️ <strong>שים לב:</strong> שליחה אוטומטית מתוזמנת דורשת הפעלת Backend Functions.
            כרגע ניתן לשלוח לוז באופן ידני מדף "בדיקת Telegram".
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-sm sm:text-base"
        >
          <Save className="w-4 h-4 ml-2" />
          שמור הגדרות
        </Button>
      </TabsContent>

      <TabsContent value="closures">
        <ClosureSettings />
      </TabsContent>
    </Tabs>
  );
}