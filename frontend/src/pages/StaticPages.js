// HakkimizdaPage.js
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function HakkimizdaPage() {
  return (
    <>
      <Helmet><title>Hakkımızda — TrafikRehber</title></Helmet>
      <div className="container-sm" style={{ padding: '60px 20px' }}>
        <h1 style={{ color: '#1a3a6b', marginBottom: 24, fontSize: 32, fontWeight: 800 }}>Hakkımızda</h1>
        <p style={{ color: '#444', lineHeight: 1.8, marginBottom: 16 }}>
          TrafikRehber, Türkiye'deki araç sahipleri ve sürücüler için trafik hukuku, ceza sorgulama, sigorta rehberi ve araç işlemleri konularında güvenilir, güncel bilgi sunmak amacıyla kurulmuş bir platformdur.
        </p>
        <p style={{ color: '#444', lineHeight: 1.8, marginBottom: 16 }}>
          Amacımız; trafik cezası itirazından ehliyet puan sorgulamaya, zorunlu sigorta rehberinden araç muayene randevusuna kadar pek çok konuda vatandaşlarımızın doğru bilgiye hızlıca ulaşmasını sağlamaktır.
        </p>
        <div className="warning-box">
          ⚖️ TrafikRehber, hukuki danışmanlık hizmeti vermemektedir. Tüm içerikler genel bilgilendirme amaçlıdır. Hukuki işlemleriniz için bir avukattan destek almanızı öneririz.
        </div>
      </div>
    </>
  );
}

export function IletisimPage() {
  return (
    <>
      <Helmet><title>İletişim — TrafikRehber</title></Helmet>
      <div className="container-sm" style={{ padding: '60px 20px' }}>
        <h1 style={{ color: '#1a3a6b', marginBottom: 24, fontSize: 32, fontWeight: 800 }}>İletişim</h1>
        <p style={{ color: '#444', lineHeight: 1.8, marginBottom: 24 }}>Görüş, öneri ve şikayetleriniz için bizimle iletişime geçebilirsiniz.</p>
        <div style={{ background: '#f4f7fc', borderRadius: 12, padding: 24 }}>
          <p style={{ marginBottom: 8 }}><strong>E-posta:</strong> info@trafikrehber.com</p>
          <p style={{ marginBottom: 8 }}><strong>Veri Sorumlusu:</strong> TrafikRehber / Göksoylar İletişim</p>
          <p style={{ fontSize: 13, color: '#666', marginTop: 16 }}>KVKK kapsamındaki talepleriniz için aynı e-posta adresini kullanabilirsiniz.</p>
        </div>
      </div>
    </>
  );
}

export function GizlilikPage() {
  return (
    <>
      <Helmet><title>Gizlilik Politikası — TrafikRehber</title></Helmet>
      <div className="container-sm" style={{ padding: '60px 20px' }}>
        <h1 style={{ color: '#1a3a6b', marginBottom: 24, fontSize: 32, fontWeight: 800 }}>Gizlilik Politikası</h1>
        <h2 style={{ color: '#1a3a6b', fontSize: 20, marginTop: 32, marginBottom: 12 }}>Kişisel Verilerin Korunması (KVKK)</h2>
        <p style={{ color: '#444', lineHeight: 1.8, marginBottom: 16 }}>
          TrafikRehber olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizi korumaya önem veriyoruz.
        </p>
        <h2 style={{ color: '#1a3a6b', fontSize: 20, marginTop: 32, marginBottom: 12 }}>Çerezler</h2>
        <p style={{ color: '#444', lineHeight: 1.8, marginBottom: 16 }}>
          Sitemizde Google Analytics gibi analitik araçlar için çerezler kullanılmaktadır. Bu çerezler yalnızca onayınız ile aktif hale gelir.
        </p>
        <h2 style={{ color: '#1a3a6b', fontSize: 20, marginTop: 32, marginBottom: 12 }}>Veri Toplama</h2>
        <p style={{ color: '#444', lineHeight: 1.8 }}>
          Dilekçe indirme veya iletişim formu aracılığıyla toplanan e-posta adresleri yalnızca belirtilen amaçla kullanılır, üçüncü taraflarla paylaşılmaz.
        </p>
        <p style={{ color: '#444', lineHeight: 1.8, marginTop: 16 }}>
          KVKK kapsamındaki talepleriniz için: info@trafikrehber.com
        </p>
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <Helmet><title>Sayfa Bulunamadı — TrafikRehber</title></Helmet>
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚦</div>
        <h1 style={{ color: '#1a3a6b', fontSize: 32, marginBottom: 8 }}>404 — Sayfa Bulunamadı</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <a href="/" className="btn btn-primary">Ana Sayfaya Dön</a>
      </div>
    </>
  );
}
