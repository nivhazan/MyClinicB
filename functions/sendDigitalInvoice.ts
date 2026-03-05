import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { invoice_id } = await req.json();

        if (!invoice_id) {
            return Response.json({ error: 'Missing invoice_id' }, { status: 400 });
        }

        // Fetch invoice data
        const invoice = await base44.entities.Invoice.get(invoice_id);
        if (!invoice) {
            return Response.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Fetch settings
        const settingsList = await base44.asServiceRole.entities.DigitalInvoiceSettings.list();
        const settings = settingsList[0];

        if (!settings || !settings.api_key) {
            return Response.json({ 
                error: 'Digital invoice integration not configured',
                details: 'Please configure API key in settings'
            }, { status: 400 });
        }

        // Prepare invoice data for digitalinvoice.co.il
        const invoiceData = {
            customer_name: invoice.patient_name,
            invoice_number: invoice.invoice_number,
            issue_date: invoice.issue_date,
            items: invoice.items,
            subtotal: invoice.subtotal,
            vat: settings.include_vat ? invoice.vat : 0,
            total: invoice.total_amount,
            business_name: settings.business_name,
            business_id: settings.business_id,
            address: settings.address,
            phone: settings.phone,
            email: settings.email
        };

        // Send to digitalinvoice.co.il API
        const response = await fetch('https://api.digitalinvoice.co.il/v1/invoices', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.api_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
            const error = await response.text();
            return Response.json({ 
                error: 'Failed to send invoice',
                details: error
            }, { status: response.status });
        }

        const result = await response.json();

        return Response.json({ 
            success: true,
            invoice_url: result.invoice_url,
            message: 'החשבונית נשלחה בהצלחה'
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            details: 'Failed to process invoice'
        }, { status: 500 });
    }
});