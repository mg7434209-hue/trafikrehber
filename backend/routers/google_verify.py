from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter()

@router.get("/google26e8a302ff887c04.html", response_class=PlainTextResponse)
async def google_verify():
    return "google-site-verification: google26e8a302ff887c04.html"
