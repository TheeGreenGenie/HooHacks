"""
ElevenLabs voice chat endpoint.

POST /voice/speak
  - Accepts user message text
  - Generates a western financial advisor AI reply (Gemini → OpenRouter → rule-based)
  - Converts AI reply to speech via ElevenLabs TTS
  - Returns: reply_text (str) + audio_b64 (base64 MP3) + stub (bool)
"""
from __future__ import annotations

import asyncio
import base64
from functools import partial

import httpx
from fastapi import APIRouter, Depends

from app.core.auth0 import get_auth0_sub
from app.core.config import settings

router = APIRouter()

# Adam voice ID on ElevenLabs — warm, confident narrator tone
_VOICE_ID = "pNInz6obpgDQGcFmaJgB"

_SYSTEM_PROMPT = (
    "You are Frontier Frank, a gruff but wise western financial advisor. "
    "You speak in a friendly cowboy tone — short sentences, occasional frontier "
    "metaphors ('ride out the storm', 'pan for gold', 'don't bet the ranch'). "
    "Give practical, accurate personal finance advice. Keep responses under 3 sentences."
)


class VoiceRequest:
    def __init__(self, text: str):
        self.text = text

    @classmethod
    def __get_validators__(cls):
        yield cls._validate

    @staticmethod
    def _validate(v):
        return v


from pydantic import BaseModel


class VoiceRequestModel(BaseModel):
    text: str


class VoiceResponse(BaseModel):
    reply_text: str
    audio_b64: str | None = None
    stub: bool = False
    message: str = ""


# ── AI reply (blocking — run in executor) ────────────────────────────────────

def _ai_reply_sync(user_text: str) -> str:
    """Generate a financial advisor response. Gemini → OpenRouter → rule-based."""
    # 1. Try Gemini (gemini-2.5-flash is current and fast)
    if settings.GEMINI_API_KEY:
        try:
            import google.generativeai as genai  # type: ignore
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                "gemini-2.5-flash",
                system_instruction=_SYSTEM_PROMPT,
            )
            resp = model.generate_content(user_text)
            return resp.text.strip()
        except Exception:
            pass

    # 2. Try OpenRouter (mistral-7b-instruct)
    if settings.OPENROUTER_API_KEY:
        try:
            resp = httpx.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "mistralai/mistral-7b-instruct",
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user",   "content": user_text},
                    ],
                },
                timeout=20,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            pass

    # 3. Rule-based fallback
    text_lower = user_text.lower()
    if any(w in text_lower for w in ["save", "saving", "cut", "spend"]):
        return "Pardner, the quickest trail to savings is trackin' every dollar — small leaks sink big ships out on the frontier."
    if any(w in text_lower for w in ["invest", "stock", "buy", "market"]):
        return "Don't bet the whole ranch on one horse. Spread your gold across a few solid companies and let time do the heavy liftin'."
    if any(w in text_lower for w in ["debt", "loan", "owe", "credit"]):
        return "Debt's like a rattlesnake — the longer you leave it, the worse the bite. Pay down the highest-interest varmint first."
    if any(w in text_lower for w in ["budget", "plan", "goal"]):
        return "Every good cowhand needs a map. Write down your income, your bills, and what's left — that's your trail to ride."
    return "Well now, that's a fine question, partner. Keep your finances lean, your savings steady, and never gamble what you can't afford to lose."


# ── ElevenLabs TTS (blocking — run in executor) ──────────────────────────────

def _elevenlabs_tts_sync(text: str) -> bytes | None:
    """Call ElevenLabs TTS API; return raw MP3 bytes or None on failure."""
    if not settings.ELEVENLABS_API_KEY:
        return None
    try:
        resp = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{_VOICE_ID}",
            headers={
                "xi-api-key": settings.ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "model_id": "eleven_turbo_v2_5",   # fastest ElevenLabs model (2025)
                "voice_settings": {
                    "stability": 0.45,
                    "similarity_boost": 0.80,
                    "style": 0.35,
                    "use_speaker_boost": True,
                },
            },
            timeout=25,
        )
        resp.raise_for_status()
        return resp.content
    except Exception:
        return None


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/speak", response_model=VoiceResponse)
async def speak(
    req: VoiceRequestModel,
    _sub: str = Depends(get_auth0_sub),
):
    loop = asyncio.get_event_loop()

    # Run blocking AI call off the event loop
    reply_text = await loop.run_in_executor(None, partial(_ai_reply_sync, req.text))

    # Run blocking TTS call off the event loop
    audio_bytes = await loop.run_in_executor(None, partial(_elevenlabs_tts_sync, reply_text))

    if audio_bytes:
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        return VoiceResponse(reply_text=reply_text, audio_b64=audio_b64)

    return VoiceResponse(
        reply_text=reply_text,
        stub=True,
        message="ElevenLabs not configured — set ELEVENLABS_API_KEY to enable voice.",
    )
