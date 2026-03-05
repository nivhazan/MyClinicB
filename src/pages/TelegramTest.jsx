import React from 'react';
import TelegramTest from '../components/telegram/TelegramTest';

export default function TelegramTestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">בדיקת Telegram</h1>
        <p className="text-gray-600 mt-1">בדוק את החיבור לבוט Telegram ושלח הודעות בדיקה</p>
      </div>
      
      <TelegramTest />
    </div>
  );
}