-- =============================================================================
-- MasmSpace -- pgvector RAG Migration
-- Run this AFTER the base schema.sql in your Supabase SQL Editor
-- =============================================================================

-- Step 1: Enable the pgvector extension
-- (Already available in all Supabase projects >= 2023-Q2)
create extension if not exists vector;

-- =============================================================================
-- CANVAS SESSIONS
-- Stores a snapshot of a board at a point in time, with extracted text
-- and rich metadata. Each session becomes one searchable document in the RAG.
-- =============================================================================
create table if not exists canvas_sessions (
  id              uuid primary key default uuid_generate_v4(),
  board_id        uuid references boards(id) on delete cascade,
  owner_id        uuid references auth.users(id) on delete set null,

  -- Human-readable metadata
  title           text not null default 'Untitled Session',
  extracted_text  text not null default '',   -- all text scraped from the canvas
  summary         text,                        -- AI-generated summary (optional)
  tags            text[] default '{}',         -- free-form tags e.g. {"auth","backend"}
  shape_count     int  default 0,
  word_count      int  generated always as (
                    array_length(
                      string_to_array(trim(extracted_text), ' '),
                      1
                    )
                  ) stored,

  -- Timestamps
  session_date    timestamptz not null default now(),  -- when the session happened
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table canvas_sessions enable row level security;

create policy "Users can view own sessions"
  on canvas_sessions for select
  using (auth.uid() = owner_id);

create policy "Users can create sessions"
  on canvas_sessions for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own sessions"
  on canvas_sessions for update
  using (auth.uid() = owner_id);

create policy "Users can delete own sessions"
  on canvas_sessions for delete
  using (auth.uid() = owner_id);

-- Auto-update trigger
create trigger canvas_sessions_updated_at
  before update on canvas_sessions
  for each row execute function update_updated_at();

-- Full-text search index (bonus: hybrid BM25 + vector later)
create index if not exists canvas_sessions_fts_idx
  on canvas_sessions
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(extracted_text, '')));

-- =============================================================================
-- CANVAS EMBEDDINGS
-- One row per canvas_session, storing the 768-dim vector produced by
-- sentence-transformers/all-mpnet-base-v2  (or 384-dim for mini models).
-- Kept in a separate table to allow partial indexing and easy re-embedding.
-- =============================================================================
create table if not exists canvas_embeddings (
  id              uuid primary key default uuid_generate_v4(),
  session_id      uuid references canvas_sessions(id) on delete cascade unique,
  board_id        uuid references boards(id) on delete cascade,

  -- The dense vector. Dimension MUST match the embedding model.
  -- all-mpnet-base-v2 => 768 dims  |  all-MiniLM-L6-v2 => 384 dims
  embedding       vector(768) not null,

  -- Which model/version produced this vector (for future re-indexing)
  model_name      text not null default 'sentence-transformers/all-mpnet-base-v2',
  embedded_at     timestamptz default now()
);

alter table canvas_embeddings enable row level security;

-- Anyone who can see the session can use its embedding for search
create policy "Users can read own embeddings"
  on canvas_embeddings for select
  using (
    exists (
      select 1 from canvas_sessions s
      where s.id = canvas_embeddings.session_id
        and s.owner_id = auth.uid()
    )
  );

create policy "Service role can insert embeddings"
  on canvas_embeddings for insert
  with check (true);   -- backend uses service key; RLS does not apply to service role

create policy "Service role can update embeddings"
  on canvas_embeddings for update
  using (true);

-- =============================================================================
-- HNSW INDEX for approximate nearest-neighbour search
-- cosine distance is best for normalised sentence-transformer vectors
-- =============================================================================
create index if not exists canvas_embeddings_hnsw_idx
  on canvas_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- =============================================================================
-- SEARCH FUNCTION
-- Called from FastAPI via Supabase RPC. Returns sessions ranked by
-- cosine similarity to a query embedding.
--
-- Parameters:
--   query_embedding  VECTOR(768)  -- embedding of the user query
--   owner_uuid       UUID         -- filter to current user's sessions
--   match_count      INT          -- how many results to return (default 5)
--   similarity_threshold FLOAT    -- minimum cosine similarity (0-1, default 0.3)
-- =============================================================================
create or replace function search_canvas_sessions(
  query_embedding      vector(768),
  owner_uuid           uuid,
  match_count          int     default 5,
  similarity_threshold float   default 0.30
)
returns table (
  session_id    uuid,
  board_id      uuid,
  title         text,
  extracted_text text,
  summary       text,
  tags          text[],
  shape_count   int,
  session_date  timestamptz,
  similarity    float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    s.id                                            as session_id,
    s.board_id                                      as board_id,
    s.title                                         as title,
    s.extracted_text                                as extracted_text,
    s.summary                                       as summary,
    s.tags                                          as tags,
    s.shape_count                                   as shape_count,
    s.session_date                                  as session_date,
    1 - (e.embedding <=> query_embedding)::float    as similarity
  from canvas_embeddings e
  join canvas_sessions   s on s.id = e.session_id
  where
    s.owner_id = owner_uuid
    and (1 - (e.embedding <=> query_embedding)) >= similarity_threshold
  order by e.embedding <=> query_embedding   -- cosine distance ASC = most similar first
  limit match_count;
end;
$$;

-- =============================================================================
-- HYBRID SEARCH FUNCTION (vector + full-text, RRF fusion)
-- For power-users: combines semantic + keyword relevance via
-- Reciprocal Rank Fusion (RRF) scoring.
-- =============================================================================
create or replace function hybrid_search_canvas_sessions(
  query_text           text,
  query_embedding      vector(768),
  owner_uuid           uuid,
  match_count          int     default 5,
  rrf_k                int     default 60   -- RRF constant (standard: 60)
)
returns table (
  session_id    uuid,
  board_id      uuid,
  title         text,
  extracted_text text,
  summary       text,
  tags          text[],
  session_date  timestamptz,
  rrf_score     float
)
language plpgsql
security definer
as $$
begin
  return query
  with

  -- Semantic ranking
  semantic as (
    select
      s.id          as session_id,
      row_number() over (order by e.embedding <=> query_embedding) as rank_sem
    from canvas_embeddings e
    join canvas_sessions s on s.id = e.session_id
    where s.owner_id = owner_uuid
    order by e.embedding <=> query_embedding
    limit match_count * 4
  ),

  -- Full-text (BM25-style) ranking
  keyword as (
    select
      s.id          as session_id,
      row_number() over (
        order by ts_rank_cd(
          to_tsvector('english', coalesce(s.title, '') || ' ' || coalesce(s.extracted_text, '')),
          plainto_tsquery('english', query_text)
        ) desc
      ) as rank_kw
    from canvas_sessions s
    where
      s.owner_id = owner_uuid
      and to_tsvector('english', coalesce(s.title, '') || ' ' || coalesce(s.extracted_text, ''))
          @@ plainto_tsquery('english', query_text)
    limit match_count * 4
  ),

  -- RRF fusion
  fused as (
    select
      coalesce(sem.session_id, kw.session_id)       as session_id,
      coalesce(1.0 / (rrf_k + sem.rank_sem), 0.0)
        + coalesce(1.0 / (rrf_k + kw.rank_kw),  0.0) as rrf_score
    from semantic sem
    full outer join keyword kw using (session_id)
  )

  select
    f.session_id,
    s.board_id,
    s.title,
    s.extracted_text,
    s.summary,
    s.tags,
    s.session_date,
    f.rrf_score
  from fused f
  join canvas_sessions s on s.id = f.session_id
  order by f.rrf_score desc
  limit match_count;
end;
$$;

-- =============================================================================
-- CONVENIENCE VIEW: sessions with embedding status
-- =============================================================================
create or replace view canvas_sessions_with_status as
select
  s.*,
  case when e.session_id is not null then true else false end as has_embedding,
  e.model_name,
  e.embedded_at
from canvas_sessions s
left join canvas_embeddings e on e.session_id = s.id;
