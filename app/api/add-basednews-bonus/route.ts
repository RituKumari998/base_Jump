import { NextRequest, NextResponse } from 'next/server';
import { addBasedNewsBonus } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content-type:', contentType);
      return NextResponse.json({ success: false, error: 'Content-Type must be application/json' }, { status: 400 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { userAddress, fid } = body;

    console.log('BasedNews API called with:', { userAddress, fid });

    if (!userAddress) {
      return NextResponse.json({ success: false, error: 'Missing userAddress' }, { status: 400 });
    }

    const result = await addBasedNewsBonus(userAddress, fid);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message, newRemainingClaims: result.newRemainingClaims });
    } else {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Error adding basedNews bonus:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

