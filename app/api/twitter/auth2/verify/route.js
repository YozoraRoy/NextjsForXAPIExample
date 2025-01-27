import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const access_token = await cookieStore.get('access_token')?.value;

    if (!access_token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('User verification failed:', {
        status: response.status,
        statusText: response.statusText,
        error,
        headers: Object.fromEntries(response.headers)
      });
      throw new Error('Failed to verify user');
    }

    const data = await response.json();
    console.log('User data received:', {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        ...data.data,
        profile_image_url: data.data.profile_image_url
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
} 