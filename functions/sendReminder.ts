import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Fetch settings (service role for scheduled runs)
        const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
        const settings = settingsList[0];

        if (!settings?.auto_send_enabled) {
            return Response.json({ success: false, message: 'Auto reminders not enabled' });
        }

        if (!settings.telegram_enabled || !settings.telegram_bot_token || !settings.telegram_chat_id) {
            return Response.json({ success: false, message: 'Telegram not configured' });
        }

        // Get tomorrow's date in Israel timezone
        const israelTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
        const tomorrow = new Date(israelTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        // Fetch tomorrow's appointments (not cancelled)
        const appointments = await base44.asServiceRole.entities.Appointment.filter({ date: tomorrowDate });
        const pending = appointments.filter(a => a.status !== 'בוטל' && a.status !== 'לא הגיע' && !a.reminder_sent);

        if (pending.length === 0) {
            return Response.json({ success: true, message: 'No pending reminders', sent: 0 });
        }

        // Sort by time
        pending.sort((a, b) => a.time.localeCompare(b.time));

        const dayName = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][tomorrow.getDay()];
        const template = settings.reminder_template || 'שלום {patient_name},\n\nמזכירים לך על התור שלך מחר ב-{time}.\n\nנשמח לראותך!\nהקליניקה';

        let sentCount = 0;

        // Send one summary message to admin with all patients
        let summaryMsg = `🔔 <b>תזכורות שנשלחו - ${dayName} ${tomorrow.toLocaleDateString('he-IL')}</b>\n\n`;
        summaryMsg += `${pending.length} מטופלים עם תורים מחר:\n\n`;

        for (const apt of pending) {
            const personalMsg = template
                .replace('{patient_name}', apt.patient_name)
                .replace('{time}', apt.time)
                .replace('{date}', tomorrow.toLocaleDateString('he-IL'))
                .replace('{type}', apt.type || 'טיפול');

            summaryMsg += `• ${apt.time} - ${apt.patient_name}\n`;

            // Mark reminder as sent
            await base44.asServiceRole.entities.Appointment.update(apt.id, { reminder_sent: true });
            sentCount++;
        }

        // Send summary to admin via Telegram
        await base44.asServiceRole.functions.invoke('sendTelegramMessage', {
            message: summaryMsg.trim(),
            chat_id: settings.telegram_chat_id
        });

        return Response.json({
            success: true,
            sent: sentCount,
            message: `נשלחו תזכורות ל-${sentCount} מטופלים`
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});