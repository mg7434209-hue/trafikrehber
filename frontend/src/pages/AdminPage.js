import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

export default function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState(null);
  const [cezalar, setCezalar] = useState([]);
  const [tab, setTab] = useState('genel');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [ydoOran, setYdoOran] = useState('');
  const [editCeza, setEditCeza] = useState(null);

  useEffect(() => { if (token) { loadStats(); loadCezalar(); } }, [token]);

  const loadStats = async () => {
    try { const d = await adminApi.getStats(token); setStats(d.stats); } catch {}
  };

  const loadCezalar = async () => {
    try { const d = await adminApi.getCezaListesi(token); setCezalar(d.cezalar || []); } catch {}
  };

  const showMsg = (m, isErr = false) => {
    setMsg({ text: m, err: isErr });
    setTimeout(() => setMsg(''), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const d = await adminApi.login(loginForm.email, loginForm.password);
      localStorage.setItem('admin_token', d.token);
      setToken(d.token);
    } catch { setLoginError('Hatalı e-posta veya şifre'); }
  };

  const handle2026Yukle = async () => {
    setLoading(true);
    try {
      const d = await adminApi.ceza2026Yukle(token);
      showMsg(`✅ ${d.eklenen} eklendi, ${d.guncellenen} güncellendi`);
      loadCezalar();
    } catch { showMsg('Hata oluştu', true); }
    setLoading(false);
  };

  const handleYdoGuncelle = async () => {
    if (!ydoOran) return;
    setLoading(true);
    try {
      const d = await adminApi.cezaYdoGuncelle(token, parseFloat(ydoOran));
      showMsg(`✅ ${d.guncellenen} ceza %${ydoOran} oranında güncellendi`);
      setYdoOran('');
      loadCezalar();
    } catch { showMsg('Hata oluştu', true); }
    setLoading(false);
  };

  const handle2026MakaleGuncelle = async () => {
    setLoading(true);
    try {
      const d = await adminApi.articles2026Guncelle(token);
      showMsg(`✅ ${d.guncellenen_makale} makalede 2025 → 2026 güncellendi`);
    } catch { showMsg('Hata oluştu', true); }
    setLoading(false);
  };

  const handleCezaGuncelle = async () => {
    if (!editCeza) return;
    setLoading(true);
    try {
      await adminApi.updateCeza(token, editCeza.id, {
        aciklama: editCeza.aciklama,
        taban_ceza_tl: parseFloat(editCeza.taban_ceza_tl),
        puan: parseInt(editCeza.puan),
        kanun_maddesi: editCeza.kanun_maddesi,
      });
      showMsg('✅ Ceza güncellendi');
      setEditCeza(null);
      loadCezalar();
    } catch { showMsg('Hata oluştu', true); }
    setLoading(false);
  };

  // ── Login ekranı ──
  if (!token) return (
    <div style={{ minHeight: '100vh', background: '#f4f7fc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(26,58,107,0.1)', padding: '40px 36px', width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: '#1a3a6b', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 auto 12px' }}>T</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a3a6b' }}>Admin Paneli</h1>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>E-posta</label>
            <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none' }} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Şifre</label>
            <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '11px 14px', fontSize: 14, outline: 'none' }} required />
          </div>
          {loginError && <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>{loginError}</div>}
          <button type="submit" style={{ width: '100%', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Giriş Yap</button>
        </form>
      </div>
    </div>
  );

  // ── Admin paneli ──
  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fc' }}>
      {/* Header */}
      <div style={{ background: '#1a3a6b', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>🛡 TrafikRehber Admin</div>
        <button onClick={() => { localStorage.removeItem('admin_token'); setToken(''); }}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>Çıkış</button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

        {/* Mesaj */}
        {msg && (
          <div style={{ background: msg.err ? '#fee2e2' : '#dcfce7', color: msg.err ? '#b91c1c' : '#166534', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
            {msg.text}
          </div>
        )}

        {/* İstatistikler */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              ['📰', stats.total_articles, 'Yayındaki Makale'],
              ['📄', stats.total_dilekce, 'Dilekçe Şablonu'],
              ['👁', stats.total_views, 'Toplam Görüntülenme'],
              ['⚖️', stats.total_ceza || 17, 'Ceza Türü'],
            ].map(([icon, val, label]) => (
              <div key={label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '18px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22 }}>{icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b', margin: '4px 0' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sekmeler */}
        <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 4, marginBottom: 20 }}>
          {[['genel', '🏠 Genel'], ['makaleler', '📰 Makaleler'], ['cezalar', '⚖️ Ceza Yönetimi']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, background: tab === key ? '#1a3a6b' : 'transparent',
              color: tab === key ? '#fff' : '#64748b',
              border: 'none', borderRadius: 7, padding: '9px 12px',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
            }}>{label}</button>
          ))}
        </div>

        {/* ── GENEL SEKMESİ ── */}
        {tab === 'genel' && stats && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a6b', marginBottom: 16 }}>🔥 En Çok Okunan Sayfalar</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0', width: 32 }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Sayfa</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Görüntülenme</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top_pages.map((p, i) => (
                    <tr key={p.slug}>
                      <td style={{ padding: '12px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{i + 1}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.slug}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#e65c00', borderBottom: '1px solid #f1f5f9' }}>{p.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MAKALELER SEKMESİ ── */}
        {tab === 'makaleler' && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a3a6b', marginBottom: 6 }}>📝 Toplu Makale Güncelleme</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Tüm makale başlıklarında, meta açıklamalarında ve içeriklerinde geçen <strong>"2025"</strong> ifadesini <strong>"2026"</strong> olarak günceller. Slug'lara dokunmaz.
            </p>
            <button onClick={handle2026MakaleGuncelle} disabled={loading} style={{
              background: '#059669', color: '#fff', border: 'none', borderRadius: 8,
              padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}>
              {loading ? '⏳ İşleniyor...' : '🔄 2025 → 2026 Toplu Güncelle'}
            </button>
          </div>
        )}

        {/* ── CEZA SEKMESİ ── */}
        {tab === 'cezalar' && (
          <div>
            {/* İşlem butonları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
              {/* 2026 Yükle */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a3a6b', marginBottom: 6 }}>📦 2026 Değerlerini Yükle</div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>7574 sayılı Kanun + %25,49 YDO dahil 17 ceza türü</p>
                <button onClick={handle2026Yukle} disabled={loading} style={{ background: '#e65c00', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? '⏳...' : '🚀 Yükle'}
                </button>
              </div>
              {/* YDO Güncelle */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a3a6b', marginBottom: 6 }}>📈 YDO ile Güncelle</div>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Tüm cezalara % oran ekle</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={ydoOran} onChange={e => setYdoOran(e.target.value)}
                    placeholder="25.49" step="0.01" min="0"
                    style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 7, padding: '9px 12px', fontSize: 13, outline: 'none' }} />
                  <button onClick={handleYdoGuncelle} disabled={loading || !ydoOran} style={{ background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: (!ydoOran || loading) ? 0.5 : 1 }}>
                    Uygula
                  </button>
                </div>
              </div>
            </div>

            {/* Ceza Listesi */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, fontSize: 14, color: '#1a3a6b' }}>
                ⚖️ Ceza Türleri ({cezalar.length})
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Kod', 'İhlal', 'Taban Ceza', 'Puan', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Taban Ceza' || h === 'Puan' ? 'right' : 'left', color: '#64748b', fontWeight: 700, fontSize: 11, letterSpacing: '0.4px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cezalar.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>{c.kod}</td>
                        <td style={{ padding: '12px 14px', color: '#1e293b' }}>{c.aciklama}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#e65c00' }}>{c.taban_ceza_tl.toLocaleString('tr-TR')} ₺</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', color: c.puan < 0 ? '#b91c1c' : '#64748b', fontWeight: c.puan < 0 ? 700 : 400 }}>{c.puan < 0 ? c.puan : '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => setEditCeza({ ...c })} style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: '#1a3a6b' }}>Düzenle</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Modal ── */}
        {editCeza && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: '100%', maxWidth: 440 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#1a3a6b', marginBottom: 18 }}>Ceza Düzenle — {editCeza.kod}</h3>
              {[
                ['İhlal Açıklaması', 'aciklama', 'text'],
                ['Taban Ceza (₺)', 'taban_ceza_tl', 'number'],
                ['Puan', 'puan', 'number'],
                ['Kanun Maddesi', 'kanun_maddesi', 'text'],
              ].map(([label, field, type]) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input type={type} value={editCeza[field] || ''} onChange={e => setEditCeza({ ...editCeza, [field]: e.target.value })}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleCezaGuncelle} disabled={loading} style={{ flex: 1, background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {loading ? '⏳...' : '💾 Kaydet'}
                </button>
                <button onClick={() => setEditCeza(null)} style={{ flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
