import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi, statsApi } from '../services/api';
import { SITE_URL, PAYMENT_URL } from '../services/site';
import Icon from '../components/Icon';
import SearchForm from '../components/SearchForm';
import ArticleCard from '../components/ArticleCard';
const CATEGORIES = [
  ['shield', 'Trafik cezaları', 'Sorgulama, ceza tutarları ve itiraz rehberleri.', '/trafik-cezalari', 'orange'],
  ['document', 'Sigorta rehberi', 'Trafik sigortası, kasko ve hasar işlemleri.', '/sigorta', 'teal'],
  ['book', 'Ehliyet işlemleri', 'Sınav, yenileme ve ceza puanı bilgileri.', '/ehliyet', 'purple'],
  ['car', 'Araç işlemleri', 'Muayene, tescil ve araç devri rehberleri.', '/arac-islemleri', 'blue'],
];
const QUESTIONS = [
  ['Trafik cezamı nereden sorgulayabilirim?', 'Kişisel ceza kayıtlarınızı e-Devlet üzerindeki resmi sorgulama hizmetinden görüntüleyebilirsiniz. TrafikRehber, işlemlerinizi anlamanıza yardımcı olan bağımsız bir bilgi platformudur.'],
  ['Ceza hesaplayıcı nasıl çalışır?', 'Listeden ihlal türünü seçerek sitede kayıtlı tutarı ve yüzde 25 indirim uygulanması durumundaki ödeme örneğini görebilirsiniz. Ödeme öncesinde tebligatınızdaki tutar ve koşulları esas alın.'],
  ['Dilekçe örneklerini nasıl kullanabilirim?', 'Şablonu açın, bilgilerinizi doldurun ve önizlemeyi kontrol edin. Belgeyi indirebilir veya yazdırabilirsiniz. Başvuru merciini ve süresini kendi tebligatınızdan kontrol edin.'],
  ['Rehberlerde nasıl arama yaparım?', 'Arama alanına en az iki karakter yazın. Makale başlıkları, açıklamalar ve içeriklerde arama yapabilir; kategorilerden ilgili rehberlere ulaşabilirsiniz.'],
];
export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    articlesApi.getFeatured().then(d => { if (active) setArticles(d.articles || []); }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setLoading(false); });
    statsApi.getPublic().then(d => { if (active) setStats(d.stats); }).catch(() => {});
    return () => { active = false; };
  }, []);
  return <>
    <Helmet><title>TrafikRehber — Trafik Cezaları, Sigorta ve Sürücü Rehberi</title><meta name="description" content="Trafik cezaları, sigorta, ehliyet ve araç işlemleri için rehberler. Ceza tutarlarını inceleyin, ödeme örneği hesaplayın ve dilekçe hazırlayın." /><meta property="og:title" content="TrafikRehber — Yolda da, kararlarında da yanında." /><meta property="og:description" content="Trafik cezaları, ödeme hesaplama ve dilekçe örnekleri bir arada." /><script type="application/ld+json">{JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'TrafikRehber', url: SITE_URL, inLanguage: 'tr-TR', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/blog?q={search_term_string}`, 'query-input': 'required name=search_term_string' } })}</script></Helmet>
    <section className="home-hero"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow"><span className="status-dot" /> SÜRÜCÜLER İÇİN PRATİK REHBER</span><h1>Yolda da,<br />kararlarında da<br /><span>yanında.</span></h1><p>Trafik cezası, sigorta, ehliyet… Karmaşık işlemleri anlaşılır adımlarla çöz. İhtiyacın olan bilgiye tek yerden ulaş.</p><SearchForm /><div className="popular-searches"><span>Sık aranan:</span><Link to="/blog?q=itiraz">Ceza itirazı</Link><Link to="/blog?q=muayene">Muayene</Link><Link to="/blog?q=ehliyet">Ehliyet</Link></div></div>
    <aside className="journey-card" aria-labelledby="journey-title"><div className="journey-top"><span className="road-emblem"><Icon name="road" size={32} /></span><span>DOĞRU BİLGİ.<br /><strong>GÜVENLİ ADIMLAR.</strong></span><div className="signal" aria-hidden="true"><i /><i /><i /></div></div><h2 id="journey-title">Nereden başlayalım?</h2><p>İhtiyacına uygun adımı seç.</p><div className="journey-links">{[['01', 'Ceza tutarını öğren', '2026 trafik cezası listesi', '/trafik-cezalari-2026'], ['02', 'Ödeme örneği hesapla', 'İndirimli tutarı karşılaştır', '/araclar/ceza-hesapla'], ['03', 'Dilekçeni hazırla', 'Doldur, kontrol et, indir', '/dilekce-ornekleri']].map(([num, title, desc, path]) => <Link to={path} key={path}><span className="step-number">{num}</span><span><strong>{title}</strong><small>{desc}</small></span><Icon name="arrow" size={18} /></Link>)}</div><a className="official-link" href={PAYMENT_URL} target="_blank" rel="noopener noreferrer"><Icon name="shield" size={17} /> e-Devlet’te ceza sorgula <span aria-hidden="true">↗</span><span className="sr-only"> (yeni sekme)</span></a></aside></div></section>
    <div className="trust-strip"><div className="container"><span><Icon name="book" size={18} /> Anlaşılır rehberler</span><span><Icon name="calculator" size={18} /> Pratik hesaplama</span><span><Icon name="document" size={18} /> Hazır dilekçeler</span><span><Icon name="shield" size={18} /> Resmi kaynaklara erişim</span></div></div>
    <section className="home-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">KONUNU SEÇ</span><h2>Her işlem için bir yol var.</h2></div><p>Aradığın bilgi, doğru kategoride.</p></div><div className="category-grid">{CATEGORIES.map(([icon, title, desc, path, color]) => <Link to={path} key={path} className={`category-card ${color}`}><span className="category-icon"><Icon name={icon} size={27} /></span><h3>{title}</h3><p>{desc}</p><span className="card-link">Rehberi incele <Icon name="arrow" size={18} /></span></Link>)}</div></div></section>
    <section className="home-section guides-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">OKU, ÖĞREN, HAREKETE GEÇ</span><h2>Öne çıkan rehberler</h2></div><Link className="text-link" to="/blog">Tüm rehberler <Icon name="arrow" size={18} /></Link></div>{loading ? <p className="state-message" role="status">Rehberler yükleniyor…</p> : failed ? <p className="state-message" role="status">Rehberler şu an yüklenemiyor. <Link to="/blog">Yeniden görüntüle</Link></p> : articles.length ? <div className="guide-grid">{articles.slice(0, 6).map(a => <ArticleCard key={a.slug} article={a} />)}</div> : <p className="state-message">Rehberler hazırlanıyor. Kategorileri ve araçları inceleyebilirsiniz.</p>}{stats && <div className="resource-stats"><div><strong>{stats.total_articles?.toLocaleString('tr-TR')}</strong><span>yayındaki rehber</span></div><div><strong>{stats.total_dilekce?.toLocaleString('tr-TR')}</strong><span>dilekçe şablonu</span></div><div><strong>{stats.total_ceza?.toLocaleString('tr-TR') ?? '—'}</strong><span>kayıtlı ceza türü</span></div></div>}</div></section>
    <section className="home-section"><div className="container faq-grid"><div><span className="eyebrow">AKLINDA SORU KALMASIN</span><h2>İlk adım,<br />doğru bilgi.</h2><p>En çok merak edilen konulardan başlayın.</p><Link to="/blog" className="text-link">Rehberleri keşfet <Icon name="arrow" size={18} /></Link></div><div>{QUESTIONS.map(([q, a]) => <details className="faq-item" key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></div></section>
    <section className="home-section cta-section"><div className="container"><div className="petition-cta"><span className="cta-icon"><Icon name="document" size={38} /></span><div><span className="eyebrow">HAZIR ŞABLONLAR</span><h2>İlk satırı biz hazırladık.</h2><p>İhtiyacına uygun dilekçeyi seç, bilgilerini doldur ve indir.</p></div><Link className="btn btn-primary" to="/dilekce-ornekleri">Dilekçe hazırla <Icon name="arrow" size={18} /></Link></div></div></section>
  </>;
}
