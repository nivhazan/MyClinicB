import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function DocumentTemplates({ patients }) {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('diagnosis');
  const [customText, setCustomText] = useState('');

  const patient = patients.find(p => p.id === selectedPatient);

  const templates = {
    diagnosis: {
      title: 'מכתב אבחון',
      generate: (patient) => `
לכבוד,
${patient?.full_name || '[שם המטופל]'}

מכתב אבחון - קלינאות תקשורת

תאריך: ${format(new Date(), 'd בMMMM yyyy', { locale: he })}

שלום רב,

${patient?.full_name || '[שם המטופל]'}, ת.ז. ${patient?.id_number || '[ת.ז.]'}, נבדק/ה על ידי במסגרת הערכה קלינית לצורך אבחון ${patient?.diagnosis || '[תחום האבחון]'}.

ממצאי ההערכה:
${patient?.medical_background || '[פירוט ממצאי ההערכה]'}

המלצות:
בהתאם לממצאי ההערכה, מומלץ על טיפול קלינאי תקשורתי בתדירות של ${patient?.regular_time ? `פעם בשבוע ביום ${patient.regular_day}` : '[פעמיים בשבוע / פעם בשבוע]'}.

בברכה,
[שם הקלינאי/ת]
קלינאי/ת תקשורת מוסמך/ת
רישיון מס׳: [מספר רישיון]
      `.trim()
    },
    progress: {
      title: 'דוח התקדמות',
      generate: (patient) => `
דוח התקדמות - ${patient?.full_name || '[שם המטופל]'}

תאריך: ${format(new Date(), 'd בMMMM yyyy', { locale: he })}

פרטי המטופל:
שם: ${patient?.full_name || '[שם]'}
ת.ז.: ${patient?.id_number || '[ת.ז.]'}
אבחון: ${patient?.diagnosis || '[אבחון]'}

תקופת הטיפול:
${patient?.regular_day ? `הטיפול מתקיים באופן קבוע בימי ${patient.regular_day} בשעה ${patient.regular_time}` : 'תדירות הטיפול משתנה'}

התקדמות המטופל/ת:
במהלך תקופת הטיפול נצפתה התקדמות משמעותית בתחומים הבאים:
[פירוט תחומי ההתקדמות]

יעדים נוכחיים:
[פירוט יעדי הטיפול הנוכחיים]

המלצות להמשך:
[המלצות לטיפול ולתרגול בבית]

בברכה,
[שם הקלינאי/ת]
קלינאי/ת תקשורת מוסמך/ת
      `.trim()
    },
    recommendation: {
      title: 'מכתב המלצה',
      generate: (patient) => `
מכתב המלצה

תאריך: ${format(new Date(), 'd בMMMM yyyy', { locale: he })}

לכבוד,
${patient?.referral_source || '[גורם מפנה]'}

הנדון: ${patient?.full_name || '[שם המטופל]'}

שלום רב,

אני ממליץ/ה בחום על ${patient?.full_name || '[שם]'} שעבר/ה טיפול קלינאי תקשורתי תחת השגחתי.

${patient?.full_name || '[שם]'} הפגין/ה מוטיבציה גבוהה, שיתוף פעולה מצוין, והתקדמות משמעותית במהלך תקופת הטיפול.

תחומי ההתקדמות כוללים:
• [תחום 1]
• [תחום 2]
• [תחום 3]

אני ממליץ/ה בביטחון על ${patient?.full_name || '[שם]'} עבור [מטרת ההמלצה].

במידה ותזדקקו למידע נוסף, אשמח לעמוד לרשותכם.

בברכה,
[שם הקלינאי/ת]
קלינאי/ת תקשורת מוסמך/ת
טלפון: [טלפון]
דוא"ל: [דוא"ל]
      `.trim()
    }
  };

  const generatedDocument = selectedPatient 
    ? templates[selectedTemplate].generate(patient)
    : templates[selectedTemplate].generate({});

  const finalDocument = customText || generatedDocument;

  const handleCopy = () => {
    navigator.clipboard.writeText(finalDocument);
    toast.success('המסמך הועתק ללוח');
  };

  const handleDownload = () => {
    const blob = new Blob([finalDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templates[selectedTemplate].title}_${patient?.full_name || 'מסמך'}_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('המסמך הורד בהצלחה');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            יצירת מסמכים מתבניות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר תבנית
              </label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diagnosis">מכתב אבחון</SelectItem>
                  <SelectItem value="progress">דוח התקדמות</SelectItem>
                  <SelectItem value="recommendation">מכתב המלצה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר מטופל (אופציונלי)
              </label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מטופל..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא מטופל</SelectItem>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ערוך את המסמך (אופציונלי)
            </label>
            <Textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={generatedDocument}
              className="min-h-[400px] font-mono text-sm"
              dir="rtl"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCopy} variant="outline">
              <Copy className="w-4 h-4 ml-2" />
              העתק ללוח
            </Button>
            <Button 
              onClick={handleDownload}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              <Download className="w-4 h-4 ml-2" />
              הורד כקובץ
            </Button>
            <Button 
              onClick={() => setCustomText('')}
              variant="ghost"
            >
              איפוס
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* תצוגה מקדימה */}
      <Card>
        <CardHeader>
          <CardTitle>תצוגה מקדימה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-6 whitespace-pre-wrap font-serif">
            {finalDocument}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}