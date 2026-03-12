import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../services/api';

const CAT_INFO = {
  'ceza': { title: 'Trafik Cezaları', icon: '🚦', desc: 'Ceza sorgulama, itiraz yolları ve güncel tutarlar.' },
  'sigorta': { title: 'Sigorta Rehberi', icon: '🛡️', desc: 'Zorunlu trafik sigortası ve kasko hakkında her şey.' },
  'ehliyet': { title: 'Ehliyet İşlemleri', icon: '🪪', desc: 'Sınav bilgileri, puan sistemi ve ehliyet yenileme.' },
  'arac-islemleri': { title: 'Araç İşlemleri', icon: '🚗', desc: 'Muayene, tescil ve plaka işlemleri rehberi.' },
};

export default function CategoryPage({ category }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const info = CAT_INFO[category] || { title: category, icon: '📄', desc: '' };

  useEffect(() => {
    setLoading(true);
    articlesApi.getByCategory(category)
      .then(d => { setArticles(d.articles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <>
      <Helmet>
        <title>{info.title} — TrafikRehber</title>
        <meta name="description" content={info.desc} />
      </Helmet>

      <div style={{ background: 'linear-gradient(135deg, #1a3a6b 0%, #2d5a9e 100%)', color: '#fff', padding: '48px 20px' }}>
        <div className="container">
          <div className="breadcrumb" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.8)' }}>Ana Sayfa</Link>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>/</span>
            <span>{info.title}</span>
          </div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{info.icon}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{info.title}</h1>
          <p style={{ opacity: 0.85, fontSize: 16 }}>{info.desc}</p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px' }}>
        {loading ? <div className="loading"><div className="spinner" /></div> : articles.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>Bu kategoride henüz makale bulunmuyor.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {articles.map(a => (
              <Link key={a.slug} to={`/blog/${a.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: 8, lineHeight: 1.4, fontSize: 15 }}>{a.title}</h3>
                  <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>{a.meta_description}</p>
                  <div style={{ fontSize: 12, color: '#999' }}>⏱ {a.reading_time_min} dk • 👁 {a.view_count}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
