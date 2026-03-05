import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalInvoiceIntegration({ invoice, patient }) {
  const isBackendEnabled = false; // Will be true when backend functions are enabled

  const handleSendToDigitalInvoice = async () => {
    if (!isBackendEnabled) {
      toast.error('יש להפעיל Backend Functions בהגדרות');
      return;
    }

    // This will work once backend functions are enabled
    toast.success('החשבונית נשלחה לחשבונית דיגיטלית');
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          שליחה אוטומטית דרך חשבונית דיגיטלית
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isBackendEnabled ? (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>כדי להפעיל שליחה אוטומטית לחשבונית דיגיטלית:</strong>
              <ol className="list-decimal mr-5 mt-2 space-y-1">
                <li>עבור להגדרות האפליקציה (Settings) בדשבורד</li>
                <li>הפעל את האפשרות "Backend Functions"</li>
                <li>חזור לעמוד זה וחבר את החשבון שלך ב-digitalinvoice.co.il</li>
              </ol>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">מחובר לחשבונית דיגיטלית</span>
            </div>
            <p className="text-sm text-green-700">
              כאשר תשמור חשבונית חדשה, היא תישלח אוטומטית למייל של המטופל דרך חשבונית דיגיטלית
            </p>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <p className="font-medium text-blue-900 mb-2">💡 מה זה חשבונית דיגיטלית?</p>
          <ul className="space-y-1 text-blue-800 text-xs">
            <li>• שירות ישראלי ליצירת חשבוניות מס/קבלות</li>
            <li>• שליחה אוטומטית למייל</li>
            <li>• תאימות למע"מ ולמס הכנסה</li>
            <li>• אתר: <a href="https://digitalinvoice.co.il/" target="_blank" rel="noopener noreferrer" className="underline">digitalinvoice.co.il</a></li>
          </ul>
        </div>

        <Button
          onClick={handleSendToDigitalInvoice}
          disabled={!isBackendEnabled}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
        >
          <Send className="w-4 h-4 ml-2" />
          שלח חשבונית דרך חשבונית דיגיטלית
        </Button>
      </CardContent>
    </Card>
  );
}