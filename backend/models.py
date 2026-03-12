from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, Enum, ARRAY, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from database import Base


class ArticleCategory(str, enum.Enum):
    ceza = "ceza"
    sigorta = "sigorta"
    ehliyet = "ehliyet"
    arac_islemleri = "arac-islemleri"
    genel = "genel"

class SchemaType(str, enum.Enum):
    Article = "Article"
    HowTo = "HowTo"
    FAQPage = "FAQPage"

class DilekceKategori(str, enum.Enum):
    itiraz = "itiraz"
    sigorta = "sigorta"
    ehliyet = "ehliyet"
    arac = "arac"
    genel = "genel"


class Article(Base):
    __tablename__ = "articles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    meta_description = Column(String(160))
    content = Column(Text)
    category = Column(String, default="genel")
    tags = Column(ARRAY(String), default=[])
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    reading_time_min = Column(Integer, default=5)
    author = Column(String, default="TrafikRehber Hukuk Ekibi")
    featured_image_url = Column(String)
    schema_type = Column(String, default="Article")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DilecceSablon(Base):
    __tablename__ = "dilekce_sablonlari"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, unique=True, nullable=False, index=True)
    baslik = Column(String, nullable=False)
    aciklama = Column(Text)
    sablon_icerik = Column(Text)
    kategori = Column(String, default="genel")
    indirme_sayisi = Column(Integer, default=0)
    premium = Column(Boolean, default=False)
    ilgili_kanun = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CezaTuru(Base):
    __tablename__ = "ceza_turleri"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kod = Column(String, unique=True)
    aciklama = Column(String, nullable=False)
    taban_ceza_tl = Column(Numeric(10, 2))
    puan = Column(Integer, default=0)
    kanun_maddesi = Column(String)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    is_premium = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PageStat(Base):
    __tablename__ = "page_stats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_slug = Column(String, index=True)
    view_count = Column(Integer, default=1)
    date = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(String, index=True)
    role = Column(String)  # user / assistant
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
