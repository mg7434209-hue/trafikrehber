const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = {
  async get(path) {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async delete(path) {
    const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' });
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

export default api;
