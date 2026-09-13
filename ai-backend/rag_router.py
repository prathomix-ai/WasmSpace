"""
MasmSpace RAG -- Router
Provides two endpoints:

  POST /api/rag/index   -- Embed and store a canvas session in Supabase
  POST /api/search      -- Natural-language vector search over stored sessions
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from embeddings import embed_text, EMBEDDING_MODEL
from supabase_client import (
    insert_canvas_session,
    upsert_canvas_embedding,
    rpc_search_sessions,
    rpc_hybrid_search_sessions,
)

logger = logging.getLogger("masmspace-ai.rag")

router = APIRouter(prefix="/api", tags=["rag"])


# =============================================================================
# Schemas
# =============================================================================

class IndexRequest(BaseModel):
    """
    Index a canvas session so it becomes searchable via /api/search.

    Send this after saving a board snapshot.  The backend will:
      1. Combine title + extracted_text + tags into one document string
      2. Generate a 768-dim embedding via HF sentence-transformers
      3. Upsert the session + embedding rows into Supabase
    """
    board_id: str = Field(..., description="UUID of the board (boards.id)")
    owner_id: str = Field(..., description="UUID of the authenticated user")
    title: str = Field(default="Untitled Session", max_length=200)
    extracted_text: str = Field(
        ...,
        description="Full text content scraped from the tldraw canvas",
    )
    summary: str | None = Field(
        default=None,
        description="Optional AI-generated summary (from /api/summarize) to enrich the embedding",
    )
    tags: list[str] = Field(
        default_factory=list,
        max_length=20,
        description="Free-form tags e.g. ['auth', 'backend', 'sprint-4']",
    )
    shape_count: int = Field(default=0, ge=0)
    session_date: str | None = Field(
        default=None,
        description="ISO-8601 timestamp of when the session occurred (defaults to now)",
    )


class IndexResponse(BaseModel):
    session_id: str
    board_id: str
    embedding_dims: int
    model_used: str
    indexed_at: str


class SearchRequest(BaseModel):
    """
    Natural-language search over indexed canvas sessions.

    Example queries:
      - 'Find the login architecture diagram from last week'
      - 'Which board discussed the payment flow refactor?'
      - 'sprint 4 retrospective action items'
    """
    query: str = Field(..., min_length=2, max_length=500)
    owner_id: str = Field(..., description="UUID of the authenticated user (filters results)")
    mode: str = Field(
        default="vector",
        description="Search mode: 'vector' (pure semantic) | 'hybrid' (semantic + BM25 RRF)",
    )
    limit: int = Field(default=5, ge=1, le=20)
    similarity_threshold: float = Field(
        default=0.30,
        ge=0.0,
        le=1.0,
        description="Minimum cosine similarity. Only used in 'vector' mode.",
    )


class SessionResult(BaseModel):
    session_id: str
    board_id: str
    title: str
    extracted_text: str
    summary: str | None
    tags: list[str]
    shape_count: int | None
    session_date: str | None
    score: float          # similarity (vector) or rrf_score (hybrid)
    mode: str


class SearchResponse(BaseModel):
    query: str
    mode: str
    results: list[SessionResult]
    model_used: str
    result_count: int


# =============================================================================
# Endpoint: Index a canvas session
# =============================================================================

@router.post("/rag/index", response_model=IndexResponse)
async def index_canvas_session(req: IndexRequest):
    """
    Embed and persist a canvas session snapshot for future RAG search.

    Flow:
      1. Build a rich document string from title + extracted_text + summary + tags
      2. Call HF Inference API to get a 768-dim sentence embedding
      3. INSERT into canvas_sessions (Supabase REST)
      4. UPSERT into canvas_embeddings (Supabase REST)
    """
    if not req.extracted_text.strip() and not req.title.strip():
        raise HTTPException(
            status_code=400,
            detail="extracted_text and title cannot both be empty.",
        )

    # Build document string for embedding
    # Prepend title (weighted twice for semantic emphasis) + summary + tags + body
    doc_parts: list[str] = [req.title, req.title]   # title twice for emphasis
    if req.summary:
        doc_parts.append(req.summary)
    if req.tags:
        doc_parts.append("Tags: " + ", ".join(req.tags))
    doc_parts.append(req.extracted_text)
    document = "\n\n".join(p for p in doc_parts if p.strip())

    logger.info(
        "Embedding session for board %s (%d chars)", req.board_id, len(document)
    )

    # Generate embedding
    try:
        vector = await embed_text(document)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Resolve session_date
    session_date = req.session_date or datetime.now(timezone.utc).isoformat()

    # Write session to Supabase
    try:
        session_row = await insert_canvas_session(
            board_id=req.board_id,
            owner_id=req.owner_id,
            title=req.title,
            extracted_text=req.extracted_text,
            summary=req.summary,
            tags=req.tags,
            shape_count=req.shape_count,
            session_date=session_date,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"Supabase write failed: {exc}")

    session_id = session_row["id"]

    # Write embedding to Supabase
    try:
        await upsert_canvas_embedding(
            session_id=session_id,
            board_id=req.board_id,
            embedding=vector,
            model_name=EMBEDDING_MODEL,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding upsert failed: {exc}",
        )

    logger.info("Session %s indexed successfully (%d dims)", session_id, len(vector))

    return IndexResponse(
        session_id=session_id,
        board_id=req.board_id,
        embedding_dims=len(vector),
        model_used=EMBEDDING_MODEL,
        indexed_at=datetime.now(timezone.utc).isoformat(),
    )


# =============================================================================
# Endpoint: Natural-language search
# =============================================================================

@router.post("/search", response_model=SearchResponse)
async def search_sessions(req: SearchRequest):
    """
    Perform a vector (or hybrid) similarity search over indexed canvas sessions.

    Given a natural-language query like 'login architecture diagram from last week',
    this endpoint:
      1. Embeds the query with the same sentence-transformer model used at index time
      2. Calls the Supabase RPC function (search_canvas_sessions or hybrid variant)
      3. Returns ranked session results with board_id, title, and similarity score

    Use the returned session_id / board_id to navigate to the specific board.
    """
    if req.mode not in ("vector", "hybrid"):
        raise HTTPException(
            status_code=400,
            detail="mode must be 'vector' or 'hybrid'",
        )

    logger.info(
        "Search [%s] query='%s' owner=%s limit=%d",
        req.mode,
        req.query[:80],
        req.owner_id,
        req.limit,
    )

    # Embed the user query
    try:
        query_vector = await embed_text(req.query)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # Call Supabase RPC
    try:
        if req.mode == "hybrid":
            rows = await rpc_hybrid_search_sessions(
                query_text=req.query,
                query_embedding=query_vector,
                owner_uuid=req.owner_id,
                match_count=req.limit,
            )
        else:
            rows = await rpc_search_sessions(
                query_embedding=query_vector,
                owner_uuid=req.owner_id,
                match_count=req.limit,
                similarity_threshold=req.similarity_threshold,
            )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"Search RPC failed: {exc}")

    if not rows:
        logger.info("No results found for query '%s'", req.query[:60])

    results = [
        SessionResult(
            session_id=row.get("session_id", ""),
            board_id=row.get("board_id", ""),
            title=row.get("title", "Untitled"),
            extracted_text=_truncate(row.get("extracted_text", ""), 300),
            summary=row.get("summary"),
            tags=row.get("tags") or [],
            shape_count=row.get("shape_count"),
            session_date=row.get("session_date"),
            score=float(row.get("similarity") or row.get("rrf_score") or 0.0),
            mode=req.mode,
        )
        for row in rows
    ]

    return SearchResponse(
        query=req.query,
        mode=req.mode,
        results=results,
        model_used=EMBEDDING_MODEL,
        result_count=len(results),
    )


# =============================================================================
# Helpers
# =============================================================================

def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "..."
