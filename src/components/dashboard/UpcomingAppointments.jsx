import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  "מתוכנן": "bg-blue-100 text-blue-800",
  "אושר": "bg-green-100 text-green-800",
  "התקיים": "bg-gray-100 text-gray-800",
  "בוטל": "bg-red-100 text-red-800"
};

export default function UpcomingAppointments({ appointments }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = appointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate >= today && apt.status !== "בוטל" && apt.status !== "התקיים";
    })
    .sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 5);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="border-b bg-gradient-to-l from-teal-50 to-white">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          תורים קרובים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {upcoming.length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין תורים קרובים</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appointment) => (
              <div
                key={appointment.id}
                className="p-3 rounded-lg border border-gray-100 hover:shadow-md transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="font-semibold text-gray-900 truncate">
                        {appointment.patient_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(new Date(appointment.date), "d בMMMM", { locale: he })}
                      </span>
                      <span>•</span>
                      <span>{appointment.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{appointment.type}</p>
                  </div>
                  <Badge className={statusColors[appointment.status]}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}