import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL || '';

const KATEGORI_RENK = {
  'itiraz':    { color: '#1a3a6b', bg: '#e0e7ff' },
  'ihlal':     { color: '#b91c1c', bg: '#fee2e2' },
  'sigorta':   { color: '#0e7490', bg: '#e0f2fe' },
  'ehliyet':   { color: '#7c3aed', bg: '#ede9fe' },
  'genel':     { color: '#374151', bg: '#f3f4f6' },
};

function kategoriRenk(kat) {
  return KATEGORI_RENK[kat?.toLowerCase()] || KATEGORI_RENK['genel'];
}

export default function DilekceListPage() {
  const [dilekce, setDilekce] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState('');

  useEffect(() => {
    fetch(`${API}/api/dilekce-sablonlari`)
      .then(r => r.json())
      .then(data => {
        if (data.sablonlar) setDilekce(data.sablonlar);
        else if (Array.isArray(data)) setDilekce(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtreliDilekce = useMemo(() => {
    if (!arama.trim()) return dilekce;
    const q = arama.toLowerCase();
    return dilekce.filter(d =>
      d.baslik.toLowerCase().includes(q) ||
      (d.aciklama || '').toLowerCase().includes(q) ||
      (d.kategori || '').toLowerCase().includes(q) ||
      (d.ilgili_kanun || '').toLowerCase().includes(q)
    );
  }, [dilekce, arama]);

  return (
    <>
      <Helmet>
        <title>Trafik Cezası İtiraz Dilekçe Örnekleri 2026 | Ücretsiz Şablonlar</title>
        <meta name="description" content="2026 trafik cezası itiraz dilekçesi örnekleri. Hız ihlali, kırmızı ışık, park cezası ve daha fazlası için hazır dilekçe şablonları." />
      </Helmet>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a3a6b', margin: '0 0 8px' }}>
            Trafik Cezası İtiraz Dilekçe Örnekleri
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Trafik cezasına itiraz etmek için hazır dilekçe şablonları. Bilgileri doldurun, indirin.
            İtiraz süresi ceza tebliğinden itibaren <strong>15 gündür</strong>.
          </p>
        </div>

        {/* Bilgi bandı */}
        <div style={{ background: '#fff8e6', border: '1px solid #fbbf24', borderRadius: 8, padding: '11px 16px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
          ⚖️ İtiraz dilekçenizi <strong>Trafik Para Cezası Karar Tutanağı</strong>'nı düzenleyen birime (trafik müdürlüğü veya emniyet) teslim edin.
        </div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input
            type="text"
            placeholder="Dilekçe ara… (itiraz, hız, sigorta…)"
            value={arama}
            onChange={e => setArama(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          {/* Başlık satırı */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 100px 1fr 120px', padding: '10px 16px', background: '#f8faff', borderBottom: '2px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>
            <div>DİLEKÇE ADI</div>
            <div style={{ textAlign: 'center' }}>KATEGORİ</div>
            <div style={{ textAlign: 'center' }}>İLGİLİ KANUN</div>
            <div style={{ textAlign: 'center' }}>İŞLEM</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Yükleniyor…</div>
          ) : filtreliDilekce.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Sonuç bulunamadı.</div>
          ) : (
            filtreliDilekce.map((d, i) => {
              const renk = kategoriRenk(d.kategori);
              return (
                <div
                  key={d.id || d.slug}
                  style={{ display: 'grid', gridTemplateColumns: '3fr 100px 1fr 120px', padding: '12px 16px', borderBottom: i < filtreliDilekce.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', background: i % 2 === 0 ? '#fff' : '#fafbff' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff'}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{d.baslik}</div>
                    {d.aciklama && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>{d.aciklama}</div>}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ background: renk.bg, color: renk.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}>
                      {d.kategori || 'genel'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
                    {d.ilgili_kanun || '—'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {d.premium ? (
                      <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 6 }}>
                        Premium
                      </span>
                    ) : (
                      <Link
                        to={`/dilekce-ornekleri/${d.slug}`}
                        style={{ background: '#1a3a6b', color: '#fff', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                      >
                        Kullan →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 16, lineHeight: 1.6 }}>
          📌 Dilekçeler bilgilendirme amaçlıdır. Hukuki destek için bir avukata danışmanızı öneririz. ·{' '}
          <Link to="/trafik-cezalari-2026" style={{ color: '#1a3a6b' }}>2026 ceza tutarlarına bakın</Link>
        </p>
      </div>
    </>
  );
}
