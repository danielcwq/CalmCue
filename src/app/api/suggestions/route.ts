import { NextRequest, NextResponse } from 'next/server';
const { CohereClientV2 } = require('cohere-ai');

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
- Recent Gmail Events: ${events?.length > 0 ? events.map((e: any) => {
      const details = typeof e.details === 'string' ? JSON.parse(e.details) : e.details;
      const eventInfo = details?.subject || details?.summary || details?.title || 'Event';
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

    return NextResponse.json({
      suggestion: response.message.content[0].text,
    });

  } catch (error) {
    console.error('Cohere API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}