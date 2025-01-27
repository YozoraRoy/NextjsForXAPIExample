import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      console.error('Missing required OAuth2 parameters:', { code, state });
      throw new Error('Missing required OAuth2 parameters');
    }

    // 獲取 PKCE verifier
    const cookieStore = await cookies();
    const verifier = await cookieStore.get('pkce_verifier')?.value;

    if (!verifier) {
      console.error('Missing PKCE verifier');
      throw new Error('Missing PKCE verifier');
    }

    // 構建 Basic Auth
    const basicAuth = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    // 直接向 Twitter 的 token 端點發送請求
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.TWITTER_CALLBACK2_URL,
      code_verifier: verifier
    });

    console.log('Token request parameters:', {
      code: code.substring(0, 10) + '...',
      verifier: verifier.substring(0, 10) + '...',
      redirect_uri: process.env.TWITTER_CALLBACK2_URL
    });

    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error,
        headers: Object.fromEntries(response.headers)
      });
      throw new Error('Token exchange failed');
    }

    const tokenData = await response.json();
    console.log('Token exchange successful:', {
      has_access_token: !!tokenData.access_token,
      has_refresh_token: !!tokenData.refresh_token
    });

    // 儲存 tokens
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    };

    await cookieStore.set('access_token', tokenData.access_token, cookieOptions);
    if (tokenData.refresh_token) {
      await cookieStore.set('refresh_token', tokenData.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }

    // 重定向到成功頁面
    const successUrl = new URL('/auth-success', process.env.NEXT_PUBLIC_BASE_URL);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('OAuth2 callback error:', error);
    const errorUrl = new URL('/auth-error', process.env.NEXT_PUBLIC_BASE_URL);
    return NextResponse.redirect(errorUrl);
  }
} 