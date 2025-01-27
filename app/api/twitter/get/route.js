import { TwitterApi } from 'twitter-api-v2';

export async function GET() {
  try {
    // 使用 OAuth 2.0 認證
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,        // 也叫 Consumer Key
      appSecret: process.env.TWITTER_API_SECRET,   // 也叫 Consumer Secret
    });

    // 使用 app-only auth flow
    const appClient = await client.appLogin();
    
    console.log('Attempting to fetch tweets...');
    
    const tweets = await appClient.v2.userTimeline('2603982811', {
      'tweet.fields': 'created_at,text',
      max_results: 10,
    });
    
    return Response.json({ success: true, tweets });
  } catch (error) {
    console.error('Twitter API Error Details:', {
      message: error.message,
      data: error.data,
      code: error.code,
      stack: error.stack,
    });
    
    return Response.json(
      { 
        success: false, 
        error: error.message,
        details: {
          code: error.code,
          data: error.data
        }
      },
      { status: 500 }
    );
  }
} 