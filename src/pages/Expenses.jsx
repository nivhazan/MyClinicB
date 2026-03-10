import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import BulkReceiptImport from '../components/expenses/BulkReceiptImport';

export default function Expenses() {
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowForm(false);
      setEditingExpense(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowForm(false);
      setEditingExpense(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleBulkSave = async (expenseList) => {
    let saved = 0;
    for (const data of expenseList) {
      try {
        await base44.entities.Expense.create(data);
        saved++;
      } catch (err) {
        console.error('bulk save error', err);
      }
    }
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    setShowBulk(false);
    toast.success(`${saved} הוצאות נשמרו בהצלחה`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ניהול הוצאות</h1>
          <p className="text-gray-600 mt-1">קבלות והוצאות עסקיות</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setShowBulk(true); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Sparkles className="w-4 h-4 ml-2" />
            ייבוא מרובה
          </Button>
          <Button
            onClick={() => {
              setEditingExpense(null);
              setShowForm(true);
              setShowBulk(false);
            }}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-md"
          >
            <Plus className="w-5 h-5 ml-2" />
            הוצאה חדשה
          </Button>
        </div>
      </div>

      {/* Bulk import */}
      {showBulk && (
        <div className="animate-in fade-in duration-300">
          <BulkReceiptImport
            onSaveAll={handleBulkSave}
            onCancel={() => setShowBulk(false)}
          />
        </div>
      )}

      {/* Single form */}
      {showForm && !showBulk && (
        <div className="animate-in fade-in duration-300">
          <ExpenseForm
            expense={editingExpense}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingExpense(null);
            }}
          />
        </div>
      )}

      {/* Expenses List */}
      <ExpenseList
        expenses={expenses}
        onExport={() => {}}
        onEdit={(expense) => {
          setEditingExpense(expense);
          setShowForm(true);
          setShowBulk(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDelete={(id) => {
          if (confirm('האם למחוק הוצאה זו?')) {
            deleteMutation.mutate(id);
          }
        }}
      />
    </div>
  );
}
