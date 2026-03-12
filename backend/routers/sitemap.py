from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
from models import Article, DilecceSablon
import os

router = APIRouter()

SITE_URL = os.getenv("SITE_URL", "https://trafikrehber.com")

STATIC_URLS = [
    "/",
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


@router.get("/sitemap.xml", response_class=Response)
def sitemap(db: Session = Depends(get_db)):
    urls = []

    # Statik sayfalar
    for path in STATIC_URLS:
        urls.append(f"""  <url>
    <loc>{SITE_URL}{path}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>""")

    # Makaleler
    articles = db.query(Article).filter(Article.is_published == True).all()
    for a in articles:
        updated = a.updated_at or a.created_at
        date_str = updated.strftime("%Y-%m-%d") if updated else ""
        urls.append(f"""  <url>
    <loc>{SITE_URL}/blog/{a.slug}</loc>
    <lastmod>{date_str}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>""")

    # Dilekçeler
    sablonlar = db.query(DilecceSablon).all()
    for s in sablonlar:
        urls.append(f"""  <url>
    <loc>{SITE_URL}/dilekce-ornekleri/{s.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>""")

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""

    return Response(content=xml, media_type="application/xml")


@router.get("/robots.txt", response_class=Response)
def robots():
    content = f"""User-agent: *
Allow: /

Disallow: /api/
Disallow: /admin/

Sitemap: {SITE_URL}/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")
