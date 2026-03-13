import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';

const API = process.env.REACT_APP_BACKEND_URL || '';

function api(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  return fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  }).then(r => r.json());
}

// ─── Renkler ───────────────────────────────────────────────
const C = {
  navy: '#1a3a6b',
  green: '#2d7a2d',
  orange: '#e65c00',
  red: '#c0392b',
  bg: '#f4f7fc',
  border: '#e2e8f0',
  white: '#fff',
};

const card = { background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 24 };
const btn = (bg = C.navy) => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 8,
  padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
});

// ─── Login ─────────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true); setError('');
    const res = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.success) { localStorage.setItem('admin_token', res.token); onLogin(); }
    else setError('Hatalı e-posta veya şifre.');
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...card, width: 360, margin: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32 }}>🛡️</div>
          <h2 style={{ color: C.navy, marginTop: 8 }}>Admin Girişi</h2>
          <p style={{ color: '#888', fontSize: 14 }}>TrafikRehber Yönetim Paneli</p>
        </div>
        <input
          type="email" placeholder="E-posta" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `2px solid ${C.border}`, fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
        />
        <input
          type="password" placeholder="Şifre" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `2px solid ${C.border}`, fontSize: 14, marginBottom: 16, boxSizing: 'border-box', outline: 'none' }}
        />
        {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{ ...btn(C.navy), width: '100%', padding: '13px' }}>
          {loading ? 'Giriş yapılıyor...' : '🔐 Giriş Yap'}
        </button>
      </div>
    </div>
  );
}

// ─── Stat Kartı ────────────────────────────────────────────
function StatCard({ icon, label, value, color = C.navy }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Ceza Güncelleme Paneli ────────────────────────────────
function CezaGuncellePanel({ onRefresh }) {
  const [oran, setOran] = useState('');
  const [loading2026, setLoading2026] = useState(false);
  const [loadingYdo, setLoadingYdo] = useState(false);
  const [sonuc, setSonuc] = useState(null);

  const yukle2026 = async () => {
    if (!window.confirm('2026 güncel ceza tutarları yüklensin mi? Mevcut değerler güncellenecek.')) return;
    setLoading2026(true); setSonuc(null);
    const res = await api('/api/admin/ceza-2026-yukle', { method: 'POST' });
    setLoading2026(false);
    setSonuc(res.success
      ? { type: 'success', msg: res.mesaj }
      : { type: 'error', msg: res.detail || 'Hata oluştu.' });
    if (res.success) onRefresh();
  };

  const ydoGuncelle = async () => {
    const o = parseFloat(oran);
    if (!o || o <= 0 || o > 200) { alert('Geçerli bir oran girin (örn: 25.49)'); return; }
    if (!window.confirm(`Tüm cezalar %${o} artırılsın mı?`)) return;
    setLoadingYdo(true); setSonuc(null);
    const res = await api('/api/admin/ceza-ydo-guncelle', {
      method: 'POST',
      body: JSON.stringify({ oran: o }),
    });
    setLoadingYdo(false);
    setSonuc(res.success
      ? { type: 'success', msg: `${res.guncellenen_sayisi} ceza %${o} artırıldı.` }
      : { type: 'error', msg: res.detail || 'Hata oluştu.' });
    if (res.success) { setOran(''); onRefresh(); }
  };

  return (
    <div style={card}>
      <h3 style={{ color: C.navy, marginBottom: 6, fontSize: 17 }}>💰 Ceza Tutarları Yönetimi</h3>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Her yıl Ocak ayında Yeniden Değerleme Oranı (YDO) açıklanır. Oranı girerek tüm cezaları tek tıkla güncelleyebilirsiniz.
      </p>

      {/* 2026 Yükle */}
      <div style={{ background: '#fff8e6', border: `1px solid #f59e0b`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚡ 2026 Güncel Değerleri Yükle</div>
        <p style={{ fontSize: 13, color: '#92400e', marginBottom: 12 }}>
          27 Şubat 2026 tarihli 7574 sayılı Kanun kapsamında güncel tutarlar (kırmızı ışık 5.000 TL, cep telefonu 5.000 TL, saldırgan sürüş 180.000 TL vb.)
        </p>
        <button onClick={yukle2026} disabled={loading2026} style={btn('#92400e')}>
          {loading2026 ? '⏳ Yükleniyor...' : '📥 2026 Değerlerini Yükle'}
        </button>
      </div>

      {/* YDO ile Güncelle */}
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ fontWeight: 700, color: C.navy, marginBottom: 6 }}>📊 YDO Oranıyla Güncelle</div>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
          Gelecek yıllarda kullanın. Yeniden Değerleme Oranını girin, tüm cezalar otomatik hesaplanır.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="number" step="0.01" placeholder="25.49" value={oran}
              onChange={e => setOran(e.target.value)}
              style={{ padding: '10px 36px 10px 14px', borderRadius: 8, border: `2px solid ${C.border}`, fontSize: 15, width: 120, outline: 'none' }}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 16 }}>%</span>
          </div>
          <button onClick={ydoGuncelle} disabled={loadingYdo} style={btn(C.green)}>
            {loadingYdo ? '⏳ Güncelleniyor...' : '✅ Tüm Cezaları Güncelle'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
          Örnek: 2025 YDO = %25.49 → 3.956 TL ceza → 4.963 TL olur
        </p>
      </div>

      {sonuc && (
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 8,
          background: sonuc.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: sonuc.type === 'success' ? C.green : C.red,
          fontWeight: 600, fontSize: 14
        }}>
          {sonuc.type === 'success' ? '✅ ' : '❌ '}{sonuc.msg}
        </div>
      )}
    </div>
  );
}

// ─── Ceza Listesi ──────────────────────────────────────────
function CezaListesi({ cezalar, onUpdate }) {
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState('');

  const saveEdit = async (id) => {
    const v = parseFloat(editVal);
    if (!v || v <= 0) return;
    await api(`/api/admin/ceza-turleri/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ taban_ceza_tl: v }),
    });
    setEditing(null);
    onUpdate();
  };

  return (
    <div style={card}>
      <h3 style={{ color: C.navy, marginBottom: 16, fontSize: 17 }}>📋 Güncel Ceza Listesi</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.navy, color: '#fff' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Kod</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>İhlal</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Taban Ceza</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>%25 İndirimli</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Puan</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Düzenle</th>
            </tr>
          </thead>
          <tbody>
            {cezalar.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                <td style={{ padding: '9px 12px', fontWeight: 700, color: C.navy }}>{c.kod}</td>
                <td style={{ padding: '9px 12px' }}>{c.aciklama}</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700 }}>
                  {editing === c.id ? (
                    <input
                      type="number" value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(c.id)}
                      autoFocus
                      style={{ width: 100, padding: '4px 8px', borderRadius: 6, border: `2px solid ${C.navy}`, fontSize: 13, textAlign: 'right' }}
                    />
                  ) : (
                    <span style={{ color: c.taban_ceza_tl >= 10000 ? C.red : C.navy }}>
                      {c.taban_ceza_tl.toLocaleString('tr-TR')} TL
                    </span>
                  )}
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'right', color: C.green }}>
                  {c.indirimli_tl.toLocaleString('tr-TR')} TL
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                  {c.puan > 0 && <span style={{ background: '#fee2e2', color: C.red, padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>-{c.puan}</span>}
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                  {editing === c.id ? (
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button onClick={() => saveEdit(c.id)} style={{ ...btn(C.green), padding: '4px 10px', fontSize: 12 }}>✅</button>
                      <button onClick={() => setEditing(null)} style={{ ...btn('#888'), padding: '4px 10px', fontSize: 12 }}>✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(c.id); setEditVal(c.taban_ceza_tl); }}
                      style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}
                    >
                      ✏️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Ana Panel ─────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [cezalar, setCezalar] = useState([]);
  const [activeTab, setActiveTab] = useState('genel');

  const loadStats = useCallback(async () => {
    const res = await api('/api/admin/stats');
    if (res.success) setStats(res.stats);
  }, []);

  const loadCezalar = useCallback(async () => {
    const res = await api('/api/admin/ceza-listesi');
    if (res.success) setCezalar(res.cezalar);
  }, []);

  useEffect(() => { loadStats(); loadCezalar(); }, [loadStats, loadCezalar]);

  const tabs = [
    { id: 'genel', label: '📊 Genel Bakış' },
    { id: 'ceza', label: '💰 Ceza Yönetimi' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: C.navy, color: '#fff', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>TrafikRehber Admin</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Yönetim Paneli</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          🚪 Çıkış
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 28px', display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '14px 18px', fontSize: 14, fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? C.navy : '#888',
            borderBottom: activeTab === t.id ? `3px solid ${C.navy}` : '3px solid transparent',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>

        {/* Genel Bakış */}
        {activeTab === 'genel' && (
          <>
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
                <StatCard icon="📰" label="Yayındaki Makale" value={stats.total_articles} color={C.navy} />
                <StatCard icon="📄" label="Dilekçe Şablonu" value={stats.total_dilekce} color={C.green} />
                <StatCard icon="👁" label="Toplam Görüntülenme" value={stats.total_views?.toLocaleString('tr-TR')} color={C.orange} />
                <StatCard icon="⚖️" label="Ceza Türü" value={cezalar.length} color={C.red} />
              </div>
            )}
            {stats?.top_pages?.length > 0 && (
              <div style={card}>
                <h3 style={{ color: C.navy, marginBottom: 16, fontSize: 17 }}>🔥 En Çok Okunan Sayfalar</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.bg }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: C.navy }}>#</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: C.navy }}>Sayfa</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: C.navy }}>Görüntülenme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_pages.map((p, i) => (
                      <tr key={p.slug} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '8px 12px', color: '#aaa', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{p.slug}</div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: C.orange }}>
                          {(p.views || 0).toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Ceza Yönetimi */}
        {activeTab === 'ceza' && (
          <>
            <CezaGuncellePanel onRefresh={loadCezalar} />
            <CezaListesi cezalar={cezalar} onUpdate={loadCezalar} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('admin_token'));

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setLoggedIn(false);
  };

  return (
    <>
      <Helmet>
        <title>Admin Paneli — TrafikRehber</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {loggedIn
        ? <AdminDashboard onLogout={handleLogout} />
        : <LoginForm onLogin={() => setLoggedIn(true)} />
      }
    </>
  );
}
