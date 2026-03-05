import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authentication check - only admin can run this
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Get this week's dates in Israel timezone
        const israelTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
        const today = israelTime;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const startDate = weekStart.toISOString().split('T')[0];
        const endDate = weekEnd.toISOString().split('T')[0];

        // Fetch this week's appointments
        const allAppointments = await base44.asServiceRole.entities.Appointment.list();
        const appointments = allAppointments.filter(a => 
            a.date >= startDate && a.date <= endDate
        );

        // Fetch settings
        const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
        const settings = settingsList[0];

        if (!settings?.admin_weekly_summary) {
            return Response.json({ 
                success: false,
                message: 'Weekly summary not enabled'
            });
        }

        // Calculate statistics
        const stats = {
            total: appointments.length,
            completed: appointments.filter(a => a.status === 'בוצע').length,
            cancelled: appointments.filter(a => a.status === 'בוטל').length,
            no_show: appointments.filter(a => a.status === 'לא הגיע').length
        };

        // Calculate revenue (if payments exist)
        const payments = await base44.asServiceRole.entities.Payment.filter({
            payment_date: { $gte: startDate, $lte: endDate }
        });
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Create message
        const message = `
📊 <b>סיכום שבועי</b>
${weekStart.toLocaleDateString('he-IL')} - ${weekEnd.toLocaleDateString('he-IL')}

👥 <b>תורים:</b>
• סה"כ: ${stats.total}
• בוצעו: ${stats.completed}
• בוטלו: ${stats.cancelled}
• לא הגיעו: ${stats.no_show}

💰 <b>הכנסות:</b>
• סה"כ תשלומים: ₪${totalRevenue.toLocaleString()}

📈 <b>אחוז השלמה:</b> ${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
        `.trim();

        // Send via Telegram
        if (settings.telegram_enabled && settings.telegram_bot_token) {
            const response = await base44.asServiceRole.functions.invoke('sendTelegramMessage', {
                message,
                chat_id: settings.telegram_chat_id
            });

            return Response.json({
                success: response.data.success,
                stats,
                message: 'סיכום שבועי נשלח'
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