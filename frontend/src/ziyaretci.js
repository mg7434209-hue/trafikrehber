/**
 * Ziyaretçi verisi için paylaşılan küçük yayın kanalı.
 *
 * Footer'daki VisitCounter her rota değişiminde ziyareti SUNUCUYA BİLDİRİR ve
 * güncel sayıları alır. Ana sayfadaki şerit aynı veriyi göstermeli — ikinci bir
 * istekle değil, bu kanaldan. Aksi hâlde şerit ziyaretçinin kendi ziyaretinden
 * ÖNCEKİ sayıyı gösterip footer'la çelişebilirdi.
 */
let son = null;
const OLAY = 'ziyaretci:veri';

export function ziyaretciYayinla(veri) {
  son = veri;
  window.dispatchEvent(new CustomEvent(OLAY, { detail: veri }));
}

export function ziyaretciSon() {
  return son;
}

export function ziyaretciDinle(fn) {
  const h = (e) => fn(e.detail);
  window.addEventListener(OLAY, h);
  return () => window.removeEventListener(OLAY, h);
}
