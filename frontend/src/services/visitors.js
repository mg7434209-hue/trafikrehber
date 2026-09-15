import { statsApi } from './api';
let pending;
function browserId() {
  try {
    const key = 'tr_visitor_id';
    let id = localStorage.getItem(key);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '')) {
      id = window.crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch { return null; }
}
export function registerVisitor() {
  if (!pending) {
    const id = browserId();
    pending = (id ? statsApi.recordVisit(id) : statsApi.getVisitors()).catch(error => { pending = null; throw error; });
  }
  return pending;
}
