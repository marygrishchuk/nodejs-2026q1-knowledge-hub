export function buildGeneratePrompt(
  userPrompt: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): string {
  if (!conversationHistory || conversationHistory.length === 0) {
    return `You are a helpful AI assistant for a knowledge management system.

User request: ${userPrompt}

Provide a helpful, accurate, and concise response.`;
  }

  const historyText = conversationHistory
    .map(
      (msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
    )
    .join('\n\n');

  return `You are a helpful AI assistant for a knowledge management system. Here is the conversation history:

${historyText}

User request: ${userPrompt}

Provide a helpful, accurate, and concise response that takes into account the conversation history.`;
}
