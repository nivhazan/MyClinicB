// Lightweight in-memory mock of base44.entities + functions
// Enabled for local dev when VITE_USE_FAKE_DB is truthy.
const makeStore = () => ({
  patients: [],
  appointments: [],
  payments: [],
  sessions: [],
  seq: 1,
});

const store = makeStore();

const nextId = (prefix) => `${prefix}_${store.seq++}`;

const clone = (o) => JSON.parse(JSON.stringify(o));

export const mockBase44 = {
  entities: {
    Patient: {
      async create(data) {
        const rec = { ...data, id: data.id || nextId('pat') };
        store.patients.push(rec);
        return clone(rec);
      },
      async get(id) {
        return clone(store.patients.find(p => p.id === id) || null);
      }
    },

    Appointment: {
      async create(data) {
        const rec = { ...data, id: data.id || nextId('apt') };
        store.appointments.push(rec);
        return clone(rec);
      },
      async get(id) {
        return clone(store.appointments.find(a => a.id === id) || null);
      },
      async update(id, data) {
        const idx = store.appointments.findIndex(a => a.id === id);
        if (idx === -1) throw new Error('Appointment not found');
        store.appointments[idx] = { ...store.appointments[idx], ...data };
        return clone(store.appointments[idx]);
      },
      async delete(id) {
        const idx = store.appointments.findIndex(a => a.id === id);
        if (idx === -1) throw new Error('Appointment not found');
        const [removed] = store.appointments.splice(idx, 1);
        return clone(removed);
      },
      async filter(query = {}) {
        return clone(store.appointments.filter(apt => {
          return Object.entries(query).every(([k, v]) => apt[k] === v);
        }));
      }
    },

    TreatmentSession: {
      async create(data) {
        const rec = { ...data, id: nextId('sess') };
        store.sessions.push(rec);
        return clone(rec);
      }
    },

    Payment: {
      async create(data) {
        const now = new Date().toISOString();
        const rec = {
          ...data,
          id: data.id || nextId('pay'),
          status: data.status || 'paid',
          created_at: data.created_at || now,
          payment_date: data.payment_date || now
        };
        store.payments.push(rec);
        return clone(rec);
      },
      async filter(query = {}) {
        return clone(store.payments.filter(p => {
          return Object.entries(query).every(([k, v]) => p[k] === v);
        }));
      },
      async get(id) {
        return clone(store.payments.find(p => p.id === id) || null);
      }
    }
  },

  functions: {
    async invoke(name, payload) {
      // Basic non-blocking mocks for integrations
      if (name === 'sendDigitalInvoice') {
        // pretend we queued an invoice
        return { ok: true, queued: true };
      }
      if (name === 'sendTelegramMessage') return { ok: true };
      return { ok: true };
    }
  },

  // expose the in-memory store for tests / inspection
  __store: store
};

export default mockBase44;

// Seed minimal data for local development convenience
(() => {
  if (store.patients.length === 0) {
    const pat = { id: 'pat_0', full_name: 'דנה לוי', billing_model: 'per_session', session_price: 250 };
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
      type: 'טיפול שוטף'
    };
    store.appointments.push(apt);
  }
})();
