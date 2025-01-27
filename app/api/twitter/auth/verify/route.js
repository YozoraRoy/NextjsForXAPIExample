import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export async function GET(request) {
  try {
    console.log('Starting verification process...');
    
    // 從 cookies 獲取 token
    const cookieStore = await cookies();
    const access_token = cookieStore.get('twitter_access_token')?.value;
    const access_token_secret = cookieStore.get('twitter_access_token_secret')?.value;

    if (!access_token || !access_token_secret) {
      throw new Error('Missing access token or secret');
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

    const request_data = {
      url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
      method: 'GET'
    };

    const token = {
      key: access_token,
      secret: access_token_secret
    };

    console.log('Using token:', {
      key: token.key,
      secret: '***'
    });

    const authorization = oauth.authorize(request_data, token);
    const authHeader = 'OAuth ' + Object.entries(authorization)
      .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
      .join(', ');

    // console.log('Request URL:', request_data.url);
    // console.log('Authorization Header:', authHeader);

    const response = await fetch(request_data.url, {
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'OAuth Client',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Verification failed:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        error: errorText
      });
      throw new Error(`Verification failed: ${response.statusText} (${errorText})`);
    }

    const userData = await response.json();
    // console.log('Verification successful:', userData);

    return NextResponse.json({ success: true, user: userData });

  } catch (error) {
    console.error('Error in verification process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.stack 
      }, 
      { status: 500 }
    );
  }
}