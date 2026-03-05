import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import WeeklyScheduleSender from './WeeklyScheduleSender';

export default function TelegramTest() {
  const [testMessage, setTestMessage] = useState('שלום! זו הודעת בדיקה מהקליניקה 👋');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const { data: settings } = useQuery({
    queryKey: ['reminderSettings'],
    queryFn: async () => {
      const data = await base44.entities.ReminderSettings.list();
      return data[0];
    }
  });

  const sendTestMessage = async () => {
    if (!settings?.telegram_bot_token || !settings?.telegram_chat_id) {
      toast.error('חסרים פרטי התחברות לטלגרם');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('sendTelegramMessage', {
        chat_id: settings.telegram_chat_id,
        message: testMessage,
        parse_mode: 'HTML'
      });

      if (response.data?.success) {
        setResult({ success: true, message: 'ההודעה נשלחה בהצלחה!' });
        toast.success('הודעת בדיקה נשלחה בהצלחה');
      } else {
        setResult({ success: false, message: `שגיאה: ${response.data?.error || 'שגיאה לא ידועה'}` });
        toast.error('שליחה נכשלה');
      }
    } catch (error) {
      setResult({ success: false, message: `שגיאת רשת: ${error.message}` });
      toast.error('שגיאה בשליחה');
    } finally {
      setSending(false);
    }
  };

  const sendReminder = async (appointment) => {
    if (!settings?.telegram_chat_id) {
      toast.error('חסרים פרטי התחברות לטלגרם');
      return false;
    }

    try {
      const message = (settings.reminder_template || '')
        .replace('{patient_name}', appointment.patient_name)
        .replace('{time}', appointment.time)
        .replace('{date}', appointment.date)
        .replace('{type}', appointment.type || 'טיפול');

      const response = await base44.functions.invoke('sendTelegramMessage', {
        chat_id: settings.telegram_chat_id,
        message,
        parse_mode: 'HTML'
      });
      return response.data?.success === true;
    } catch (error) {
      console.error('Telegram send error:', error);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <WeeklyScheduleSender />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            בדיקת חיבור Telegram
          </CardTitle>
          <CardDescription>
            שלח הודעת בדיקה לוודא שההגדרות נכונות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings?.telegram_enabled ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Telegram לא מופעל. עבור להגדרות והפעל את Telegram.
              </p>
            </div>
          ) : !settings?.telegram_bot_token || !settings?.telegram_chat_id ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                חסרים פרטי התחברות. הזן את ה-Bot Token וה-Chat ID בהגדרות.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>הודעת בדיקה</Label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                  className="text-right"
                />
              </div>

              <Button
                onClick={sendTestMessage}
                disabled={sending}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 ml-2" />
                    שלח הודעת בדיקה
                  </>
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`text-sm ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 הוראות הגדרה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">שלב 1: יצירת בוט</p>
              <ol className="list-decimal pr-5 space-y-1 text-gray-600">
                <li>פתח את אפליקציית Telegram</li>
                <li>חפש את <code className="bg-gray-100 px-1 rounded">@BotFather</code></li>
                <li>שלח <code className="bg-gray-100 px-1 rounded">/newbot</code></li>
                <li>בחר שם ושם משתמש לבוט</li>
                <li>העתק את ה-Token שקיבלת</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-1">שלב 2: קבלת Chat ID</p>
              <ol className="list-decimal pr-5 space-y-1 text-gray-600">
                <li>שלח הודעה לבוט שיצרת</li>
                <li>חפש בטלגרם את <code className="bg-gray-100 px-1 rounded">@userinfobot</code></li>
                <li>שלח <code className="bg-gray-100 px-1 rounded">/start</code></li>
                <li>הבוט יציג את ה-ID שלך</li>
                <li>העתק את המספר</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-1">שלב 3: הזנת הפרטים</p>
              <ol className="list-decimal pr-5 space-y-1 text-gray-600">
                <li>עבור להגדרות → תזכורות אוטומטיות</li>
                <li>הפעל את Telegram</li>
                <li>הזן את ה-Bot Token וה-Chat ID</li>
                <li>שמור ובדוק כאן את החיבור</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 טיפ:</strong> לשליחה אוטומטית מתוזמנת של תזכורות, יש להפעיל Backend Functions.
          כרגע ניתן לשלוח תזכורות באופן ידני מלוח התורים.
        </p>
      </div>
    </div>
  );
}