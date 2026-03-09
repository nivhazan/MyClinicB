import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // large limit for receipt images

// ──────────────────────────────────────────────
// Helper: wrap async route handlers for error handling
// ──────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Helper: parse sort param like "-date" → { date: 'desc' }
function parseSortParam(sort) {
  if (!sort) return { createdAt: 'desc' };
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  // Map snake_case sort fields to camelCase Prisma fields
  const fieldMap = {
    created_date: 'createdAt',
    payment_date: 'paymentDate',
    session_date: 'sessionDate',
    issue_date: 'issueDate',
    upload_date: 'uploadDate',
    activity_status: 'activityStatus',
  };
  const prismaField = fieldMap[field] || field;
  return { [prismaField]: desc ? 'desc' : 'asc' };
}

// Helper: map snake_case filter keys to camelCase Prisma fields
function mapFilterKeys(query) {
  const keyMap = {
    patient_id: 'patientId',
    session_id: 'sessionId',
    billing_month: 'billingMonth',
    owner_type: 'ownerType',
    owner_id: 'ownerId',
    activity_status: 'activityStatus',
    patient_name: 'patientName',
    receipt_status: 'receiptStatus',
  };
  const mapped = {};
  for (const [k, v] of Object.entries(query)) {
    mapped[keyMap[k] || k] = v;
  }
  return mapped;
}

// Helper: map incoming snake_case data to camelCase for Prisma create/update
function mapDataKeys(data) {
  const keyMap = {
    full_name: 'fullName',
    id_number: 'idNumber',
    date_of_birth: 'dateOfBirth',
    parent_phone: 'parentPhone',
    medical_background: 'medicalBackground',
    referral_source: 'referralSource',
    emergency_contact: 'emergencyContact',
    emergency_phone: 'emergencyPhone',
    inactive_reason: 'inactiveReason',
    inactive_note: 'inactiveNote',
    regular_day: 'regularDay',
    regular_time: 'regularTime',
    months_ahead: 'monthsAhead',
    patient_id: 'patientId',
    patient_name: 'patientName',
    session_id: 'sessionId',
    billing_model: 'billingModel',
    session_price: 'sessionPrice',
    billing_month: 'billingMonth',
    payment_date: 'paymentDate',
    receipt_status: 'receiptStatus',
    receipt_attempt_count: 'receiptAttemptCount',
    receipt_sent_at: 'receiptSentAt',
    receipt_error: 'receiptError',
    activity_status: 'activityStatus',
    owner_type: 'ownerType',
    owner_id: 'ownerId',
    file_type: 'fileType',
    file_name: 'fileName',
    session_date: 'sessionDate',
    reminder_sent: 'reminderSent',
    due_date: 'dueDate',
    issue_date: 'issueDate',
    start_date: 'startDate',
    end_date: 'endDate',
    telegram_token: 'telegramToken',
    telegram_chat_id: 'telegramChatId',
    reminder_enabled: 'reminderEnabled',
    reminder_template: 'reminderTemplate',
    daily_update_enabled: 'dailyUpdateEnabled',
    business_name: 'businessName',
    business_id: 'businessId',
    business_address: 'businessAddress',
    business_phone: 'businessPhone',
    business_email: 'businessEmail',
    logo_url: 'logoUrl',
    footer_text: 'footerText',
    receipt_url: 'receiptUrl',
    upload_date: 'uploadDate',
    entity_type: 'entityType',
    entity_id: 'entityId',
    created_date: 'createdAt',
  };
  const mapped = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === 'id' || k === 'createdAt') continue; // skip auto-generated
    mapped[keyMap[k] || k] = v;
  }
  return mapped;
}

// Helper: map camelCase DB record back to snake_case for frontend
function mapRecordToSnake(record) {
  if (!record) return record;
  const keyMap = {
    fullName: 'full_name',
    idNumber: 'id_number',
    dateOfBirth: 'date_of_birth',
    parentPhone: 'parent_phone',
    medicalBackground: 'medical_background',
    referralSource: 'referral_source',
    emergencyContact: 'emergency_contact',
    emergencyPhone: 'emergency_phone',
    inactiveReason: 'inactive_reason',
    inactiveNote: 'inactive_note',
    regularDay: 'regular_day',
    regularTime: 'regular_time',
    monthsAhead: 'months_ahead',
    patientId: 'patient_id',
    patientName: 'patient_name',
    sessionId: 'session_id',
    billingModel: 'billing_model',
    sessionPrice: 'session_price',
    billingMonth: 'billing_month',
    paymentDate: 'payment_date',
    receiptStatus: 'receipt_status',
    receiptAttemptCount: 'receipt_attempt_count',
    receiptSentAt: 'receipt_sent_at',
    receiptError: 'receipt_error',
    activityStatus: 'activity_status',
    ownerType: 'owner_type',
    ownerId: 'owner_id',
    fileType: 'file_type',
    fileName: 'file_name',
    sessionDate: 'session_date',
    reminderSent: 'reminder_sent',
    dueDate: 'due_date',
    issueDate: 'issue_date',
    startDate: 'start_date',
    endDate: 'end_date',
    telegramToken: 'telegram_token',
    telegramChatId: 'telegram_chat_id',
    reminderEnabled: 'reminder_enabled',
    reminderTemplate: 'reminder_template',
    dailyUpdateEnabled: 'daily_update_enabled',
    businessName: 'business_name',
    businessId: 'business_id',
    businessAddress: 'business_address',
    businessPhone: 'business_phone',
    businessEmail: 'business_email',
    logoUrl: 'logo_url',
    footerText: 'footer_text',
    receiptUrl: 'receipt_url',
    uploadDate: 'upload_date',
    entityType: 'entity_type',
    entityId: 'entity_id',
    createdAt: 'created_at',
  };
  const mapped = {};
  for (const [k, v] of Object.entries(record)) {
    mapped[keyMap[k] || k] = v;
  }
  return mapped;
}

function mapMany(records) {
  return records.map(mapRecordToSnake);
}

// ──────────────────────────────────────────────
// Generic CRUD factory
// ──────────────────────────────────────────────
function registerCrud(modelName, prismaModel, opts = {}) {
  const path = `/${modelName}`;

  // LIST: GET /modelName?sort=-date&limit=50
  app.get(path, asyncHandler(async (req, res) => {
    const { sort, limit, ...filterParams } = req.query;
    const where = Object.keys(filterParams).length
      ? mapFilterKeys(filterParams)
      : undefined;
    const records = await prismaModel.findMany({
      where,
      orderBy: parseSortParam(sort),
      take: limit ? parseInt(limit, 10) : undefined,
    });
    res.json(mapMany(records));
  }));

  // GET by ID: GET /modelName/:id
  app.get(`${path}/:id`, asyncHandler(async (req, res) => {
    const record = await prismaModel.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(mapRecordToSnake(record));
  }));

  // CREATE: POST /modelName
  app.post(path, asyncHandler(async (req, res) => {
    if (opts.beforeCreate) await opts.beforeCreate(req.body);
    const data = mapDataKeys(req.body);
    const record = await prismaModel.create({ data });
    if (opts.afterCreate) await opts.afterCreate(record, req.body);
    res.status(201).json(mapRecordToSnake(record));
  }));

  // BULK CREATE: POST /modelName/bulk
  app.post(`${path}/bulk`, asyncHandler(async (req, res) => {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected array' });
    const results = [];
    for (const item of items) {
      const data = mapDataKeys(item);
      const record = await prismaModel.create({ data });
      results.push(mapRecordToSnake(record));
    }
    res.status(201).json(results);
  }));

  // UPDATE: PUT /modelName/:id
  app.put(`${path}/:id`, asyncHandler(async (req, res) => {
    const data = mapDataKeys(req.body);
    const record = await prismaModel.update({
      where: { id: req.params.id },
      data,
    });
    res.json(mapRecordToSnake(record));
  }));

  // DELETE: DELETE /modelName/:id
  app.delete(`${path}/:id`, asyncHandler(async (req, res) => {
    await prismaModel.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  }));
}

// ──────────────────────────────────────────────
// Register all entities
// ──────────────────────────────────────────────

registerCrud('patients', prisma.patient);

registerCrud('appointments', prisma.appointment);

registerCrud('payments', prisma.payment, {
  async beforeCreate(body) {
    // Guard: billing_month XOR session_id
    if (body.billing_month && body.session_id) {
      throw Object.assign(new Error('תשלום לא יכול להיות גם חודשי וגם מקושר לטיפול'), { status: 400 });
    }

    // Guard: prevent payment on future appointment
    if (body.session_id) {
      const apt = await prisma.appointment.findUnique({ where: { id: body.session_id } });
      if (apt && apt.date && apt.time) {
        const start = new Date(`${apt.date}T${apt.time}`);
        const endMs = start.getTime() + Number(apt.duration || 45) * 60 * 1000;
        if (endMs > Date.now()) {
          throw Object.assign(new Error('לא ניתן לרשום תשלום לתור שטרם הסתיים'), { status: 400 });
        }
      }
    }
    // Duplicate check is enforced by unique constraint on sessionId
  },

  async afterCreate(payment, body) {
    // Auto-fix: if appointment was מתוכנן → change to בוצע
    if (payment.sessionId) {
      const apt = await prisma.appointment.findUnique({ where: { id: payment.sessionId } });
      if (apt && apt.status === 'מתוכנן') {
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { status: 'בוצע' },
        });
      }
    }
  },
});

registerCrud('treatment-sessions', prisma.treatmentSession);
registerCrud('expenses', prisma.expense);
registerCrud('attachments', prisma.attachment);
registerCrud('patient-files', prisma.patientFile);
registerCrud('tasks', prisma.task);
registerCrud('activities', prisma.activity);
registerCrud('invoices', prisma.invoice);
registerCrud('reminder-settings', prisma.reminderSettings);
registerCrud('clinic-closures', prisma.clinicClosure);
registerCrud('digital-invoice-settings', prisma.digitalInvoiceSettings);
registerCrud('sync-logs', prisma.syncLog);

// ──────────────────────────────────────────────
// Receipt AI Analysis endpoint (security fix)
// Anthropic API key stays server-side only
// ──────────────────────────────────────────────
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

app.post('/api/analyze-receipt', asyncHandler(async (req, res) => {
  const { image, mediaType } = req.body;
  if (!image || !mediaType) {
    return res.status(400).json({ error: 'Missing image or mediaType' });
  }
  if (!VALID_IMAGE_TYPES.includes(mediaType)) {
    return res.status(400).json({ error: 'סוג קובץ לא נתמך. נא להעלות JPG, PNG, GIF או WEBP' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: image },
          },
          {
            type: 'text',
            text: `אתה מנתח קבלות. חלץ את המידע הבא מהקבלה והחזר JSON בלבד, ללא טקסט נוסף:
{
  "amount": <סכום כמספר בלבד ללא סימן מטבע>,
  "vendor": "<שם העסק>",
  "date": "<תאריך בפורמט YYYY-MM-DD>",
  "description": "<תיאור קצר של מה נקנה>",
  "category": "<אחת בדיוק מתוך: ציוד קליני, חומרי משרד, שכר דירה, חשמל ומים, אינטרנט וטלפון, שיווק ופרסום, השתלמויות, ביטוח, אחזקה ותיקונים, אחר>"
}
אם לא ניתן לזהות שדה מסוים, החזר null עבורו.`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return res.status(422).json({ error: 'לא ניתן לנתח את תשובת ה-AI' });
  }
  res.json(JSON.parse(jsonMatch[0]));
}));

// ──────────────────────────────────────────────
// Functions endpoint (replaces base44.functions.invoke)
// ──────────────────────────────────────────────
app.post('/api/functions/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;

  // For now, log the function invocation and return ok
  // In production, wire these to actual Telegram/email services
  await prisma.syncLog.create({
    data: {
      action: `function:${name}`,
      details: JSON.stringify(req.body),
      status: 'success',
    },
  });

  res.json({ ok: true, function: name });
}));

// ──────────────────────────────────────────────
// Error handling middleware
// ──────────────────────────────────────────────
app.use((err, req, res, _next) => {
  // Friendly message for Prisma unique constraint violations
  if (err.code === 'P2002' && err.meta?.target?.includes('sessionId')) {
    return res.status(400).json({ error: 'כבר קיים תשלום לטיפול זה' });
  }
  const status = err.status || 500;
  console.error(`[${status}] ${err.message}`);
  res.status(status).json({ error: err.message });
});

// ──────────────────────────────────────────────
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});
