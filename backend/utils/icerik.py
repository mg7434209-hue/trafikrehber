"""
İçerik yer tutucuları — rehber metinleri KENDİLİĞİNDEN güncel kalsın.

NEDEN: rehberlerde yazılı tutar ve yıl etiketleri ("Muayenesiz araç: 1.318 TL",
"… Rehberi 2025") ceza listesi güncellendiğinde elle düzeltilmedikçe eski
kalıyordu. Artık metne rakam/yıl yazılmaz; yer tutucu yazılır ve API yanıtı
hazırlanırken veritabanındaki GÜNCEL değerle doldurulur:

  {{yil}}             → veri yılı (CEZA_SON_DOGRULAMA'nın yılı; takvim yılı DEĞİL)
  {{ceza:H10}}        → "2.721 ₺"        (ceza_turleri.taban_ceza_tl)
  {{indirimli:H10}}   → "2.040,75 ₺"     (1 ay içinde %25 indirimli tutar)
  {{puan:H1}}         → "20"             (ceza puanı)
  {{not:H1}}          → kademe_notu metni
  {{odeme_gun}} {{itiraz_gun}} {{indirim}} {{taksit}}  → süre/oran sabitleri
  {{son_dogrulama}}   → "14.09.2026"
  {{tablo}}           → tüm cezaların HTML tablosu (tutar + indirimli tutar)

YIL KURALI: etiket, takvime göre değil, ceza verisinin DOĞRULANDIĞI yıla göre
değişir. 1 Ocak'ta yeniden değerleme ile tutarlar değişir; liste doğrulanmadan
başlıklara yeni yıl yazmak "2027 güncel" deyip 2026 tutarını göstermek olurdu.
Liste güncellenip CEZA_SON_DOGRULAMA ilerletilince tüm başlıklar kendiliğinden
yeni yıla geçer.

Tanınmayan ya da veritabanında karşılığı olmayan yer tutucu SİLİNİR (okura
"{{…}}" gösterilmez) ve log'a yazılır.
"""

import re
import time

YER_TUTUCU = re.compile(r"\{\{\s*([a-z_]+)(?::([A-Za-z0-9]+))?\s*\}\}")
_ONBELLEK = {"t": 0.0, "veri": None}
_SURE = 60  # sn — ceza listesi admin'den değişince en geç 1 dk'da yansır


def _tl(v: float) -> str:
    """Türkçe para biçimi: 2721 → '2.721 ₺', 2040.75 → '2.040,75 ₺'."""
    v = round(float(v or 0), 2)
    tam, kurus = divmod(round(v * 100), 100)
    s = f"{int(tam):,}".replace(",", ".")
    return f"{s},{int(kurus):02d} ₺" if kurus else f"{s} ₺"


def _tarih(iso: str) -> str:
    y, a, g = (iso or "--").split("-") if iso else ("", "", "")
    return f"{g}.{a}.{y}" if y else ""


def veri_yili() -> int:
    from routers.admin import CEZA_SON_DOGRULAMA
    return int(CEZA_SON_DOGRULAMA[:4])


def _veri(db):
    simdi = time.time()
    if _ONBELLEK["veri"] is not None and simdi - _ONBELLEK["t"] < _SURE:
        return _ONBELLEK["veri"]
    from models import CezaTuru
    from routers.admin import CEZA_SON_DOGRULAMA
    from routers.ceza import INDIRIM_ORANI, ODEME_SURESI_GUN, ITIRAZ_SURESI_GUN, TAKSIT_ADEDI
    cezalar = db.query(CezaTuru).order_by(CezaTuru.taban_ceza_tl.desc()).all()
    veri = {
        "cezalar": {c.kod: c for c in cezalar},
        "sira": [c.kod for c in cezalar],
        "yil": str(veri_yili()),
        "son_dogrulama": _tarih(CEZA_SON_DOGRULAMA),
        "indirim_orani": INDIRIM_ORANI,
        "odeme_gun": str(ODEME_SURESI_GUN),
        "itiraz_gun": str(ITIRAZ_SURESI_GUN),
        "indirim": f"%{int(INDIRIM_ORANI * 100)}",
        "taksit": str(TAKSIT_ADEDI),
    }
    _ONBELLEK.update(t=simdi, veri=veri)
    return veri


def onbellegi_bosalt():
    _ONBELLEK.update(t=0.0, veri=None)


def _tablo(v) -> str:
    oran = 1 - v["indirim_orani"]
    satirlar = "".join(
        f"<tr><td>{c.aciklama}</td><td>{_tl(c.taban_ceza_tl)}</td>"
        f"<td>{_tl(float(c.taban_ceza_tl or 0) * oran)}</td></tr>"
        for c in (v["cezalar"][k] for k in v["sira"])
    )
    return (
        "<table><thead><tr><th>İhlal</th><th>Ceza (ilk ihlal)</th>"
        f"<th>{v['odeme_gun']} gün içinde ödenirse</th></tr></thead>"
        f"<tbody>{satirlar}</tbody></table>"
    )


def isle(metin, db):
    """Metindeki yer tutucuları güncel değerlerle doldurur. None → None."""
    if not metin or "{{" not in metin:
        return metin
    v = _veri(db)

    def coz(m):
        ad, kod = m.group(1), m.group(2)
        try:
            if ad in ("yil", "son_dogrulama", "odeme_gun", "itiraz_gun", "indirim", "taksit") and not kod:
                return v[ad]
            if ad == "tablo" and not kod:
                return _tablo(v)
            c = v["cezalar"].get(kod) if kod else None
            if c is not None:
                if ad == "ceza":
                    return _tl(c.taban_ceza_tl)
                if ad == "indirimli":
                    return _tl(float(c.taban_ceza_tl or 0) * (1 - v["indirim_orani"]))
                if ad == "puan" and c.puan:
                    return str(c.puan)
                if ad == "not":
                    return c.kademe_notu or ""
        except Exception as e:  # içerik hatası sayfayı düşürmesin
            print(f"[icerik] {m.group(0)} işlenemedi: {e}")
            return ""
        print(f"[icerik] tanınmayan/eksik yer tutucu silindi: {m.group(0)}")
        return ""

    return YER_TUTUCU.sub(coz, metin)
