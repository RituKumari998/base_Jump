import { NextRequest, NextResponse } from 'next/server';
import { addShareBonus } from '@/lib/database';

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

    console.log('🎁 Adding share bonus for:', address, 'FID:', fid);

    const result = await addShareBonus(address, fid);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      newRemainingClaims: result.newRemainingClaims
    });

  } catch (error) {
    console.error('Error adding share bonus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add share bonus' },
      { status: 500 }
    );
  }
}

