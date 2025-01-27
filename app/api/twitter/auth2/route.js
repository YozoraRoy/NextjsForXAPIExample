import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// PKCE 挑戰碼生成
function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  
  return { verifier, challenge };
}

// 生成狀態值
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

// OAuth 2.0 配置
const OAUTH2_CONFIG = {
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
  redirectUri: process.env.TWITTER_CALLBACK2_URL || 'http://localhost:3000/api/twitter/auth2/callback',
  scope: ['tweet.read', 'tweet.write', 'users.read'].join(' '),
  authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
  tokenUrl: 'https://api.twitter.com/2/oauth2/token'
};

export async function GET(request) {
  try {
    const { verifier, challenge } = generatePKCE();
    const state = generateState();

    const cookieStore = await cookies();
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 hour
    };

    await cookieStore.set('pkce_verifier', verifier, cookieOptions);
    await cookieStore.set('oauth_state', state, cookieOptions);

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', process.env.TWITTER_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', process.env.TWITTER_CALLBACK2_URL);
    authUrl.searchParams.append('scope', 'tweet.read tweet.write users.read');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    console.log('Authorization URL:', authUrl.toString());
    return NextResponse.json({ success: true, url: authUrl.toString() });

  } catch (error) {
    console.error('OAuth2 authorization error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { code, state } = await request.json();
    const cookieStore = await cookies();
    
    // 驗證 state
    const savedState = await cookieStore.get('oauth_state')?.value;
    console.log('Saved state:', savedState);
    console.log('Received state:', state);

    if (!state || state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    // 獲取 PKCE verifier
    const verifier = await cookieStore.get('pkce_verifier')?.value;
    console.log('PKCE verifier:', verifier ? 'present' : 'missing');

    if (!verifier) {
      throw new Error('Missing PKCE verifier');
    }

    // 交換 access token
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: OAUTH2_CONFIG.redirectUri,
      code_verifier: verifier,
      client_id: OAUTH2_CONFIG.clientId,
      client_secret: OAUTH2_CONFIG.clientSecret
    });

    console.log('Token request parameters:', Object.fromEntries(params));

    const response = await fetch(OAUTH2_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token exchange failed:', error);
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokenData = await response.json();
    console.log('Token data received:', tokenData.access_token ? 'yes' : 'no');

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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('OAuth2 token exchange error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 