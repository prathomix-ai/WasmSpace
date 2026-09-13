"""
MasmSpace AI Backend — FastAPI Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Intelligence layer and payment backend for the MasmSpace collaborative workspace.

Endpoints:
  POST /api/summarize             -- AI summary + action items from canvas (Qwen2.5-72B)
  POST /api/rag/index             -- Embed + store a canvas session in Supabase pgvector
  POST /api/search                -- Natural-language vector search over stored sessions
  POST /create-razorpay-order     -- Generate a Razorpay order ID using SDK
  POST /verify-payment            -- Validate HMAC-SHA256 signature & update Supabase profile
  POST /admin/grant-subscription  -- Admin manual override to grant subscription tier
  GET  /health                    -- Service health check
"""

from __future__ import annotations

import os
import re
import json
import time
import hmac
import hashlib
import logging
from typing import Any

from dotenv import load_dotenv

# ─────────────────────────────────────────────────────────────────────────────
# Environment Initialization
# ─────────────────────────────────────────────────────────────────────────────
load_dotenv()
_backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_backend_dir, ".env"))
load_dotenv(os.path.join(_backend_dir, "..", ".env.local"))
load_dotenv(os.path.join(_backend_dir, "..", ".env"))

import httpx
import razorpay
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from rag_router import router as rag_router
from supabase_client import (
    get_profile_by_email,
    update_profile_subscription,
)

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("masmspace-backend")

# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="MasmSpace AI & Payment Backend",
    description=(
        "AI Summarisation, Vector RAG Search, and Secure Razorpay Subscription "
        "Integration for the MasmSpace Collaborative Workspace."
    ),
    version="2.1.0",
)

# Allow requests from both Next.js dev server and production domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://masmspace.online",
        "https://www.masmspace.online",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*masmspace\.online)(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)


@app.options("/{full_path:path}")
async def preflight_options_handler(full_path: str):
    """Explicit preflight OPTIONS handler ensuring 200 OK for cross-origin callers."""
    return JSONResponse(status_code=200, content={"status": "ok", "path": full_path})

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
HF_TOKEN: str = os.getenv("HF_TOKEN", "")
HF_MODEL: str = os.getenv("HF_MODEL", "Qwen/Qwen2.5-72B-Instruct")
HF_API_URL: str = f"https://api-inference.huggingface.co/models/{HF_MODEL}/v1/chat/completions"
REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "60"))

RAZORPAY_KEY_ID: str = (
    os.getenv("RAZORPAY_KEY_ID", "")
    or os.getenv("NEXT_PUBLIC_RAZORPAY_KEY_ID", "")
)
RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")


def get_razorpay_client() -> razorpay.Client:
    """Instantiate and return an authenticated Razorpay Client."""
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        logger.error("Razorpay credentials missing in environment.")
        raise HTTPException(
            status_code=500,
            detail="Razorpay credentials not configured on server (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).",
        )
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────
class CanvasShape(BaseModel):
    """A single shape/element from the canvas."""
    id: str = ""
    type: str = ""
    text: str = ""
    props: dict[str, Any] = Field(default_factory=dict)


class SummarizeRequest(BaseModel):
    """Request body for /api/summarize."""
    canvas_text: str = Field(default="", description="Raw text extracted from canvas")
    shapes: list[CanvasShape] = Field(default_factory=list, description="Structured canvas shapes")
    board_title: str = Field(default="Untitled Board", description="Title of whiteboard session")
    context: str = Field(default="", description="Optional additional user context")


class ActionItem(BaseModel):
    task: str
    owner: str | None = None
    due: str | None = None
    priority: str = "medium"


class SummarizeResponse(BaseModel):
    summary: str
    key_points: list[str]
    action_items: list[ActionItem]
    decisions: list[str]
    next_steps: list[str]
    mood: str
    model_used: str
    processing_time_ms: int


class CreateOrderRequest(BaseModel):
    plan: str = Field(default="monthly", description="'monthly' or 'yearly'")
    amount: float | None = Field(default=None, description="Amount in currency subunits (* 100)")
    currency: str = Field(default="USD", description="USD or INR")
    receipt: str | None = None
    user_email: str | None = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    user_email: str | None = None
    plan: str = "pro"


class AdminGrantSubscriptionRequest(BaseModel):
    email: str
    plan: str = "pro"
    role: str = "pro"
    admin_email: str | None = None


class AdminRevokeAccessRequest(BaseModel):
    email: str
    admin_email: str | None = None


# ─────────────────────────────────────────────────────────────────────────────
# Helper — extract text & call Hugging Face
# ─────────────────────────────────────────────────────────────────────────────
def _extract_text_from_shapes(shapes: list[CanvasShape]) -> str:
    texts: list[str] = []
    for shape in shapes:
        if shape.text:
            texts.append(shape.text.strip())
        for key in ("text", "label", "value", "content"):
            val = shape.props.get(key)
            if isinstance(val, str) and val.strip():
                texts.append(val.strip())
    return "\n".join(t for t in texts if t)


def _build_canvas_content(req: SummarizeRequest) -> str:
    parts: list[str] = []
    shape_text = _extract_text_from_shapes(req.shapes)
    if shape_text:
        parts.append(shape_text)
    if req.canvas_text and req.canvas_text not in shape_text:
        parts.append(req.canvas_text)
    if req.context:
        parts.append(f"[User context: {req.context}]")
    return "\n\n".join(parts) or "(empty canvas)"


SYSTEM_PROMPT = """You are MasmSpace AI, an expert meeting analyst and productivity assistant.
You will receive raw whiteboard content from a collaborative session and must produce a structured,
actionable JSON summary.

Return ONLY valid JSON — no markdown fences, no prose before or after.

The JSON must match this exact schema:
{
  "summary": "2-4 sentence overview of the session",
  "key_points": ["point 1", "point 2"],
  "action_items": [
    {"task": "...", "owner": "name or null", "due": "date or null", "priority": "high|medium|low"}
  ],
  "decisions": ["decision 1"],
  "next_steps": ["next step 1"],
  "mood": "productive|brainstorming|planning|retrospective"
}
"""


async def _call_huggingface(canvas_content: str, board_title: str) -> dict[str, Any]:
    if not HF_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="HF_TOKEN environment variable not set.",
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
                detail=f"Hugging Face API timed out after {REQUEST_TIMEOUT}s.",
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Network error: {exc}")

    if response.status_code != 200:
        logger.error("HF API error %s: %s", response.status_code, response.text[:300])
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Hugging Face API error: {response.text[:300]}",
        )

    data = response.json()
    raw_text: str = data["choices"][0]["message"]["content"]
    clean = re.sub(r"```(?:json)?|```", "", raw_text).strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError as exc:
        logger.error("JSON parse error: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="AI returned malformed JSON. Please retry.",
        )


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(rag_router)


@app.get("/", tags=["health"])
async def root():
    return {
        "service": "MasmSpace Backend",
        "status": "online",
        "version": "2.1.0",
        "razorpay_configured": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET),
        "endpoints": [
            "/api/summarize",
            "/create-razorpay-order",
            "/verify-payment",
            "/admin/grant-subscription",
        ],
    }


@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "razorpay": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET),
        "hf_token": bool(HF_TOKEN),
    }


@app.post("/api/summarize", response_model=SummarizeResponse, tags=["ai"])
async def summarize(req: SummarizeRequest):
    t0 = time.perf_counter()
    canvas_content = _build_canvas_content(req)
    if canvas_content.strip() == "(empty canvas)":
        raise HTTPException(
            status_code=400,
            detail="Canvas is empty. Add some text or shapes before summarising.",
        )

    result = await _call_huggingface(canvas_content, req.board_title)
    elapsed_ms = int((time.perf_counter() - t0) * 1000)

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
# Razorpay Subscription Endpoints
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/create-razorpay-order", tags=["payment"])
@app.post("/api/create-razorpay-order", tags=["payment"])
async def create_razorpay_order(req: CreateOrderRequest):
    """
    Generate a Razorpay Order ID in currency lowest subunits (* 100).
    Returns strict JSON response.
    """
    try:
        client = get_razorpay_client()
        is_yearly = req.plan.lower() == "yearly"

        amount_subunits = 4900 if is_yearly else 500
        currency = "USD"

        receipt_id = req.receipt or f"rcpt_{req.plan}_{int(time.time())}"

        order_data = {
            "amount": amount_subunits,
            "currency": currency,
            "receipt": receipt_id,
            "notes": {
                "plan": req.plan,
                "user_email": req.user_email or "",
                "service": "PRATHOMIX MasmSpace Pro",
            },
        }

        order = client.order.create(data=order_data)
        logger.info(
            "Razorpay order created: %s | Plan: %s | Amount: %d %s",
            order["id"],
            req.plan,
            amount_subunits,
            currency,
        )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": RAZORPAY_KEY_ID,
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to create Razorpay order: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(exc),
                "detail": "Failed to create order via Razorpay API.",
            },
        )


@app.post("/verify-payment", tags=["payment"])
@app.post("/api/verify-payment", tags=["payment"])
async def verify_payment(req: VerifyPaymentRequest):
    """
    Validates Razorpay HMAC-SHA256 signature.
    If valid, automatically updates the user's profile in Supabase to active/pro.
    """
    try:
        if not RAZORPAY_KEY_SECRET:
            raise HTTPException(
                status_code=500,
                detail="RAZORPAY_KEY_SECRET is not configured in the environment.",
            )

        payload_to_verify = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
        generated_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode("utf-8"),
            payload_to_verify.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        # Timing safe comparison
        if not hmac.compare_digest(generated_signature, req.razorpay_signature):
            logger.warning(
                "Signature mismatch for order %s, payment %s",
                req.razorpay_order_id,
                req.razorpay_payment_id,
            )
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": "Payment signature verification failed. Mismatch detected.",
                },
            )

        logger.info(
            "Payment verified: %s for order: %s",
            req.razorpay_payment_id,
            req.razorpay_order_id,
        )

        # Update Supabase database
        updated_profile = None
        if req.user_email:
            try:
                updated_profile = await update_profile_subscription(
                    email=req.user_email,
                    status="active",
                    role="pro",
                )
                logger.info(
                    "Supabase profile updated for %s to subscription_status='active'",
                    req.user_email,
                )
            except Exception as db_exc:
                logger.error("Supabase profile update warning: %s", db_exc)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Payment verified and subscription activated successfully.",
                "order_id": req.razorpay_order_id,
                "payment_id": req.razorpay_payment_id,
                "subscription_status": "active",
                "profile": updated_profile,
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Payment verification error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(exc),
                "detail": "Internal server error during payment verification.",
            },
        )


@app.post("/admin/grant-subscription", tags=["admin"])
@app.post("/api/admin/grant-subscription", tags=["admin"])
async def admin_grant_subscription(req: AdminGrantSubscriptionRequest):
    """
    Admin Override: takes user email, finds the user in Supabase,
    and manually upgrades their subscription tier without requiring payment.
    """
    try:
        clean_email = req.email.strip().lower()
        if not clean_email or "@" not in clean_email:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Please provide a valid email address."},
            )

        logger.info("Admin manual override for %s (tier: %s)", clean_email, req.plan)
        is_free = req.plan.lower() == "free"
        effective_role = "free" if is_free else (req.role or "pro")
        effective_status = "free" if is_free else "active"

        profile = await update_profile_subscription(
            email=clean_email,
            status=effective_status,
            role=effective_role,
        )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Successfully updated subscription to {req.plan.upper()} for {clean_email}.",
                "user": profile,
            },
        )
    except Exception as exc:
        logger.exception("Failed to grant subscription for %s: %s", req.email, exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(exc),
                "detail": "Failed to update profile in Supabase.",
            },
        )


@app.post("/admin/revoke-access", tags=["admin"])
@app.post("/api/admin/revoke-access", tags=["admin"])
async def admin_revoke_access(req: AdminRevokeAccessRequest):
    """
    Admin Override: Revokes pro access, resetting user's role to 'free' and status to 'free'.
    """
    try:
        clean_email = req.email.strip().lower()
        if not clean_email or "@" not in clean_email:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Please provide a valid email address."},
            )

        logger.info("Admin manual revocation for %s", clean_email)
        profile = await update_profile_subscription(
            email=clean_email,
            status="free",
            role="free",
        )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Successfully revoked access for {clean_email}. Role reset to 'free'.",
                "user": profile,
            },
        )
    except Exception as exc:
        logger.exception("Failed to revoke access for %s: %s", req.email, exc)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(exc),
                "detail": "Failed to update profile in Supabase.",
            },
        )


# ─────────────────────────────────────────────────────────────────────────────
# Strict Global JSON Error Handlers (Prevents 500 HTML responses)
# ─────────────────────────────────────────────────────────────────────────────
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("HTTP %d on %s: %s", exc.status_code, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": str(exc.detail), "detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Invalid request parameters or payload formatting.",
            "detail": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled 500 exception on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error.",
            "detail": str(exc),
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# Dev runner
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
