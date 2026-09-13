"""
MasmSpace RAG -- Supabase Client
Thin async wrapper around the Supabase REST + RPC API using httpx.
Uses the SERVICE ROLE key so it bypasses RLS for embedding writes.
"""

from __future__ import annotations

import os
import logging
from typing import Any

import httpx

logger = logging.getLogger("masmspace-ai.supabase")

SUPABASE_URL: str  = os.getenv("SUPABASE_URL", "")
# Service role key -- never exposed to the browser
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_TIMEOUT = 20


def _headers() -> dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment."
        )
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def insert_canvas_session(
    board_id: str,
    owner_id: str | None,
    title: str,
    extracted_text: str,
    summary: str | None,
    tags: list[str],
    shape_count: int,
    session_date: str,
) -> dict[str, Any]:
    """Insert a new canvas_session row. Returns the created row."""
    url = f"{SUPABASE_URL}/rest/v1/canvas_sessions"
    payload = {
        "board_id": board_id,
        "owner_id": owner_id,
        "title": title,
        "extracted_text": extracted_text,
        "summary": summary,
        "tags": tags,
        "shape_count": shape_count,
        "session_date": session_date,
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(url, json=payload, headers=_headers())
    _raise_for_status(resp, "insert canvas_session")
    rows: list[dict] = resp.json()
    return rows[0]


async def upsert_canvas_embedding(
    session_id: str,
    board_id: str,
    embedding: list[float],
    model_name: str,
) -> None:
    """Upsert an embedding row (insert or update if session_id already exists)."""
    url = f"{SUPABASE_URL}/rest/v1/canvas_embeddings"
    payload = {
        "session_id": session_id,
        "board_id": board_id,
        "embedding": embedding,
        "model_name": model_name,
    }
    headers = {**_headers(), "Prefer": "resolution=merge-duplicates,return=minimal"}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(url, json=payload, headers=headers)
    _raise_for_status(resp, "upsert canvas_embedding")


async def rpc_search_sessions(
    query_embedding: list[float],
    owner_uuid: str,
    match_count: int = 5,
    similarity_threshold: float = 0.30,
) -> list[dict[str, Any]]:
    """Call the search_canvas_sessions Postgres RPC function."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/search_canvas_sessions"
    payload = {
        "query_embedding": query_embedding,
        "owner_uuid": owner_uuid,
        "match_count": match_count,
        "similarity_threshold": similarity_threshold,
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(url, json=payload, headers=_headers())
    _raise_for_status(resp, "rpc search_canvas_sessions")
    return resp.json()


async def rpc_hybrid_search_sessions(
    query_text: str,
    query_embedding: list[float],
    owner_uuid: str,
    match_count: int = 5,
) -> list[dict[str, Any]]:
    """Call the hybrid_search_canvas_sessions RPC (vector + BM25 RRF)."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/hybrid_search_canvas_sessions"
    payload = {
        "query_text": query_text,
        "query_embedding": query_embedding,
        "owner_uuid": owner_uuid,
        "match_count": match_count,
    }
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        resp = await client.post(url, json=payload, headers=_headers())
    _raise_for_status(resp, "rpc hybrid_search_canvas_sessions")
    return resp.json()


def _raise_for_status(resp: httpx.Response, op: str) -> None:
    if resp.status_code not in (200, 201, 204):
        logger.error("[supabase] %s failed %s: %s", op, resp.status_code, resp.text[:400])
        raise RuntimeError(
            f"Supabase {op} returned {resp.status_code}: {resp.text[:200]}"
        )
