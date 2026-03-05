import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { FileText, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ratingColors = {
  "מצוין": "bg-green-100 text-green-800",
  "טוב": "bg-blue-100 text-blue-800",
  "בינוני": "bg-yellow-100 text-yellow-800",
  "מאתגר": "bg-orange-100 text-orange-800"
};

export default function RecentSessions({ sessions }) {
  const recent = sessions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-l from-purple-50 to-white">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          תיעודים אחרונים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {recent.length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין תיעודים עדיין</p>
        ) : (
          <div className="space-y-3">
            {recent.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg border border-gray-100 hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 truncate">
                        {session.patient_name}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                      {session.session_summary}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(session.date), "d בMMMM yyyy", { locale: he })}
                    </p>
                  </div>
                  {session.rating && (
                    <Badge className={ratingColors[session.rating]}>
                      {session.rating}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}