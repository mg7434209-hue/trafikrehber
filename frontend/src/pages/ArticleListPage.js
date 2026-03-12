import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../services/api';

export default function ArticleListPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');

  useEffect(() => {
    setLoading(true);
    const fetch = q ? articlesApi.search(q) : articlesApi.getAll();
    fetch.then(d => { setArticles(d.articles || d.results || []); setLoading(false); }).catch(() => setLoading(false));
  }, [q]);

  return (
    <>
      <Helmet>
        <title>{q ? `"${q}" için sonuçlar` : 'Blog & Makaleler'} — TrafikRehber</title>
      </Helmet>
      <div className="container" style={{ padding: '40px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a3a6b', marginBottom: 8 }}>
          {q ? `"${q}" için arama sonuçları` : 'Blog & Makaleler'}
        </h1>
        <p style={{ color: '#666', marginBottom: 32 }}>{articles.length} makale bulundu</p>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {articles.map(a => (
              <Link key={a.slug} to={`/blog/${a.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 24 }}>
                  <span className="badge badge-blue" style={{ marginBottom: 10, display: 'inline-block' }}>{a.category}</span>
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
