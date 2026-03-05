import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Get tomorrow's date in Israel timezone
        const israelTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
        const tomorrow = new Date(israelTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        // Fetch settings first
        const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
        const settings = settingsList[0];

        if (!settings?.daily_update_enabled && !settings?.admin_daily_summary) {
            return Response.json({ 
                success: false,
                message: 'Daily update not enabled'
            });
        }

        // Fetch all appointments and filter by tomorrow's date
        const allAppointments = await base44.asServiceRole.entities.Appointment.list('-date', 500);
        const appointments = allAppointments.filter(a => a.date === tomorrowDate);
        appointments.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        // Create message
        const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][tomorrow.getDay()];
        let message = `📅 <b>לוח תורים למחר - ${dayName} ${tomorrow.toLocaleDateString('he-IL')}</b>\n\n`;

        if (appointments.length === 0) {
            message += 'אין תורים מתוכננים למחר';
        } else {
            message += `סה"כ ${appointments.length} תורים:\n\n`;
            appointments.forEach(apt => {
                message += `⏰ ${apt.time} - ${apt.patient_name}`;
                if (apt.type && apt.type !== 'טיפול שוטף') {
                    message += ` (${apt.type})`;
                }
                if (apt.notes && apt.notes !== 'תור קבוע שנוצר אוטומטית') {
                    message += `\n  📝 ${apt.notes}`;
                }
                message += '\n';
            });
        }

        // Send via Telegram directly (bypass auth issues with function invoke)
        if (settings.telegram_enabled && settings.telegram_bot_token && settings.telegram_chat_id) {
            const telegramRes = await fetch(
                `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: settings.telegram_chat_id,
                        text: message.trim(),
                        parse_mode: 'HTML'
                    })
                }
            );
            const response = { data: { success: telegramRes.ok } };
            if (!telegramRes.ok) {
                const err = await telegramRes.json();
                return Response.json({ success: false, error: err.description });
            }

            return Response.json({
                success: response.data.success,
                appointments_count: appointments.length,
                message: 'עדכון יומי נשלח'
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