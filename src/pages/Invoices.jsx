import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText, Download, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import InvoiceForm from '../components/invoices/InvoiceForm';
import InvoicePreview from '../components/invoices/InvoicePreview';
import DigitalInvoiceIntegration from '../components/invoices/DigitalInvoiceIntegration';

const statusColors = {
  'שולם': 'bg-green-100 text-green-800 border-green-200',
  'ממתין לתשלום': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'שולם חלקית': 'bg-orange-100 text-orange-800 border-orange-200'
};

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-issue_date'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedInvoice(null);
    },
  });

  const handleSubmit = (data) => {
    createMutation.mutate(data);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number?.includes(searchTerm)
  );

  const totalRevenue = invoices
    .filter(i => i.payment_status === 'שולם')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  const pendingPayments = invoices
    .filter(i => i.payment_status === 'ממתין לתשלום')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  if (selectedInvoice) {
    return (
      <InvoicePreview
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdate={(data) => updateMutation.mutate({ id: selectedInvoice.id, data })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">חשבוניות וקבלות</h1>
          <p className="text-gray-600 mt-1">ניהול חשבוניות דיגיטליות</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md"
        >
          <Plus className="w-5 h-5 ml-2" />
          חשבונית חדשה
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">סה״כ הכנסות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-green-600">₪{totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md border-0">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">ממתין לתשלום</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-yellow-600">₪{pendingPayments.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">סה״כ חשבוניות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{invoices.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-md border-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="חיפוש לפי שם מטופל או מספר חשבונית..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </CardContent>
      </Card>

      {/* Digital Invoice Integration */}
      <DigitalInvoiceIntegration />

      {/* Invoice Form */}
      {showForm && (
        <InvoiceForm
          patients={patients}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Invoices Table */}
      <Card className="shadow-md border-0">
        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            רשימת חשבוניות
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">טוען...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">אין חשבוניות במערכת</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-right text-xs md:text-sm">מספר</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">תאריך</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">מטופל</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">סכום</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">סטטוס</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <TableCell className="font-medium text-xs md:text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell className="text-xs md:text-sm">
                        {invoice.issue_date && format(parseISO(invoice.issue_date), 'dd/MM/yyyy', { locale: he })}
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">{invoice.patient_name}</TableCell>
                      <TableCell className="font-semibold text-xs md:text-sm">₪{invoice.total_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[invoice.payment_status]} border text-xs`}>
                          {invoice.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(invoice);
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}