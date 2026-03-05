import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Star, BookOpen } from 'lucide-react';
import ActivityCard from '../components/activities/ActivityCard';
import ActivityForm from '../components/activities/ActivityForm';

export default function Activities() {
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);

  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowForm(false);
      setEditingActivity(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowForm(false);
      setEditingActivity(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleFavorite = (activity) => {
    updateMutation.mutate({
      id: activity.id,
      data: { is_favorite: !activity.is_favorite }
    });
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = ageFilter === 'all' || activity.age_range === ageFilter;
    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    const matchesFavorites = !showFavorites || activity.is_favorite;
    
    return matchesSearch && matchesAge && matchesCategory && matchesFavorites;
  });

  const favoriteCount = activities.filter(a => a.is_favorite).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            בנק פעילויות טיפוליות
          </h1>
          <p className="text-gray-600 mt-1">
            ספריית פעילויות מותאמות לטיפול קלינאי
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowFavorites(!showFavorites)}
            variant={showFavorites ? 'default' : 'outline'}
            className={showFavorites ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            <Star className={`w-4 h-4 ml-2 ${showFavorites ? 'fill-current' : ''}`} />
            מועדפים ({favoriteCount})
          </Button>
          <Button
            onClick={() => {
              setEditingActivity(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            <Plus className="w-5 h-5 ml-2" />
            פעילות חדשה
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חפש פעילות..."
                className="pr-10"
              />
            </div>

            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="כל הגילאים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הגילאים</SelectItem>
                <SelectItem value="0-3">0-3 שנים</SelectItem>
                <SelectItem value="3-6">3-6 שנים</SelectItem>
                <SelectItem value="6-12">6-12 שנים</SelectItem>
                <SelectItem value="12-18">12-18 שנים</SelectItem>
                <SelectItem value="18+">18+ שנים</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="כל הקטגוריות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                <SelectItem value="שפה">שפה</SelectItem>
                <SelectItem value="דיבור">דיבור</SelectItem>
                <SelectItem value="הבנה">הבנה</SelectItem>
                <SelectItem value="תקשורת חברתית">תקשורת חברתית</SelectItem>
                <SelectItem value="אוצר מילים">אוצר מילים</SelectItem>
                <SelectItem value="קריאה">קריאה</SelectItem>
                <SelectItem value="כתיבה">כתיבה</SelectItem>
                <SelectItem value="אחר">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingActivity(null);
          }}
        />
      )}

      {/* Activities Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">טוען פעילויות...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">לא נמצאו פעילויות</p>
            {(searchTerm || ageFilter !== 'all' || categoryFilter !== 'all' || showFavorites) && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm('');
                  setAgeFilter('all');
                  setCategoryFilter('all');
                  setShowFavorites(false);
                }}
                className="mt-2"
              >
                נקה סינונים
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={(act) => {
                setEditingActivity(act);
                setShowForm(true);
              }}
              onDelete={(id) => {
                if (confirm('האם למחוק את הפעילות?')) {
                  deleteMutation.mutate(id);
                }
              }}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}