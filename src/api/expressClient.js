/**
 * Express API client that mimics the Base44 SDK interface.
 *
 * base44.entities.EntityName.list(sort?, limit?)
 * base44.entities.EntityName.filter(query, sort?)
 * base44.entities.EntityName.get(id)
 * base44.entities.EntityName.create(data)
 * base44.entities.EntityName.update(id, data)
 * base44.entities.EntityName.delete(id)
 * base44.entities.EntityName.bulkCreate(items)
 * base44.entities.EntityName.subscribe(callback) — noop (polling via react-query)
 *
 * base44.functions.invoke(name, payload)
 */

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:4000';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function createEntityProxy(endpoint) {
  return {
    /** list(sort?, limit?) */
    async list(sort, limit) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return request(`/${endpoint}${qs ? `?${qs}` : ''}`);
    },

    /** filter(query, sort?) */
    async filter(query = {}, sort) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      if (sort) params.set('sort', sort);
      const qs = params.toString();
      return request(`/${endpoint}${qs ? `?${qs}` : ''}`);
    },

    /** get(id) */
    async get(id) {
      return request(`/${endpoint}/${id}`);
    },

    /** create(data) */
    async create(data) {
      return request(`/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /** update(id, data) */
    async update(id, data) {
      return request(`/${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    /** delete(id) */
    async delete(id) {
      return request(`/${endpoint}/${id}`, {
        method: 'DELETE',
      });
    },

    /** bulkCreate(items) */
    async bulkCreate(items) {
      return request(`/${endpoint}/bulk`, {
        method: 'POST',
        body: JSON.stringify(items),
      });
    },

    /** subscribe — no-op for REST (react-query handles polling/refetch) */
    subscribe(callback) {
      // Subscriptions not supported over REST; return unsubscribe noop
      return () => {};
    },
  };
}

export const expressBase44 = {
  entities: {
    Patient: createEntityProxy('patients'),
    Appointment: createEntityProxy('appointments'),
    Payment: createEntityProxy('payments'),
    TreatmentSession: createEntityProxy('treatment-sessions'),
    Expense: createEntityProxy('expenses'),
    Attachment: createEntityProxy('attachments'),
    PatientFile: createEntityProxy('patient-files'),
    Task: createEntityProxy('tasks'),
    Activity: createEntityProxy('activities'),
    Invoice: createEntityProxy('invoices'),
    ReminderSettings: createEntityProxy('reminder-settings'),
    ClinicClosure: createEntityProxy('clinic-closures'),
    DigitalInvoiceSettings: createEntityProxy('digital-invoice-settings'),
    SyncLog: createEntityProxy('sync-logs'),
    // Query entity — alias to a generic handler
    Query: createEntityProxy('queries'),
  },

  functions: {
    async invoke(name, payload) {
      return request(`/api/functions/${name}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  // Auth stub — no-op for self-hosted
  auth: {
    async login() { return { ok: true }; },
    async logout() { return { ok: true }; },
    async getUser() { return null; },
  },

  // Integrations stub
  integrations: {
    Core: {
      async InvokeLLM(params) {
        return request('/api/functions/invokeLLM', {
          method: 'POST',
          body: JSON.stringify(params),
        });
      },
      async SendEmail(params) {
        return request('/api/functions/sendEmail', {
          method: 'POST',
          body: JSON.stringify(params),
        });
      },
      async SendSMS(params) {
        return request('/api/functions/sendSMS', {
          method: 'POST',
          body: JSON.stringify(params),
        });
      },
      async UploadFile({ file }) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || `HTTP ${res.status}`); }
        return res.json();
      },
      async GenerateImage(params) {
        return request('/api/functions/generateImage', {
          method: 'POST',
          body: JSON.stringify(params),
        });
      },
      async ExtractDataFromUploadedFile(params) {
        return request('/api/functions/extractData', {
          method: 'POST',
          body: JSON.stringify(params),
        });
      },
    },
  },
};

export default expressBase44;
