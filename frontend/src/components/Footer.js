import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#0f2347', color: '#94a3b8', marginTop: 64 }}>
      <div className="container" style={{ padding: '44px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 36, marginBottom: 36 }}>

          {/* Marka */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#1a3a6b', flexShrink: 0 }}>T</div>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>TrafikRehber</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              Trafik cezaları, sigorta, ehliyet ve araç işlemleri hakkında güncel ve güvenilir Türkçe rehber.
            </p>
            <div style={{ marginTop: 14, background: '#e65c0020', border: '1px solid #e65c0040', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fbbf24' }}>
              🔴 2026 güncel ceza tutarları yayında
            </div>
          </div>

          {/* Cezalar */}
          <div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trafik Cezaları</div>
            {[
              ['2026 Ceza Listesi', '/trafik-cezalari-2026'],
              ['Trafik Cezaları', '/trafik-cezalari'],
              ['Ceza Hesapla', '/araclar/ceza-hesapla'],
              ['İtiraz Dilekçeleri', '/dilekce-ornekleri'],
            ].map(([label, path]) => (
              <div key={path} style={{ marginBottom: 9 }}>
                <Link to={path} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = '#94a3b8'}
                >{label}</Link>
              </div>
            ))}
          </div>

          {/* Kategoriler */}
          <div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kategoriler</div>
            {[
              ['Sigorta Rehberi', '/sigorta'],
              ['Ehliyet İşlemleri', '/ehliyet'],
              ['Araç İşlemleri', '/arac-islemleri'],
              ['Blog & Makaleler', '/blog'],
            ].map(([label, path]) => (
              <div key={path} style={{ marginBottom: 9 }}>
                <Link to={path} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = '#94a3b8'}
                >{label}</Link>
              </div>
            ))}
          </div>

          {/* Kurumsal */}
          <div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kurumsal</div>
            {[
              ['Hakkımızda', '/hakkimizda'],
              ['İletişim', '/iletisim'],
              ['Gizlilik Politikası', '/gizlilik-politikasi'],
            ].map(([label, path]) => (
              <div key={path} style={{ marginBottom: 9 }}>
                <Link to={path} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s' }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = '#94a3b8'}
                >{label}</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alt bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#64748b' }}>© 2026 TrafikRehber. Tüm hakları saklıdır.</p>
          <p style={{ fontSize: 12, color: '#64748b', textAlign: 'right' }}>
            ⚖️ Bu site genel bilgilendirme amaçlıdır. Hukuki danışmanlık yerine geçmez.
          </p>
        </div>
      </div>
    </footer>
  );
}
