from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

from database import engine, Base
from routers import articles, dilekce, ceza, admin, chat, sitemap, stats

# Tabloları oluştur
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TrafikRehber API",
    description="Trafik cezaları, sigorta, ehliyet rehber platformu",
    version="1.0.0"
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'ları ekle
app.include_router(articles.router, prefix="/api/articles", tags=["Makaleler"])
app.include_router(dilekce.router, prefix="/api/dilekce", tags=["Dilekçeler"])
app.include_router(ceza.router, prefix="/api/ceza-turleri", tags=["Ceza Türleri"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])
app.include_router(sitemap.router, tags=["SEO"])
app.include_router(stats.router, prefix="/api/stats", tags=["İstatistikler"])

@app.get("/")
def root():
    return {"status": "ok", "service": "TrafikRehber API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
