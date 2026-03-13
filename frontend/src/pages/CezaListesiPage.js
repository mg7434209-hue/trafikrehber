import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL || '';

// ─── Sabitler ──────────────────────────────────────────────
const KATEGORI_MAP = {
  hiz:     { label: 'Hız İhlali',   emoji: '💨', kodlar: ['H2','H3','H3B'] },
  alkol:   { label: 'Alkol/Uyuşturucu', emoji: '🍺', kodlar: ['H7','H7B'] },
  tehlike: { label: 'Tehlikeli Sürüş', emoji: '⚠️', kodlar: ['H12','H13'] },
  belge:   { label: 'Belge/Ehliyet', emoji: '📋', kodlar: ['H11'] },
  diger:   { label: 'Diğer İhlaller', emoji: '🚦', kodlar: ['H1','H4','H5','H6','H8','H9','H10','H14','H15'] },
};

// ─── Yardımcılar ───────────────────────────────────────────
function formatTL(val) {
  return Number(val).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₺';
}

function severity(tl) {
  if (tl >= 50000) return { label: 'Çok Ağır', color: '#b91c1c', bg: '#fee2e2' };
  if (tl >= 10000) return { label: 'Ağır',     color: '#c2410c', bg: '#ffedd5' };
  if (tl >= 3000)  return { label: 'Orta',     color: '#92400e', bg: '#fef3c7' };
  return              { label: 'Hafif',     color: '#166534', bg: '#dcfce7' };
}

// ─── Ceza Kartı ────────────────────────────────────────────
function CezaKart({ c, onHesapla }) {
  const sv = severity(c.taban_ceza_tl);
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e8ecf4',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: '0 2px 8px rgba(26,58,107,0.06)',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,58,107,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,58,107,0.06)'; }}
    >
      {/* Üst satır */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>{c.kod}</span>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a3a6b', marginTop: 2, lineHeight: 1.3 }}>{c.aciklama}</div>
          {c.kanun_maddesi && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{c.kanun_maddesi}</div>}
        </div>
        <span style={{ background: sv.bg, color: sv.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {sv.label}
        </span>
      </div>

      {/* Ceza tutarları */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: '#f0f4ff', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Tam Ceza</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.taban_ceza_tl >= 10000 ? '#b91c1c' : '#1a3a6b' }}>
            {formatTL(c.taban_ceza_tl)}
          </div>
        </div>
        <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>15 Günde Öde</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
            {formatTL(c.indirimli_tl)}
          </div>
        </div>
      </div>

      {/* Alt bilgiler */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {c.puan > 0 && (
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              🎯 -{c.puan} puan
            </span>
          )}
          <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
            💰 %25 tasarruf
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onHesapla(c)}
            style={{ background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Hesapla
          </button>
          <Link
            to="/dilekce-ornekleri"
            style={{ background: '#f0f4ff', color: '#1a3a6b', textDecoration: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
          >
            İtiraz →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Hesaplayıcı Modal ─────────────────────────────────────
function HesaplaModal({ ceza, onClose }) {
  const [gun, setGun] = useState(10);
  if (!ceza) return null;

  const erken = gun <= 15;
  const odenecek = erken ? ceza.indirimli_tl : ceza.taban_ceza_tl;
  const tasarruf = erken ? (ceza.taban_ceza_tl - ceza.indirimli_tl) : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#1a3a6b', margin: 0, fontSize: 18 }}>💰 Erken Ödeme Hesaplayıcı</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>

        <div style={{ background: '#f0f4ff', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: '#1a3a6b', fontSize: 15 }}>{ceza.aciklama}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{ceza.kanun_maddesi}</div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Ceza tebliğinden kaç gün sonra ödeyeceksiniz?
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={1} max={60} value={gun}
              onChange={e => setGun(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#1a3a6b' }}
            />
            <span style={{
              minWidth: 50, textAlign: 'center', fontWeight: 800, fontSize: 18,
              color: gun <= 15 ? '#16a34a' : '#b91c1c'
            }}>{gun}. gün</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {gun <= 15 ? '✅ İndirim süresi içinde!' : '❌ İndirim süresi dolmuş (15 gün geçti)'}
          </div>
        </div>

        <div style={{ background: erken ? '#f0fdf4' : '#fef2f2', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Ödenecek Tutar</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: erken ? '#16a34a' : '#b91c1c' }}>
            {formatTL(odenecek)}
          </div>
          {erken && (
            <div style={{ fontSize: 13, color: '#16a34a', marginTop: 6, fontWeight: 600 }}>
              🎉 {formatTL(tasarruf)} tasarruf ediyorsunuz!
            </div>
          )}
        </div>

        {ceza.puan > 0 && (
          <div style={{ background: '#fef3c7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            ⚠️ Bu cezada ayrıca <strong>-{ceza.puan} ceza puanı</strong> uygulanır. 100 puana ulaşırsanız ehliyetinize el konulur.
          </div>
        )}

        <Link
          to="/dilekce-ornekleri"
          onClick={onClose}
          style={{ display: 'block', background: '#f0f4ff', color: '#1a3a6b', textAlign: 'center', padding: '12px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
        >
          📄 İtiraz Dilekçesi Hazırla →
        </Link>
      </div>
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────
export default function CezaListesiPage() {
  const [cezalar, setCezalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [arama, setArama] = useState('');
  const [aktifKat, setAktifKat] = useState('tumu');
  const [hesaplaModal, setHesaplaModal] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/ceza-turleri`)
      .then(r => r.json())
      .then(data => {
        if (data.cezalar) {
          // indirimli_tl hesapla (public endpoint'te yoksa)
          const list = data.cezalar.map(c => ({
            ...c,
            taban_ceza_tl: parseFloat(c.taban_ceza_tl),
            indirimli_tl: c.indirimli_tl ?? Math.round(parseFloat(c.taban_ceza_tl) * 0.75 * 100) / 100,
            puan: c.puan || 0,
          }));
          setCezalar(list);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtreliCezalar = useMemo(() => {
    let list = cezalar;
    if (aktifKat !== 'tumu') {
      const kodlar = KATEGORI_MAP[aktifKat]?.kodlar || [];
      list = list.filter(c => kodlar.includes(c.kod));
    }
    if (arama.trim()) {
      const q = arama.toLowerCase();
      list = list.filter(c =>
        c.aciklama.toLowerCase().includes(q) ||
        c.kod.toLowerCase().includes(q) ||
        (c.kanun_maddesi || '').toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.taban_ceza_tl - a.taban_ceza_tl);
  }, [cezalar, aktifKat, arama]);

  const toplamCeza = cezalar.length;
  const enYuksek = cezalar.reduce((m, c) => c.taban_ceza_tl > m ? c.taban_ceza_tl : m, 0);

  return (
    <>
      <Helmet>
        <title>2026 Trafik Cezaları Güncel Liste | Tüm Tutarlar ve Erken Ödeme İndirimi</title>
        <meta name="description" content="2026 yılı güncel trafik cezaları listesi. Kırmızı ışık, hız ihlali, alkollü araç kullanma ve tüm cezaların tutarları. Erken ödeme indirimi hesaplayıcı." />
      </Helmet>

      <div style={{ background: '#f4f7fc', minHeight: '100vh' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #0f2347 100%)', color: '#fff', padding: '48px 20px 40px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 14 }}>
              📅 27 ŞUBAT 2026 TARİHLİ 7574 SAYILI KANUN
            </div>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
              2026 Güncel Trafik Cezaları
            </h1>
            <p style={{ fontSize: 16, opacity: 0.8, margin: '0 0 28px', maxWidth: 560 }}>
              Tüm ceza tutarları, erken ödeme indirimleri ve ceza puanları. 15 gün içinde ödeyin, %25 tasarruf edin.
            </p>

            {/* Özet istatistikler */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Ceza Türü', val: toplamCeza, icon: '⚖️' },
                { label: 'En Yüksek Ceza', val: formatTL(enYuksek), icon: '🚨' },
                { label: 'Erken Ödeme İndirimi', val: '%25', icon: '💰' },
                { label: 'İndirim Süresi', val: '15 Gün', icon: '📅' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 18px', backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>{s.icon} {s.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 17 }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 16px' }}>

          {/* Arama + Filtre */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(26,58,107,0.07)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
              <input
                type="text"
                placeholder="Ceza ara… (hız, alkol, park…)"
                value={arama}
                onChange={e => setArama(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 10, border: '2px solid #e8ecf4', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => setAktifKat('tumu')}
                style={{ padding: '8px 14px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: aktifKat === 'tumu' ? '#1a3a6b' : '#f0f4ff', color: aktifKat === 'tumu' ? '#fff' : '#1a3a6b' }}
              >
                Tümü ({toplamCeza})
              </button>
              {Object.entries(KATEGORI_MAP).map(([key, kat]) => (
                <button key={key}
                  onClick={() => setAktifKat(key)}
                  style={{ padding: '8px 14px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', background: aktifKat === key ? '#1a3a6b' : '#f0f4ff', color: aktifKat === key ? '#fff' : '#1a3a6b' }}
                >
                  {kat.emoji} {kat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bilgi bandı */}
          <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
            💡 Tebliğ tarihinden itibaren <strong>15 gün içinde ödeme</strong> yaparsanız cezanın <strong>%25'i indirimli</strong> uygulanır. Hesaplayıcıyı kullanın!
          </div>

          {/* Ceza Kartları */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>⏳ Yükleniyor…</div>
          ) : filtreliCezalar.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 }}>Sonuç bulunamadı.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
              {filtreliCezalar.map(c => (
                <CezaKart key={c.id || c.kod} c={c} onHesapla={setHesaplaModal} />
              ))}
            </div>
          )}

          {/* Alt bilgi */}
          <div style={{ marginTop: 32, background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e8ecf4', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#1a3a6b' }}>📌 Yasal Dayanaklar:</strong> 2918 sayılı Karayolları Trafik Kanunu, 12.02.2026 tarihli 7574 sayılı Kanun (RG: 27.02.2026/33181), %25,49 Yeniden Değerleme Oranı. Ceza tutarları bilgilendirme amaçlıdır; resmi kaynak için <a href="https://trafik.gov.tr" target="_blank" rel="noreferrer" style={{ color: '#1a3a6b' }}>trafik.gov.tr</a> adresini ziyaret edin.
          </div>
        </div>
      </div>

      <HesaplaModal ceza={hesaplaModal} onClose={() => setHesaplaModal(null)} />
    </>
  );
}
