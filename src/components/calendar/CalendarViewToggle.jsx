import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, LayoutGrid, List } from 'lucide-react';

export default function CalendarViewToggle({ view, onViewChange }) {
  const views = [
    { id: 'day', label: 'יומי', icon: List },
    { id: 'week', label: 'שבועי', icon: LayoutGrid },
    { id: 'month', label: 'חודשי', icon: Calendar }
  ];

  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
      {views.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={view === id ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange(id)}
          className={view === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-700 hover:text-gray-900'}
        >
          <Icon className="w-4 h-4 ml-1" />
          {label}
        </Button>
      ))}
    </div>
  );
}