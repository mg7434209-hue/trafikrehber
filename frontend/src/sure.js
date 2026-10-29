/**
 * Yasal süre hesabı (itiraz yol haritası ve dilekçe oluşturucu).
 *
 * - İtiraz: tebliğden itibaren GÜN olarak (Kabahatler K. m.27). Tebliğ günü
 *   sayılmaz; son gün hafta sonu / resmî tatile denk gelirse süre izleyen ilk
 *   iş gününün sonunda biter (CMK m.39). Dinî bayramlar her yıl değiştiği için
 *   HESAPLANMAZ; arayüz bunu ayrıca uyarır.
 * - İndirimli ödeme: tebliğden itibaren 1 AY (ayın karşılık gelen günü; o gün
 *   yoksa ayın son günü). Bu süre uzatılmaz; son güne bırakmamak önerilir.
 * Süre değerleri (15 gün, 30 gün) sayfaya gömülmez, API'den gelir.
 */

// Sabit tarihli resmî tatiller (AA-GG). Dinî bayramlar burada YOK.
const SABIT_TATIL = ['01-01', '04-23', '05-01', '05-19', '07-15', '08-30', '10-29'];

export function tarihOku(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, a, g] = iso.split('-').map(Number);
  const d = new Date(y, a - 1, g);
  return d.getMonth() === a - 1 ? d : null;
}

const iki = (n) => String(n).padStart(2, '0');
export const isoYaz = (d) => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;

export function tatilMi(d) {
  const gun = d.getDay();
  return gun === 0 || gun === 6 || SABIT_TATIL.includes(`${iki(d.getMonth() + 1)}-${iki(d.getDate())}`);
}

/** Tebliğ + n gün; son gün tatilse ilk iş gününe kayar. */
export function gunSuresi(teblig, n) {
  const d = new Date(teblig.getFullYear(), teblig.getMonth(), teblig.getDate() + n);
  let kaydi = false;
  while (tatilMi(d)) { d.setDate(d.getDate() + 1); kaydi = true; }
  return { son: d, kaydi };
}

/** Tebliğ + 1 ay (ayın karşılık gelen günü, yoksa son günü). */
export function birAySonra(teblig) {
  const hedefAy = teblig.getMonth() + 1;
  const sonGun = new Date(teblig.getFullYear(), hedefAy + 1, 0).getDate();
  return new Date(teblig.getFullYear(), hedefAy, Math.min(teblig.getDate(), sonGun));
}

export function kalanGun(son, bugun = new Date()) {
  const a = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
  return Math.round((son - a) / 86400000);
}

export const trTarih = (d) => d ? d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' }) : '';
export const kisaTarih = (d) => d ? d.toLocaleDateString('tr-TR') : '';
