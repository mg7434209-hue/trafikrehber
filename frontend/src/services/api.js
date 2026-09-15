const API_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
async function request(path, method = 'GET', body, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), path.startsWith('/api/chat') ? 45000 : 15000);
  try {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, { method, headers, signal: controller.signal, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      const error = new Error(typeof data?.detail === 'string' ? data.detail : 'Veriler yüklenemedi. Lütfen yeniden deneyin.');
      error.status = res.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Bağlantı zaman aşımına uğradı. Lütfen yeniden deneyin.');
    throw error;
  } finally { clearTimeout(timer); }
}
const api = {
  get: (path, token) => request(path, 'GET', undefined, token),
  post: (path, body, token) => request(path, 'POST', body, token),
  put: (path, body, token) => request(path, 'PUT', body, token),
  delete: (path, token) => request(path, 'DELETE', undefined, token),
};

export const articlesApi = {
  getAll: (page = 1, category = null) =>
    api.get(`/api/articles?page=${page}${category ? `&category=${encodeURIComponent(category)}` : ''}`),
  getFeatured: () => api.get('/api/articles/featured'),
  getBySlug: (slug) => api.get(`/api/articles/${encodeURIComponent(slug)}`),
  getByCategory: (cat) => api.get(`/api/articles/category/${encodeURIComponent(cat)}`),
  search: (q) => api.get(`/api/articles/search?q=${encodeURIComponent(q)}`),
};

export const dilekceApi = {
  getAll: (kategori = null) =>
    api.get(`/api/dilekce${kategori ? `?kategori=${encodeURIComponent(kategori)}` : ''}`),
  getBySlug: (slug) => api.get(`/api/dilekce/${encodeURIComponent(slug)}`),
  downloadUrl: (slug) => `${API_URL}/api/dilekce/${encodeURIComponent(slug)}/download`,
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
  getVisitors: () => api.get('/api/stats/visitors'),
  recordVisit: visitor_id => api.post('/api/stats/visit', { visitor_id }),
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
