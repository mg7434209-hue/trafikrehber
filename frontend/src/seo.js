import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Site genelinde tek doğru adres. Railway'de REACT_APP_SITE_URL ile ezilir.
 * KURAL: Sayfalara elle alan adı yazma — canonical/paylaşım linkleri buradan.
 */
export const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://www.cezarehberi.com').replace(/\/$/, '');

export const abs = (path = '/') => SITE_URL + (path.startsWith('/') ? path : '/' + path);

/**
 * İstemci tarafı head bakımı.
 *
 * Üretimde `<head>` etiketlerini SUNUCU basar (bkz. frontend/server.js) — botlar
 * ve sosyal medya kazıyıcıları JS çalıştırmadığı için tek güvenilir yol budur.
 * Bu bileşen sunucunun bastığı head'i tarayıcıda tutarlı tutar:
 *   1) SPA içi gezinmede canonical/og:url'i yeni rotaya günceller.
 *   2) Sayfaların kendi <Helmet>'i bir etiketi yazdıysa sunucunun aynı etiketten
 *      bastığı KOPYAYI siler (Helmet etiketleri `data-rh` işaretlidir) — aksi
 *      hâlde sayfada iki canonical / iki description olur.
 *   3) og:title / og:description'ı güncel başlık ve açıklamayla eşitler.
 * Makale sayfası gibi veriyi SONRADAN çeken sayfalarda Helmet geç bastığı için
 * head bir MutationObserver ile kısa süre izlenir.
 */
const TEKILLESTIRILECEK = [
  'link[rel="canonical"]',
  'meta[name="description"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
];

const IZLEME_SURESI_MS = 6000;

function kopyalariTemizle() {
  TEKILLESTIRILECEK.forEach((secici) => {
    const grup = {};
    document.head.querySelectorAll(secici).forEach((el) => {
      const anahtar = el.getAttribute('property') || el.getAttribute('name') || el.getAttribute('rel');
      (grup[anahtar] = grup[anahtar] || []).push(el);
    });
    Object.values(grup).forEach((liste) => {
      if (liste.length < 2) return;
      const helmetli = liste.filter((el) => el.hasAttribute('data-rh'));
      if (!helmetli.length) return; // hepsi sunucudan geliyorsa dokunma
      liste.filter((el) => !el.hasAttribute('data-rh')).forEach((el) => el.remove());
    });
  });
}

/** Helmet yönetmiyorsa etiketi (gerekirse oluşturup) ayarlar; değer aynıysa yazmaz. */
function etiketYaz(secici, olustur, ozellik, deger) {
  if (!deger) return;
  if (document.head.querySelector(secici + '[data-rh]')) return; // sayfa kendi yönetiyor
  let el = document.head.querySelector(secici);
  if (!el) {
    el = olustur();
    document.head.appendChild(el);
  }
  if (el.getAttribute(ozellik) !== deger) el.setAttribute(ozellik, deger);
}

const metaOlustur = (ozellik, ad) => () => {
  const el = document.createElement('meta');
  el.setAttribute(ozellik, ad);
  return el;
};

let senkronDevam = false;

function senkronize(url) {
  if (senkronDevam) return;
  senkronDevam = true;
  try {
    kopyalariTemizle();

    etiketYaz('link[rel="canonical"]', () => {
      const el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      return el;
    }, 'href', url);
    etiketYaz('meta[property="og:url"]', metaOlustur('property', 'og:url'), 'content', url);

    const baslik = document.title;
    etiketYaz('meta[property="og:title"]', metaOlustur('property', 'og:title'), 'content', baslik);
    etiketYaz('meta[name="twitter:title"]', metaOlustur('name', 'twitter:title'), 'content', baslik);

    const aciklamaEl = document.head.querySelector('meta[name="description"]');
    const aciklama = aciklamaEl && aciklamaEl.getAttribute('content');
    etiketYaz('meta[property="og:description"]', metaOlustur('property', 'og:description'), 'content', aciklama);
    etiketYaz('meta[name="twitter:description"]', metaOlustur('name', 'twitter:description'), 'content', aciklama);
  } finally {
    senkronDevam = false;
  }
}

export default function SeoDefaults() {
  const { pathname } = useLocation();

  useEffect(() => {
    const url = abs(pathname);
    let zamanlayici = null;
    const calistir = () => {
      clearTimeout(zamanlayici);
      zamanlayici = setTimeout(() => senkronize(url), 50);
    };

    calistir();
    // Helmet etiketlerini kendi effect'inde uygular; veri geç gelen sayfalarda
    // (makale/dilekçe detayı) bu kısa süreli izleme senkronu garantiler.
    const gozlemci = new MutationObserver(calistir);
    gozlemci.observe(document.head, { childList: true, subtree: true, attributes: true });
    const durdur = setTimeout(() => gozlemci.disconnect(), IZLEME_SURESI_MS);

    return () => {
      clearTimeout(zamanlayici);
      clearTimeout(durdur);
      gozlemci.disconnect();
    };
  }, [pathname]);

  return null;
}
