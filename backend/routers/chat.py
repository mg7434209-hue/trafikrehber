from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import ChatMessage
from utils.gemini import ask_gemini
import uuid

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


@router.post("/send")
async def send_message(req: ChatRequest, db: Session = Depends(get_db)):
    conv_id = req.conversation_id or str(uuid.uuid4())

    # Konuşma geçmişini getir (son 10 mesaj)
    history = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conv_id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    history.reverse()

    messages = [{"role": m.role, "content": m.content} for m in history]
    messages.append({"role": "user", "content": req.message})

    # Kullanıcı mesajını kaydet
    user_msg = ChatMessage(
        conversation_id=conv_id,
        role="user",
        content=req.message
    )
    db.add(user_msg)

    # Gemini'ye sor
    response = await ask_gemini(messages)

    # AI yanıtını kaydet
    ai_msg = ChatMessage(
        conversation_id=conv_id,
        role="assistant",
        content=response
    )
    db.add(ai_msg)
    db.commit()

    return {
        "success": True,
        "conversation_id": conv_id,
        "response": response
    }


@router.get("/history/{conv_id}")
def get_history(conv_id: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conv_id
    ).order_by(ChatMessage.created_at).all()

    return {
        "success": True,
        "messages": [
            {"role": m.role, "content": m.content, "timestamp": m.created_at.isoformat()}
            for m in messages
        ]
    }


@router.delete("/history/{conv_id}")
def delete_history(conv_id: str, db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.conversation_id == conv_id).delete()
    db.commit()
    return {"success": True}
