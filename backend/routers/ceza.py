from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import CezaTuru
from ceza_icerik import ICERIK
from utils.icerik import isle, veri_yili

router = APIRouter()


# Peşin (erken) ödeme indirimi: tebliğden itibaren 1 AY içinde ödemede %25.
# (Süre 31.01.2024 yönetmelik değişikliğiyle 15 günden 1 aya çıkarıldı —
#  KTK m.115 + Trafik İdari Para Cezası ... Yönetmeliği m.14.)
# İTİRAZ süresi bundan AYRIDIR ve 15 gündür (Kabahatler Kanunu m.27).
INDIRIM_ORANI = 0.25
ODEME_SURESI_GUN = 30
ITIRAZ_SURESI_GUN = 15
TAKSIT_ADEDI = 4  # Kabahatler Kanunu m.17/3: ilk taksit ödeme süresinde, kalan 3 taksit 1 yıl içinde


def ceza_to_dict(c: CezaTuru):
    taban = float(c.taban_ceza_tl) if c.taban_ceza_tl else 0
    return {
        "id": str(c.id),
        "kod": c.kod,
        "aciklama": c.aciklama,
        "taban_ceza_tl": taban,
        "indirimli_tl": round(taban * (1 - INDIRIM_ORANI), 2),
        "puan": c.puan or 0,
        "kanun_maddesi": c.kanun_maddesi,
        "kademe_notu": c.kademe_notu,
        "slug": (ICERIK.get(c.kod) or {}).get("slug"),
    }


@router.get("")
def get_ceza_turleri(db: Session = Depends(get_db)):
    from routers.admin import CEZA_SON_DOGRULAMA, CEZA_DAYANAK
    cezalar = db.query(CezaTuru).order_by(CezaTuru.taban_ceza_tl.desc()).all()
    return {
        "success": True,
        "son_dogrulama": CEZA_SON_DOGRULAMA,
        "veri_yili": veri_yili(),
        "dayanak": CEZA_DAYANAK,
        "odeme_suresi_gun": ODEME_SURESI_GUN,
        "itiraz_suresi_gun": ITIRAZ_SURESI_GUN,
        "indirim_orani": INDIRIM_ORANI,
        "cezalar": [ceza_to_dict(c) for c in cezalar],
    }


@router.get("/sayfa/{slug}")
def get_ceza_sayfa(slug: str, db: Session = Depends(get_db)):
    """Tek bir cezanın KENDİ SAYFASI için veri.

    Her ceza ayrı bir arama sorgusudur; tutar veritabanından, sayfa metni
    `ceza_icerik.ICERIK`'ten gelir (bkz. o dosyanın başındaki kural).
    """
    from routers.admin import CEZA_SON_DOGRULAMA

    kod = next((k for k, v in ICERIK.items() if v["slug"] == slug), None)
    if not kod:
        raise HTTPException(status_code=404, detail="Ceza sayfası bulunamadı")

    ceza = db.query(CezaTuru).filter(CezaTuru.kod == kod).first()
    if not ceza:
        raise HTTPException(status_code=404, detail="Ceza türü bulunamadı")

    icerik = ICERIK[kod]
    taban = float(ceza.taban_ceza_tl) if ceza.taban_ceza_tl else 0

    # İç bağlantı için: aynı ağırlık bandındaki diğer cezalar (±%60 tutar)
    hepsi = db.query(CezaTuru).filter(CezaTuru.kod != kod).all()
    kodlu = [c for c in hepsi if c.kod in ICERIK]
    kodlu.sort(key=lambda c: abs(float(c.taban_ceza_tl or 0) - taban))
    ilgili = [{
        "slug": ICERIK[c.kod]["slug"],
        "aciklama": c.aciklama,
        "taban_ceza_tl": float(c.taban_ceza_tl or 0),
        "indirimli_tl": round(float(c.taban_ceza_tl or 0) * (1 - INDIRIM_ORANI), 2),
    } for c in kodlu[:6]]

    return {
        "success": True,
        "son_dogrulama": CEZA_SON_DOGRULAMA,
        "odeme_suresi_gun": ODEME_SURESI_GUN,
        "itiraz_suresi_gun": ITIRAZ_SURESI_GUN,
        "taksit_adedi": TAKSIT_ADEDI,
        "ceza": {**ceza_to_dict(ceza), "slug": icerik["slug"]},
        "sayfa": {
            "baslik": isle(icerik["baslik"], db),
            "ozet": isle(icerik["ozet"], db),
            "sss": [{"soru": isle(q, db), "cevap": isle(a, db)} for q, a in icerik["sss"]],
        },
        "ilgili": ilgili,
    }


@router.get("/guncellik")
def get_guncellik():
    """Sitenin "veri yılı" ve ceza verisinin tazeliği — TEK KAYNAK.

    Frontend server.js bunu saatte bir okur: sayfa başlıklarındaki yıl
    ("… 2026") ve ana sayfa rozetleri buradan gelir. Admin paneli `uyari`
    doluysa kırmızı kutu gösterir.
    """
    from datetime import date
    from routers.admin import CEZA_SON_DOGRULAMA, CEZA_DAYANAK
    from routers.stats import tr_bugun

    bugun = tr_bugun()
    yil = veri_yili()
    gun_once = (bugun - date.fromisoformat(CEZA_SON_DOGRULAMA)).days
    uyari = None
    if bugun.year > yil:
        uyari = (f"{bugun.year} yılı başladı ama ceza listesi en son {yil} için doğrulandı. "
                 "Yeniden değerleme oranıyla değişen tutarları güncelleyip CEZA_SON_DOGRULAMA'yı "
                 "ilerletin; başlıklar o zaman kendiliğinden yeni yıla geçer.")
    elif gun_once > 120:
        uyari = (f"Ceza listesi {gun_once} gündür doğrulanmadı. Resmî Gazete ve EGM listesini "
                 "kontrol edip CEZA_SON_DOGRULAMA'yı güncelleyin.")
    return {
        "success": True,
        "veri_yili": yil,
        "son_dogrulama": CEZA_SON_DOGRULAMA,
        "gun_once": gun_once,
        "dayanak": CEZA_DAYANAK,
        "uyari": uyari,
    }


@router.get("/hiz-kademeleri")
def get_hiz_kademeleri():
    """Hız cezası hesaplama aracının verisi (KTK m.51 kademeleri)."""
    from routers.admin import HIZ_KADEMELERI, CEZA_SON_DOGRULAMA
    return {
        "success": True,
        "son_dogrulama": CEZA_SON_DOGRULAMA,
        "odeme_suresi_gun": ODEME_SURESI_GUN,
        "indirim_orani": INDIRIM_ORANI,
        "yollar": {
            k: {
                "ad": v["ad"],
                "slug": (ICERIK.get(v["kod"]) or {}).get("slug"),
                "kademeler": [
                    {"alt": a, "ust": u, "ceza_tl": t, "belge_gun": g}
                    for a, u, t, g in v["kademeler"]
                ],
            }
            for k, v in HIZ_KADEMELERI.items()
        },
    }


@router.get("/sayfalar")
def get_ceza_sayfalari(db: Session = Depends(get_db)):
    """Tüm ceza sayfalarının listesi (sitemap, iç bağlantı ve sunucu meta'sı için)."""
    cezalar = db.query(CezaTuru).order_by(CezaTuru.taban_ceza_tl.desc()).all()
    return {"success": True, "sayfalar": [{
        "slug": ICERIK[c.kod]["slug"],
        "baslik": isle(ICERIK[c.kod]["baslik"], db),
        "aciklama": c.aciklama,
        "taban_ceza_tl": float(c.taban_ceza_tl or 0),
    } for c in cezalar if c.kod in ICERIK]}


@router.get("/{ceza_id}/hesapla")
def hesapla_ceza(ceza_id: str, db: Session = Depends(get_db)):
    ceza = db.query(CezaTuru).filter(CezaTuru.id == ceza_id).first()
    if not ceza:
        raise HTTPException(status_code=404, detail="Ceza türü bulunamadı")

    taban = float(ceza.taban_ceza_tl) if ceza.taban_ceza_tl else 0
    erken_odeme = round(taban * (1 - INDIRIM_ORANI), 2)
    taksit_tutari = round(taban / TAKSIT_ADEDI, 2)

    return {
        "success": True,
        "ceza": ceza_to_dict(ceza),
        "hesaplama": {
            "taban_tutar": taban,
            "erken_odeme_indirimi": erken_odeme,
            "erken_odeme_aciklama": (
                f"Tebliğden itibaren {ODEME_SURESI_GUN} gün (1 ay) içinde ödenirse "
                f"%{int(INDIRIM_ORANI * 100)} indirim uygulanır."
            ),
            "odeme_suresi_gun": ODEME_SURESI_GUN,
            "itiraz_suresi_gun": ITIRAZ_SURESI_GUN,
            "taksit_adedi": TAKSIT_ADEDI,
            "taksit_tutari": taksit_tutari,
            "taksit_aciklama": (
                "Ekonomik durumu uygun olmayanlar ödeme süresi içinde taksit talep edebilir: "
                "ilk taksit ödeme süresinde, kalan 3 taksit tebliğden itibaren 1 yıl içinde "
                "ödenir. Taksitlendirmede peşin ödeme indiriminden yararlanılamaz."
            ),
        }
    }
