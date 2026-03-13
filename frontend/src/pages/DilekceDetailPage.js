
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { dilekceApi } from '../services/api';

const PLACEHOLDER_LABELS = {
  'AD SOYAD': 'Ad Soyad',
  'TC KİMLİK NUMARASI': 'TC Kimlik Numarası',
  'TC KİMLİK': 'TC Kimlik Numarası',
  'TC KİMLİK NO': 'TC Kimlik Numarası',
  'AÇIK ADRES': 'Açık Adres',
  'ADRES': 'Adres',
  'TELEFON': 'Telefon Numarası',
  'TARİH': 'Tarih (gün/ay/yıl)',
  'ŞEHİR ADI': 'Şehir',
  'ŞEHİR': 'Şehir',
  'İL': 'İl',
  'PLAKA': 'Araç Plakası',
  'CEZA NO': 'Ceza / Tutanak Numarası',
  'CEZA TÜRÜ': 'Ceza Türü',
  'TUTAR': 'Ceza Tutarı (TL)',
  'YER': 'Yer / Konum',
  'KAZA YERİ': 'Kaza Yeri',
  'SAAT': 'Saat',
  'GEREKÇENİZ': 'Gerekçeniz',
  'BİRİNCİ GEREKÇENİZ': '1. Gerekçeniz',
  'VARSA İKİNCİ GEREKÇE': '2. Gerekçeniz (İsteğe bağlı)',
  'SİGORTA ŞİRKETİ': 'Sigorta Şirketi Adı',
  'POLİÇE NUMARASI': 'Poliçe Numarası',
  'POLİÇE NO': 'Poliçe Numarası',
  'IBAN': 'IBAN Numarası',
  'BANKA ADI': 'Banka Adı',
  'NO': 'Tutanak / Belge Numarası',
  'KİŞİ ADI': 'Kişinin Adı',
  'TOPLAM': 'Toplam Tutar (TL)',
  'ÇEKİLME TARİHİ': 'Çekilme Tarihi',
};

function getLabel(key) {
  return PLACEHOLDER_LABELS[key.trim()] || key.trim();
}

function extractPlaceholders(text) {
  const regex = /\[([^\]]+)\]/g;
  const found = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const key = match[1].trim();
    if (key.length < 60 && !key.includes('\n')) found.add(key);
  }
  return [...found];
}

function fillTemplate(template, values) {
  let result = template;
  for (const [key, val] of Object.entries(values)) {
    if (val) {
      result = result.replace(new RegExp(`\\[${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), val);
    }
  }
  return result;
}

function getInputType(key) {
  if (key.includes('TARİH')) return 'date';
  if (key.includes('TELEFON')) return 'tel';
  if (key.includes('TUTAR') || key.includes('TOPLAM')) return 'number';
  return 'text';
}

function isTextarea(key) {
  return key.includes('GEREKÇE') || key === 'ADRES' || key === 'AÇIK ADRES';
}

function openPdfPrint(content, baslik) {
  const pw = window.open('', '_blank');
  if (!pw) { alert('Pop-up engelleyiciyi kapatıp tekrar deneyin.'); return; }
  const escaped = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  pw.document.write(`<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"/>
<title>${baslik}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;background:#fff}
  .page{width:210mm;min-height:297mm;margin:0 auto;padding:25mm 20mm 20mm 25mm;position:relative}
  .wm{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-42deg);
    font-size:58pt;font-weight:900;color:rgba(200,0,0,0.07);white-space:nowrap;
    pointer-events:none;z-index:0;letter-spacing:3px;font-family:Arial,sans-serif}
  .content{position:relative;z-index:1;white-space:pre-wrap;line-height:2;font-size:11pt}
  .hdr{border-bottom:2px solid #1a3a6b;margin-bottom:22px;padding-bottom:8px;
    display:flex;justify-content:space-between;align-items:flex-end}
  .hdr .sn{font-size:9pt;color:#1a3a6b;font-weight:bold}
  .hdr .dl{font-size:8pt;color:#888}
  .ftr{position:fixed;bottom:10mm;left:0;right:0;text-align:center;
    font-size:7.5pt;color:#aaa;border-top:1px solid #ddd;padding-top:5px;margin:0 20mm}
  @media print{body{padding:0}@page{margin:0;size:A4}}
</style></head>
<body>
<div class="wm">ÖRNEK DİLEKÇEDİR</div>
<div class="page">
  <div class="hdr">
    <span class="sn">TrafikRehber — cezarehberi.com</span>
    <span class="dl">Örnek Dilekçe Şablonu</span>
  </div>
  <div class="content">${escaped}</div>
</div>
<div class="ftr">Bu belge örnek amaçlıdır; hukuki danışmanlık yerine geçmez. Önemli işlemler için avukata danışınız. | cezarehberi.com</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400)}<\/script>
</body></html>`);
  pw.document.close();
}

export default function DilekceDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    dilekceApi.getBySlug(slug)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40,height:40,border:'3px solid #e2e8f0',borderTopColor:'#1a3a6b',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px' }} />
        <p style={{ color:'#666' }}>Yükleniyor...</p>
      </div>
    </div>
  );

  if (!data?.sablon) return (
    <div className="container" style={{ padding:'60px 20px', textAlign:'center' }}>
      <h2>Şablon bulunamadı</h2>
      <Link to="/dilekce-ornekleri" className="btn btn-primary">Tüm Şablonlar</Link>
    </div>
  );

  const { sablon, related } = data;
  const placeholders = extractPlaceholders(sablon.sablon_icerik || '');
  const filledContent = fillTemplate(sablon.sablon_icerik || '', values);
  const isComplete = placeholders.every(p => values[p]?.trim());
  const completedCount = placeholders.filter(p => values[p]?.trim()).length;
  const progress = placeholders.length > 0 ? Math.round((completedCount / placeholders.length) * 100) : 100;

  const handleChange = (key, val) => setValues(prev => ({ ...prev, [key]: val }));

  const handleTxt = () => {
    const blob = new Blob([filledContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${sablon.slug}-dilekce.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(filledContent).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <Helmet>
        <title>{sablon.baslik} — Kişiselleştir ve İndir | TrafikRehber</title>
        <meta name="description" content={sablon.aciklama} />
      </Helmet>

      <div className="container-sm" style={{ padding:'40px 20px', maxWidth:900 }}>
        <div className="breadcrumb">
          <Link to="/">Ana Sayfa</Link><span>/</span>
          <Link to="/dilekce-ornekleri">Dilekçeler</Link><span>/</span>
          <span>{sablon.baslik}</span>
        </div>

        <span className="badge badge-orange" style={{ marginBottom:12, display:'inline-block' }}>
          📄 {sablon.kategori}
        </span>
        <h1 style={{ fontSize:'clamp(20px,4vw,28px)', fontWeight:800, color:'#1a3a6b', marginBottom:8 }}>
          {sablon.baslik}
        </h1>
        <p style={{ color:'#666', marginBottom:20 }}>{sablon.aciklama}</p>

        {sablon.ilgili_kanun && (
          <div style={{ background:'#dce6f1', borderRadius:8, padding:'10px 16px', marginBottom:20, fontSize:14 }}>
            📚 İlgili mevzuat: <strong>{sablon.ilgili_kanun}</strong>
          </div>
        )}

        <div className="warning-box" style={{ marginBottom:28 }}>
          ⚖️ Bu şablon örnek amaçlıdır. Hukuki danışmanlık yerine geçmez. Önemli davalarda avukata danışmanız önerilir.
        </div>

        <div style={{ display:'grid', gridTemplateColumns: placeholders.length > 0 ? '1fr 1fr' : '1fr', gap:24, alignItems:'start' }}>

          {/* SOL: Form */}
          {placeholders.length > 0 && (
            <div>
              <div style={{ background:'#1a3a6b', color:'#fff', borderRadius:'12px 12px 0 0', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontWeight:700, fontSize:15 }}>✏️ Bilgilerinizi Girin</span>
                <span style={{ fontSize:13, background:'rgba(255,255,255,0.2)', padding:'4px 10px', borderRadius:20 }}>
                  {completedCount}/{placeholders.length}
                </span>
              </div>
              <div style={{ background:'#e2e8f0', height:5 }}>
                <div style={{ background: progress===100 ? '#2d7a2d' : '#e65c00', height:'100%', width:`${progress}%`, transition:'width 0.3s' }} />
              </div>
              <div style={{ background:'#f4f7fc', border:'1px solid #e2e8f0', borderTop:'none', borderRadius:'0 0 12px 12px', padding:20 }}>
                {placeholders.map(key => (
                  <div key={key} style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontWeight:600, fontSize:13, color:'#1a3a6b', marginBottom:5 }}>
                      {getLabel(key)}
                      {!values[key]?.trim() && <span style={{ color:'#e65c00', marginLeft:4 }}>*</span>}
                    </label>
                    {isTextarea(key) ? (
                      <textarea
                        value={values[key] || ''}
                        onChange={e => handleChange(key, e.target.value)}
                        placeholder={`${getLabel(key)} yazın...`}
                        rows={3}
                        style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`2px solid ${values[key]?.trim() ? '#2d7a2d' : '#e2e8f0'}`, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
                      />
                    ) : (
                      <input
                        type={getInputType(key)}
                        value={values[key] || ''}
                        onChange={e => handleChange(key, e.target.value)}
                        placeholder={`${getLabel(key)} girin`}
                        style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:`2px solid ${values[key]?.trim() ? '#2d7a2d' : '#e2e8f0'}`, fontSize:14, outline:'none', boxSizing:'border-box' }}
                      />
                    )}
                  </div>
                ))}

                {/* PDF İndir butonu */}
                <button
                  onClick={() => openPdfPrint(filledContent, sablon.baslik)}
                  style={{
                    width:'100%', padding:'14px',
                    background: isComplete ? '#c0392b' : '#1a3a6b',
                    color:'#fff', border:'none', borderRadius:10,
                    fontSize:15, fontWeight:700, cursor:'pointer', marginTop:8
                  }}
                >
                  {isComplete ? '📄 Kişiselleştirilmiş PDF İndir' : '📄 PDF Olarak İndir'}
                </button>

                {/* TXT İndir butonu */}
                <button
                  onClick={handleTxt}
                  style={{
                    width:'100%', padding:'11px',
                    background:'#f4f7fc', color:'#1a3a6b',
                    border:'2px solid #1a3a6b', borderRadius:10,
                    fontSize:14, fontWeight:600, cursor:'pointer', marginTop:8
                  }}
                >
                  ⬇️ Metin Olarak İndir (.txt)
                </button>

                {!isComplete && (
                  <p style={{ fontSize:12, color:'#888', textAlign:'center', marginTop:6 }}>
                    Tüm alanları doldurarak kişiselleştirilmiş dilekçe oluşturabilirsiniz
                  </p>
                )}
              </div>
            </div>
          )}

          {/* SAĞ: Canlı Önizleme */}
          <div>
            <div style={{ background:'#374151', color:'#fff', borderRadius:'12px 12px 0 0', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700, fontSize:15 }}>👁 Canlı Önizleme</span>
              <button
                onClick={handleCopy}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'5px 12px', borderRadius:20, fontSize:12, cursor:'pointer' }}
              >
                {copied ? '✅ Kopyalandı!' : '📋 Kopyala'}
              </button>
            </div>
            <div
              ref={previewRef}
              style={{
                background:'#fff', border:'1px solid #e2e8f0', borderTop:'none',
                borderRadius:'0 0 12px 12px', padding:20, position:'relative',
                fontFamily:'"Courier New",Courier,monospace', fontSize:12,
                lineHeight:1.9, whiteSpace:'pre-wrap', maxHeight:520,
                overflowY:'auto', color:'#1a1a1a'
              }}
            >
              {/* Önizleme filigran */}
              <div style={{
                position:'absolute', top:'50%', left:'50%',
                transform:'translate(-50%,-50%) rotate(-35deg)',
                fontSize:20, fontWeight:900, color:'rgba(200,0,0,0.07)',
                whiteSpace:'nowrap', pointerEvents:'none', userSelect:'none',
                letterSpacing:2, fontFamily:'Arial,sans-serif'
              }}>ÖRNEK DİLEKÇEDİR</div>

              {filledContent.split(/\[([^\]]+)\]/g).map((part, i) => {
                if (i % 2 === 0) return part;
                const key = part.trim();
                const filled = values[key];
                return filled
                  ? <span key={i} style={{ background:'#dcfce7', color:'#15803d', fontWeight:600 }}>{filled}</span>
                  : <span key={i} style={{ background:'#fef3c7', color:'#92400e', border:'1px dashed #fbbf24', padding:'0 2px' }}>[{part}]</span>;
              })}
            </div>

            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <button
                onClick={() => openPdfPrint(filledContent, sablon.baslik)}
                style={{ flex:1, padding:'11px', background:'#c0392b', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}
              >
                📄 PDF İndir
              </button>
              <button
                onClick={handleTxt}
                style={{ flex:1, padding:'11px', background:'#1a3a6b', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}
              >
                ⬇️ .txt
              </button>
              <button
                onClick={handleCopy}
                style={{ flex:1, padding:'11px', background:'#f4f7fc', color:'#1a3a6b', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}
              >
                {copied ? '✅' : '📋 Kopyala'}
              </button>
            </div>
          </div>
        </div>

        {/* İlgili şablonlar */}
        {related?.length > 0 && (
          <div style={{ marginTop:48 }}>
            <h3 style={{ color:'#1a3a6b', marginBottom:16, fontSize:18, fontWeight:700 }}>
              İlgili Dilekçe Şablonları
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
              {related.map(r => (
                <Link key={r.slug} to={`/dilekce-ornekleri/${r.slug}`} style={{ textDecoration:'none' }}>
                  <div className="card" style={{ padding:16, transition:'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform='none'}
                  >
                    <p style={{ fontSize:13, fontWeight:600, color:'#1a3a6b', lineHeight:1.4 }}>{r.baslik}</p>
                    <p style={{ fontSize:12, color:'#888', marginTop:6 }}>⬇️ {r.indirme_sayisi} indirme</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .dilekce-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
