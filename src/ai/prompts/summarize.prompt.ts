export function buildSummarizePrompt(
  articleTitle: string,
  articleContent: string,
  maxLength: 'short' | 'medium' | 'detailed' = 'medium',
): string {
  const lengthInstructions = {
    short: 'Keep it very brief, 2-3 sentences maximum.',
    medium: 'Provide a concise summary in 4-6 sentences.',
    detailed:
      'Provide a comprehensive summary covering all key points, 8-12 sentences.',
  };

  return `You are summarizing a knowledge base article.

Article Title: ${articleTitle}

Article Content:
${articleContent}

Task: Summarize the article content. ${lengthInstructions[maxLength]}

Provide only the summary text without any preamble or explanation.`;
}
