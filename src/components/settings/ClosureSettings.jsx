import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Download } from 'lucide-react';
import { format, parse } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';

const ISRAELI_HOLIDAYS_2026 = [
  { date: '2026-04-15', name: 'פסח (ערב)', type: 'holiday' },
  { date: '2026-04-16', name: 'פסח (ראשון)', type: 'holiday' },
  { date: '2026-04-17', name: 'פסח (שני)', type: 'holiday' },
  { date: '2026-04-22', name: 'פסח (שביעי)', type: 'holiday' },
  { date: '2026-04-23', name: 'פסח (שמיני)', type: 'holiday' },
  { date: '2026-05-14', name: 'יום הזיכרון', type: 'holiday' },
  { date: '2026-05-15', name: 'יום העצמאות', type: 'holiday' },
  { date: '2026-06-03', name: 'שבועות', type: 'holiday' },
  { date: '2026-10-02', name: 'ערב יום הכיפורים', type: 'holiday' },
  { date: '2026-10-03', name: 'יום הכיפורים', type: 'holiday' },
  { date: '2026-10-07', name: 'סוכות (ערב)', type: 'holiday' },
  { date: '2026-10-08', name: 'סוכות (ראשון)', type: 'holiday' },
  { date: '2026-10-14', name: 'שמיני עצרת', type: 'holiday' },
  { date: '2026-10-15', name: 'שמחת תורה', type: 'holiday' },
];

export default function ClosureSettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    type: 'vacation',
  });
  const queryClient = useQueryClient();

  const { data: closures = [], isLoading } = useQuery({
    queryKey: ['closures'],
    queryFn: () => base44.entities.ClinicClosure.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClinicClosure.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      setFormData({ start_date: '', end_date: '', reason: '', type: 'vacation' });
      setDialogOpen(false);
      toast.success('חופשה נוספה בהצלחה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClinicClosure.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      toast.success('חופשה נמחקה');
    },
  });

  const importHolidaysMutation = useMutation({
    mutationFn: async () => {
      const existingDates = closures.map((c) => c.start_date);
      const toCreate = ISRAELI_HOLIDAYS_2026.filter(
        (h) => !existingDates.includes(h.date)
      ).map((h) => ({
        start_date: h.date,
        end_date: h.date,
        reason: h.name,
        type: h.type,
      }));
      if (toCreate.length === 0) {
        toast.info('כל החגים כבר קיימים במערכת');
        return;
      }
      await base44.entities.ClinicClosure.bulkCreate(toCreate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      toast.success('חגים ישראליים 2026 יובאו בהצלחה');
    },
  });

  const handleSubmit = () => {
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      toast.error('אנא מלא את כל השדות');
      return;
    }
    if (formData.end_date < formData.start_date) {
      toast.error('תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>חופשות וחגים</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> הוסף חופשה
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוסף חופשה או יום חופשי</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>תאריך התחלה</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>תאריך סיום</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>סיבה</Label>
                  <Input
                    placeholder="חופשה אישית, חג, השתלמות..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>סוג</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) =>
                      setFormData({ ...formData, type: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">חופשה</SelectItem>
                      <SelectItem value="holiday">חג</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                  >
                    הוסף
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => importHolidaysMutation.mutate()}
            disabled={importHolidaysMutation.isPending}
          >
            <Download className="w-4 h-4" /> ייבוא חגים 2026
          </Button>
        </div>

        {isLoading ? (
          <p className="text-gray-500">טוען...</p>
        ) : closures.length === 0 ? (
          <p className="text-gray-500">אין חופשות או חגים מוגדרים</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-2">תאריך</th>
                  <th className="text-right p-2">סיבה</th>
                  <th className="text-right p-2">סוג</th>
                  <th className="text-right p-2"></th>
                </tr>
              </thead>
              <tbody>
                {closures
                  .sort(
                    (a, b) =>
                      new Date(a.start_date) - new Date(b.start_date)
                  )
                  .map((closure) => (
                    <tr key={closure.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        {closure.start_date === closure.end_date
                          ? format(parse(closure.start_date, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy')
                          : `${format(parse(closure.start_date, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy')} - ${format(parse(closure.end_date, 'yyyy-MM-dd', new Date()), 'dd.MM.yyyy')}`}
                      </td>
                      <td className="p-2">{closure.reason}</td>
                      <td className="p-2 text-xs">
                        {closure.type === 'holiday'
                          ? 'חג'
                          : closure.type === 'vacation'
                          ? 'חופשה'
                          : 'אחר'}
                      </td>
                      <td className="p-2 text-left">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>מחק חופשה</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם אתה בטוח שברצונך למחוק חופשה זו?
                            </AlertDialogDescription>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteMutation.mutate(closure.id)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                מחק
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}