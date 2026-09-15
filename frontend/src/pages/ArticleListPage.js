import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../services/api';
import { SITE_URL } from '../services/site';
import SearchForm from '../components/SearchForm';
import ArticleCard from '../components/ArticleCard';
export default function ArticleListPage() {
  const [articles, setArticles] = useState([]), [total, setTotal] = useState(0), [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const rawPage = Number(params.get('page'));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setArticles([]);
    if (q && (q.length < 2 || q.length > 160)) { setError('Arama için 2–160 karakter girin.'); setLoading(false); return; }
    (q ? articlesApi.search(q) : articlesApi.getAll(page)).then(d => { if (active) { setArticles(d.articles || d.results || []); setTotal(d.total ?? d.results?.length ?? 0); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q, page, retry]);
  const pages = Math.ceil(total / 12);
  return <><Helmet><title>{q ? `“${q}” arama sonuçları` : 'Rehberler ve Makaleler'} — TrafikRehber</title><meta name="description" content="Trafik cezaları, sigorta, ehliyet ve araç işlemleri rehberlerinde arama yapın." /><link rel="canonical" href={`${SITE_URL}/blog${!q && page > 1 ? `?page=${page}` : ''}`} />{q && <meta name="robots" content="noindex, follow" />}</Helmet>
    <div className="container page-content"><div className="page-intro"><div className="breadcrumb"><Link to="/">Ana Sayfa</Link><span>›</span><span>Rehberler</span></div><h1>{q ? `“${q}” için sonuçlar` : 'Rehberler ve makaleler'}</h1><p>Trafik ve araç işlemlerinde aradığınız bilgiyi bulun.</p><SearchForm key={q} initialValue={q} id="guide-search" /></div>
      {loading ? <div className="loading" role="status"><span className="sr-only">Rehberler yükleniyor</span><div className="spinner" /></div> : error ? <div className="state-message error-state" role="alert"><p>{error}</p><button className="btn btn-secondary" onClick={() => setRetry(r => r + 1)}>Tekrar dene</button></div> : <><p style={{ marginBottom: 20, fontSize: 13 }} role="status">{total} rehber bulundu{q && total === 10 ? ' · İlk 10 sonuç gösteriliyor' : ''}</p>{articles.length ? <div className="guide-grid">{articles.map(a => <ArticleCard key={a.slug} article={a} />)}</div> : <div className="state-message"><p>Sonuç bulunamadı. Başka bir kelime deneyin veya tüm rehberlere göz atın.</p><Link to="/blog">Tüm rehberler →</Link></div>}{!q && pages > 1 && <nav className="pagination" aria-label="Makale sayfaları">{page > 1 && <Link to={`/blog?page=${page - 1}`}>← Önceki</Link>}<span>Sayfa {page} / {pages}</span>{page < pages && <Link to={`/blog?page=${page + 1}`}>Sonraki →</Link>}</nav>}</>}
    </div></>;
}
