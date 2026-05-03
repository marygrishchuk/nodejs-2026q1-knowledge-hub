export function buildAnalyzePrompt(
  articleTitle: string,
  articleContent: string,
  task: 'review' | 'bugs' | 'optimize' | 'explain' = 'review',
): string {
  const taskInstructions = {
    review:
      'Review the article for clarity, completeness, and technical accuracy.',
    bugs: 'Identify potential technical errors, inaccuracies, or bugs mentioned in the article.',
    optimize:
      'Suggest ways to optimize or improve the content, structure, and technical recommendations.',
    explain:
      'Explain the technical concepts covered in the article in simpler terms.',
  };

  return `You are analyzing a knowledge base article.

Article Title: ${articleTitle}

Article Content:
${articleContent}

Task: ${taskInstructions[task]}

You must respond with a valid JSON object with this exact structure:
{
  "analysis": "Your detailed analysis here",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "severity": "info"
}

The "severity" field must be one of: "info", "warning", or "error".
Provide at least 3 specific suggestions in the suggestions array.

Respond only with the JSON object, no other text.`;
}
