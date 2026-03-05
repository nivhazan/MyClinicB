import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Bell, Calendar, CalendarRange, CalendarClock, FileText, Activity } from 'lucide-react';
import RemindersSettings from '../components/settings/RemindersSettings';
import AdminSummaryGenerator from '../components/reminders/AdminSummaryGenerator';
import CalendarSync from '../components/calendar/CalendarSync';
import ScheduleSettings from '../components/settings/ScheduleSettings';
import DigitalInvoiceSettings from '../components/settings/DigitalInvoiceSettings';
import SyncLogs from '../components/settings/SyncLogs';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">הגדרות</h1>
          <p className="text-xs sm:text-sm text-gray-500">ניהול הגדרות המערכת והתזכורות</p>
        </div>
      </div>

      <Tabs defaultValue="reminders" dir="rtl">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="reminders" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-center sm:text-right">תזכורות</span>
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-center sm:text-right">סיכומים</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <CalendarClock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-center sm:text-right">לוז</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <CalendarRange className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-center sm:text-right">סנכרון</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-center sm:text-right">חשבונית</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 text-xs sm:text-sm">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-center sm:text-right">תיעוד</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="mt-3 sm:mt-6">
          <RemindersSettings />
        </TabsContent>

        <TabsContent value="summary" className="mt-3 sm:mt-6">
          <AdminSummaryGenerator />
        </TabsContent>

        <TabsContent value="schedule" className="mt-3 sm:mt-6">
          <ScheduleSettings />
        </TabsContent>

        <TabsContent value="calendar" className="mt-3 sm:mt-6">
          <CalendarSync />
        </TabsContent>

        <TabsContent value="invoice" className="mt-3 sm:mt-6">
          <DigitalInvoiceSettings />
        </TabsContent>

        <TabsContent value="logs" className="mt-3 sm:mt-6">
          <SyncLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}