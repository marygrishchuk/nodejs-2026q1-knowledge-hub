import { ApiProperty } from '@nestjs/swagger';

export class RagSearchResultDto {
  @ApiProperty()
  articleId: string;

  @ApiProperty()
  articleTitle: string;

  @ApiProperty()
  chunk: string;

  @ApiProperty()
  similarity: number;
}

export class RagSearchResponseDto {
  @ApiProperty({ type: [RagSearchResultDto] })
  results: RagSearchResultDto[];
}
