"""
Ziyaretçi sayacı + genel istatistikler.

SAYAÇ MANTIĞI (gespaenerji.com'daki footer sayacıyla AYNI mantık):
  • Tekil ziyaretçi GÜNDE 1 KEZ sayılır. Kimlik yerine
    sha256(IP + User-Agent + gün + tuz) karması saklanır — ham IP
    veritabanına HİÇ yazılmaz (KVKK).
  • Bot/tarayıcı olmayan istekler User-Agent süzgeciyle elenir.
  • "Şu an sitede" = son 5 dakikada ping atan tekil anahtar sayısı
    (yalnız bellekte tutulur, veritabanına yazılmaz).
  • Gösterilen toplam = VISITORS_BASE (taban, varsayılan 1000) + veritabanı sayacı.
    Veritabanı sıfırlansa bile sayaç geriye düşmesin diye taban
    ortam değişkeniyle taşınır (Railway → Variables → VISITORS_BASE).
  • Toplamlar 30 sn bellekte önbelleklenir; ping trafiği veritabanını
    yormaz (yeni tekil ziyaretçi yoksa hiç yazma yapılmaz).

Uçlar:
  POST /api/stats/visit     → ziyaret bildirir, güncel sayaçları döner
  GET  /api/stats/visitors  → yalnız okuma (sayım yapmaz)
  GET  /api/stats/public    → site geneli istatistikler + ziyaretçi
"""

import hashlib
import hmac
import os
import re
import time
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from database import get_db
from models import Article, DilecceSablon, SiteVisit, VisitorKey, DilekceGun, DilekceKey, AiBotHit

router = APIRouter()

# Türkiye takvim günü. Railway konteyneri UTC çalışır; date.today() gün sınırını
# Türkiye saatiyle 03:00'e kaydırıyordu (00:00-03:00 arası "bugün" dünü gösterip
# 03:00'te sıfıra düşüyordu). Türkiye 2016'dan beri kalıcı UTC+3 — yaz saati yok,
# sabit ofset doğrudur ve tzdata paketi gerektirmez.
TR_SAAT = timezone(timedelta(hours=3))


def tr_bugun() -> date:
    return datetime.now(TR_SAAT).date()


# Bot süzgeci — gespaenerji server.js'teki BOT_RE ile aynı liste
BOT_RE = re.compile(
    r"bot|crawl|spider|slurp|preview|scan|monitor|probe|fetch|curl|wget|python|"
    r"node-fetch|axios|headless|lighthouse|pingdom|facebookexternal|whatsapp|telegram",
    re.I,
)

ONLINE_WINDOW_SEC = 5 * 60          # son 5 dk istek atan = "şu an sitede"
CACHE_TTL_SEC = 30                  # toplamlar bu süre boyunca bellekten okunur
KEY_RETENTION_DAYS = 7              # tekillik anahtarlarının saklama süresi
PRUNE_EVERY_SEC = 3600              # temizlik en fazla saatte bir çalışır

# Sayacın başlangıç tabanı. Site 1.000 ziyaretçiden saymaya başlar;
# Railway → Variables → VISITORS_BASE ile ezilebilir (veritabanı
# sıfırlanırsa güncel toplam buraya yazılarak sayaç taşınır).
VISITORS_BASE = int(os.getenv("VISITORS_BASE", "1000") or 1000)
VISITOR_SALT = os.getenv("VISITOR_SALT") or os.getenv("JWT_SECRET", "trafikrehber-salt")

_online: dict = {}                  # anahtar → son istek zamanı (bellek)
_cache = {"t": 0.0, "toplam": 0, "bugun": 0, "goruntulenme": 0}
_last_prune = 0.0


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    real = request.headers.get("x-real-ip", "")
    if real:
        return real.strip()
    return request.client.host if request.client else "?"


def _visitor_key(request: Request, gun: date) -> str:
    ham = f"{_client_ip(request)}|{request.headers.get('user-agent', '')}|{gun.isoformat()}|{VISITOR_SALT}"
    return hashlib.sha256(ham.encode("utf-8")).hexdigest()


def _online_count() -> int:
    simdi = time.time()
    for k, t in list(_online.items()):
        if simdi - t > ONLINE_WINDOW_SEC:
            _online.pop(k, None)
    return len(_online)


def _totals(db: Session, force: bool = False) -> dict:
    """Toplamları döner; 30 sn önbellekli."""
    simdi = time.time()
    if not force and simdi - _cache["t"] < CACHE_TTL_SEC:
        return _cache
    toplam = db.query(func.coalesce(func.sum(SiteVisit.tekil), 0)).scalar() or 0
    goruntulenme = db.query(func.coalesce(func.sum(SiteVisit.goruntulenme), 0)).scalar() or 0
    bugun_row = db.query(SiteVisit).filter(SiteVisit.gun == tr_bugun()).first()
    _cache.update({
        "t": simdi,
        "toplam": int(toplam),
        "bugun": int(bugun_row.tekil) if bugun_row else 0,
        "goruntulenme": int(goruntulenme),
    })
    return _cache


def _prune(db: Session) -> None:
    """Eski tekillik anahtarlarını temizler (tablo şişmesin)."""
    global _last_prune
    simdi = time.time()
    if simdi - _last_prune < PRUNE_EVERY_SEC:
        return
    _last_prune = simdi
    try:
        db.query(VisitorKey).filter(
            VisitorKey.gun < tr_bugun() - timedelta(days=KEY_RETENTION_DAYS)
        ).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()


def _cevap(db: Session, force: bool = False) -> dict:
    t = _totals(db, force=force)
    son_24_saat = db.query(func.count(VisitorKey.id)).filter(
        VisitorKey.created_at >= datetime.now(timezone.utc) - timedelta(hours=24)
    ).scalar() or 0
    return {
        "success": True,
        "son_24_saat": int(son_24_saat),
        "toplam": VISITORS_BASE + t["toplam"],
        "bugun": t["bugun"],
        "online": _online_count(),
        "goruntulenme": t["goruntulenme"],
        "base": VISITORS_BASE,
    }


class VisitRequest(BaseModel):
    sayfa: Optional[str] = None     # dolu ise sayfa görüntülenmesi de sayılır
                                    # (boş = yalnız "şu an sitede" tazeleme pingi)


@router.post("/visit")
def kaydet_ziyaret(req: VisitRequest, request: Request, db: Session = Depends(get_db)):
    ua = request.headers.get("user-agent", "")
    if not ua or BOT_RE.search(ua):
        # Bot: sayma, yalnız güncel değerleri dön
        return _cevap(db)

    gun = tr_bugun()
    anahtar = _visitor_key(request, gun)
    _online[anahtar] = time.time()

    yeni_tekil = 0
    try:
        sonuc = db.execute(
            pg_insert(VisitorKey.__table__)
            .values(id=uuid.uuid4(), gun=gun, anahtar=anahtar)
            .on_conflict_do_nothing(index_elements=["gun", "anahtar"])
        )
        yeni_tekil = 1 if sonuc.rowcount else 0

        sayfa_artis = 1 if req.sayfa else 0
        if yeni_tekil or sayfa_artis:
            tablo = SiteVisit.__table__
            db.execute(
                pg_insert(tablo)
                .values(id=uuid.uuid4(), gun=gun, tekil=yeni_tekil, goruntulenme=sayfa_artis)
                .on_conflict_do_update(
                    index_elements=["gun"],
                    set_={
                        "tekil": tablo.c.tekil + yeni_tekil,
                        "goruntulenme": tablo.c.goruntulenme + sayfa_artis,
                    },
                )
            )
        db.commit()
    except Exception as exc:
        db.rollback()
        # Do not return a fake successful visit when persistence failed.
        # The frontend must be able to surface a configuration/database issue.
        print(f"[visitor-counter] visit write failed: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=503, detail="Ziyaret kaydı şu anda yapılamıyor.") from exc

    _prune(db)
    # Yeni ziyaretçi sayıldıysa önbelleği tazele (rozet anında artsın)
    return _cevap(db, force=bool(yeni_tekil))


@router.get("/visitors")
def get_visitors(db: Session = Depends(get_db)):
    return _cevap(db)


@router.get("/public")
def get_public_stats(db: Session = Depends(get_db)):
    total_articles = db.query(Article).filter(Article.is_published == True).count()
    total_dilekce = db.query(DilecceSablon).count()
    total_downloads = db.query(func.sum(DilecceSablon.indirme_sayisi)).scalar() or 0
    total_views = db.query(func.sum(Article.view_count)).scalar() or 0
    ziyaret = _totals(db)

    return {
        "success": True,
        "stats": {
            "total_articles": total_articles,
            "total_dilekce": total_dilekce,
            "total_downloads": int(total_downloads),
            "total_views": int(total_views),
            "ziyaretci_toplam": VISITORS_BASE + ziyaret["toplam"],
            "ziyaretci_bugun": ziyaret["bugun"],
            "ziyaretci_online": _online_count(),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# DİLEKÇE SAYACI — "X kişi dilekçesini burada hazırladı" (sosyal kanıt)
#
# Gerçek sayı: dilekçe oluşturucu ve şablon sayfasındaki yazdır / indir /
# kopyala eylemi, kişi başı günde 1 kez. Bot ve UA'sız istek sayılmaz.
# DILEKCE_SAYAC_ESIK'e (varsayılan 50) ulaşmadan `goster: false` döner ve
# arayüz sayıyı HİÇ göstermez — küçük ya da uydurma sayı yayınlanmaz.
# Taban (base) YOKTUR: bu sayı şişirilemez.
# ─────────────────────────────────────────────────────────────────────────────
DILEKCE_ESIK = int(os.getenv("DILEKCE_SAYAC_ESIK", "50") or 50)
DILEKCE_TURLER = {"yazdir", "word", "kopya", "txt", "sablon-yazdir", "sablon-kopya"}
_dilekce_cache = {"t": 0.0, "veri": None}


class DilekceOlay(BaseModel):
    tur: str


def _dilekce_cevap(db: Session, force: bool = False) -> dict:
    simdi = time.time()
    if not force and _dilekce_cache["veri"] and simdi - _dilekce_cache["t"] < CACHE_TTL_SEC:
        return _dilekce_cache["veri"]
    toplam = int(db.query(func.coalesce(func.sum(DilekceGun.kisi), 0)).scalar() or 0)
    son30 = int(db.query(func.coalesce(func.sum(DilekceGun.kisi), 0)).filter(
        DilekceGun.gun > tr_bugun() - timedelta(days=30)).scalar() or 0)
    veri = {"success": True, "toplam": toplam, "son_30_gun": son30,
            "esik": DILEKCE_ESIK, "goster": toplam >= DILEKCE_ESIK}
    _dilekce_cache.update(t=simdi, veri=veri)
    return veri


@router.post("/dilekce")
def kaydet_dilekce(olay: DilekceOlay, request: Request, db: Session = Depends(get_db)):
    ua = request.headers.get("user-agent", "")
    if olay.tur not in DILEKCE_TURLER or not ua or BOT_RE.search(ua):
        return _dilekce_cevap(db)
    gun = tr_bugun()
    ham = f"dilekce|{_client_ip(request)}|{ua}|{gun.isoformat()}|{VISITOR_SALT}"
    anahtar = hashlib.sha256(ham.encode("utf-8")).hexdigest()
    try:
        yeni = db.execute(
            pg_insert(DilekceKey.__table__)
            .values(id=uuid.uuid4(), gun=gun, anahtar=anahtar)
            .on_conflict_do_nothing(index_elements=["gun", "anahtar"])
        ).rowcount
        if yeni:
            tablo = DilekceGun.__table__
            db.execute(
                pg_insert(tablo).values(id=uuid.uuid4(), gun=gun, kisi=1)
                .on_conflict_do_update(index_elements=["gun"], set_={"kisi": tablo.c.kisi + 1})
            )
            db.query(DilekceKey).filter(DilekceKey.gun < gun - timedelta(days=KEY_RETENTION_DAYS)).delete(synchronize_session=False)
        db.commit()
    except Exception as exc:  # sayaç hatası dilekçe yazdırmayı engellemez
        db.rollback()
        print(f"[dilekce-sayac] yazılamadı: {type(exc).__name__}: {exc}")
        return {"success": False}
    return _dilekce_cevap(db, force=bool(yeni))


@router.get("/dilekce")
def get_dilekce(db: Session = Depends(get_db)):
    return _dilekce_cevap(db)


# ─────────────────────────────────────────────────────────────────────────────
# AI / ARAMA TARAYICI SAYACI — frontend server.js'ten toplu giriş
# Kimlik: BOT_SAYAC_KEY (iki serviste AYNI değer, gizli). Yoksa uç kapalıdır.
# ─────────────────────────────────────────────────────────────────────────────
BOT_SAYAC_KEY = (os.getenv("BOT_SAYAC_KEY") or "").strip()
BOT_AD_RE = re.compile(r"^[A-Za-z0-9_.\-]{2,40}$")
BOT_SAKLAMA_GUN = 90


class BotSatir(BaseModel):
    bot: str
    tur: str = "ai"
    yol: str
    n: int


class BotToplu(BaseModel):
    satirlar: list[BotSatir]


@router.post("/bot-toplu")
def kaydet_botlar(govde: BotToplu, request: Request, db: Session = Depends(get_db)):
    anahtar = request.headers.get("x-bot-key", "")
    if not BOT_SAYAC_KEY or not hmac.compare_digest(anahtar, BOT_SAYAC_KEY):
        raise HTTPException(status_code=403, detail="Yetkisiz")
    gun = tr_bugun()
    tablo = AiBotHit.__table__
    kaydedilen = 0
    try:
        for r in govde.satirlar[:500]:
            if not BOT_AD_RE.match(r.bot) or not r.yol.startswith("/") or len(r.yol) > 160 or not (1 <= r.n <= 10000):
                continue
            tur = "ai" if r.tur == "ai" else "arama"
            db.execute(
                pg_insert(tablo).values(id=uuid.uuid4(), gun=gun, bot=r.bot, tur=tur, yol=r.yol, sayi=r.n)
                .on_conflict_do_update(index_elements=["gun", "bot", "yol"], set_={"sayi": tablo.c.sayi + r.n})
            )
            kaydedilen += 1
        db.query(AiBotHit).filter(AiBotHit.gun < gun - timedelta(days=BOT_SAKLAMA_GUN)).delete(synchronize_session=False)
        db.commit()
    except Exception as exc:
        db.rollback()
        print(f"[bot-sayac] yazılamadı: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=503, detail="Yazılamadı") from exc
    return {"success": True, "kaydedilen": kaydedilen}


def bot_rapor(db: Session, gun_sayisi: int = 30) -> dict:
    """Admin paneli için özet: bot başına toplam, son görülme, en çok çekilen yollar."""
    bas = tr_bugun() - timedelta(days=gun_sayisi - 1)
    satirlar = db.query(AiBotHit).filter(AiBotHit.gun >= bas).all()
    botlar: dict = {}
    gunluk: dict = {}
    for r in satirlar:
        b = botlar.setdefault(r.bot, {"bot": r.bot, "tur": r.tur, "toplam": 0, "son_gun": r.gun, "yollar": {}})
        b["toplam"] += r.sayi
        if r.gun > b["son_gun"]:
            b["son_gun"] = r.gun
        b["yollar"][r.yol] = b["yollar"].get(r.yol, 0) + r.sayi
        g = gunluk.setdefault(r.gun, {"ai": 0, "arama": 0})
        g[r.tur if r.tur in g else "arama"] += r.sayi
    cikti = []
    for b in botlar.values():
        ust = sorted(b["yollar"].items(), key=lambda x: -x[1])[:5]
        cikti.append({"bot": b["bot"], "tur": b["tur"], "toplam": b["toplam"],
                      "son_gun": b["son_gun"].isoformat(), "yollar": [{"yol": y, "sayi": n} for y, n in ust]})
    cikti.sort(key=lambda x: -x["toplam"])
    return {
        "success": True, "acik": bool(BOT_SAYAC_KEY), "gun_sayisi": gun_sayisi,
        "ai_toplam": sum(b["toplam"] for b in cikti if b["tur"] == "ai"),
        "arama_toplam": sum(b["toplam"] for b in cikti if b["tur"] != "ai"),
        "botlar": cikti,
        "gunluk": [{"gun": g.isoformat(), **v} for g, v in sorted(gunluk.items())][-14:],
    }

