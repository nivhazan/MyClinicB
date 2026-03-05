import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Edit2, Trash2, Target } from 'lucide-react';

export default function ActivityCard({ activity, onEdit, onDelete, onToggleFavorite }) {
  const categoryColors = {
    'שפה': 'bg-blue-100 text-blue-800',
    'דיבור': 'bg-purple-100 text-purple-800',
    'הבנה': 'bg-green-100 text-green-800',
    'תקשורת חברתית': 'bg-pink-100 text-pink-800',
    'אוצר מילים': 'bg-orange-100 text-orange-800',
    'קריאה': 'bg-teal-100 text-teal-800',
    'כתיבה': 'bg-indigo-100 text-indigo-800',
    'אחר': 'bg-gray-100 text-gray-800'
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {activity.title}
              {activity.is_favorite && (
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              )}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={categoryColors[activity.category] || 'bg-gray-100'}>
                {activity.category}
              </Badge>
              {activity.age_range && (
                <Badge variant="outline">גיל: {activity.age_range}</Badge>
              )}
              {activity.duration && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.duration} דק'
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onToggleFavorite(activity)}
              className={activity.is_favorite ? 'text-yellow-500' : 'text-gray-400'}
            >
              <Star className={`w-4 h-4 ${activity.is_favorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(activity)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(activity.id)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.description && (
          <p className="text-sm text-gray-700">{activity.description}</p>
        )}
        
        {activity.goals && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-900">מטרות:</p>
                <p className="text-xs text-blue-800">{activity.goals}</p>
              </div>
            </div>
          </div>
        )}

        {activity.materials && (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">חומרים:</p>
            <p className="text-xs text-gray-600">{activity.materials}</p>
          </div>
        )}

        {activity.diagnosis && activity.diagnosis.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activity.diagnosis.map((diag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {diag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}