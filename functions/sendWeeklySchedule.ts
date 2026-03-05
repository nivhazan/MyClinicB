import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authentication check - only admin can run this
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Get next week's dates in Israel timezone
        const israelTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
        const today = israelTime;
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

        const startDate = nextWeekStart.toISOString().split('T')[0];
        const endDate = nextWeekEnd.toISOString().split('T')[0];

        // Fetch next week's appointments
        const allAppointments = await base44.asServiceRole.entities.Appointment.list();
        const appointments = allAppointments.filter(a => 
            a.date >= startDate && a.date <= endDate
        ).sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        // Fetch settings
        const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
        const settings = settingsList[0];

        if (!settings?.weekly_schedule_enabled) {
            return Response.json({ 
                success: false,
                message: 'Weekly schedule not enabled'
            });
        }

        // Group by day
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const schedule = {};
        
        appointments.forEach(apt => {
            const date = new Date(apt.date);
            const dayName = dayNames[date.getDay()];
            const dateStr = date.toLocaleDateString('he-IL');
            const key = `${dayName} ${dateStr}`;
            
            if (!schedule[key]) {
                schedule[key] = [];
            }
            schedule[key].push(`${apt.time} - ${apt.patient_name}`);
        });

        // Create message
        let message = `📅 <b>לוח תורים לשבוע הבא</b>\n${nextWeekStart.toLocaleDateString('he-IL')} - ${nextWeekEnd.toLocaleDateString('he-IL')}\n\n`;

        if (Object.keys(schedule).length === 0) {
            message += 'אין תורים מתוכננים לשבוע הבא';
        } else {
            for (const [day, appointments] of Object.entries(schedule)) {
                message += `<b>${day}</b>\n`;
                appointments.forEach(apt => {
                    message += `  • ${apt}\n`;
                });
                message += '\n';
            }
        }

        // Send via Telegram
        if (settings.telegram_enabled && settings.telegram_bot_token) {
            const response = await base44.asServiceRole.functions.invoke('sendTelegramMessage', {
                message: message.trim(),
                chat_id: settings.telegram_chat_id
            });

            return Response.json({
                success: response.data.success,
                appointments_count: appointments.length,
                message: 'לוח שבועי נשלח'
            });
        }

        return Response.json({
            success: false,
            message: 'Telegram not configured'
        });

    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});