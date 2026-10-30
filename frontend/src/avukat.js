/**
 * AVUKAT YÖNLENDİRME — tek kaynak.
 *
 * Liste BOŞKEN sitede hiçbir avukat adı görünmez; itiraz sayfası yalnızca
 * "ne zaman avukat gerekir, nasıl bulunur (baro, adli yardım)" bilgisini verir.
 * Anlaşma yapılan avukat buraya satır olarak eklenince /itiraz sayfasında ve
 * ceza sayfalarındaki itiraz kutusunda "Avukatla görüşün" kartı açılır.
 *
 * HUKUKİ SINIR (Avukatlık Kanunu m.55 "iş simsarlığı" ve TBB Reklam Yasağı
 * Yönetmeliği): avukata iş getirip MÜVEKKİL BAŞINA ücret/komisyon almak
 * yasaktır, avukatın kendisi de bunu kabul edemez. Kartta yalnız avukatın
 * kimlik ve iletişim bilgisi durur; ücret ve vekâlet doğrudan avukatla
 * kararlaştırılır. Kart metni "başarı garantisi", "en iyi avukat" gibi
 * reklam ifadeleri İÇERMEZ. Yayına almadan önce düzenlemeyi avukatın kendi
 * barosuna sorması önerilir.
 *
 * Alanlar: ad (zorunlu), baro (zorunlu), sicil (baro sicil no, zorunlu),
 * il, telefon ("+90 5xx ..."), whatsapp (yalnız rakam, ör. "905xxxxxxxxx"),
 * eposta, alan (kısa: "Trafik cezası itirazları, ehliyet iptali").
 * Ad/baro/sicil eksik satır GÖSTERİLMEZ (doğrulanamayan avukat yayınlanmaz).
 */
export const AVUKATLAR = [
  // {
  //   ad: 'Av. Ad Soyad',
  //   baro: 'Antalya Barosu',
  //   sicil: '00000',
  //   il: 'Antalya',
  //   telefon: '+90 5xx xxx xx xx',
  //   whatsapp: '905xxxxxxxxx',
  //   eposta: '',
  //   alan: 'Trafik cezası itirazları, ehliyet iptali',
  // },
];

export const avukatlar = () => AVUKATLAR.filter(a => a && a.ad && a.baro && a.sicil);
