import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Copy, CheckCircle, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AISessionSummary({ formData, onApplySummary }) {
  const [loading, setLoading] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    setShowSummary(true);
    
    try {
      const prompt = `
אתה קלינאי/ת תקשורת מקצועי/ת. עליך לכתוב סיכום טיפולי מקצועי בעברית על בסיס המידע הבא:

מידע על הפגישה:
- מטרות: ${formData.goals || 'לא צוין'}
- פעילויות שבוצעו: ${formData.activities || 'לא צוין'}
- רמת התקדמות: ${formData.progress || 'לא צוין'}
- שיתוף פעולה: ${formData.patient_cooperation || 'לא צוין'}
- משימות לבית: ${formData.homework || 'לא צוין'}
- תכנית לפגישה הבאה: ${formData.next_session_plan || 'לא צוין'}

כתוב סיכום קליני מקצועי, תמציתי אך מפורט, שכולל:
1. מטרות הפגישה ומה בוצע
2. התקדמות ושיתוף פעולה של המטופל/ת
3. תובנות מהפגישה
4. המלצות למשך ותכנון קדימה

הסיכום צריך להיות בסגנון רשמי-מקצועי, בעברית תקנית.
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedSummary(result);
      toast.success('הסיכום נוצר בהצלחה');
    } catch (error) {
      toast.error('שגיאה ביצירת הסיכום');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setShowSummary(true);
    
    try {
      const prompt = `
אתה קלינאי/ת תקשורת מקצועי/ת. צור דוח טיפולי מפורט על בסיס התבנית הבאה:

**דוח טיפולי**

**פרטי המטופל/ת:**
שם: ${formData.patient_name}
תאריך הפגישה: ${formData.session_date}
מספר פגישה: ${formData.session_number || 'לא צוין'}

**מטרות הפגישה:**
${formData.goals || 'לא צוינו מטרות'}

**פעילויות שבוצעו:**
${formData.activities || 'לא תועדו פעילויות'}

**הערכת התקדמות:**
רמת התקדמות: ${formData.progress || 'לא צוין'}
שיתוף פעולה: ${formData.patient_cooperation || 'לא צוין'}

**סיכום הפגישה:**
${formData.summary || 'לא נכתב סיכום'}

**משימות לבית:**
${formData.homework || 'לא ניתנו משימות'}

**תכנית לפגישה הבאה:**
${formData.next_session_plan || 'לא תוכננה פגישה הבאה'}

**המלצות:**
${formData.recommendations || 'אין המלצות נוספות'}

---

בבקשה, השלם את הדוח בצורה מקצועית, תמציתית אך מפורטת. 
הוסף ניתוח מקצועי, תובנות והמלצות נוספות במידת הצורך.
כתוב בעברית תקנית ובסגנון רשמי.
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedSummary(result);
      toast.success('הדוח נוצר בהצלחה');
    } catch (error) {
      toast.error('שגיאה ביצירת הדוח');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSummary);
    toast.success('הסיכום הועתק ללוח');
  };

  const applySummary = () => {
    onApplySummary(generatedSummary);
    toast.success('הסיכום הוזן לטופס');
    setShowSummary(false);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          סיכום אוטומטי באמצעות AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={generateSummary}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מייצר סיכום...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                צור סיכום קליני
              </>
            )}
          </Button>

          <Button
            onClick={generateReport}
            disabled={loading}
            variant="outline"
            className="flex-1 border-purple-300 hover:bg-purple-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מייצר דוח...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 ml-2" />
                צור דוח מלא
              </>
            )}
          </Button>
        </div>

        {showSummary && (
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <Textarea
                value={generatedSummary}
                onChange={(e) => setGeneratedSummary(e.target.value)}
                className="min-h-[200px] text-right"
                placeholder="הסיכום יופיע כאן..."
              />
            </div>

            {generatedSummary && !loading && (
              <div className="flex gap-2">
                <Button
                  onClick={applySummary}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  השתמש בסיכום
                </Button>
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                >
                  <Copy className="w-4 h-4 ml-2" />
                  העתק
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-purple-700">
          💡 ה-AI יצור סיכום מקצועי על בסיס הנתונים שמילאת בטופס
        </p>
      </CardContent>
    </Card>
  );
}