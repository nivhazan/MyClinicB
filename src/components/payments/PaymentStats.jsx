import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';

export default function PaymentStats({ payments, patients }) {
  const thisMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && 
           paymentDate.getFullYear() === now.getFullYear();
  });

  const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayPayments = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const now = new Date();
    return paymentDate.toDateString() === now.toDateString();
  });
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const monthlyPayingPatients = patients.filter(p => p.billing_model === 'monthly_aggregate').length;
  const perSessionPatients = patients.filter(p => p.billing_model === 'per_session').length;

  const stats = [
    {
      title: 'הכנסות החודש',
      value: `₪${thisMonthTotal.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'תשלומים היום',
      value: `₪${todayTotal.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'תשלום חודשי',
      value: `${monthlyPayingPatients} מטופלים`,
      icon: Calendar,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'תשלום לפי טיפול',
      value: `${perSessionPatients} מטופלים`,
      icon: Users,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="shadow-md border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}