import React, { useEffect, useState } from 'react';
import { registerVisitor } from '../services/visitors';
import Icon from './Icon';
export default function VisitorCounter() {
  const [count, setCount] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => registerVisitor().then(data => {
      if (!Number.isSafeInteger(data.total_visitors) || data.total_visitors < 1000) throw new Error('Invalid count');
      if (active) { setCount(data.total_visitors); setError(false); }
    }).catch(() => { if (active) setError(true); });
    load(); window.addEventListener('online', load);
    return () => { active = false; window.removeEventListener('online', load); };
  }, []);
  return <div className="visitor-counter" title="Başlangıç değeri 1.000’dir. Yeni tarayıcılar bir kez eklenir; yenilemeler tekrar sayılmaz."><span className="visitor-icon"><Icon name="users" size={24} /></span><div><span className="visitor-label">Toplam ziyaretçi</span><strong aria-live="polite">{count !== null ? count.toLocaleString('tr-TR') : error ? '—' : '…'}</strong></div><small>{error ? 'Sayaç şu an güncellenemiyor' : 'Başlangıç: 1.000'}</small></div>;
}
