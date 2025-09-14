import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]; // Default to today

    const apiKey = process.env.INTERVALS_ICU_API_KEY;
    const athleteId = process.env.INTERVALS_ICU_ATHLETE_ID;

    if (!apiKey || !athleteId) {
      return NextResponse.json(
        { error: 'intervals.icu API key or athlete ID not configured' },
        { status: 500 }
      );
    }

    // Create Basic Auth header: base64 encode "API_KEY:your_actual_api_key"
    const authString = `API_KEY:${apiKey}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    const response = await fetch(
      `https://intervals.icu/api/v1/athlete/${athleteId}/wellness/${date}`,
      {
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('intervals.icu API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `intervals.icu API error: ${response.status}` },
        { status: response.status }
      );
    }

    const wellnessData = await response.json();

    return NextResponse.json(wellnessData);

  } catch (error) {
    console.error('Wellness API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wellness data' },
      { status: 500 }
    );
  }
}