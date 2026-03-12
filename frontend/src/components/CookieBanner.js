import React, { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setShow(true);
  }, []);

  const accept = () => { localStorage.setItem('cookie_consent', 'true'); setShow(false); };
  const reject = () => { localStorage.setItem('cookie_consent', 'false'); setShow(false); };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#1a2744', color: '#fff', padding: '16px 20px',
      display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
    }}>
      <p style={{ flex: 1, fontSize: 14, margin: 0, minWidth: 200 }}>
        🍪 Bu site analitik çerezler kullanmaktadır. Daha iyi bir deneyim için çerezleri kabul edebilirsiniz.{' '}
        <a href="/gizlilik-politikasi" style={{ color: '#ffd700' }}>Gizlilik Politikası</a>
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={reject} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Reddet</button>
        <button onClick={accept} style={{ padding: '8px 16px', background: '#e65c00', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Kabul Et</button>
      </div>
    </div>
  );
}
