import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL || '';

function formatTL(val) {
  return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₺';
}

function severity(tl) {
  if (tl >= 50000) return { label: 'Çok Ağır', color: '#b91c1c', bg: '#fee2e2' };
  if (tl >= 10000) return { label: 'Ağır',     color: '#c2410c', bg: '#ffedd5' };
  if (tl >= 3000)  return { label: 'Orta',     color: '#92400e', bg: '#fef3c7' };
  return              { label: 'Hafif',     color: '#166534', bg: '#dcfce7' };
}

function HesaplaModal({ ceza, onClose }) {
  const [gun, setGun] = useState(10);
  if (!ceza) return null;
  const erken = gun <= 15;
  const odenecek = erken ? ceza.indirimli_tl : ceza.taban_ceza_tl;
  const tasarruf = erken ? (ceza.taban_ceza_tl - ceza.indirimli_tl) : 0;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 17, color: '#1a3a6b' }}>Erken Ödeme Hesaplayıcı</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontWeight: 700, color: '#1a3a6b', marginBottom: 4 }}>{ceza.aciklama}</div>
        {ceza.kanun_maddesi && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{ceza.kanun_maddesi}</div>}
        <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 8, fontWeight: 600 }}>Kaçıncı günde ödeyeceksiniz?</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <input type="range" min={1} max={60} value={gun} onChange={e => setGun(Number(e.target.value))} style={{ flex: 1, accentColor: '#1a3a6b' }} />
          <span style={{ fontWeight: 800, fontSize: 18, color: erken ? '#16a34a' : '#b91c1c', minWidth: 40, textAlign: 'right' }}>{gun}.</span>
        </div>
        <div style={{ fontSize: 12, color: erken ? '#16a34a' : '#b91c1c', marginBottom: 20, fontWeight: 600 }}>
          {erken ? '✅ İndirim süresi içinde (15 gün)' : '❌ İndirim süresi doldu'}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Tam Ceza</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a3a6b' }}>{formatTL(ceza.taban_ceza_tl)}</div>
          </div>
          <div style={{ flex: 1, background: erken ? '#f0fdf4' : '#fff1f1', border: `1px solid ${erken ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Ödenecek</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: erken ? '#16a34a' : '#b91c1c' }}>{formatTL(odenecek)}</div>
            {erken && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>{formatTL(tasarruf)} tasarruf</div>}
          </div>
        </div>
        {ceza.puan > 0 && (
          <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#92400e' }}>
            ⚠️ Bu ihlalde ayrıca <strong>-{ceza.puan} ceza puanı</strong> uygulanır.
          </div>
        )}
        <Link to="/dilekce-ornekleri" onClick={onClose} style={{ display: 'block', textAlign: 'center', background: '#f0f4ff', color: '#1a3a6b', padding: '11px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
          İtiraz Dilekçesi Hazırla →
        </Link>
      </div>
    </div>
  );
}

export default function CezaListesiPage() {
  const [cezalar, setCezalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState('');
  const [hesaplaModal, setHesaplaModal] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/ceza-turleri`)
      .then(r => r.json())
      .then(data => {
        if (data.cezalar) {
          setCezalar(data.cezalar.map(c => ({
            ...c,
            taban_ceza_tl: parseFloat(c.taban_ceza_tl),
            indirimli_tl: c.indirimli_tl ?? Math.round(parseFloat(c.taban_ceza_tl) * 0.75 * 100) / 100,
            puan: c.puan || 0,
          })));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtreliCezalar = useMemo(() => {
    let list = [...cezalar];
    if (arama.trim()) {
      const q = arama.toLowerCase();
      list = list.filter(c =>
        c.aciklama.toLowerCase().includes(q) ||
        c.kod.toLowerCase().includes(q) ||
        (c.kanun_maddesi || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.taban_ceza_tl - a.taban_ceza_tl);
  }, [cezalar, arama]);

  return (
    <>
      <Helmet>
        <title>2026 Trafik Cezaları Güncel Liste | Tüm Tutarlar</title>
        <meta name="description" content="2026 yılı güncel trafik cezaları tam listesi. Kırmızı ışık, hız, alkol ve tüm ihlaller için ceza tutarları ve erken ödeme indirimi." />
      </Helmet>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a3a6b', margin: '0 0 8px' }}>
            2026 Trafik Cezaları Güncel Liste
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            27 Şubat 2026 tarihli 7574 sayılı Kanun ve %25,49 Yeniden Değerleme Oranı kapsamında güncellenmiştir.
            Tebliğden itibaren <strong>15 gün içinde ödeme</strong> yapıldığında <strong>%25 indirim</strong> uygulanır.
          </p>
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder="İhlal ara… (hız, alkol, park, telefon…)"
            value={arama}
            onChange={e => setArama(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 70px 80px 140px', padding: '10px 16px', background: '#f8faff', borderBottom: '2px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>
            <div>İHLAL</div>
            <div style={{ textAlign: 'right' }}>TAM CEZA</div>
            <div style={{ textAlign: 'right' }}>15 GÜNDE</div>
            <div style={{ textAlign: 'center' }}>PUAN</div>
            <div style={{ textAlign: 'center' }}>SEVİYE</div>
            <div style={{ textAlign: 'center' }}>İŞLEM</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Yükleniyor…</div>
          ) : filtreliCezalar.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Sonuç bulunamadı.</div>
          ) : (
            filtreliCezalar.map((c, i) => {
              const sv = severity(c.taban_ceza_tl);
              return (
                <div
                  key={c.id || c.kod}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 70px 80px 140px', padding: '11px 16px', borderBottom: i < filtreliCezalar.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#fafbff' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{c.aciklama}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{c.kanun_maddesi} · {c.kod}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: c.taban_ceza_tl >= 10000 ? '#b91c1c' : '#1a3a6b' }}>
                    {formatTL(c.taban_ceza_tl)}
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 600, fontSize: 14, color: '#16a34a' }}>
                    {formatTL(c.indirimli_tl)}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {c.puan > 0
                      ? <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>-{c.puan}</span>
                      : <span style={{ color: '#cbd5e1' }}>—</span>
                    }
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ background: sv.bg, color: sv.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>{sv.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button
                      onClick={() => setHesaplaModal(c)}
                      style={{ background: '#f0f4ff', color: '#1a3a6b', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Hesapla
                    </button>
                    <Link
                      to="/dilekce-ornekleri"
                      style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                    >
                      İtiraz →
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16, lineHeight: 1.6 }}>
          📌 Kaynak: 2918 sayılı KTK, 7574 sayılı Kanun (RG: 27.02.2026/33181). Bilgilendirme amaçlıdır.
          Resmi kaynak: <a href="https://trafik.gov.tr" target="_blank" rel="noreferrer" style={{ color: '#1a3a6b' }}>trafik.gov.tr</a> ·{' '}
          Cezanıza itiraz için <Link to="/dilekce-ornekleri" style={{ color: '#1a3a6b' }}>dilekçe şablonlarımızı</Link> kullanabilirsiniz.
        </p>
      </div>

      <HesaplaModal ceza={hesaplaModal} onClose={() => setHesaplaModal(null)} />
    </>
  );
}
