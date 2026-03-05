import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const startTime = Date.now();
    try {
        const base44 = createClientFromRequest(req);
        
        // Get appointment data from the event
        const { event, data, initiated_by = 'automation' } = await req.json();
        
        if (!data || !data.id) {
            return Response.json({ error: 'Invalid appointment data' }, { status: 400 });
        }

        // Get the access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken("googlecalendar");

        // Prepare event data - send datetime without timezone suffix
        // Google Calendar will interpret it according to the timeZone field
        const startDateTime = `${data.date}T${data.time}:00`;
        
        // Calculate end time
        const startDate = new Date(`${data.date}T${data.time}:00Z`);
        const endDate = new Date(startDate.getTime() + (data.duration || 45) * 60000);
        const endDateTime = endDate.toISOString().slice(0, 19);

        const calendarEvent = {
            summary: `טיפול: ${data.patient_name}`,
            description: `סוג: ${data.type || 'טיפול שוטף'}\n${data.notes ? 'הערות: ' + data.notes : ''}`,
            start: {
                dateTime: startDateTime,
                timeZone: 'Asia/Jerusalem'
            },
            end: {
                dateTime: endDateTime,
                timeZone: 'Asia/Jerusalem'
            }
        };

        let response;
        let result;
        
        if (event.type === 'create') {
            // Create new event
            response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(calendarEvent)
            });
            result = await response.json();
            
            // Store Google event ID for future updates
            if (response.ok && result.id) {
                await base44.asServiceRole.entities.Appointment.update(data.id, {
                    google_event_id: result.id
                });
            }
        } else if (event.type === 'update') {
            // Update existing event
            if (!data.google_event_id) {
                return Response.json({ 
                    success: false, 
                    error: 'No Google event ID found. Cannot update event.',
                    skipped: true 
                });
            }
            
            response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${data.google_event_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(calendarEvent)
            });
            result = await response.json();
        } else if (event.type === 'delete') {
            // Delete event from calendar
            if (!data.google_event_id) {
                return Response.json({ 
                    success: true, 
                    message: 'No Google event ID found. Nothing to delete.',
                    skipped: true 
                });
            }
            
            response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${data.google_event_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            result = response.ok ? { deleted: true } : await response.json();
        } else {
            return Response.json({ 
                success: false, 
                error: 'Unknown event type' 
            }, { status: 400 });
        }

        const duration = Date.now() - startTime;

        if (!response.ok) {
            // Log failed sync
            await base44.asServiceRole.entities.SyncLog.create({
                system: 'Google Calendar',
                event_type: 'appointment_sync',
                status: 'failed',
                entity_name: 'Appointment',
                entity_id: data.id,
                patient_name: data.patient_name,
                details: `ניסיון סנכרון תור של ${data.patient_name}`,
                error_message: JSON.stringify(result),
                request_data: JSON.stringify(calendarEvent),
                response_data: JSON.stringify(result),
                duration_ms: duration,
                initiated_by
            });
            
            return Response.json({ 
                error: 'Failed to sync to Google Calendar', 
                details: result 
            }, { status: response.status });
        }

        // Log successful sync
        await base44.asServiceRole.entities.SyncLog.create({
            system: 'Google Calendar',
            event_type: 'appointment_sync',
            status: 'success',
            entity_name: 'Appointment',
            entity_id: data.id,
            patient_name: data.patient_name,
            details: `תור של ${data.patient_name} ב-${data.date} ${data.time}`,
            external_id: result.id,
            request_data: JSON.stringify(calendarEvent),
            response_data: JSON.stringify(result),
            duration_ms: duration,
            initiated_by
        });

        return Response.json({ 
            success: true, 
            google_event_id: result.id,
            message: 'התור סונכרן בהצלחה לגוגל קלנדר'
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        // Log error
        try {
            await base44.asServiceRole.entities.SyncLog.create({
                system: 'Google Calendar',
                event_type: 'appointment_sync',
                status: 'failed',
                entity_name: 'Appointment',
                entity_id: data?.id || 'unknown',
                patient_name: data?.patient_name,
                details: 'שגיאה בסנכרון',
                error_message: error.message,
                duration_ms: duration,
                initiated_by: 'unknown'
            });
        } catch (logError) {
            console.error('Failed to log sync error:', logError);
        }
        
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});