import { NextRequest } from "next/server";
import { getUserDailyMintCount, getUserMintHistory, getTopScores, getUserGameDataByAddress, hasUserMintedToday, getUserGiftBoxStats } from "@/lib/database";
import { successResponse, validationErrorResponse, serverErrorResponse } from "@/lib/api-helpers";
import { ethers } from "ethers";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');
    const fid = searchParams.get('fid');

    if (!userAddress) {
      return validationErrorResponse("Missing userAddress parameter");
    }

    // Validate userAddress format
    if (!ethers.isAddress(userAddress)) {
      return validationErrorResponse('Invalid userAddress format');
    }

    // Get user's daily mint count
    const dailyMintCount = await getUserDailyMintCount(userAddress);
    
    // Get user's mint history
    const mintHistory = await getUserMintHistory(userAddress, 10);
    
    // Get top scores
    const topScores = await getTopScores(10);
    
    // Get user's game data (current season score and ATH)
    const userGameData = await getUserGameDataByAddress(userAddress);
    
    // Check if user has minted today
    const hasMintedToday = await hasUserMintedToday(userAddress);
    
    // Get user's gift box stats
    const giftBoxStats = await getUserGiftBoxStats(userAddress, fid ? parseInt(fid) : undefined);
    
    console.log('User game data:', userGameData);
    console.log('Gift box stats:', giftBoxStats);
    
    return successResponse({
      userAddress,
      dailyMintCount,
      mintHistory,
      topScores,
      dailyMintsRemaining: 5 - dailyMintCount,
      currentSeasonScore: userGameData?.currentSeasonScore || null,
      bestScore: userGameData?.score || null,
      level: userGameData?.level || null,
      hasMintedToday: hasMintedToday,
      giftBoxStats: giftBoxStats,
      lastGiftBoxUpdate: userGameData?.lastGiftBoxUpdate || null,
      hasFollowed: userGameData?.hasFollowed || false,
      lastShareBonus: userGameData?.lastShareBonus || null,
      lastBasedNewsBonus: userGameData?.lastBasedNewsBonus || null
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    return serverErrorResponse(
      "Failed to get user stats",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
} 