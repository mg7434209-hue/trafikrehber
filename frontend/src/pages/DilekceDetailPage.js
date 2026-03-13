import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { dilekceApi } from '../services/api';

// Placeholder etiketini kullanıcı dostu etikete dönüştür
const PLACEHOLDER_LABELS = {
  'AD SOYAD': 'Ad Soyad',
  'TC KİMLİK NUMARASI': 'TC Kimlik Numarası',
  'TC KİMLİK': 'TC Kimlik Numarası',
  'TC KİMLİK NO': 'TC Kimlik Numarası',
  'AÇIK ADRES': 'Açık Adres',
  'ADRES': 'Adres',
  'TELEFON': 'Telefon Numarası',
  'TARİH': 'Tarih (gün/ay/yıl)',
  'ŞEHİR ADI': 'Şehir',
  'ŞEHİR': 'Şehir',
  'İL': 'İl',
  'PLAKA': 'Araç Plakası',
  'CEZA NO': 'Ceza / Tutanak Numarası',
  'CEZA TÜRÜ': 'Ceza Türü',
  'TUTAR': 'Ceza Tutarı (TL)',
  'YER': 'Yer / Konum',
  'KAZA YERİ': 'Kaza Yeri',
  'SAAT': 'Saat',
  'GEREKÇENİZ': 'Gerekçeniz',
  'BİRİNCİ GEREKÇENİZ': '1. Gerekçeniz',
  'VARSA İKİNCİ GEREKÇE': '2. Gerekçeniz (İsteğe bağlı)',
  'SİGORTA ŞİRKETİ': 'Sigorta Şirketi Adı',
  'POLİÇE NUMARASI': 'Poliçe Numarası',
  'POLİÇE NO': 'Poliçe Numarası',
  'IBAN': 'IBAN Numarası',
  'BANKA ADI': 'Banka Adı',
  'NO': 'Tutanak / Belge Numarası',
  'KİŞİ ADI': 'Kişinin Adı',
  'TOPLAM': 'Toplam Tutar (TL)',
  'ÇEKİLME TARİHİ': 'Çekilme Tarihi',
};

function getLabel(key) {
  return PLACEHOLDER_LABELS[key.trim()] || key.trim();
}

function extractPlaceholders(text) {
  const regex = /\[([^\]]+)\]/g;
  const found = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].trim();
    // Köşeli parantez içi ama açıklama gibi görünenleri atla
    if (key.length < 60 && !key.includes('\n')) {
      found.add(key);
    }
  }
  return [...found];
}

function fillTemplate(template, values) {
  let result = template;
  for (const [key, val] of Object.entries(values)) {
    if (val) {
      result = result.replace(new RegExp(`\\[${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), val);
    }
  }
  return result;
}

function getInputType(key) {
  if (key.includes('TARİH')) return 'date';
  if (key.includes('TELEFON')) return 'tel';
  if (key === 'TC KİMLİK' || key === 'TC KİMLİK NUMARASI' || key === 'TC KİMLİK NO') return 'text';
  if (key.includes('TUTAR') || key.includes('TOPLAM')) return 'number';
  return 'text';
}

function isTextarea(key) {
  return key.includes('GEREKÇE') || key === 'ADRES' || key === 'AÇIK ADRES';
}

export default function DilekceDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    dilekceApi.getBySlug(slug)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#1a3a6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#666' }}>Yükleniyor...</p>
      </div>
    </div>
  );

  if (!data?.sablon) return (
    <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
      <h2>Şablon bulunamadı</h2>
      <Link to="/dilekce-ornekleri" className="btn btn-primary">Tüm Şablonlar</Link>
    </div>
  );

  const { sablon, related } = data;
  const placeholders = extractPlaceholders(sablon.sablon_icerik || '');
  const filledContent = fillTemplate(sablon.sablon_icerik || '', values);
  const isComplete = placeholders.every(p => values[p]?.trim());

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleDownload = () => {
    const content = filledContent;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sablon.slug}-doldurulmus.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(filledContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const completedCount = placeholders.filter(p => values[p]?.trim()).length;
  const progress = placeholders.length > 0 ? Math.round((completedCount / placeholders.length) * 100) : 100;

  return (
    <>
      <Helmet>
        <title>{sablon.baslik} — Kişiselleştir ve İndir | TrafikRehber</title>
        <meta name="description" content={sablon.aciklama} />
      </Helmet>

      <div className="container-sm" style={{ padding: '40px 20px', maxWidth: 860 }}>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Ana Sayfa</Link><span>/</span>
          <Link to="/dilekce-ornekleri">Dilekçeler</Link><span>/</span>
          <span>{sablon.baslik}</span>
        </div>

        <span className="badge badge-orange" style={{ marginBottom: 12, display: 'inline-block' }}>
          📄 {sablon.kategori}
        </span>
        <h1 style={{ fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, color: '#1a3a6b', marginBottom: 8 }}>
          {sablon.baslik}
        </h1>
        <p style={{ color: '#666', marginBottom: 20 }}>{sablon.aciklama}</p>

        {sablon.ilgili_kanun && (
          <div style={{ background: '#dce6f1', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 14 }}>
            📚 İlgili mevzuat: <strong>{sablon.ilgili_kanun}</strong>
          </div>
        )}

        <div className="warning-box" style={{ marginBottom: 28 }}>
          ⚖️ Bu şablon örnek amaçlıdır. Hukuki danışmanlık yerine geçmez. Önemli davalarda avukata danışmanız önerilir.
        </div>

        {/* Ana grid */}
        <div style={{ display: 'grid', gridTemplateColumns: placeholders.length > 0 ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>

          {/* SOL: Form */}
          {placeholders.length > 0 && (
            <div>
              <div style={{ background: '#1a3a6b', color: '#fff', borderRadius: '12px 12px 0 0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>✏️ Bilgilerinizi Girin</span>
                <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 20 }}>
                  {completedCount}/{placeholders.length}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ background: '#e2e8f0', height: 5 }}>
                <div style={{ background: progress === 100 ? '#2d7a2d' : '#e65c00', height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>

              <div style={{ background: '#f4f7fc', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: 20 }}>
                {placeholders.map(key => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#1a3a6b', marginBottom: 5 }}>
                      {getLabel(key)}
                      {!values[key]?.trim() && <span style={{ color: '#e65c00', marginLeft: 4 }}>*</span>}
                    </label>
                    {isTextarea(key) ? (
                      <textarea
                        value={values[key] || ''}
                        onChange={e => handleChange(key, e.target.value)}
                        placeholder={`${getLabel(key)} yazın...`}
                        rows={3}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `2px solid ${values[key]?.trim() ? '#2d7a2d' : '#e2e8f0'}`, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                    ) : (
                      <input
                        type={getInputType(key)}
                        value={values[key] || ''}
                        onChange={e => handleChange(key, e.target.value)}
                        placeholder={`${getLabel(key)} girin`}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `2px solid ${values[key]?.trim() ? '#2d7a2d' : '#e2e8f0'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                ))}

                {/* İndir butonu */}
                <button
                  onClick={handleDownload}
                  style={{
                    width: '100%', padding: '14px', background: isComplete ? '#2d7a2d' : '#1a3a6b', color: '#fff',
                    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8
                  }}
                >
                  {isComplete ? '✅ Doldurulmuş Dilekçeyi İndir' : '⬇️ Dilekçeyi İndir'}
                </button>
                {!isComplete && (
                  <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 6 }}>
                    Tüm alanları doldurursanız kişiselleştirilmiş dilekçe oluşur
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SAĞ: Canlı Önizleme */}
          <div>
            <div style={{ background: '#374151', color: '#fff', borderRadius: '12px 12px 0 0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>👁 Canlı Önizleme</span>
              <button
                onClick={handleCopy}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer' }}
              >
                {copied ? '✅ Kopyalandı!' : '📋 Kopyala'}
              </button>
            </div>
            <div
              ref={previewRef}
              style={{
                background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none',
                borderRadius: '0 0 12px 12px', padding: 20,
                fontFamily: '"Courier New", Courier, monospace', fontSize: 12,
                lineHeight: 1.9, whiteSpace: 'pre-wrap', maxHeight: 520,
                overflowY: 'auto', color: '#1a1a1a'
              }}
            >
              {filledContent.split(/\[([^\]]+)\]/g).map((part, i) => {
                if (i % 2 === 0) return part;
                const key = part.trim();
                const filled = values[key];
                return filled
                  ? <span key={i} style={{ background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>{filled}</span>
                  : <span key={i} style={{ background: '#fef3c7', color: '#92400e', border: '1px dashed #fbbf24', padding: '0 2px' }}>[{part}]</span>;
              })}
            </div>

            {/* Alt buton grubu */}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={handleDownload} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                ⬇️ İndir (.txt)
              </button>
              <button onClick={handleCopy} className="btn" style={{ flex: 1, justifyContent: 'center', padding: '12px', background: '#f4f7fc', color: '#1a3a6b' }}>
                {copied ? '✅ Kopyalandı' : '📋 Kopyala'}
              </button>
            </div>
          </div>
        </div>

        {/* İlgili şablonlar */}
        {related?.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3 style={{ color: '#1a3a6b', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
              İlgili Dilekçe Şablonları
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {related.map(r => (
                <Link key={r.slug} to={`/dilekce-ornekleri/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 16, transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a3a6b', lineHeight: 1.4 }}>{r.baslik}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>⬇️ {r.indirme_sayisi} indirme</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .dilekce-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
