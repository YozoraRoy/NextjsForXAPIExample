import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // 清除所有認證相關的 cookies
    await cookieStore.delete('access_token');
    await cookieStore.delete('refresh_token');
    await cookieStore.delete('pkce_verifier');
    await cookieStore.delete('oauth_state');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 