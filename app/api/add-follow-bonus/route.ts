import { NextRequest, NextResponse } from 'next/server';
import { addFollowBonus } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, fid } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    console.log('👤 Recording follow for:', address, 'FID:', fid);

    const result = await addFollowBonus(address, fid);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message,
          alreadyFollowed: result.alreadyFollowed 
        },
        { status: result.alreadyFollowed ? 200 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error recording follow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record follow' },
      { status: 500 }
    );
  }
}

