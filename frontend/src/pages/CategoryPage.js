import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../services/api';

const CATEGORY_META = {
  ceza: {
    label: 'Trafik Cezaları',
    icon: '🚦',
    desc: 'Ceza sorgulama, itiraz yolları ve güncel tutarlar.',
    color: '#e65c00',
    bg: '#fff0e6',
  },
  sigorta: {
    label: 'Sigorta Rehberi',
    icon: '🛡️',
    desc: 'Zorunlu trafik sigortası ve kasko hakkında her şey.',
    color: '#0e7490',
    bg: '#e0f2fe',
  },
  ehliyet: {
    label: 'Ehliyet İşlemleri',
    icon: '🪪',
    desc: 'Sınav rehberi, puan sistemi ve yenileme bilgileri.',
    color: '#7c3aed',
    bg: '#f3e8ff',
  },
  'arac-islemleri': {
    label: 'Araç İşlemleri',
    icon: '🚗',
    desc: 'Muayene, tescil, noter ve plaka işlemleri.',
    color: '#059669',
    bg: '#d1fae5',
  },
};

const CATEGORY_ROUTES = {
  '/trafik-cezalari': 'ceza',
  '/sigorta': 'sigorta',
  '/ehliyet': 'ehliyet',
  '/arac-islemleri': 'arac-islemleri',
};

export default function CategoryPage() {
  const { category } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL'den kategori id'sini bul
  const catId = category || Object.entries(CATEGORY_ROUTES).find(
    ([path]) => window.location.pathname === path
  )?.[1] || 'ceza';

  const meta = CATEGORY_META[catId] || CATEGORY_META['ceza'];

  useEffect(() => {
    setLoading(true);
    articlesApi.getByCategory(catId)
      .then(d => setArticles(d.articles || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [catId]);

  return (
    <>
      <Helmet>
        <title>{meta.label} — TrafikRehber 2026</title>
        <meta name="description" content={meta.desc} />
      </Helmet>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0f2347 0%, #1a3a6b 100%)', color: '#fff', padding: '44px 20px 36px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 36 }}>{meta.icon}</div>
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 800, margin: 0 }}>
              {meta.label}
            </h1>
          </div>
          <p style={{ fontSize: 16, opacity: 0.8, margin: 0 }}>{meta.desc}</p>
        </div>
      </section>

      {/* Liste */}
      <section style={{ padding: '36px 20px 60px', background: '#f4f7fc', minHeight: 400 }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            <Link to="/" style={{ color: '#1a3a6b', textDecoration: 'none', fontWeight: 600 }}>Ana Sayfa</Link>
            <span>›</span>
            <span>{meta.label}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p>Yükleniyor...</p>
            </div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{meta.icon}</div>
              <p>Bu kategoride henüz makale yok.</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                <strong style={{ color: '#1a3a6b' }}>{articles.length}</strong> makale
              </div>

              {/* Liste satırları */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {articles.map((a, i) => (
                  <Link
                    key={a.slug}
                    to={`/blog/${a.slug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        background: '#fff',
                        borderRadius: i === 0 ? '10px 10px 4px 4px' :
                                     i === articles.length - 1 ? '4px 4px 10px 10px' : '4px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        transition: 'background 0.12s, transform 0.12s',
                        cursor: 'pointer',
                        border: '1px solid #e9eef5',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = meta.bg;
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#fff';
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      {/* Sıra no */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: meta.bg, color: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, flexShrink: 0
                      }}>
                        {i + 1}
                      </div>

                      {/* İçerik */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, color: '#1e293b', fontSize: 15,
                          lineHeight: 1.4, marginBottom: 4,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {a.title}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden'
                        }}>
                          {a.meta_description}
                        </div>
                      </div>

                      {/* Meta */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                        gap: 4, flexShrink: 0, fontSize: 11, color: '#94a3b8'
                      }}>
                        <span>⏱ {a.reading_time_min} dk</span>
                        {a.view_count > 0 && <span>👁 {a.view_count}</span>}
                      </div>

                      {/* Ok */}
                      <div style={{ color: meta.color, fontSize: 16, flexShrink: 0, opacity: 0.6 }}>›</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
