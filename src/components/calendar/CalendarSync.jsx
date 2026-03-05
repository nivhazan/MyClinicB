import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CalendarSync() {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          סנכרון עם לוחות שנה חיצוניים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertTitle className="text-green-800">מחובר לגוגל קלנדר</AlertTitle>
          <AlertDescription className="text-green-700">
            תורים חדשים מסתנכרנים אוטומטית לגוגל קלנדר שלך
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Google Calendar</h3>
            <Button disabled variant="outline" size="sm" className="bg-white">
              מחובר ✓
            </Button>
          </div>

          <div className="border rounded-lg p-4 text-center opacity-50">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold mb-2">Outlook</h3>
            <Button disabled variant="outline" size="sm">
              בקרוב
            </Button>
          </div>

          <div className="border rounded-lg p-4 text-center opacity-50">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="font-semibold mb-2">Apple Calendar</h3>
            <Button disabled variant="outline" size="sm">
              בקרוב
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
          <p className="font-medium mb-2">💡 יתרונות הסנכרון:</p>
          <ul className="space-y-1 text-xs">
            <li>• תורים חדשים יתווספו אוטומטית ללוח השנה שלך</li>
            <li>• עדכונים ומחיקות יסתנכרנו בזמן אמת</li>
            <li>• תזכורות אוטומטיות דרך לוח השנה שלך</li>
            <li>• גישה לתורים מכל מכשיר</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}