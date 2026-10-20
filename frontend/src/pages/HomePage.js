import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi, statsApi } from '../services/api';
// SSS verisi paylaşılır: sunucu (server.js) bunu okuyup FAQPage JSON-LD basar
import SSS from '../data/sss.json';

const KATEGORILER = [
  { label: 'Trafik Cezaları', icon: '🚦', path: '/trafik-cezalari', desc: 'Ceza tutarları, itiraz yolları, güncel rehber', renk: '#1a3a6b' },
  { label: 'Sigorta Rehberi', icon: '🛡️', path: '/sigorta', desc: 'Zorunlu sigorta, kasko, tazminat bilgileri', renk: '#0e7490' },
  { label: 'Ehliyet İşlemleri', icon: '🪪', path: '/ehliyet', desc: 'Sınav rehberi, puan sistemi, yenileme', renk: '#7c3aed' },
  { label: 'Araç İşlemleri', icon: '🚗', path: '/arac-islemleri', desc: 'Muayene, tescil, noter işlemleri', renk: '#059669' },
];

export default function HomePage() {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [openSss, setOpenSss] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    articlesApi.getFeatured().then(d => setFeaturedArticles(d.articles || [])).catch(() => {});
    statsApi.getPublic().then(d => setStats(d.stats)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/blog?q=${encodeURIComponent(search)}`);
  };

  return (
    <>
      <Helmet>
        <title>CezaRehberi — 2026 Güncel Trafik Cezaları, İtiraz ve Sigorta Rehberi</title>
        <meta name="description" content="2026 güncel trafik cezaları listesi, erken ödeme indirimi hesaplayıcı, itiraz dilekçesi ve sigorta rehberi. Bilgileri resmî kaynaklardan doğrulayın." />
        <meta name="keywords" content="trafik cezası 2026, trafik cezası itiraz, trafik cezası sorgulama, kırmızı ışık cezası, hız cezası, trafik sigortası" />
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{ background: 'linear-gradient(135deg, #0f2347 0%, #1a3a6b 60%, #1e4d8c 100%)', color: '#fff', padding: '60px 20px 52px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>

          {/* Güncellik bandı */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.24)', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            <span aria-hidden="true">✓</span> Trafik cezaları ve araç işlemleri bilgi merkezi
          </div>

          <h1 style={{ fontSize: 'clamp(26px, 5vw, 46px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.2 }}>
            Trafik Cezası mı Aldınız?<br />
            <span style={{ color: '#fbbf24' }}>Doğru Adımı Öğrenin.</span>
          </h1>
          <p style={{ fontSize: 17, opacity: 0.85, margin: '0 auto 36px', maxWidth: 580, lineHeight: 1.6 }}>
            2026 güncel ceza tutarları, erken ödeme indirimi hesaplayıcı, itiraz dilekçeleri ve hukuki rehber — hepsi ücretsiz.
          </p>

          {/* Arama */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 0, maxWidth: 540, margin: '0 auto 32px', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <input
              type="search"
              aria-label="Trafik ve araç işlemleri rehberlerinde ara"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Trafik cezası itiraz, sigorta, ehliyet puan..."
              style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 18px', fontSize: 14, color: '#1e293b', background: 'transparent' }}
            />
            <button type="submit" style={{ background: '#e65c00', color: '#fff', border: 'none', padding: '14px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Ara →
            </button>
          </form>

          {/* Hızlı linkler */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '2026 Ceza Listesi', path: '/trafik-cezalari-2026', bg: '#e65c00' },
              { label: 'İtiraz Dilekçesi', path: '/dilekce-ornekleri', bg: 'rgba(255,255,255,0.15)' },
              { label: 'Ceza Hesapla', path: '/araclar/ceza-hesapla', bg: 'rgba(255,255,255,0.15)' },
            ].map(t => (
              <Link key={t.path} to={t.path} style={{
                background: t.bg, color: '#fff', textDecoration: 'none',
                padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RESMÎ KAYNAKLAR / GÜNCELLİK ─── */}
      <section style={{ background: '#fff8e6', borderBottom: '2px solid #fbbf24', padding: '20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.5 }}>
            <strong>Ceza tutarını ve ödeme süresini kontrol edin.</strong> Tutarlar, mevzuat ve uygulama koşulları değişebilir. İşlem yapmadan önce güncel resmî kayıtları doğrulayın.
          </div>
          <Link to="/trafik-cezalari-2026" style={{ background: '#e65c00', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Tüm Liste →
          </Link>
        </div>
      </section>

      {/* ─── BELGE HAZIRLAMA YOLCULUĞU ─── */}
      <section aria-labelledby="belge-baslik" style={{ padding: '54px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: '#e8f1ff', color: '#1a3a6b', fontWeight: 700, fontSize: 12, borderRadius: 30, padding: '5px 13px', marginBottom: 14 }}>ADIM ADIM BAŞVURU REHBERİ</div>
          <h2 id="belge-baslik" style={{ color: '#142c4f', fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.3, marginBottom: 12 }}>Trafik cezanıza ilişkin belgeleri bilinçli hazırlayın</h2>
          <p style={{ color: '#64748b', maxWidth: 720, lineHeight: 1.7, marginBottom: 24 }}>İşlemin türünü belirleyin, resmî bilgileri doğrulayın ve uygun dilekçe örneğine ulaşın. Hukuki temsil veya avukat incelemesi gerektiren durumlarda bağımsız bir avukattan destek alın.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            {[
              { n: '01', title: 'Ceza türünü belirleyin', detail: 'Tebliğ tarihi, tutanak ve işlem türünü inceleyin.' },
              { n: '02', title: 'Başvuru yolunu öğrenin', detail: 'Süreleri ve yetkili mercileri güncel mevzuattan doğrulayın.' },
              { n: '03', title: 'Dilekçe örneğini inceleyin', detail: 'Genel şablonlardan yararlanın; kişisel olayınıza göre değerlendirin.' },
              { n: '04', title: 'Gerekirse avukata danışın', detail: 'Hukuki görüş ve temsil için yetkili bir avukatla çalışın.' },
            ].map(step => (
              <div key={step.n} style={{ padding: 20, border: '1px solid #dfe7f1', borderRadius: 14, background: '#fbfdff' }}>
                <span style={{ color: '#e65c00', fontSize: 22, fontWeight: 900 }}>{step.n}</span>
                <h3 style={{ color: '#142c4f', fontSize: 16, margin: '12px 0 8px' }}>{step.title}</h3>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{step.detail}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <Link to="/dilekce-ornekleri" style={{ display: 'inline-block', background: '#e65c00', color: '#fff', padding: '13px 22px', borderRadius: 9, textDecoration: 'none', fontWeight: 700 }}>Dilekçe örneklerini incele →</Link>
            <span style={{ fontSize: 12, color: '#64748b' }}>Avukat incelemeli ücretli hizmet henüz sunulmamaktadır.</span>
          </div>
        </div>
      </section>

      {/* ─── HIZLI ARAÇLAR ─── */}
      <section style={{ padding: '52px 20px', background: '#f4f7fc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b', marginBottom: 6, textAlign: 'center' }}>Hızlı Araçlar</h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>En çok ihtiyaç duyulan işlemler — hızlı ve ücretsiz</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { icon: '📋', label: '2026 Ceza Listesi', desc: 'Tüm güncel tutarlar', path: '/trafik-cezalari-2026', renk: '#1a3a6b' },
              { icon: '🧮', label: 'Ceza Hesapla', desc: 'Erken ödeme indirimi', path: '/araclar/ceza-hesapla', renk: '#e65c00' },
              { icon: '📄', label: 'İtiraz Dilekçesi', desc: 'Hazır şablonlar', path: '/dilekce-ornekleri', renk: '#059669' },
              { icon: '🛡️', label: 'Sigorta Rehberi', desc: 'ZMSS ve kasko', path: '/sigorta', renk: '#0e7490' },
            ].map(t => (
              <Link key={t.path} to={t.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                  padding: '20px 18px', display: 'flex', gap: 14, alignItems: 'center',
                  transition: 'box-shadow 0.15s, transform 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,58,107,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ background: t.renk + '15', borderRadius: 10, padding: '10px', fontSize: 22, flexShrink: 0 }}>{t.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{t.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── İSTATİSTİKLER ─── */}
      {stats && (
        <section style={{ background: '#1a3a6b', color: '#fff', padding: '28px 20px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { val: stats.total_articles + '+', label: 'Güncel Makale', icon: '📰' },
              { val: stats.total_dilekce + '+', label: 'Dilekçe Şablonu', icon: '📄' },
              { val: 'Ücretsiz', label: 'Bilgi ve Rehberler', icon: '✅' },
              // Ziyaretçi sayacı (backend /api/stats/public) — veri yoksa gizlenir
              ...(stats.ziyaretci_toplam
                ? [{ val: stats.ziyaretci_toplam.toLocaleString('tr-TR'), label: 'Ziyaretçi', icon: '👥' }]
                : []),
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 32px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: 24 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{s.val}</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── KATEGORİLER ─── */}
      <section style={{ padding: '52px 20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b', marginBottom: 6, textAlign: 'center' }}>Tüm Kategoriler</h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>İhtiyacınıza göre kategori seçin</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
            {KATEGORILER.map(k => (
              <Link key={k.path} to={k.path} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 20px', textAlign: 'center', transition: 'box-shadow 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,58,107,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                >
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{k.icon}</div>
                  <div style={{ fontWeight: 700, color: k.renk, fontSize: 15, marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{k.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MAKALELER ─── */}
      {featuredArticles.length > 0 && (
        <section style={{ padding: '52px 20px', background: '#f4f7fc' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b', margin: 0 }}>Güncel Rehberler</h2>
              <Link to="/blog" style={{ fontSize: 13, color: '#1a3a6b', fontWeight: 700, textDecoration: 'none' }}>Tümü →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {featuredArticles.slice(0, 6).map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px', height: '100%', boxSizing: 'border-box', transition: 'box-shadow 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,58,107,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                  >
                    <span style={{ background: a.category === 'ceza' ? '#fff0e6' : '#e0f2fe', color: a.category === 'ceza' ? '#e65c00' : '#0e7490', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 12, display: 'inline-block', marginBottom: 10 }}>
                      {a.category}
                    </span>
                    <h3 style={{ color: '#1e293b', fontWeight: 700, fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>{a.title}</h3>
                    <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{a.meta_description?.slice(0, 90)}…</p>
                    <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 10 }}>
                      <span>⏱ {a.reading_time_min} dk</span>
                      <span>👁 {a.view_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── RESMÎ İŞLEM KANALLARI ─── */}
      <section style={{ padding: '46px 20px', background: '#fff' }} aria-labelledby="resmi-kaynaklar-baslik">
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 id="resmi-kaynaklar-baslik" style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b', marginBottom: 8 }}>Resmî kaynaklardan doğrulayın</h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Rehberlerimiz bilgilendirme amaçlıdır. Borç, tebligat, başvuru ve ödeme durumunuzu ilgili kurumun resmî sisteminden kontrol edin.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
            {[
              { ad: 'e-Devlet Kapısı', aciklama: 'Kişisel sorgulama ve kamu hizmetleri', url: 'https://www.turkiye.gov.tr/' },
              { ad: 'Gelir İdaresi Başkanlığı', aciklama: 'Vergi ve ödeme işlemleri', url: 'https://www.gib.gov.tr/' },
              { ad: 'Mevzuat Bilgi Sistemi', aciklama: 'Yürürlükteki düzenlemeleri inceleyin', url: 'https://www.mevzuat.gov.tr/' },
            ].map(k => (
              <a key={k.url} href={k.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, color: '#1a3a6b', textDecoration: 'none' }}>
                <strong style={{ display: 'block', fontSize: 15, marginBottom: 6 }}>{k.ad} ↗</strong>
                <span style={{ color: '#64748b', fontSize: 13 }}>{k.aciklama}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SSS ─── */}
      <section style={{ padding: '52px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b', marginBottom: 6, textAlign: 'center' }}>Sık Sorulan Sorular</h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>Trafik cezaları hakkında merak edilenler</p>
          {SSS.map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
              <button
                type="button"
                aria-expanded={openSss === i}
                aria-controls={`sss-yanit-${i}`}
                onClick={() => setOpenSss(openSss === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '16px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14, color: '#1a3a6b' }}
              >
                <span>{item.s}</span>
                <span style={{ fontSize: 18, marginLeft: 12, flexShrink: 0, color: '#94a3b8' }}>{openSss === i ? '−' : '+'}</span>
              </button>
              {openSss === i && (
                <div id={`sss-yanit-${i}`} style={{ padding: '0 20px 16px', color: '#475569', fontSize: 14, lineHeight: 1.7, borderTop: '1px solid #f1f5f9' }}>
                  {item.c}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ background: '#1a3a6b', color: '#fff', padding: '44px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Cezanıza Haksız mı Kaldınız?</h2>
          <p style={{ opacity: 0.8, fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            İtiraz süresi ve başvuru yolu işlemin türüne göre değişebilir. Güncel mevzuatı kontrol edin, dilekçe örneklerimizden yararlanın.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dilekce-ornekleri" style={{ background: '#e65c00', color: '#fff', textDecoration: 'none', padding: '13px 28px', borderRadius: 9, fontWeight: 700, fontSize: 15 }}>
              📄 İtiraz Dilekçesi Hazırla
            </Link>
            <Link to="/trafik-cezalari-2026" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', padding: '13px 28px', borderRadius: 9, fontWeight: 700, fontSize: 15, border: '1px solid rgba(255,255,255,0.3)' }}>
              📋 2026 Ceza Tutarları
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
