"""
MasmSpace AI Backend — FastAPI Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Intelligence layer for the MasmSpace collaborative whiteboard.

Endpoints:
  POST /api/summarize     -- AI summary + action items from canvas (Qwen2.5-72B)
  POST /api/rag/index     -- Embed + store a canvas session in Supabase pgvector
  POST /api/search        -- Natural-language vector search over stored sessions
  GET  /health            -- Service health check
"""

from __future__ import annotations

import os
import re
import json
import time
import logging
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from rag_router import router as rag_router

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("masmspace-ai")

# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MasmSpace AI Backend",
    description=(
        "Summarisation, action-item extraction, and vector RAG search "
        "for the MasmSpace collaborative whiteboard."
    ),
    version="2.0.0",
)

# Allow requests from both Next.js dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
HF_TOKEN: str = os.getenv("HF_TOKEN", "")
# Primary model — Qwen 2.5 72B (excellent instruction following, free tier)
HF_MODEL: str = os.getenv(
    "HF_MODEL",
    "Qwen/Qwen2.5-72B-Instruct",
)
HF_API_URL: str = (
    f"https://api-inference.huggingface.co/models/{HF_MODEL}/v1/chat/completions"
)
REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "60"))


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────
class CanvasShape(BaseModel):
    """A single shape/element from the tldraw canvas."""
    id: str = ""
    type: str = ""
    text: str = ""
    props: dict[str, Any] = Field(default_factory=dict)


class SummarizeRequest(BaseModel):
    """Request body for /api/summarize."""
    canvas_text: str = Field(
        default="",
        description="Raw text content extracted from the canvas",
    )
    shapes: list[CanvasShape] = Field(
        default_factory=list,
        description="Structured canvas shapes from tldraw store",
    )
    board_title: str = Field(
        default="Untitled Board",
        description="Title of the whiteboard session",
    )
    context: str = Field(
        default="",
        description="Optional additional context provided by the user",
    )


class ActionItem(BaseModel):
    task: str
    owner: str | None = None
    due: str | None = None
    priority: str = "medium"   # high | medium | low


class SummarizeResponse(BaseModel):
    summary: str
    key_points: list[str]
    action_items: list[ActionItem]
    decisions: list[str]
    next_steps: list[str]
    mood: str                  # productive | brainstorming | planning | retrospective
    model_used: str
    processing_time_ms: int


# ─────────────────────────────────────────────────────────────────────────────
# Helper — extract all text from canvas shapes
# ─────────────────────────────────────────────────────────────────────────────
def _extract_text_from_shapes(shapes: list[CanvasShape]) -> str:
    """Walk tldraw shape props and pull out every text string."""
    texts: list[str] = []
    for shape in shapes:
        # Direct text field
        if shape.text:
            texts.append(shape.text.strip())
        # Nested inside props (tldraw stores text in props.text for geo/text shapes)
        for key in ("text", "label", "value", "content"):
            val = shape.props.get(key)
            if isinstance(val, str) and val.strip():
                texts.append(val.strip())
    return "\n".join(t for t in texts if t)


def _build_canvas_content(req: SummarizeRequest) -> str:
    """Merge all available content sources into one clean string."""
    parts: list[str] = []

    shape_text = _extract_text_from_shapes(req.shapes)
    if shape_text:
        parts.append(shape_text)

    if req.canvas_text and req.canvas_text not in shape_text:
        parts.append(req.canvas_text)

    if req.context:
        parts.append(f"[User context: {req.context}]")

    return "\n\n".join(parts) or "(empty canvas)"


# ─────────────────────────────────────────────────────────────────────────────
# Helper — call Hugging Face Serverless Inference (OpenAI-compatible)
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are MasmSpace AI, an expert meeting analyst and productivity assistant.
You will receive raw whiteboard content from a collaborative session and must produce a structured,
actionable JSON summary.

Return ONLY valid JSON — no markdown fences, no prose before or after.

The JSON must match this exact schema:
{
  "summary": "2-4 sentence overview of the session",
  "key_points": ["point 1", "point 2", ...],
  "action_items": [
    {"task": "...", "owner": "name or null", "due": "date or null", "priority": "high|medium|low"},
    ...
  ],
  "decisions": ["decision 1", ...],
  "next_steps": ["next step 1", ...],
  "mood": "productive|brainstorming|planning|retrospective"
}

Rules:
- key_points: 3-7 bullets, each no more than 15 words
- action_items: concrete, assignable tasks only; skip vague ideas
- decisions: things explicitly decided or concluded
- next_steps: immediate follow-ups (meetings, reviews, deliverables)
- mood: single word from the allowed set that best describes the session tone
"""


async def _call_huggingface(canvas_content: str, board_title: str) -> dict[str, Any]:
    """Call the HF Inference API and return parsed JSON."""
    if not HF_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="HF_TOKEN environment variable not set. Please configure your Hugging Face API token.",
        )

    user_message = (
        f"Board title: {board_title}\n\n"
        f"Canvas content:\n{canvas_content}\n\n"
        "Produce the JSON summary now."
    )

    payload = {
        "model": HF_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": 1024,
        "temperature": 0.3,
        "stream": False,
    }

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            response = await client.post(HF_API_URL, json=payload, headers=headers)
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504,
                detail=f"Hugging Face API timed out after {REQUEST_TIMEOUT}s. The model may be loading — try again in 30 seconds.",
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Network error: {exc}")

    if response.status_code == 503:
        raise HTTPException(
            status_code=503,
            detail="Model is currently loading on Hugging Face. Please retry in 20-30 seconds.",
        )

    if response.status_code != 200:
        logger.error("HF API error %s: %s", response.status_code, response.text[:500])
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Hugging Face API error: {response.text[:300]}",
        )

    data = response.json()
    raw_text: str = data["choices"][0]["message"]["content"]
    logger.info("Raw LLM output (first 300 chars): %s", raw_text[:300])

    # Strip markdown code fences if the model added them anyway
    clean = re.sub(r"```(?:json)?|```", "", raw_text).strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError as exc:
        logger.error("JSON parse error: %s\nRaw: %s", exc, raw_text[:500])
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed JSON. Please retry.",
        )


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

# Register RAG router (provides /api/rag/index and /api/search)
app.include_router(rag_router)


@app.get("/", tags=["health"])
async def root():
    return {
        "service": "MasmSpace AI Backend",
        "status": "online",
        "model": HF_MODEL,
        "version": "2.0.0",
        "endpoints": ["/api/summarize", "/api/rag/index", "/api/search"],
    }


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "hf_token_configured": bool(HF_TOKEN)}


@app.post("/api/summarize", response_model=SummarizeResponse, tags=["ai"])
async def summarize(req: SummarizeRequest):
    """
    Accepts the tldraw canvas state/text and returns a structured AI summary.

    The endpoint extracts all text content from the canvas shapes, sends it to
    the Hugging Face Serverless Inference API (Qwen2.5-72B-Instruct), and returns
    a fully-structured JSON with summary, key points, action items, decisions, etc.
    """
    t0 = time.perf_counter()

    canvas_content = _build_canvas_content(req)
    logger.info(
        "Summarising board '%s' — %d chars of content",
        req.board_title,
        len(canvas_content),
    )

    if canvas_content.strip() == "(empty canvas)":
        raise HTTPException(
            status_code=400,
            detail="Canvas is empty. Add some text, sticky notes, or shapes before summarising.",
        )

    result = await _call_huggingface(canvas_content, req.board_title)

    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    # Normalise / fill optional fields safely
    action_items = [
        ActionItem(
            task=item.get("task", ""),
            owner=item.get("owner"),
            due=item.get("due"),
            priority=item.get("priority", "medium"),
        )
        for item in result.get("action_items", [])
        if item.get("task")
    ]

    return SummarizeResponse(
        summary=result.get("summary", ""),
        key_points=result.get("key_points", []),
        action_items=action_items,
        decisions=result.get("decisions", []),
        next_steps=result.get("next_steps", []),
        mood=result.get("mood", "productive"),
        model_used=HF_MODEL,
        processing_time_ms=elapsed_ms,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Error handlers
# ─────────────────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Dev runner
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
