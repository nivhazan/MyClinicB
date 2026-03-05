import { parseISO } from 'date-fns';

/**
 * Returns the end Date of an appointment (start + duration).
 * Returns null if date or time is missing/invalid.
 */
export function getAppointmentEndDate(apt) {
  if (!apt?.date || !apt?.time) return null;
  const start = parseISO(`${apt.date}T${apt.time}`);
  if (isNaN(start)) return null;
  const minutes = Number(apt.duration || 45);
  return new Date(start.getTime() + minutes * 60 * 1000);
}

/**
 * Returns true if the appointment has fully ended (end time <= now).
 */
export function isAppointmentEnded(apt, now = new Date()) {
  const end = getAppointmentEndDate(apt);
  if (!end) return false;
  return end <= now;
}

/**
 * Returns true if the appointment should be considered an unpaid debt:
 * - Not cancelled / no-show
 * - Has ended (based on date+time+duration)
 * - No existing payment for this session
 */
export function isUnpaidDebt(apt, payments) {
  if (apt.status === 'בוטל' || apt.status === 'לא הגיע') return false;
  if (!isAppointmentEnded(apt)) return false;
  return !payments?.some(p => p.session_id === apt.id);
}