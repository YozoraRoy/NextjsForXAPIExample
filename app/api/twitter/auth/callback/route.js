import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Step 2: 處理回調並獲取 access token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const oauth_token = searchParams.get('oauth_token');
    const oauth_verifier = searchParams.get('oauth_verifier');

    if (!oauth_token || !oauth_verifier) {
      throw new Error('Missing required OAuth parameters');
    }

    const params = new URLSearchParams({
      oauth_token,
      oauth_verifier
    });

    const response = await fetch('https://api.twitter.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Access token request failed: ${response.statusText}`);
    }

    const responseText = await response.text();
    const responseParams = new URLSearchParams(responseText);

    // 儲存 access token 和 secret 到 cookies
    const cookieStore = cookies();
    cookieStore.set('twitter_access_token', responseParams.get('oauth_token'), {
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    });
    cookieStore.set('twitter_access_token_secret', responseParams.get('oauth_token_secret'), {
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    });

    // 重定向到前端頁面
    return NextResponse.redirect('http://localhost:3000/auth-success');

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.redirect('http://localhost:3000/auth-error');
  }
} 