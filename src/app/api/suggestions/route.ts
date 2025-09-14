import { NextRequest, NextResponse } from 'next/server';
import { CohereClientV2 } from 'cohere-ai';

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { heartRate, timeOfDay, timezone, events } = await request.json();

    const prompt = `
You are a wellness assistant helping someone calm down at the end of the day. Based on the following information, provide personalized suggestions with a few light jokes mixed in:

**Current Context:**
- Heart Rate: ${heartRate} BPM
- Time: ${timeOfDay}
- Timezone: ${timezone}
- Recent Gmail Events: ${events?.length > 0 ? events.map((e: { details: string | object; start_at?: string }) => {
      const details = typeof e.details === 'string' ? JSON.parse(e.details) : e.details;
      const eventInfo = (details as { subject?: string; summary?: string; title?: string })?.subject ||
                       (details as { subject?: string; summary?: string; title?: string })?.summary ||
                       (details as { subject?: string; summary?: string; title?: string })?.title || 'Event';
      const timeInfo = e.start_at ? new Date(e.start_at).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) : '';
      return `• ${eventInfo}${timeInfo ? ` (${timeInfo})` : ''}`;
    }).join('\n') : 'No recent events'}

**Instructions:**
Generate exactly 5 short, punchy suggestions (one per line). Each should be:
- Maximum 1 sentence (under 15 words)
- Actionable and specific
- Mix of wellness tips, playful observations, and light humor
- Focus on time of day and recent events for context
- Only mention heart rate if there are unusual patterns (ignore normal/stable HR)
- Tone: casual, supportive, slightly cheeky

Format as a simple numbered list:
1. [suggestion]
2. [suggestion]
3. [suggestion]
4. [suggestion]
5. [suggestion]
`;

    const response = await cohere.chat({
      model: 'command-a-03-2025',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content from Cohere response
    let suggestionText = 'No suggestion available';
    if (response.message.content && Array.isArray(response.message.content)) {
      const textContent = response.message.content.find((item: { type?: string; text?: string }) => item.type === 'text');
      if (textContent && 'text' in textContent) {
        suggestionText = textContent.text;
      }
    }

    return NextResponse.json({
      suggestion: suggestionText,
    });

  } catch (error) {
    console.error('Cohere API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}