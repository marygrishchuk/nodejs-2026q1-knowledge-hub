export interface VectorPointPayload {
  articleId: string;
  articleTitle: string;
  articleStatus: string;
  categoryId: string | null;
  tags: string[];
  chunkText: string;
}

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: VectorPointPayload;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: VectorPointPayload;
}

export interface QdrantFilter {
  must?: QdrantCondition[];
}

export interface QdrantCondition {
  key: string;
  match?: { value: string };
  values_count?: { gte?: number };
}

export interface QdrantSearchRequest {
  vector: number[];
  limit: number;
  with_payload: boolean;
  filter?: QdrantFilter;
}

export interface QdrantScrollRequest {
  limit: number;
  with_payload: boolean;
  filter?: QdrantFilter;
}

export interface QdrantPointResult {
  id: string;
  score?: number;
  payload: VectorPointPayload;
}

export interface QdrantSearchResponse {
  result: QdrantPointResult[];
}

export interface QdrantScrollResponse {
  result: {
    points: QdrantPointResult[];
  };
}

export interface QdrantDeleteResponse {
  result: {
    operation_id: number;
    status: string;
  };
  status: string;
}

export interface QdrantCountResponse {
  result: {
    count: number;
  };
}
