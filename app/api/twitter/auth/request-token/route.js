import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// OAuth 參數生成
function generateOAuthParams(callback_url) {
  return {
    oauth_callback: callback_url,
    oauth_consumer_key: process.env.TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(32).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0'
  };
}

// Step 1: 獲取 request token
export async function POST() {
  try {
    console.log('Starting request token process...');
    
    // 檢查環境變數
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
      throw new Error('Missing required environment variables');
    }

    const oauth = new OAuth({
      consumer: { 
        key: process.env.TWITTER_API_KEY,
        secret: process.env.TWITTER_API_SECRET
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      }
    });

    const callback_url = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/api/twitter/auth/callback';
    console.log('Using callback URL:', callback_url);

    const request_data = {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
      data: { oauth_callback: callback_url }
    };

    const authorization = oauth.authorize(request_data);
    const authHeader = 'OAuth ' + Object.entries(authorization)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ');

    console.log('Request URL:', request_data.url);
    console.log('Authorization Header:', authHeader);

    const response = await fetch(request_data.url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Request token error:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        error: errorText,
        callback_url,
        authHeader
      });
      throw new Error(`Request token failed: ${response.statusText} (${errorText})`);
    }

    const responseText = await response.text();
    const responseParams = new URLSearchParams(responseText);

    // 儲存 request token
    const cookieStore = cookies();
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 hour
    };

    await cookieStore.set('oauth_token', responseParams.get('oauth_token'), cookieOptions);
    await cookieStore.set('oauth_token_secret', responseParams.get('oauth_token_secret'), cookieOptions);

    // 構建授權 URL
    const authorizeUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${responseParams.get('oauth_token')}`;

    return NextResponse.json({
      success: true,
      authorizeUrl
    });

  } catch (error) {
    console.error('Error in request token process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: {
          callback_url: process.env.TWITTER_CALLBACK_URL,
          message: error.toString()
        }
      }, 
      { status: 500 }
    );
  }
} 