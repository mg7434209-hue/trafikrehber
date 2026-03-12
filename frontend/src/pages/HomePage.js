import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi, statsApi } from '../services/api';

const CATEGORIES = [
  { id: 'ceza', label: 'Trafik Cezaları', icon: '🚦', path: '/trafik-cezalari', desc: 'Ceza sorgulama, itiraz, tutarlar' },
  { id: 'sigorta', label: 'Sigorta Rehberi', icon: '🛡️', path: '/sigorta', desc: 'Zorunlu sigorta, kasko bilgileri' },
  { id: 'ehliyet', label: 'Ehliyet İşlemleri', icon: '🪪', path: '/ehliyet', desc: 'Sınav, puan sistemi, yenileme' },
  { id: 'arac-islemleri', label: 'Araç İşlemleri', icon: '🚗', path: '/arac-islemleri', desc: 'Muayene, tescil, plaka işlemleri' },
];

const QUICK_TOOLS = [
  { label: 'Ceza Hesapla', icon: '🧮', path: '/araclar/ceza-hesapla', color: '#e65c00' },
  { label: 'Dilekçe İndir', icon: '📄', path: '/dilekce-ornekleri', color: '#1a3a6b' },
  { label: 'Trafik Cezaları', icon: '🚦', path: '/trafik-cezalari', color: '#2d7a2d' },
];

const SSS = [
  { s: 'Trafik cezasına kaç günde itiraz edilebilir?', c: 'Trafik cezasına tebliğ tarihinden itibaren 15 gün içinde Sulh Ceza Hâkimliği\'ne itiraz edilebilir.' },
  { s: 'E-devlet ile trafik cezası nasıl sorgulanır?', c: 'E-devlet.gov.tr\'ye giriş yapın, "Trafik İdari Para Cezası Sorgulama" hizmetini aratın ve TC kimlik numaranız ile sorgulayın.' },
  { s: 'Zorunlu trafik sigortası olmadan araç kullanılabilir mi?', c: 'Hayır, zorunlu trafik sigortası (ZMSS) olmadan araç kullanmak yasaktır ve ciddi para cezasına yol açar.' },
  { s: 'Ehliyet puanı nasıl sorgulanır?', c: 'E-devlet üzerinden "Sürücü Puan Durumu Sorgulama" hizmetiyle TC kimlik numaranızla anlık puan durumunuzu görebilirsiniz.' },
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
        <title>TrafikRehber — Trafik Cezaları, Sigorta ve Ehliyet Rehberi</title>
        <meta name="description" content="Trafik cezası itiraz, sorgulama, sigorta rehberi, ehliyet işlemleri ve araç muayene bilgilerine buradan ulaşın." />
      </Helmet>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #2d5a9e 100%)', color: '#fff', padding: '80px 20px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
            Trafik Sorunlarınıza<br />Hızlı ve Güvenilir Çözüm
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
            Trafik cezası itirazından sigorta rehberine, ehliyet işlemlerinden araç muayenesine — tüm bilgiler burada.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, maxWidth: 560, margin: '0 auto 40px', background: '#fff', borderRadius: 12, padding: 6 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Trafik cezası itiraz, ehliyet puan, sigorta..."
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 16px', fontSize: 15, borderRadius: 8, color: '#1a1a2e' }}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Ara 🔍</button>
          </form>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {QUICK_TOOLS.map(t => (
              <Link key={t.path} to={t.path} className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                {t.icon} {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      {stats && (
        <div style={{ background: '#e65c00', color: '#fff', padding: '16px 20px' }}>
          <div className="container" style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', textAlign: 'center' }}>
            {[
              ['📰', stats.total_articles + '+', 'Makale'],
              ['📄', stats.total_dilekce + '+', 'Dilekçe Şablonu'],
              ['⬇️', stats.total_downloads + '+', 'İndirme'],
            ].map(([icon, val, label]) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{val}</span>
                <span style={{ opacity: 0.85, fontSize: 14 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KATEGORİLER */}
      <section style={{ padding: '64px 20px', background: '#f4f7fc' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#1a3a6b', marginBottom: 8 }}>Ne Arıyorsunuz?</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 40 }}>İhtiyacınıza göre kategori seçin</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {CATEGORIES.map(cat => (
              <Link key={cat.id} to={cat.path} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 28, textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>{cat.icon}</div>
                  <h3 style={{ color: '#1a3a6b', fontWeight: 700, marginBottom: 8 }}>{cat.label}</h3>
                  <p style={{ color: '#666', fontSize: 14 }}>{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SON MAKALELER */}
      {featuredArticles.length > 0 && (
        <section style={{ padding: '64px 20px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1a3a6b' }}>Popüler Makaleler</h2>
              <Link to="/blog" className="btn btn-outline" style={{ fontSize: 14, padding: '8px 16px' }}>Tümünü Gör →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
              {featuredArticles.slice(0, 6).map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 24, height: '100%' }}>
                    <span className={`badge badge-${a.category === 'ceza' ? 'orange' : 'blue'}`} style={{ marginBottom: 12, display: 'inline-block' }}>
                      {a.category}
                    </span>
                    <h3 style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: 8, lineHeight: 1.4, fontSize: 15 }}>{a.title}</h3>
                    <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>{a.meta_description}</p>
                    <div style={{ fontSize: 12, color: '#999', display: 'flex', gap: 12 }}>
                      <span>⏱ {a.reading_time_min} dk okuma</span>
                      <span>👁 {a.view_count} görüntülenme</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HIZLI ARAÇLAR */}
      <section style={{ padding: '64px 20px', background: '#1a3a6b', color: '#fff' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Ücretsiz Araçlar</h2>
          <p style={{ opacity: 0.8, marginBottom: 40 }}>Hızlıca hesaplayın, indirin, öğrenin</p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/araclar/ceza-hesapla" className="btn" style={{ background: '#e65c00', color: '#fff', fontSize: 16, padding: '16px 32px' }}>
              🧮 Trafik Cezası Hesapla
            </Link>
            <Link to="/dilekce-ornekleri" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontSize: 16, padding: '16px 32px' }}>
              📄 Dilekçe Şablonu İndir
            </Link>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section style={{ padding: '64px 20px', background: '#f4f7fc' }}>
        <div className="container-sm">
          <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, color: '#1a3a6b', marginBottom: 32 }}>Sık Sorulan Sorular</h2>
          {SSS.map((item, i) => (
            <div key={i} className="card" style={{ marginBottom: 12, overflow: 'visible' }}>
              <button
                onClick={() => setOpenSss(openSss === i ? null : i)}
                style={{ width: '100%', background: 'none', border: 'none', padding: '18px 24px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 15, color: '#1a3a6b' }}
              >
                {item.s}
                <span style={{ fontSize: 20, marginLeft: 12, flexShrink: 0 }}>{openSss === i ? '−' : '+'}</span>
              </button>
              {openSss === i && (
                <div style={{ padding: '0 24px 18px', color: '#444', fontSize: 15, lineHeight: 1.7 }}>{item.c}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
