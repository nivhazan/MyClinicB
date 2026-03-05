import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authentication check - only admin can run this
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Get today's date in Israel timezone
        const israelTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
        const today = israelTime.toISOString().split('T')[0];

        // Fetch today's appointments
        const appointments = await base44.asServiceRole.entities.Appointment.filter({
            date: today
        });

        // Fetch settings
        const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
        const settings = settingsList[0];

        if (!settings?.admin_daily_summary) {
            return Response.json({ 
                success: false,
                message: 'Daily summary not enabled'
            });
        }

        // Group appointments by status
        const summary = {
            total: appointments.length,
            confirmed: appointments.filter(a => a.status === 'אושר').length,
            completed: appointments.filter(a => a.status === 'בוצע').length,
            cancelled: appointments.filter(a => a.status === 'בוטל').length,
            no_show: appointments.filter(a => a.status === 'לא הגיע').length,
            scheduled: appointments.filter(a => a.status === 'מתוכנן').length
        };

        // Create message
        const message = `
📊 <b>סיכום יומי - ${new Date().toLocaleDateString('he-IL')}</b>

👥 סה"כ תורים: ${summary.total}
✅ אושרו: ${summary.confirmed}
✔️ בוצעו: ${summary.completed}
📅 מתוכננים: ${summary.scheduled}
❌ בוטלו: ${summary.cancelled}
⚠️ לא הגיעו: ${summary.no_show}

${appointments.length > 0 ? '\n<b>תורים להיום:</b>\n' + appointments.map(a => 
    `• ${a.time} - ${a.patient_name} (${a.status})`
).join('\n') : '\nאין תורים מתוכננים להיום'}
        `.trim();

        // Send via Telegram
        if (settings.telegram_enabled && settings.telegram_bot_token) {
            const response = await base44.asServiceRole.functions.invoke('sendTelegramMessage', {
                message,
                chat_id: settings.telegram_chat_id
            });

            return Response.json({
                success: response.data.success,
                summary,
                message: 'סיכום יומי נשלח'
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