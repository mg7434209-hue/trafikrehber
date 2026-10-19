/**
 * AdSense reklam birimi kimlikleri — TEK DOĞRU KAYNAK.
 *
 * KURULUM (bir kez yapılır):
 *   1. adsense.google.com → Reklamlar → Reklam birimine göre → "Görüntülü reklam"
 *   2. Aşağıdaki üç birimi oluştur (adları serbest, biçim "Duyarlı"):
 *        icerikIci   → makale/ceza sayfasında yazının ortası
 *        icerikAlti  → yazı bittikten sonra
 *        listeUstu   → liste sayfalarında ilk kartların üstü
 *   3. Her birimin kodundaki data-ad-slot="1234567890" sayısını buraya yaz.
 *
 * Boş bırakılan birim sayfada HİÇ basılmaz (boş kutu/CLS/politika riski yok).
 * Yayın öncesi dolu olup olmadığını `npm run build` çıktısı değil, sitede
 * reklamın görünmesi gösterir — AdSense yeni birimi doldurmaya 30 dk-birkaç
 * saat içinde başlar.
 */
export const AD_SLOTS = {
  icerikIci: '',
  icerikAlti: '',
  listeUstu: '',
};

export const adsEtkin = () => Object.values(AD_SLOTS).some(Boolean);
