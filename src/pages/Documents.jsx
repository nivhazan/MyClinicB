import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import DocumentTemplates from '../components/documents/DocumentTemplates';

export default function Documents() {
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => base44.entities.Patient.list(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">מסמכים ותבניות</h1>
        <p className="text-gray-600 mt-1">צור מסמכים מקצועיים מתבניות מוכנות</p>
      </div>

      <DocumentTemplates patients={patients} />
    </div>
  );
}