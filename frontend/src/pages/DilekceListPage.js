import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { dilekceApi } from '../services/api';
import Icon from '../components/Icon';

export default function DilekceListPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    dilekceApi.getAll().then(d => { if (active) setTemplates(d.sablonlar || []); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);
  const filtered = useMemo(() => templates.filter(t => [t.baslik, t.aciklama, t.kategori, t.ilgili_kanun].join(' ').toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR'))), [templates, query]);
  return <>
    <Helmet><title>Dilekçe Örnekleri — TrafikRehber</title><meta name="description" content="Trafik, sigorta ve ehliyet işlemleri için dilekçe örneklerini inceleyin, kişiselleştirin ve indirin." /></Helmet>
    <div className="container page-section"><div className="page-heading"><span className="eyebrow">DİLEKÇE KÜTÜPHANESİ</span><h1>İlk adımınız hazır.</h1><p>Şablonunuzu seçin, bilgilerinizi doldurun, dilekçenizi indirin.</p></div>
      <p className="notice">Başvuru süresini ve başvuracağınız merciyi tebligatınızdan kontrol edin. Şablonlar genel örneklerdir; durumunuza göre düzenlenmelidir.</p>
      <label className="sr-only" htmlFor="petition-search">Dilekçe ara</label><input className="filter-input" id="petition-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Dilekçe ara: itiraz, sigorta, ehliyet…" />
      {loading ? <p role="status" className="empty-state">Dilekçeler yükleniyor…</p> : error ? <div role="alert" className="empty-state"><p>{error}</p><button className="btn btn-primary" onClick={() => setRetry(r => r + 1)}>Yeniden dene</button></div> : !filtered.length ? <p className="empty-state">Aramanıza uygun dilekçe bulunamadı.</p> : <div className="article-grid">{filtered.map(t => <article className="petition-card" key={t.id}><Icon name="document" size={28} /><span className="eyebrow">{t.kategori || 'Genel'}</span><h2>{t.baslik}</h2><p>{t.aciklama}</p>{t.ilgili_kanun && <small>{t.ilgili_kanun}</small>}{t.premium ? <span className="badge">Premium</span> : <Link className="text-link" to={`/dilekce-ornekleri/${t.slug}`}>Dilekçeyi hazırla <Icon name="arrow" /></Link>}</article>)}</div>}
    </div>
  </>;
}
