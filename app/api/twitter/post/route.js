import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // 檢查環境變數
    const requiredEnvVars = [
      'TWITTER_API_KEY',
      'TWITTER_API_SECRET'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing ${envVar}`);
      }
    }

    // 1. 建立 OAuth 1.0a 實例
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

    // 2. 準備請求資料
    const callback_url = 'http://localhost:3000/callback';
    const request_data = {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
      data: {
        oauth_callback: callback_url
      }
    };

    // 3. 產生 nonce 和時間戳
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(32).toString('hex');

    // 4. 準備 OAuth 參數（按字母順序排序）
    const oauth_params = {
      oauth_callback: callback_url,
      oauth_consumer_key: process.env.TWITTER_API_KEY,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_version: '1.0'
    };

    // 5. 獲取 OAuth 簽名
    const authorization = oauth.authorize({
      ...request_data,
      data: oauth_params
    });

    // 6. 按照規範構建授權標頭（使用單行格式）
    const authHeader = 'OAuth ' + [
      `oauth_callback="${encodeURIComponent(callback_url)}"`,
      `oauth_consumer_key="${encodeURIComponent(authorization.oauth_consumer_key)}"`,
      `oauth_nonce="${encodeURIComponent(authorization.oauth_nonce)}"`,
      `oauth_signature="${encodeURIComponent(authorization.oauth_signature)}"`,
      `oauth_signature_method="HMAC-SHA1"`,
      `oauth_timestamp="${authorization.oauth_timestamp}"`,
      `oauth_version="1.0"`
    ].sort().join(', ');

    console.log('Request URL:', request_data.url);
    console.log('Authorization Header:', authHeader);

    // 7. 發送請求
    const response = await fetch(request_data.url, {
      method: request_data.method,
      headers: {
        'Authorization': authHeader,
        'Accept': '*/*',
        'User-Agent': "themattharris' HTTP Client",
        'Host': 'api.twitter.com'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token 請求失敗:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        error: errorText
      });
      throw new Error(`Token 請求失敗: ${response.statusText}`);
    }

    const responseText = await response.text();
    const responseParams = new URLSearchParams(responseText);
    
    // 檢查回應
    if (responseParams.get('oauth_callback_confirmed') !== 'true') {
      throw new Error('OAuth callback not confirmed');
    }

    console.log('Token 請求成功:', {
      oauth_token: responseParams.get('oauth_token'),
      oauth_token_secret: responseParams.get('oauth_token_secret'),
      oauth_callback_confirmed: responseParams.get('oauth_callback_confirmed')
    });

    return Response.json({
      success: true,
      oauth_token: responseParams.get('oauth_token'),
      oauth_token_secret: responseParams.get('oauth_token_secret'),
      message: 'Token 請求成功'
    });

  } catch (error) {
    console.error('錯誤詳情:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      details: error.response?.body || error.message
    }, { status: error.response?.status || 500 });
  }
}