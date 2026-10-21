import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { articlesApi, cezaApi, dilekceApi } from '../services/api';
import AkilliArama from '../components/AkilliArama';
import ZiyaretciSeridi from '../components/ZiyaretciSeridi';
// SSS verisi paylaşılır: sunucu (server.js) bunu okuyup FAQPage JSON-LD basar
import SSS from '../data/sss.json';
import { YIL } from '../yil';

/*
 * ANA SAYFA — "giren kişi ne aradığını ilk ekranda bulsun".
 * Sıra: arama (cezalar + dilekçeler + rehberler) → niyet kartları
 * ("ne yapmak istiyorsunuz?") → ceza geldi: öde mi itiraz mı → en çok
 * aranan cezalar (tutar API'den) → dilekçeler → rehberler → kategoriler
 * → hizmet durumu → resmî kaynaklar → SSS.
 * KURAL: ceza tutarı ve süreler bu dosyaya YAZILMAZ — /api/ceza-turleri
 * döndürür (CLAUDE.md "Ceza Verisi"). Yalnız API yanıt vermezse metin
 * yasal süreyle (1 ay / 15 gün) yazılır, rakam basılmaz.
 */

// En çok aranan cezalar (arama hacmine göre sıralı); tutarlar API'den gelir
const POPULER = [
  'kirmizi-isik-cezasi', 'hiz-cezasi-sehir-ici', 'cep-telefonu-cezasi',
  'alkollu-arac-kullanma-cezasi', 'hatali-park-cezasi', 'emniyet-kemeri-cezasi',
  'muayenesiz-arac-cezasi', 'zorunlu-trafik-sigortasi-cezasi',
];

// Hero altındaki hızlı çipler (kısa adlar)
const CIPLER = [
  { ad: 'Kırmızı ışık', slug: 'kirmizi-isik-cezasi' },
  { ad: 'Hız', slug: 'hiz-cezasi-sehir-ici' },
  { ad: 'Cep telefonu', slug: 'cep-telefonu-cezasi' },
  { ad: 'Alkol', slug: 'alkollu-arac-kullanma-cezasi' },
  { ad: 'Park', slug: 'hatali-park-cezasi' },
  { ad: 'Emniyet kemeri', slug: 'emniyet-kemeri-cezasi' },
];

// "Ne yapmak istiyorsunuz?" — ziyaretçinin niyetine göre tek tık.
// `yazi` adayları varsa ve öne çıkan rehberlerde bulunursa o yazıya gider,
// yoksa `ara` ile rehberlerde arama açılır (kırık bağlantı oluşmaz).
const NIYETLER = [
  { ikon: '💸', baslik: 'Cezam ne kadar?', alt: `${YIL} güncel tutarlar ve ceza puanları`, href: '/trafik-cezalari-2026' },
  { ikon: '🧮', baslik: 'İndirimli ne kadar öderim?', alt: 'Erken ödeme indirimi ve taksit hesabı', href: '/araclar/ceza-hesapla' },
  { ikon: '📄', baslik: 'Cezaya itiraz etmek istiyorum', alt: 'Hazır itiraz dilekçesi örnekleri', href: '/dilekce-ornekleri' },
  { ikon: '🔎', baslik: 'Cezamı nasıl sorgularım?', alt: 'e-Devlet ile adım adım sorgulama', yazi: ['trafik-cezasi-sorgulama-e-devlet', 'trafik-cezasi-e-devlet-sorgulama'], ara: 'sorgulama' },
  { ikon: '🪪', baslik: 'Ehliyet puanım / el koyma', alt: '100 puan, geri alma, psikoteknik', yazi: ['ehliyet-puan-sistemi-sorgulama'], href: '/ehliyet' },
  { ikon: '🚑', baslik: 'Kaza yaptım, ne yapmalıyım?', alt: 'Tutanak, sigorta ve hasar süreci', yazi: ['trafik-kazasi-sonrasi-ne-yapilir'], href: '/sigorta' },
];

const KATEGORILER = [
  { label: 'Trafik Cezaları', icon: '🚦', path: '/trafik-cezalari', desc: 'Ceza tutarları, itiraz yolları, güncel rehber' },
  { label: 'Sigorta Rehberi', icon: '🛡️', path: '/sigorta', desc: 'Zorunlu sigorta, kasko, tazminat bilgileri' },
  { label: 'Ehliyet İşlemleri', icon: '🪪', path: '/ehliyet', desc: 'Sınav rehberi, puan sistemi, yenileme' },
  { label: 'Araç İşlemleri', icon: '🚗', path: '/arac-islemleri', desc: 'Muayene, tescil, noter işlemleri' },
];

const KAYNAKLAR = [
  { ad: 'e-Devlet Kapısı', aciklama: 'Ceza sorgulama ve kişisel kayıtlar', url: 'https://www.turkiye.gov.tr/' },
  { ad: 'Gelir İdaresi Başkanlığı', aciklama: 'Trafik cezası ödeme işlemleri', url: 'https://www.gib.gov.tr/' },
  { ad: 'Mevzuat Bilgi Sistemi', aciklama: '2918 sayılı Kanun ve değişiklikleri', url: 'https://www.mevzuat.gov.tr/' },
];

const tl = (v) => Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
const tarih = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

export default function HomePage() {
  const [rehberler, setRehberler] = useState([]);
  const [ceza, setCeza] = useState(null);
  const [dilekceler, setDilekceler] = useState([]);
  const [openSss, setOpenSss] = useState(null);

  useEffect(() => {
    articlesApi.getFeatured().then(d => setRehberler(d.articles || [])).catch(() => {});
    cezaApi.getAll().then(d => setCeza(d)).catch(() => {});
    dilekceApi.getAll().then(d => setDilekceler(d.sablonlar || [])).catch(() => {});
  }, []);

  const cezalar = ceza?.cezalar || [];
  const populer = POPULER.map(s => cezalar.find(c => c.slug === s)).filter(Boolean);
  const sayfaliCeza = cezalar.filter(c => c.slug).length;
  const odemeGun = ceza?.odeme_suresi_gun;
  const itirazGun = ceza?.itiraz_suresi_gun || 15;
  const indirim = ceza?.indirim_orani ? Math.round(ceza.indirim_orani * 100) : 25;
  const ornek = cezalar.find(c => c.slug === 'kirmizi-isik-cezasi');

  const niyetHref = (n) => {
    const y = (n.yazi || []).find(s => rehberler.some(a => a.slug === s));
    if (y) return `/blog/${y}`;
    return n.href || `/blog?q=${encodeURIComponent(n.ara)}`;
  };

  return (
    <>
      <Helmet>
        <title>{`Trafik Cezası Ne Kadar? ${YIL} Güncel Tutarlar ve İtiraz | CezaRehberi`}</title>
        <meta name="description" content={`${YIL} güncel trafik cezası tutarları: kırmızı ışık, hız, cep telefonu, alkol, park. %25 erken ödeme indirimi hesaplama, ücretsiz itiraz dilekçesi örnekleri ve e-Devlet sorgulama rehberi.`} />
        <meta name="keywords" content={`trafik cezası ${YIL}, trafik cezası ne kadar, trafik cezası itiraz, trafik cezası sorgulama, kırmızı ışık cezası, hız cezası, ceza hesaplama`} />
      </Helmet>

      {/* ─── HERO: arama ilk ekranın merkezinde ─── */}
      <section className="hm-hero">
        <div className="hm-hero-in">
          <div className="hm-rozet">
            <span aria-hidden="true">✓</span>
            <span>{YIL} güncel<span className="hm-rozet-uzun"> · 7574 sayılı Kanun değişiklikleri işlendi</span></span>
          </div>
          <h1 className="hm-h1">
            Trafik cezanız ne kadar?<br />
            <span>Ödemeli mi, itiraz mı etmeli? Hemen öğrenin.</span>
          </h1>
          <p className="hm-lead">
            Ceza adını, dilekçe türünü ya da sorunuzu yazın; doğru sayfaya tek tıkla gidin.
          </p>

          <AkilliArama placeholder="Örn. kırmızı ışık, hız, itiraz…" />

          <nav className="hm-cipler" aria-label="Sık aranan cezalar">
            <span className="hm-cipler-ad">Sık arananlar:</span>
            {CIPLER.map(c => (
              <Link key={c.slug} to={`/ceza/${c.slug}`} className="hm-cip">{c.ad}</Link>
            ))}
          </nav>

          <ZiyaretciSeridi />

          <p className="hm-not">
            Bağımsız bilgilendirme platformudur; resmî kurum veya hukuk bürosu değildir. Süreleri ve tutarları resmî kaynaklardan doğrulayın.
          </p>
        </div>
      </section>

      {/* ─── NİYET KARTLARI ─── */}
      <section className="hm-niyet" aria-labelledby="niyet-baslik">
        <div className="hm-wrap">
          <h2 id="niyet-baslik" className="hm-niyet-baslik">Ne yapmak istiyorsunuz?</h2>
          <div className="hm-niyet-grid">
            {NIYETLER.map(n => (
              <Link key={n.baslik} to={niyetHref(n)} className="hm-niyet-kart">
                <span className="hm-niyet-ikon" aria-hidden="true">{n.ikon}</span>
                <span className="hm-niyet-metin">
                  <strong>{n.baslik}</strong>
                  <small>{n.alt}</small>
                </span>
                <span className="hm-ok" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CEZA GELDİ: İKİ YOL ─── */}
      <section className="hm-sec hm-sec-acik" aria-labelledby="yol-baslik">
        <div className="hm-wrap">
          <div className="hm-head">
            <span className="hm-etiket">CEZA GELDİ Mİ?</span>
            <h2 id="yol-baslik">Süreler tebliğ tarihinden başlar — iki yolunuz var</h2>
          </div>
          <div className="hm-yol">
            <article className="hm-yol-kart hm-yol-ode">
              <div className="hm-yol-sure">{odemeGun ? `${odemeGun} gün` : '1 ay'}</div>
              <h3>Ödemek istiyorum</h3>
              <p>
                Tebliğden itibaren {odemeGun ? `${odemeGun} gün (1 ay)` : '1 ay'} içinde öderseniz cezanın %{indirim}'i indirilir.
                {ornek && <> Örneğin {tl(ornek.taban_ceza_tl)} kırmızı ışık cezası {tl(ornek.taban_ceza_tl * (1 - indirim / 100))} olur.</>}
              </p>
              <Link to="/araclar/ceza-hesapla" className="hm-btn hm-btn-tur">İndirimli tutarı hesapla →</Link>
            </article>
            <article className="hm-yol-kart hm-yol-itiraz">
              <div className="hm-yol-sure">{itirazGun} gün</div>
              <h3>İtiraz etmek istiyorum</h3>
              <p>
                Tebliğden itibaren {itirazGun} gün içinde Sulh Ceza Hâkimliği'ne yazılı başvurursunuz. Süre kaçarsa ceza kesinleşir.
              </p>
              <Link to="/dilekce-ornekleri" className="hm-btn hm-btn-lac">İtiraz dilekçesi örnekleri →</Link>
            </article>
          </div>
          <p className="hm-alt-not">Peşin ödeme itiraz hakkınızı ortadan kaldırmaz (Kabahatler Kanunu m.17/6). İki süreyi karıştırmayın; kişisel durumunuz için bir avukata danışabilirsiniz.</p>
        </div>
      </section>

      {/* ─── EN ÇOK ARANAN CEZALAR ─── */}
      {populer.length > 0 && (
        <section className="hm-sec" aria-labelledby="populer-baslik">
          <div className="hm-wrap">
            <div className="hm-head hm-head-satir">
              <div>
                <span className="hm-etiket">{YIL} TUTARLARI</span>
                <h2 id="populer-baslik">En çok aranan trafik cezaları</h2>
              </div>
              <Link to="/trafik-cezalari-2026" className="hm-tumu">Tüm cezalar ({cezalar.length}) →</Link>
            </div>
            <div className="hm-ceza-grid">
              {populer.map(c => (
                <Link key={c.slug} to={`/ceza/${c.slug}`} className="hm-ceza">
                  <span className="hm-ceza-ad">{c.aciklama}</span>
                  <span className="hm-ceza-tutar">{tl(c.taban_ceza_tl)}</span>
                  <span className="hm-ceza-alt">
                    Erken ödemede {tl(c.taban_ceza_tl * (1 - indirim / 100))}
                    {c.puan > 0 ? ` · ${c.puan} puan` : ''}
                  </span>
                </Link>
              ))}
            </div>
            {ceza?.son_dogrulama && (
              <p className="hm-alt-not">
                Tutarlar son olarak {tarih(ceza.son_dogrulama)} tarihinde resmî kaynaklarla karşılaştırıldı · {sayfaliCeza} cezanın ayrıntılı sayfası var.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ─── DİLEKÇELER ─── */}
      {dilekceler.length > 0 && (
        <section className="hm-sec hm-sec-acik" aria-labelledby="dilekce-baslik">
          <div className="hm-wrap">
            <div className="hm-head hm-head-satir">
              <div>
                <span className="hm-etiket">ÜCRETSİZ ŞABLON</span>
                <h2 id="dilekce-baslik">Hazır dilekçe örnekleri</h2>
              </div>
              <Link to="/dilekce-ornekleri" className="hm-tumu">Tüm dilekçeler →</Link>
            </div>
            <div className="hm-kart-grid">
              {dilekceler.slice(0, 4).map(d => (
                <Link key={d.slug} to={`/dilekce-ornekleri/${d.slug}`} className="hm-kart">
                  <span className="hm-kart-ikon" aria-hidden="true">📄</span>
                  <strong>{d.baslik}</strong>
                  {d.aciklama && <small>{d.aciklama.length > 90 ? `${d.aciklama.slice(0, 90)}…` : d.aciklama}</small>}
                  <span className="hm-kart-git">Doldur, kopyala, yazdır →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── GÜNCEL REHBERLER ─── */}
      {rehberler.length > 0 && (
        <section className="hm-sec" aria-labelledby="rehber-baslik">
          <div className="hm-wrap">
            <div className="hm-head hm-head-satir">
              <div>
                <span className="hm-etiket">REHBERLER</span>
                <h2 id="rehber-baslik">Adım adım güncel rehberler</h2>
              </div>
              <Link to="/blog" className="hm-tumu">Tüm rehberler →</Link>
            </div>
            <div className="hm-kart-grid hm-kart-grid-3">
              {rehberler.slice(0, 6).map(a => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="hm-kart">
                  <strong>{a.title}</strong>
                  {a.meta_description && <small>{a.meta_description.length > 100 ? `${a.meta_description.slice(0, 100)}…` : a.meta_description}</small>}
                  <span className="hm-kart-meta">⏱ {a.reading_time_min} dk okuma</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── KATEGORİLER ─── */}
      <section className="hm-sec hm-sec-acik" aria-labelledby="kategori-baslik">
        <div className="hm-wrap">
          <div className="hm-head">
            <h2 id="kategori-baslik">Konuya göre göz atın</h2>
          </div>
          <div className="hm-kat-grid">
            {KATEGORILER.map(k => (
              <Link key={k.path} to={k.path} className="hm-kat">
                <span className="hm-kat-ikon" aria-hidden="true">{k.icon}</span>
                <strong>{k.label}</strong>
                <small>{k.desc}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HİZMET DURUMU (dürüst bilgi: neyin olduğu, neyin olmadığı) ─── */}
      <section className="hm-sec" aria-labelledby="hizmet-baslik">
        <div className="hm-wrap">
          <div className="hm-head">
            <span className="hm-etiket">BELGE VE BAŞVURU</span>
            <h2 id="hizmet-baslik">Dilekçeniz için seçenekler</h2>
          </div>
          <div className="hm-hizmet-grid">
            <article className="hm-hizmet hm-hizmet-aktif">
              <span className="hm-hizmet-durum hm-yesil">HEMEN KULLANIN</span>
              <h3>Ücretsiz tam şablon</h3>
              <div className="hm-hizmet-fiyat">0 TL</div>
              <p>Dilekçe örneğini seçin, bilgileri doldurun, kopyalayın veya yazdırın.</p>
              <Link to="/dilekce-ornekleri" className="hm-btn hm-btn-lac hm-btn-blok">Ücretsiz dilekçe hazırla →</Link>
            </article>
            <article className="hm-hizmet">
              <span className="hm-hizmet-durum hm-turuncu">YAKINDA</span>
              <h3>Gelişmiş şablon paketi</h3>
              <div className="hm-hizmet-fiyat">200 TL</div>
              <p>Belge kontrol listesi ve düzenli eklerle hazırlanacak dijital paket. Avukat incelemesi içermez.</p>
              <div className="hm-hizmet-kapali">Hazırlanıyor · ödeme kapalı</div>
            </article>
            <article className="hm-hizmet">
              <span className="hm-hizmet-durum">PLANLANIYOR</span>
              <h3>Avukat incelemesi</h3>
              <div className="hm-hizmet-fiyat hm-hizmet-fiyat-k">Anlaşma sonrası</div>
              <p>Gerçek avukatın incelemesi; sözleşme, yetki ve ücret koşulları tamamlanınca sunulabilir.</p>
              <div className="hm-hizmet-kapali">Şu anda hizmet verilmemektedir</div>
            </article>
          </div>
          <p className="hm-alt-not hm-orta">Genel şablonlar kişiye özel hukuki danışmanlık değildir. Avukat incelemeli hizmet için henüz avukat anlaşması yapılmamıştır.</p>
        </div>
      </section>

      {/* ─── RESMÎ KAYNAKLAR ─── */}
      <section className="hm-sec hm-sec-acik" aria-labelledby="resmi-kaynaklar-baslik">
        <div className="hm-wrap">
          <div className="hm-head">
            <h2 id="resmi-kaynaklar-baslik">Resmî kaynaklardan doğrulayın</h2>
            <p>Borç, tebligat, başvuru ve ödeme durumunuzu ilgili kurumun resmî sisteminden kontrol edin.</p>
          </div>
          <div className="hm-kat-grid hm-kaynak-grid">
            {KAYNAKLAR.map(k => (
              <a key={k.url} href={k.url} target="_blank" rel="noopener noreferrer" className="hm-kat hm-kaynak">
                <strong>{k.ad} ↗</strong>
                <small>{k.aciklama}</small>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SSS ─── */}
      <section className="hm-sec" aria-labelledby="sss-baslik">
        <div className="hm-wrap hm-dar">
          <div className="hm-head hm-orta">
            <h2 id="sss-baslik">Sık sorulan sorular</h2>
          </div>
          {SSS.map((item, i) => (
            <div key={i} className="hm-sss">
              <button
                type="button"
                aria-expanded={openSss === i}
                aria-controls={`sss-yanit-${i}`}
                onClick={() => setOpenSss(openSss === i ? null : i)}
                className="hm-sss-s"
              >
                <span>{item.s}</span>
                <span className="hm-sss-ikon" aria-hidden="true">{openSss === i ? '−' : '+'}</span>
              </button>
              {openSss === i && (
                <div id={`sss-yanit-${i}`} className="hm-sss-c">{item.c}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="hm-cta">
        <div className="hm-wrap hm-dar hm-orta">
          <h2>Aradığınızı bulamadınız mı?</h2>
          <p>Tüm rehberlerde arayın ya da {YIL} ceza listesinin tamamına göz atın.</p>
          <div className="hm-cta-btn">
            <Link to="/blog" className="hm-btn hm-btn-tur">📰 Tüm rehberler</Link>
            <Link to="/trafik-cezalari-2026" className="hm-btn hm-btn-cam">📋 {YIL} ceza listesi</Link>
          </div>
        </div>
      </section>
    </>
  );
}
