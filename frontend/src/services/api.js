const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = {
  async get(path, token = null) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}${path}`, { headers });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async post(path, body, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async put(path, body, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async delete(path, token = null) {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers });
    return res.json();
  }
};

export const articlesApi = {
  getAll: (page = 1, category = null) =>
    api.get(`/api/articles?page=${page}${category ? `&category=${category}` : ''}`),
  getFeatured: () => api.get('/api/articles/featured'),
  getBySlug: (slug) => api.get(`/api/articles/${slug}`),
  getByCategory: (cat) => api.get(`/api/articles/category/${cat}`),
  search: (q) => api.get(`/api/articles/search?q=${encodeURIComponent(q)}`),
};

export const dilekceApi = {
  getAll: (kategori = null) =>
    api.get(`/api/dilekce${kategori ? `?kategori=${kategori}` : ''}`),
  getBySlug: (slug) => api.get(`/api/dilekce/${slug}`),
  downloadUrl: (slug) => `${API_URL}/api/dilekce/${slug}/download`,
};

export const cezaApi = {
  getAll: () => api.get('/api/ceza-turleri'),
  hesapla: (id) => api.get(`/api/ceza-turleri/${id}/hesapla`),
};

export const chatApi = {
  send: (message, conversation_id) =>
    api.post('/api/chat/send', { message, conversation_id }),
  getHistory: (id) => api.get(`/api/chat/history/${id}`),
  deleteHistory: (id) => api.delete(`/api/chat/history/${id}`),
};

export const statsApi = {
  getPublic: () => api.get('/api/stats/public'),
};

export const adminApi = {
  login: (email, password) =>
    api.post('/api/admin/login', { email, password }),

  getStats: (token) =>
    api.get('/api/admin/stats', token),

  // Makaleler
  articles2026Guncelle: (token) =>
    api.post('/api/admin/articles-2026-guncelle', {}, token),

  // Ceza türleri
  getCezaListesi: (token) =>
    api.get('/api/admin/ceza-listesi', token),
  updateCeza: (token, id, data) =>
    api.put(`/api/admin/ceza-turleri/${id}`, data, token),
  ceza2026Yukle: (token) =>
    api.post('/api/admin/ceza-2026-yukle', {}, token),
  cezaYdoGuncelle: (token, oran) =>
    api.post('/api/admin/ceza-ydo-guncelle', { oran }, token),
};

export default api;
