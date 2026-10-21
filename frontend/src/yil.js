/**
 * Sitenin VERİ YILI — sayfa başlıklarındaki "… 2026" etiketinin tek kaynağı.
 *
 * Değer sunucudan gelir: server.js her HTML yanıtına backend'in
 * /api/ceza-turleri/guncellik → veri_yili değerini `window.__VERI_YILI__`
 * olarak yazar. Bu yıl, ceza listesinin DOĞRULANDIĞI yıldır (takvim yılı
 * değil): liste yeni yıl için güncellenince bütün etiketler kendiliğinden
 * yeni yıla geçer. Koda "2026" yazma; `YIL` kullan.
 *
 * İstisnalar (sabit kalır): rota adresi `/trafik-cezalari-2026` (yayınlanmış
 * URL değişmez) ve yasal tarihler ("27.02.2026 tarihli 7574 sayılı Kanun").
 */
const sunucu = typeof window !== 'undefined' ? Number(window.__VERI_YILI__) : 0;

export const YIL = sunucu > 2000 ? sunucu : 2026;
