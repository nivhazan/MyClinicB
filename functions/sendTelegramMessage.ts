import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const { message, chat_id } = await req.json();

        if (!message) {
            return Response.json({ error: 'Missing message' }, { status: 400 });
        }

        // Fetch Telegram settings
        const settingsList = await base44.asServiceRole.entities.ReminderSettings.list();
        const settings = settingsList[0];

        if (!settings?.telegram_enabled || !settings?.telegram_bot_token) {
            return Response.json({ 
                error: 'Telegram not configured',
                details: 'Please enable and configure Telegram in settings'
            }, { status: 400 });
        }

        const targetChatId = chat_id || settings.telegram_chat_id;
        
        if (!targetChatId) {
            return Response.json({ error: 'Missing chat_id' }, { status: 400 });
        }

        // Send via Telegram Bot API
        const response = await fetch(
            `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            return Response.json({ 
                error: 'Failed to send Telegram message',
                details: error.description
            }, { status: response.status });
        }

        const result = await response.json();

        return Response.json({ 
            success: true,
            message_id: result.result.message_id,
            message: 'ההודעה נשלחה בהצלחה'
        });

    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});