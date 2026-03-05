import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TaskForm from '../components/tasks/TaskForm';
import { format, parseISO, isPast } from 'date-fns';
import { he } from 'date-fns/locale';

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
    },
  });

  const handleSubmit = (data) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'הושלם' ? 'לביצוע' : 'הושלם';
    updateMutation.mutate({ id: task.id, data: { status: newStatus } });
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return task.status === 'הושלם';
    if (filter === 'pending') return task.status !== 'הושלם';
    return true;
  });

  const priorityColors = {
    'גבוהה': 'bg-red-100 text-red-800 border-red-200',
    'בינונית': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'נמוכה': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const statusIcons = {
    'לביצוע': Circle,
    'בתהליך': Clock,
    'הושלם': CheckCircle2
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">משימות</h1>
          <p className="text-gray-600 mt-1">ניהול משימות ותזכורות</p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md"
        >
          <Plus className="w-5 h-5 ml-2" />
          משימה חדשה
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-md border-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : ''}
            >
              הכל ({tasks.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : ''}
            >
              לביצוע ({tasks.filter(t => t.status !== 'הושלם').length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
              className={filter === 'completed' ? 'bg-gradient-to-r from-blue-500 to-purple-500' : ''}
            >
              הושלמו ({tasks.filter(t => t.status === 'הושלם').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Form */}
      {showForm && (
        <TaskForm
          task={editingTask}
          patients={patients}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">טוען...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">אין משימות</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const StatusIcon = statusIcons[task.status] || Circle;
            const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'הושלם';
            
            return (
              <Card
                key={task.id}
                className={`shadow-md border-0 hover:shadow-lg transition-all ${
                  task.status === 'הושלם' ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-2 md:gap-4">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-1 hover:scale-110 transition-transform flex-shrink-0"
                    >
                      <StatusIcon
                        className={`w-5 h-5 md:w-6 md:h-6 ${
                          task.status === 'הושלם' ? 'text-green-500' : 'text-gray-400'
                        }`}
                      />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-base md:text-lg ${task.status === 'הושלם' ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </h3>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {task.priority && (
                          <Badge className={`${priorityColors[task.priority]} border text-xs`}>
                            {task.priority}
                          </Badge>
                        )}
                        
                        {task.patient_name && (
                          <Badge variant="outline" className="text-xs">
                            {task.patient_name}
                          </Badge>
                        )}
                        
                        {task.due_date && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${isOverdue ? 'border-red-500 text-red-700' : ''}`}
                          >
                            <Clock className="w-3 h-3 ml-1" />
                            {format(parseISO(task.due_date), 'dd/MM/yyyy', { locale: he })}
                            {isOverdue && ' - באיחור'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTask(task);
                        setShowForm(true);
                      }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      ערוך
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}