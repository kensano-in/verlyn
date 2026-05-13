import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no API key is provided
      console.warn('GEMINI_API_KEY not set. Skipping AI moderation.');
      return NextResponse.json({ isAbusive: false, reason: 'API key not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a highly strict content moderation API for an enterprise application. 
Your task is to determine if the following name contains any abusive, profane, highly offensive, or inappropriate language in ANY language (especially English, Hindi, Hinglish, Spanish, etc.).
Also flag names that are clearly trolling or attempting to bypass filters (e.g. using symbols replacing letters for bad words).
Do NOT be overly sensitive about normal names, but have ZERO TOLERANCE for swear words, slurs, explicit sexual terms, or severe insults.

Respond in strict JSON format:
{
  "isAbusive": boolean,
  "reason": "short explanation if abusive, else null"
}

Text to check: "${text}"
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON block in case the model adds markdown formatting
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const moderationResult = JSON.parse(jsonMatch[0]);

    return NextResponse.json(moderationResult);
  } catch (error) {
    console.error('Moderation API Error:', error);
    // Fail open to avoid blocking legitimate users if the API fails
    return NextResponse.json({ isAbusive: false, error: 'Moderation failed' });
  }
}
