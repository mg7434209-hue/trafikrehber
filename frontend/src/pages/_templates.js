// ArticlePage.js
export const ArticlePage = `
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../services/api';

export default function ArticlePage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    articlesApi.getBySlug(slug).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data?.article) return <div className="container" style={{padding:'60px 20px',textAlign:'center'}}><h2>Makale bulunamadı</h2><Link to="/blog" className="btn btn-secondary" style={{marginTop:16}}>← Geri Dön</Link></div>;

  const { article, related } = data;

  return (
    <>
      <Helmet>
        <title>{article.title} — TrafikRehber</title>
        <meta name="description" content={article.meta_description} />
        <script type="application/ld+json">{JSON.stringify({
          "@context":"https://schema.org","@type":article.schema_type||"Article",
          "headline":article.title,"author":{"@type":"Organization","name":article.author},
          "publisher":{"@type":"Organization","name":"TrafikRehber"}
        })}</script>
      </Helmet>
      <div className="container-sm" style={{padding:'40px 20px'}}>
        <div className="breadcrumb">
          <Link to="/">Ana Sayfa</Link><span>/</span>
          <Link to="/blog">Blog</Link><span>/</span>
          <span>{article.title}</span>
        </div>
        <span className="badge badge-blue" style={{marginBottom:12,display:'inline-block'}}>{article.category}</span>
        <h1 style={{fontSize:'clamp(22px,4vw,34px)',fontWeight:800,color:'#1a3a6b',marginBottom:16,lineHeight:1.3}}>{article.title}</h1>
        <div style={{display:'flex',gap:16,fontSize:13,color:'#666',marginBottom:32,flexWrap:'wrap'}}>
          <span>✍️ {article.author}</span>
          <span>⏱ {article.reading_time_min} dk okuma</span>
          <span>👁 {article.view_count} görüntülenme</span>
        </div>
        <div className="warning-box" style={{marginBottom:32}}>
          ⚖️ Bu içerik genel bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez. Özel durumunuz için avukata danışınız.
        </div>
        <div className="article-content" dangerouslySetInnerHTML={{__html: article.content}} />
        {related?.length > 0 && (
          <div style={{marginTop:48}}>
            <h3 style={{color:'#1a3a6b',marginBottom:20}}>İlgili Makaleler</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
              {related.map(r => (
                <Link key={r.slug} to={"/blog/"+r.slug} style={{textDecoration:'none'}}>
                  <div className="card" style={{padding:16}}>
                    <p style={{fontWeight:600,fontSize:14,color:'#1a3a6b',lineHeight:1.4}}>{r.title}</p>
                    <p style={{fontSize:12,color:'#888',marginTop:6}}>{r.reading_time_min} dk okuma</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
`;
