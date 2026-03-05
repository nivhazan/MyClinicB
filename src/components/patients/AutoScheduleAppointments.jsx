import { base44 } from '@/api/base44Client';
import { addDays, addMonths, parseISO, format, startOfDay } from 'date-fns';

const dayNameToNumber = {
  'ראשון': 0,
  'שני': 1,
  'שלישי': 2,
  'רביעי': 3,
  'חמישי': 4,
  'שישי': 5,
  'שבת': 6
};

export async function schedulePatientAppointments(patient, monthsAhead = null) {
  if (!patient.regular_day || !patient.regular_time) {
    return { success: false, message: 'אין יום ושעה קבועים' };
  }

  const months = monthsAhead || patient.months_ahead || 4;
  const targetDayOfWeek = dayNameToNumber[patient.regular_day];
  const today = new Date();
  const endDate = addMonths(today, months);

  // קבלת כל הימים סגורים (חופשות וחגים)
  const closures = await base44.entities.ClinicClosure.list();
  const closedDates = new Set();
  closures.forEach(closure => {
    let date = parseISO(closure.start_date);
    while (date <= parseISO(closure.end_date)) {
      closedDates.add(format(date, 'yyyy-MM-dd'));
      date = addDays(date, 1);
    }
  });

  // מציאת היום הראשון בשבוע הבא
  let currentDate = addDays(today, 1);
  while (currentDate.getDay() !== targetDayOfWeek) {
    currentDate = addDays(currentDate, 1);
  }

  // קבלת כל התורים הקיימים של המטופל
  const existingAppointments = await base44.entities.Appointment.filter({
    patient_id: patient.id
  });

  const existingDates = new Set(
    existingAppointments.map(apt => apt.date)
  );

  const appointmentsToCreate = [];

  // יצירת תורים שבועיים
  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    // רק אם התור לא קיים כבר וקליניקה פתוחה ביום זה
    if (!existingDates.has(dateStr) && !closedDates.has(dateStr)) {
      appointmentsToCreate.push({
        patient_id: patient.id,
        patient_name: patient.full_name,
        date: dateStr,
        time: patient.regular_time,
        duration: 45,
        type: 'טיפול שוטף',
        status: 'מתוכנן',
        notes: 'תור קבוע שנוצר אוטומטית'
      });
    }

    currentDate = addDays(currentDate, 7);
  }

  if (appointmentsToCreate.length === 0) {
    return { success: true, message: 'אין תורים חדשים ליצירה', count: 0 };
  }

  // Create in batches of 5 to reduce partial-failure impact
  const BATCH_SIZE = 5;
  let created = 0;
  let failed = 0;

  for (let i = 0; i < appointmentsToCreate.length; i += BATCH_SIZE) {
    const batch = appointmentsToCreate.slice(i, i + BATCH_SIZE);
    try {
      await base44.entities.Appointment.bulkCreate(batch);
      created += batch.length;
    } catch {
      failed += batch.length;
    }
  }

  if (failed > 0 && created === 0) {
    return { success: false, message: `יצירת התורים נכשלה`, count: 0 };
  }

  return {
    success: true,
    message: failed > 0
      ? `נוצרו ${created} תורים (${failed} נכשלו)`
      : `נוצרו ${created} תורים חדשים`,
    count: created
  };
}