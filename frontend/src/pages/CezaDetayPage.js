import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AdSlot from '../components/AdSlot';
import { AD_SLOTS } from '../adsense';
import { YIL } from '../yil';

const API = process.env.REACT_APP_BACKEND_URL || '';
const tl = v => Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';

export default function CezaDetayPage() {
  const { slug } = useParams();
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acikSss, setAcikSss] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/ceza-turleri/sayfa/${slug}`)
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(v => { setD(v); setLoading(false); })
      .catch(() => { setD(null); setLoading(false); });
  }, [slug]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!d) return (
    <div className="container" style={{ padding: '70px 20px', textAlign: 'center' }}>
      <h1 style={{ color: '#1a3a6b', marginBottom: 12 }}>Ceza bulunamadı</h1>
      <Link to="/trafik-cezalari-2026" className="btn btn-secondary">{YIL} ceza listesine dön</Link>
    </div>
  );

  const { ceza, sayfa, ilgili, odeme_suresi_gun, itiraz_suresi_gun, son_dogrulama } = d;
  const tasarruf = ceza.taban_ceza_tl - ceza.indirimli_tl;

  return (
    <>
      <Helmet>
        <title>{sayfa.baslik} | CezaRehberi</title>
        <meta name="description" content={`${ceza.aciklama} cezası ${tl(ceza.taban_ceza_tl)}. ${odeme_suresi_gun} gün içinde ödemede ${tl(ceza.indirimli_tl)}. Ceza puanı, itiraz yolu ve dilekçe örneği.`} />
      </Helmet>

      {/* ── Hero: aranan sayı ilk ekranda ── */}
      <section style={{ background: 'linear-gradient(135deg,#0f2347,#1a3a6b 60%,#1e4d8c)', color: '#fff', padding: '30px 20px 36px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <nav className="breadcrumb" style={{ color: 'rgba(255,255,255,.65)', marginBottom: 14 }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,.8)' }}>Ana Sayfa</Link><span>/</span>
            <Link to="/trafik-cezalari-2026" style={{ color: 'rgba(255,255,255,.8)' }}>{YIL} Ceza Listesi</Link><span>/</span>
            <span>{ceza.aciklama}</span>
          </nav>

          <h1 style={{ fontSize: 'clamp(23px,4.2vw,36px)', fontWeight: 900, lineHeight: 1.22, margin: '0 0 18px' }}>
            {sayfa.baslik}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(168px,1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, opacity: .75, marginBottom: 4 }}>Ceza tutarı</div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{tl(ceza.taban_ceza_tl)}</div>
            </div>
            <div style={{ background: 'rgba(34,197,94,.17)', border: '1px solid rgba(34,197,94,.4)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, opacity: .85, marginBottom: 4 }}>{odeme_suresi_gun} gün içinde</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#86efac' }}>{tl(ceza.indirimli_tl)}</div>
              <div style={{ fontSize: 11.5, color: '#86efac', marginTop: 2 }}>{tl(tasarruf)} tasarruf</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 12, opacity: .75, marginBottom: 4 }}>Ceza puanı</div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{ceza.puan > 0 ? ceza.puan : '—'}</div>
            </div>
          </div>

          {ceza.kanun_maddesi && (
            <div style={{ marginTop: 14, fontSize: 13, opacity: .72 }}>⚖️ {ceza.kanun_maddesi}</div>
          )}
        </div>
      </section>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '30px 20px 10px' }}>
        {ceza.kademe_notu && (
          <div style={{ background: '#fff8e6', border: '1px solid #fde68a', borderRadius: 12, padding: '15px 18px', fontSize: 14.5, color: '#92400e', lineHeight: 1.65, marginBottom: 26 }}>
            <strong>⚠️ Bu ceza kademelidir:</strong> {ceza.kademe_notu}
          </div>
        )}

        <div style={{ fontSize: 16.5, lineHeight: 1.8, color: '#374151' }}
             dangerouslySetInnerHTML={{ __html: sayfa.ozet }} />

        <AdSlot slot={AD_SLOTS.icerikIci} />

        {/* ── Ne yapmalıyım: dönüşüm + iç bağlantı ── */}
        <h2 style={{ fontSize: 21, fontWeight: 800, color: '#1a3a6b', margin: '30px 0 14px' }}>
          Ceza geldi, şimdi ne yapmalıyım?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 14 }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontWeight: 800, color: '#15803d', marginBottom: 7 }}>1 · Ödeyecekseniz: {odeme_suresi_gun} gün</div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, marginBottom: 12 }}>
              Tebliğden itibaren {odeme_suresi_gun} gün içinde öderseniz %25 indirim uygulanır:
              <strong> {tl(ceza.indirimli_tl)}</strong>. Süre dolduktan sonra indirim hakkı düşer.
            </p>
            <Link to="/araclar/ceza-hesapla" style={{ fontWeight: 700, color: '#15803d', fontSize: 14, textDecoration: 'none' }}>
              Kaçıncı günde ne öderim? →
            </Link>
          </div>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontWeight: 800, color: '#c2410c', marginBottom: 7 }}>2 · İtiraz edecekseniz: {itiraz_suresi_gun} gün</div>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, marginBottom: 12 }}>
              İtiraz süresi ödeme süresinden <strong>ayrıdır ve daha kısadır</strong>. Sulh Ceza
              Hâkimliği'ne {itiraz_suresi_gun} gün içinde başvurmanız gerekir.
            </p>
            <Link to="/dilekce-ornekleri/trafik-cezasi-itiraz-dilekce-ornegi" style={{ fontWeight: 700, color: '#c2410c', fontSize: 14, textDecoration: 'none' }}>
              Hazır itiraz dilekçesi →
            </Link>
          </div>
        </div>

        {/* ── SSS ── */}
        {sayfa.sss.length > 0 && (
          <>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: '#1a3a6b', margin: '34px 0 14px' }}>
              Sık sorulan sorular
            </h2>
            {sayfa.sss.map((q, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                <button onClick={() => setAcikSss(acikSss === i ? -1 : i)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '15px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 14.5, color: '#1a3a6b' }}>
                  <span>{q.soru}</span>
                  <span style={{ fontSize: 18, color: '#94a3b8', flexShrink: 0 }}>{acikSss === i ? '−' : '+'}</span>
                </button>
                {acikSss === i && (
                  <div style={{ padding: '0 18px 16px', color: '#475569', fontSize: 14.5, lineHeight: 1.75, borderTop: '1px solid #f1f5f9' }}>
                    {q.cevap}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <AdSlot slot={AD_SLOTS.icerikAlti} />

        {/* ── İlgili cezalar: iç bağlantı ağı ── */}
        {ilgili.length > 0 && (
          <>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: '#1a3a6b', margin: '32px 0 14px' }}>
              Diğer trafik cezaları
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(228px,1fr))', gap: 10 }}>
              {ilgili.map(c => (
                <Link key={c.slug} to={`/ceza/${c.slug}`}
                  style={{ display: 'block', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', textDecoration: 'none' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', lineHeight: 1.4, marginBottom: 6 }}>{c.aciklama}</div>
                  <div style={{ fontSize: 13, color: '#1a3a6b', fontWeight: 800 }}>{tl(c.taban_ceza_tl)}</div>
                  <div style={{ fontSize: 12, color: '#16a34a' }}>{odeme_suresi_gun} günde {tl(c.indirimli_tl)}</div>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <Link to="/trafik-cezalari-2026" style={{ fontWeight: 700, color: '#1a3a6b', fontSize: 14.5, textDecoration: 'none' }}>
                📋 {YIL} trafik cezalarının tam listesi →
              </Link>
            </div>
          </>
        )}

        <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '26px 0 10px', lineHeight: 1.7 }}>
          📌 Kaynak: 2918 sayılı KTK, 7574 sayılı Kanun (RG: 27.02.2026).
          {son_dogrulama && <> Son doğrulama: <strong>{new Date(son_dogrulama).toLocaleDateString('tr-TR')}</strong>.</>}
          {' '}Bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez; kesin tutar için e-Devlet'teki ceza kaydınızı esas alın.
        </p>
      </div>
    </>
  );
}
