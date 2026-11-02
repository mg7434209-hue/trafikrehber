/**
 * İLETİŞİM BİLGİSİ — tek kaynak: src/data/iletisim.json (sunucu da okur).
 *
 * "eposta" boşken sitede e-posta adresi GÖSTERİLMEZ; ziyaretçi iletişim formunu
 * kullanır (mesajlar yönetici panelinde "Mesajlar" sekmesinde görünür). Gerçek
 * bir adres açılınca JSON'a yazın: iletişim sayfasında görünür ve Organization
 * şemasına contactPoint olarak girer. Uydurma/ölü adres YAZILMAZ.
 */
import K from './data/iletisim.json';

export const EPOSTA = (K.eposta || '').trim();
