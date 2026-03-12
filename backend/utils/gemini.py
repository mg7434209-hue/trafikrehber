import httpx
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

SYSTEM_PROMPT = """Sen TrafikRehber platformunun AI asistanısın. Adın 'Rehber'.
Yalnızca şu konularda yardım edersin:
- Trafik cezaları (sorgulama, itiraz, ödeme)
- Zorunlu trafik sigortası ve kasko
- Ehliyet işlemleri ve puan sistemi
- Araç tescil, muayene, plaka işlemleri
- Türk trafik hukuku genel bilgisi

KURALLAR:
1. Her yanıtın sonuna şu uyarıyı ekle: "⚖️ Bu bilgi genel rehber niteliğindedir, hukuki danışmanlık yerine geçmez."
2. Konu dışı sorulara: "Üzgünüm, yalnızca trafik ve araç işlemleri konularında yardımcı olabiliyorum."
3. Türkçe yanıt ver, resmi ama sıcak bir dil kullan.
4. Kısa ve öz yanıtlar ver — maksimum 3 paragraf.
"""

async def ask_gemini(messages: list) -> str:
    if not GEMINI_API_KEY:
        return "AI servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin."

    # Konuşma geçmişini Gemini formatına çevir
    contents = [{"role": "user", "parts": [{"text": SYSTEM_PROMPT + "\n\nKullanıcı sorusu:"}]}]
    
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 500,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except httpx.TimeoutException:
        return "Yanıt gecikmesi yaşandı. Lütfen tekrar deneyin. ⚖️ Bu bilgi genel rehber niteliğindedir."
    except Exception as e:
        return "Şu an yanıt veremiyorum. Lütfen daha sonra tekrar deneyin."
