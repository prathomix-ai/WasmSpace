// ─────────────────────────────────────────────────────────────────────────────
// Prathomix — RAG Search Types
// ─────────────────────────────────────────────────────────────────────────────

export interface IndexRequest {
  board_id: string;
  owner_id: string;
  title?: string;
  extracted_text: string;
  summary?: string | null;
  tags?: string[];
  shape_count?: number;
  session_date?: string;
}

export interface IndexResponse {
  session_id: string;
  board_id: string;
  embedding_dims: number;
  model_used: string;
  indexed_at: string;
}

export type SearchMode = "vector" | "hybrid";

export interface SearchRequest {
  query: string;
  owner_id: string;
  mode?: SearchMode;
  limit?: number;
  similarity_threshold?: number;
}

export interface SessionResult {
  session_id: string;
  board_id: string;
  title: string;
  extracted_text: string;
  summary: string | null;
  tags: string[];
  shape_count: number | null;
  session_date: string | null;
  score: number;
  mode: SearchMode;
}

export interface SearchResponse {
  query: string;
  mode: SearchMode;
  results: SessionResult[];
  model_used: string;
  result_count: number;
}
