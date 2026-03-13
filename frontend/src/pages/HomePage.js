import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi, statsApi } from '../services/api';

const SSS = [
  { s: 'Trafik cezasına kaç günde itiraz edilebilir?', c: 'Trafik cezasına tebliğ tarihinden itibaren 15 gün içinde Sulh Ceza Hâkimliği\'ne itiraz edilebilir. Bu süre kaçırılırsa ceza kesinleşir.' },
  { s: '2026 yılında trafik cezaları ne kadar arttı?', c: '1 Ocak 2026 itibarıyla %25,49 Yeniden Değerleme Oranı uygulandı. Ayrıca 27 Şubat 2026 tarihli 7574 sayılı Kanun ile kırmızı ışık ihlali 5.000 TL, cep telefonu kullanımı 5.000 TL, trafikte saldırgan davranış 180.000 TL oldu.' },
  { s: 'Trafik cezasını erken ödesem indirim var mı?', c: 'Evet. Tebliğden itibaren 15 gün içinde ödenirse cezanın %25\'i indirimli uygulanır. Örneğin 5.000 TL\'lik ceza 3.750 TL\'ye düşer.' },
  { s: 'E-devlet ile trafik cezası nasıl sorgulanır?', c: 'E-devlet.gov.tr\'ye giriş yapın, "Trafik İdari Para Cezası Sorgulama" hizmetini aratın. TC kimlik numaranızla tüm cezalarınızı görüntüleyebilirsiniz.' },
  { s: '100 ceza puanı dolunca ne olur?', c: '1 yıl içinde 100 ceza puanına ulaşan sürücünün ehliyetine geçici olarak el konulur. Ehliyetin iadesi için psikoteknik değerlendirme zorunludur.' },
];

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
        <title>TrafikRehber — 2026 Güncel Trafik Cezaları, İtiraz ve Sigorta Rehberi</title>
        <meta name="description" content="2026 güncel trafik cezaları listesi, erken ödeme indirimi hesaplayıcı, itiraz dilekçesi ve sigorta rehberi. 7574 sayılı Kanun ile güncellendi." />
        <meta name="keywords" content="trafik cezası 2026, trafik cezası itiraz, trafik cezası sorgulama, kırmızı ışık cezası, hız cezası, trafik sigortası" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "TrafikRehber",
          "url": "https://www.cezarehberi.com",
          "description": "Trafik cezaları, itiraz rehberi ve sigorta bilgileri",
          "potentialAction": { "@type": "SearchAction", "target": "https://www.cezarehberi.com/blog?q={search_term_string}", "query-input": "required name=search_term_string" }
        })}</script>
      </Helmet>

      {/* ─── HERO ─── */}
      <section style={{ background: 'linear-gradient(135deg, #0f2347 0%, #1a3a6b 60%, #1e4d8c 100%)', color: '#fff', padding: '60px 20px 52px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>

          {/* Güncellik bandı */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(230,92,0,0.9)', borderRadius: 20, padding: '5px 16px', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
            <span>🔴</span> 7574 sayılı Kanun — 27 Şubat 2026 güncel
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

      {/* ─── 2026 ACİL BİLGİ KUTUSU ─── */}
      <section style={{ background: '#fff8e6', borderBottom: '2px solid #fbbf24', padding: '20px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.5 }}>
            <strong>2026 yeni ceza tutarları yürürlükte:</strong> Kırmızı ışık <strong>5.000 ₺</strong> · Cep telefonu <strong>5.000 ₺</strong> · Trafikte saldırgan davranış <strong>180.000 ₺</strong> · 15 günde ödeyin <strong>%25 indirim</strong> alın.
          </div>
          <Link to="/trafik-cezalari-2026" style={{ background: '#e65c00', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Tüm Liste →
          </Link>
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
              { val: '17', label: 'Ceza Türü', icon: '⚖️' },
              { val: '%100', label: 'Ücretsiz', icon: '✅' },
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

      {/* ─── SSS ─── */}
      <section style={{ padding: '52px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a3a6b', marginBottom: 6, textAlign: 'center' }}>Sık Sorulan Sorular</h2>
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 28 }}>Trafik cezaları hakkında merak edilenler</p>
          {SSS.map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
              <button
                onClick={() => setOpenSss(openSss === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '16px 20px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14, color: '#1a3a6b' }}
              >
                <span>{item.s}</span>
                <span style={{ fontSize: 18, marginLeft: 12, flexShrink: 0, color: '#94a3b8' }}>{openSss === i ? '−' : '+'}</span>
              </button>
              {openSss === i && (
                <div style={{ padding: '0 20px 16px', color: '#475569', fontSize: 14, lineHeight: 1.7, borderTop: '1px solid #f1f5f9' }}>
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
            15 gün içinde itiraz hakkınız var. Hazır dilekçe şablonlarımızla hemen başlayın.
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
