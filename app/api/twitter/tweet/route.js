import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { text } = await request.json();
    const cookieStore = cookies();

    // 獲取 OAuth 2.0 access token
    const access_token = await cookieStore.get('access_token')?.value;

    if (!access_token) {
      throw new Error('Not authenticated - Please login with OAuth 2.0');
    }

    console.log('Using OAuth 2.0 for tweeting');

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'v2TweetPoster'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Tweet failed:', {
        status: response.status,
        statusText: response.statusText,
        error,
        headers: Object.fromEntries(response.headers)
      });
      throw new Error(`Tweet failed: ${error}`);
    }

    const data = await response.json();
    console.log('Tweet success:', data);
    return NextResponse.json({ success: true, tweet: data });

  } catch (error) {
    console.error('Tweet error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 