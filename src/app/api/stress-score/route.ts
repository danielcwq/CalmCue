import { NextRequest, NextResponse } from 'next/server';
import { CohereClientV2 } from 'cohere-ai';

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { heartRate, timeOfDay, events, previousScore, previousReasoning } = await request.json();

    const prompt = `You are a stress assessment AI that analyzes a person's current situation to compute a stress score from 0-6:

0: 😊 Relaxed - Very low stress
1: 🙂 Calm - Low stress
2: 😐 Neutral - Slightly tense
3: 😑 Tense - Moderate stress (default)
4: 😬 Stressed - High stress
5: 😰 Very Stressed - Very high stress
6: 🤯 Overwhelmed - Maximum stress

**Current Situation:**
- Heart Rate: ${heartRate} BPM (normal resting: 60-100 BPM)
- Time: ${timeOfDay}
- Previous Stress: ${previousScore}/6 - "${previousReasoning}"
- Recent Email Activity: ${events?.length > 0 ? events.map((e: { details: string | object; start_at?: string }) => {
  const details = typeof e.details === 'string' ? JSON.parse(e.details) : e.details;
  const eventInfo = (details as { subject?: string; summary?: string; title?: string })?.subject ||
                   (details as { subject?: string; summary?: string; title?: string })?.summary ||
                   (details as { subject?: string; summary?: string; title?: string })?.title || 'Event';
  const timeInfo = e.start_at ? new Date(e.start_at).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'}) : '';
  return `• ${eventInfo}${timeInfo ? ` (${timeInfo})` : ''}`;
}).join('\n') : 'No recent emails'}

**Analysis Factors:**
- Heart rate patterns (spikes, sustained elevation)
- Email volume and urgency indicators
- Time of day and energy patterns
- Previous stress state for continuity
- Work/life balance indicators

**IMPORTANT: Respond with ONLY valid JSON in this exact format:**
{
  "score": [number 0-6],
  "reasoning": "[brief explanation of the score]",
  "confidence": [number 0-1]
}

Do not include any other text, explanations, or formatting. Only the JSON response.`;

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
    let responseText = '';
    if (response.message.content && Array.isArray(response.message.content)) {
      const textContent = response.message.content.find((item: { type?: string; text?: string }) => item.type === 'text');
      if (textContent && 'text' in textContent) {
        responseText = textContent.text;
      }
    }

    // Try to parse as JSON
    let stressData;
    try {
      // Clean up the response and extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      stressData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.warn('Failed to parse stress response as JSON, using fallback');

      // Fallback parsing
      const scoreMatch = responseText.match(/(?:score|stress).*?[:\s]*([0-6])/i);
      const reasoningMatch = responseText.match(/(?:reasoning|reason|explanation)[:\s]*["']?([^"'\n]+)/i);

      stressData = {
        score: scoreMatch ? parseInt(scoreMatch[1]) : 3,
        reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'Moderate stress level',
        confidence: 0.5
      };
    }

    // Ensure valid ranges
    stressData.score = Math.max(0, Math.min(6, Math.round(stressData.score || 3)));
    stressData.confidence = Math.max(0, Math.min(1, stressData.confidence || 0.7));

    return NextResponse.json(stressData);

  } catch (error) {
    console.error('Stress score API error:', error);
    return NextResponse.json(
      {
        score: 3,
        reasoning: 'Unable to compute stress score at this time',
        confidence: 0.1
      },
      { status: 500 }
    );
  }
}