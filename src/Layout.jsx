import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Calendar, Users, FileText, LayoutDashboard, LogOut, CheckSquare, Receipt, Settings, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Toaster } from 'sonner';
import GlobalSearch from './components/shared/GlobalSearch';
import RealtimeNotifications from './components/shared/RealtimeNotifications';

export default function Layout({ children, currentPageName }) {
  const [searchOpen, setSearchOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', label: 'לוח בקרה' },
    { name: 'Calendar', icon: Calendar, path: 'Calendar', label: 'לוח תורים' },
    { name: 'Payments', icon: FileText, path: 'Payments', label: 'תשלומים' },
    { name: 'Sessions', icon: FileText, path: 'Sessions', label: 'תיעוד טיפולים' },
    { name: 'Documents', icon: FileText, path: 'Documents', label: 'מסמכים' },
    { name: 'Activities', icon: FileText, path: 'Activities', label: 'בנק פעילויות' },
    { name: 'Expenses', icon: Receipt, path: 'Expenses', label: 'הוצאות' },
    { name: 'Patients', icon: Users, path: 'Patients', label: 'מטופלים' },
    { name: 'Tasks', icon: CheckSquare, path: 'Tasks', label: 'משימות' },
  ];

  const settingsItems = [
    { name: 'TelegramTest', path: 'TelegramTest', label: 'בדיקת Telegram' },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      <style>{`
        :root {
          --primary: 220 85% 62%;
          --primary-dark: 220 85% 52%;
          --secondary: 280 70% 68%;
          --accent: 165 75% 65%;
          --success: 142 76% 56%;
          --warning: 38 92% 50%;
        }
      `}</style>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-white text-lg sm:text-xl font-bold">ק</span>
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-800">ניהול קליניקה</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">קלינאות תקשורת</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">חיפוש</span>
              </button>
              {settingsItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
              <Link
                to={createPageUrl('Settings')}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">הגדרות</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">יציאה</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200 mt-6 sm:mt-12">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} מערכת ניהול קליניקה - כל הזכויות שמורות
          </p>
        </div>
      </footer>
      
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <RealtimeNotifications />
      <Toaster position="top-center" richColors />
    </div>
  );
}