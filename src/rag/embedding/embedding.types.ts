export interface EmbedContentRequest {
  model: string;
  content: {
    parts: Array<{ text: string }>;
  };
}

export interface EmbedContentResponse {
  embedding: {
    values: number[];
  };
}
