from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
from models import Article, DilecceSablon, CezaTuru
import os

router = APIRouter()

# Yayındaki alan adı. Railway → Variables → SITE_URL ile ezilir.
SITE_URL = os.getenv("SITE_URL", "https://www.cezarehberi.com").rstrip("/")

STATIC_URLS = [
    "/",
    "/trafik-cezalari-2026",
    "/blog",
    "/trafik-cezalari",
    "/trafik-cezalari/sorgulama",
    "/trafik-cezalari/itiraz",
    "/trafik-cezalari/tutarlar",
    "/sigorta",
    "/sigorta/trafik-sigortasi",
    "/sigorta/kasko",
    "/ehliyet",
    "/ehliyet/sinav",
    "/ehliyet/puan-sistemi",
    "/arac-islemleri",
    "/arac-islemleri/muayene",
    "/dilekce-ornekleri",
    "/araclar/ceza-hesapla",
    "/hakkimizda",
    "/iletisim",
    "/gizlilik-politikasi",
]


def _tarih(*adaylar):
    """İlk dolu tarihi YYYY-AA-GG olarak döndürür."""
    for d in adaylar:
        if d:
            return d.strftime("%Y-%m-%d")
    return None


def _url(loc, lastmod=None, changefreq="weekly", priority="0.8"):
    satir = [f"  <url>", f"    <loc>{loc}</loc>"]
    if lastmod:
        satir.append(f"    <lastmod>{lastmod}</lastmod>")
    satir.append(f"    <changefreq>{changefreq}</changefreq>")
    satir.append(f"    <priority>{priority}</priority>")
    satir.append("  </url>")
    return "\n".join(satir)


@router.get("/sitemap.xml", response_class=Response)
def sitemap(db: Session = Depends(get_db)):
    """Dinamik sitemap — her istekte veritabanından üretilir.

    `lastmod` değerleri gerçek kayıt tarihlerinden gelir; içerik güncellendiğinde
    sitemap kendiliğinden tazelenir (yeniden derleme gerekmez). Frontend sunucusu
    site kökündeki /sitemap.xml'i buradan servis eder.
    """
    urls = []

    son_makale = db.query(Article).filter(Article.is_published == True).order_by(
        Article.created_at.desc()
    ).first()
    son_makale_tarih = _tarih(son_makale.updated_at, son_makale.created_at) if son_makale else None
    son_ceza = db.query(CezaTuru).order_by(CezaTuru.updated_at.desc()).first()
    son_ceza_tarih = _tarih(son_ceza.updated_at) if son_ceza else None

    # Öne çıkan sayfalar (ana giriş noktaları)
    urls.append(_url(f"{SITE_URL}/", son_makale_tarih, "daily", "1.0"))
    urls.append(_url(f"{SITE_URL}/trafik-cezalari-2026", son_ceza_tarih, "weekly", "0.9"))
    urls.append(_url(f"{SITE_URL}/araclar/ceza-hesapla", son_ceza_tarih, "monthly", "0.9"))
    urls.append(_url(f"{SITE_URL}/dilekce-ornekleri", None, "weekly", "0.9"))
    urls.append(_url(f"{SITE_URL}/blog", son_makale_tarih, "daily", "0.8"))

    ozel = {"/", "/trafik-cezalari-2026", "/araclar/ceza-hesapla", "/dilekce-ornekleri", "/blog"}
    for path in STATIC_URLS:
        if path in ozel:
            continue
        oncelik = "0.4" if path in ("/hakkimizda", "/iletisim", "/gizlilik-politikasi") else "0.7"
        urls.append(_url(f"{SITE_URL}{path}", None, "monthly", oncelik))

    # Makaleler
    for a in db.query(Article).filter(Article.is_published == True).all():
        urls.append(_url(f"{SITE_URL}/blog/{a.slug}", _tarih(a.updated_at, a.created_at), "monthly", "0.7"))

    # Dilekçeler
    for s in db.query(DilecceSablon).all():
        urls.append(_url(f"{SITE_URL}/dilekce-ornekleri/{s.slug}", _tarih(s.created_at), "monthly", "0.6"))

    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(urls) + "\n</urlset>")

    return Response(content=xml, media_type="application/xml",
                    headers={"Cache-Control": "public, max-age=900"})


@router.get("/robots.txt", response_class=Response)
def robots():
    content = f"""User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

Sitemap: {SITE_URL}/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")
