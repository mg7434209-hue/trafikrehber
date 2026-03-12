import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { cezaApi } from '../services/api';

export default function CezaHesaplaPage() {
  const [cezalar, setCezalar] = useState([]);
  const [selected, setSelected] = useState('');
  const [sonuc, setSonuc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cezaApi.getAll().then(d => setCezalar(d.cezalar || [])).catch(() => {});
  }, []);

  const hesapla = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const d = await cezaApi.hesapla(selected);
      setSonuc(d);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Trafik Cezası Hesaplama Aracı 2025 — TrafikRehber</title>
        <meta name="description" content="2025 yılı güncel trafik cezası tutarlarını hesaplayın. Erken ödeme indirimi ve taksit seçeneklerini görün." />
      </Helmet>
      <div className="container-sm" style={{ padding: '40px 20px' }}>
        <div className="breadcrumb">
          <Link to="/">Ana Sayfa</Link><span>/</span>
          <span>Ceza Hesapla</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a3a6b', marginBottom: 8 }}>Trafik Cezası Hesapla</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>Ceza türünü seçin, güncel tutarı ve ödeme seçeneklerini görün.</p>

        <div style={{ background: '#f4f7fc', borderRadius: 16, padding: 32, marginBottom: 32 }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#1a3a6b', marginBottom: 10 }}>
            Ceza Türü Seçin
          </label>
          <select
            value={selected}
            onChange={e => { setSelected(e.target.value); setSonuc(null); }}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 15, outline: 'none', marginBottom: 16 }}
          >
            <option value="">-- Ceza türü seçin --</option>
            {cezalar.map(c => (
              <option key={c.id} value={c.id}>{c.aciklama}</option>
            ))}
          </select>
          <button onClick={hesapla} disabled={!selected || loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: 14 }}>
            {loading ? '⏳ Hesaplanıyor...' : '🧮 Hesapla'}
          </button>
        </div>

        {sonuc && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32 }}>
            <h2 style={{ color: '#1a3a6b', marginBottom: 24, fontSize: 20 }}>{sonuc.ceza.aciklama}</h2>

            <div style={{ display: 'grid', gap: 16 }}>
              {[
                ['💰 Taban Ceza Tutarı', `₺${sonuc.hesaplama.taban_tutar.toLocaleString('tr-TR')}`, '#1a3a6b'],
                ['⚡ Erken Ödeme (%25 indirimli)', `₺${sonuc.hesaplama.erken_odeme_indirimi.toLocaleString('tr-TR')}`, '#2d7a2d'],
                ['📅 2 Taksit', `₺${sonuc.hesaplama.taksit_2.toLocaleString('tr-TR')} / taksit`, '#666'],
                ['📅 3 Taksit', `₺${sonuc.hesaplama.taksit_3.toLocaleString('tr-TR')} / taksit`, '#666'],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f4f7fc', borderRadius: 10 }}>
                  <span style={{ fontSize: 15 }}>{label}</span>
                  <span style={{ fontWeight: 700, fontSize: 18, color }}>{value}</span>
                </div>
              ))}
            </div>

            {sonuc.ceza.puan > 0 && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#fff0e6', borderRadius: 10, fontSize: 14 }}>
                ⚠️ Bu ceza ehliyet puanınızdan <strong>{sonuc.ceza.puan} puan</strong> düşürür.
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 13, color: '#888' }}>
              {sonuc.hesaplama.erken_odeme_aciklama}
            </div>

            <div style={{ marginTop: 24, padding: '16px', background: '#dce6f1', borderRadius: 10 }}>
              <p style={{ fontSize: 14, color: '#1a3a6b' }}>
                Bu cezaya itiraz etmek ister misiniz?{' '}
                <Link to="/trafik-cezalari/itiraz" style={{ fontWeight: 600, color: '#e65c00' }}>İtiraz Rehberini Okuyun →</Link>
              </p>
            </div>
          </div>
        )}

        <div className="warning-box" style={{ marginTop: 32 }}>
          ⚖️ Tutarlar 2024-2025 yılı için geçerlidir. Güncel tutarlar için resmi kaynakları kontrol ediniz.
        </div>
      </div>
    </>
  );
}
