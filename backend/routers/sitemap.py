import os
from urllib.parse import quote
from xml.etree.ElementTree import Element, SubElement, tostring
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import get_db
from models import Article, DilecceSablon
router = APIRouter()
SITE_URL = os.getenv("SITE_URL", "https://www.cezarehberi.com").rstrip("/")
if SITE_URL in ("https://trafikrehber.com", "https://www.trafikrehber.com"):
    SITE_URL = "https://www.cezarehberi.com"
STATIC_URLS = ["/", "/blog", "/trafik-cezalari-2026", "/trafik-cezalari", "/sigorta", "/ehliyet", "/arac-islemleri", "/dilekce-ornekleri", "/araclar/ceza-hesapla", "/hakkimizda", "/iletisim", "/gizlilik-politikasi"]

@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)):
    root = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    def add(path, date=None):
        node = SubElement(root, "url")
        SubElement(node, "loc").text = SITE_URL + path
        if date:
            SubElement(node, "lastmod").text = date.strftime("%Y-%m-%d")
    for path in STATIC_URLS:
        add(path)
    for a in db.query(Article).filter(Article.is_published.is_(True)).all():
        add("/blog/" + quote(a.slug, safe=""), a.updated_at or a.created_at)
    for s in db.query(DilecceSablon).all():
        add("/dilekce-ornekleri/" + quote(s.slug, safe=""), s.created_at)
    return Response(tostring(root, encoding="utf-8", xml_declaration=True), media_type="application/xml")

@router.get("/robots.txt")
def robots():
    return Response(f"User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: {SITE_URL}/sitemap.xml\n", media_type="text/plain")
