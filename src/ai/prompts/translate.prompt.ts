export function buildTranslatePrompt(
  articleTitle: string,
  articleContent: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  const sourceLangHint = sourceLanguage
    ? `The source language is ${sourceLanguage}.`
    : 'Detect the source language automatically.';

  return `You are translating a knowledge base article to ${targetLanguage}.

${sourceLangHint}

Article Title: ${articleTitle}

Article Content:
${articleContent}

Task: Translate the article content to ${targetLanguage}. Maintain technical accuracy and preserve formatting.

Provide only the translated text without any preamble or explanation.`;
}
