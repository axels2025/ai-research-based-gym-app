// functions/src/index.js
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// Define secret parameter for Anthropic API key
const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

export const generateWorkout = onCall({
  secrets: [anthropicApiKey],
  cors: true,
}, async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { prompt } = request.data;
  
  if (!prompt) {
    throw new HttpsError('invalid-argument', 'Prompt is required');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey.value(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new HttpsError('internal', `API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { result: data };

  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw new HttpsError('internal', 'Failed to generate workout');
  }
});