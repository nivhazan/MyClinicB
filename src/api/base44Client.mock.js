// Lightweight in-memory mock of base44.entities + functions
// Enabled for local dev when VITE_USE_FAKE_DB is truthy.
const makeStore = () => ({
  patients: [],
  appointments: [],
  payments: [],
  sessions: [],
  expenses: [],
  attachments: [],
  patientFiles: [],
  tasks: [],
  activities: [],
  invoices: [],
  reminderSettings: [],
  clinicClosures: [],
  digitalInvoiceSettings: [],
  syncLogs: [],
  seq: 1,
});

const store = makeStore();

const nextId = (prefix) => `${prefix}_${store.seq++}`;

const clone = (o) => JSON.parse(JSON.stringify(o));

function createEntityMock(collectionName, prefix) {
  return {
    async create(data) {
      const now = new Date().toISOString();
      const rec = { ...data, id: data.id || nextId(prefix), created_at: now };
      store[collectionName].push(rec);
      return clone(rec);
    },
    async get(id) {
      return clone(store[collectionName].find(r => r.id === id) || null);
    },
    async update(id, data) {
      const idx = store[collectionName].findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`${collectionName}: not found`);
      store[collectionName][idx] = { ...store[collectionName][idx], ...data };
      return clone(store[collectionName][idx]);
    },
    async delete(id) {
      const idx = store[collectionName].findIndex(r => r.id === id);
      if (idx === -1) throw new Error(`${collectionName}: not found`);
      const [removed] = store[collectionName].splice(idx, 1);
      return clone(removed);
    },
    async filter(query = {}, sort) {
      let results = store[collectionName].filter(r =>
        Object.entries(query).every(([k, v]) => r[k] === v)
      );
      if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.slice(1) : sort;
        results.sort((a, b) => {
          if (a[field] < b[field]) return desc ? 1 : -1;
          if (a[field] > b[field]) return desc ? -1 : 1;
          return 0;
        });
      }
      return clone(results);
    },
    async list(sort, limit) {
      let results = [...store[collectionName]];
      if (sort) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.slice(1) : sort;
        results.sort((a, b) => {
          if (a[field] < b[field]) return desc ? 1 : -1;
          if (a[field] > b[field]) return desc ? -1 : 1;
          return 0;
        });
      }
      if (limit) results = results.slice(0, limit);
      return clone(results);
    },
    async bulkCreate(items) {
      const results = [];
      for (const item of items) {
        const rec = { ...item, id: item.id || nextId(prefix), created_at: new Date().toISOString() };
        store[collectionName].push(rec);
        results.push(clone(rec));
      }
      return results;
    },
    subscribe(callback) {
      return () => {};
    },
  };
}

export const mockBase44 = {
  entities: {
    Patient: createEntityMock('patients', 'pat'),
    Appointment: createEntityMock('appointments', 'apt'),
    Payment: createEntityMock('payments', 'pay'),
    TreatmentSession: createEntityMock('sessions', 'sess'),
    Expense: createEntityMock('expenses', 'exp'),
    Attachment: createEntityMock('attachments', 'att'),
    PatientFile: createEntityMock('patientFiles', 'pf'),
    Task: createEntityMock('tasks', 'task'),
    Activity: createEntityMock('activities', 'act'),
    Invoice: createEntityMock('invoices', 'inv'),
    ReminderSettings: createEntityMock('reminderSettings', 'rs'),
    ClinicClosure: createEntityMock('clinicClosures', 'cc'),
    DigitalInvoiceSettings: createEntityMock('digitalInvoiceSettings', 'dis'),
    SyncLog: createEntityMock('syncLogs', 'sl'),
    Query: createEntityMock('queries', 'q'),
  },

  functions: {
    async invoke(name, payload) {
      if (name === 'sendDigitalInvoice') return { ok: true, queued: true };
      if (name === 'sendTelegramMessage') return { ok: true };
      return { ok: true };
    },
  },

  auth: {
    async login() { return { ok: true }; },
    async logout() { return { ok: true }; },
    async getUser() { return null; },
  },

  integrations: {
    Core: {
      async InvokeLLM() { return { result: 'mock' }; },
      async SendEmail() { return { ok: true }; },
      async SendSMS() { return { ok: true }; },
      async UploadFile() { return { ok: true, url: 'mock://file' }; },
      async GenerateImage() { return { ok: true }; },
      async ExtractDataFromUploadedFile() { return { ok: true }; },
    },
  },

  __store: store,
};

export default mockBase44;

// Seed minimal data for local development convenience
(() => {
  if (store.patients.length === 0) {
    const pat = { id: 'pat_0', full_name: 'דנה לוי', billing_model: 'per_session', session_price: 250, activity_status: 'active' };
    store.patients.push(pat);
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const apt = {
      id: 'apt_0',
      patient_id: pat.id,
      patient_name: pat.full_name,
      date: dateStr,
      time: '09:00',
      duration: 45,
      status: 'מתוכנן',
      type: 'טיפול שוטף',
      reminder_sent: false,
    };
    store.appointments.push(apt);
  }
})();
