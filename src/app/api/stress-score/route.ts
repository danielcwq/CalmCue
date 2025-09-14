import { NextRequest, NextResponse } from 'next/server';
import { CohereClientV2 } from 'cohere-ai';

// Type definitions for Cohere reasoning response
interface CohereThinkingContent {
  type: "thinking";
  thinking: string;
}

interface CohereTextContent {
  type: "text";
  text: string;
}

type CohereContent = CohereThinkingContent | CohereTextContent;

interface CohereMessage {
  content: CohereContent[];
}

interface CohereResponse {
  message: CohereMessage;
}

const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { heartRate, timeOfDay, events, previousScore, previousReasoning, wellnessData } = await request.json();

    console.log('🔍 Stress API received wellness data:', wellnessData);
    console.log('📊 Intervals.icu data status:', {
      hasWellnessData: !!wellnessData,
      hrv: wellnessData?.hrv,
      sleepScore: wellnessData?.sleepScore,
      stress: wellnessData?.stress,
      mood: wellnessData?.mood
    });

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

**intervals.icu Wellness Data:**${wellnessData ? `
- HRV: ${wellnessData.hrv || 'N/A'} ms
- Resting HR: ${wellnessData.restingHR || 'N/A'} BPM
- Sleep Score: ${wellnessData.sleepScore || 'N/A'}/100
- Sleep Quality: ${wellnessData.sleepQuality || 'N/A'}/5
- Stress Level: ${wellnessData.stress || 'N/A'}/5 (self-reported)
- Fatigue: ${wellnessData.fatigue || 'N/A'}/5
- Soreness: ${wellnessData.soreness || 'N/A'}/5
- Mood: ${wellnessData.mood || 'N/A'}/5
- Readiness: ${wellnessData.readiness || 'N/A'}/100` : '\n- No wellness data available'}

**Recent Email Activity:**
${events?.length > 0 ? events.map((e: { details: string | object; start_at?: string }) => {
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

    console.log('🤖 Full prompt being sent to LLM:');
    console.log('=' .repeat(50));
    console.log(prompt);
    console.log('=' .repeat(50));

    const response = await cohere.chat({
      model: 'command-a-reasoning-08-2025',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }) as CohereResponse;

    // Extract thinking and text content from Cohere reasoning response
    let responseText = '';
    let thinkingContent = '';

    if (response.message?.content && Array.isArray(response.message.content)) {
      for (const content of response.message.content) {
        // Type-safe handling of thinking content
        if (content.type === "thinking") {
          thinkingContent = (content as CohereThinkingContent).thinking;
          console.log('🧠 Cohere Thinking:', (content as CohereThinkingContent).thinking);
        }

        // Type-safe handling of text content
        if (content.type === "text") {
          responseText = (content as CohereTextContent).text;
          console.log('📝 Cohere Response:', (content as CohereTextContent).text);
        }
      }
    }

    // Log if we didn't get expected content types
    if (!responseText) {
      console.warn('⚠️ No text content found in Cohere response');
    }
    if (!thinkingContent) {
      console.warn('⚠️ No thinking content found in Cohere reasoning response');
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