import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { dilekceApi } from '../services/api';

export function DilekceListPage() {
  const [sablonlar, setSablonlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kategori, setKategori] = useState(null);

  const kategoriler = ['itiraz', 'sigorta', 'ehliyet', 'arac', 'genel'];

  useEffect(() => {
    setLoading(true);
    dilekceApi.getAll(kategori).then(d => { setSablonlar(d.sablonlar || []); setLoading(false); }).catch(() => setLoading(false));
  }, [kategori]);

  return (
    <>
      <Helmet>
        <title>Ücretsiz Dilekçe Örnekleri — TrafikRehber</title>
        <meta name="description" content="Trafik cezası itiraz, sigorta hasar, ehliyet gibi konularda ücretsiz dilekçe şablonları." />
      </Helmet>
      <div className="container" style={{ padding: '40px 20px' }}>
        <div className="breadcrumb"><Link to="/">Ana Sayfa</Link><span>/</span><span>Dilekçe Örnekleri</span></div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a3a6b', marginBottom: 8 }}>Ücretsiz Dilekçe Örnekleri</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>İndirin, kendi bilgilerinizle doldurun. Tümü ücretsiz.</p>

        <div className="warning-box" style={{ marginBottom: 32 }}>
          ⚖️ Bu şablonlar örnek amaçlıdır. Hukuki danışmanlık yerine geçmez. Durumunuza özel destek için avukata danışınız.
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          <button onClick={() => setKategori(null)} className="btn" style={{ padding: '8px 16px', fontSize: 13, background: !kategori ? '#1a3a6b' : '#f4f7fc', color: !kategori ? '#fff' : '#1a3a6b' }}>Tümü</button>
          {kategoriler.map(k => (
            <button key={k} onClick={() => setKategori(k)} className="btn" style={{ padding: '8px 16px', fontSize: 13, background: kategori === k ? '#1a3a6b' : '#f4f7fc', color: kategori === k ? '#fff' : '#1a3a6b' }}>{k}</button>
          ))}
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {sablonlar.map(s => (
              <Link key={s.slug} to={`/dilekce-ornekleri/${s.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 24 }}>
                  <span className="badge badge-orange" style={{ marginBottom: 10, display: 'inline-block' }}>📄 {s.kategori}</span>
                  <h3 style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: 8, lineHeight: 1.4, fontSize: 15 }}>{s.baslik}</h3>
                  <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>{s.aciklama}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: '#2d7a2d', fontWeight: 600 }}>✅ Ücretsiz</span>
                    <span style={{ color: '#999' }}>⬇️ {s.indirme_sayisi} indirme</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function DilekceDetailPage() {
  const { slug } = require('react-router-dom').useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dilekceApi.getBySlug(slug).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!data?.sablon) return <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}><h2>Şablon bulunamadı</h2></div>;

  const { sablon, related } = data;

  const handleDownload = () => {
    const url = dilekceApi.downloadUrl(sablon.slug);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sablon.slug}.txt`;
    a.click();
  };

  return (
    <>
      <Helmet>
        <title>{sablon.baslik} — TrafikRehber Dilekçe Örnekleri</title>
        <meta name="description" content={sablon.aciklama} />
      </Helmet>
      <div className="container-sm" style={{ padding: '40px 20px' }}>
        <div className="breadcrumb">
          <Link to="/">Ana Sayfa</Link><span>/</span>
          <Link to="/dilekce-ornekleri">Dilekçeler</Link><span>/</span>
          <span>{sablon.baslik}</span>
        </div>

        <span className="badge badge-orange" style={{ marginBottom: 12, display: 'inline-block' }}>📄 {sablon.kategori}</span>
        <h1 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 800, color: '#1a3a6b', marginBottom: 16 }}>{sablon.baslik}</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>{sablon.aciklama}</p>

        {sablon.ilgili_kanun && (
          <div style={{ background: '#dce6f1', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14 }}>
            📚 İlgili mevzuat: <strong>{sablon.ilgili_kanun}</strong>
          </div>
        )}

        <div className="warning-box" style={{ marginBottom: 24 }}>
          ⚖️ Bu şablon örnek amaçlıdır. Hukuki danışmanlık yerine geçmez. Kendi durumunuza göre düzenleyiniz. Önemli hukuki işlemler için avukata danışmanız önerilir.
        </div>

        {/* Önizleme */}
        <div style={{ background: '#f4f7fc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'hidden', position: 'relative' }}>
          {sablon.sablon_icerik?.substring(0, 400)}...
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, #f4f7fc)' }} />
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          <button onClick={handleDownload} className="btn btn-primary" style={{ fontSize: 16, padding: '14px 28px' }}>
            ⬇️ Ücretsiz İndir (.txt)
          </button>
          <span style={{ color: '#666', fontSize: 13 }}>Bu şablonu {sablon.indirme_sayisi} kişi indirdi</span>
        </div>

        {related?.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h3 style={{ color: '#1a3a6b', marginBottom: 16 }}>İlgili Şablonlar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {related.map(r => (
                <Link key={r.slug} to={`/dilekce-ornekleri/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a3a6b' }}>{r.baslik}</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>⬇️ {r.indirme_sayisi}</p>
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
