import { NextRequest } from "next/server";
import { startUserGame, canUserStartGame } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { userAddress, fid } = await request.json();

    if (!userAddress) {
      return Response.json(
        { success: false, error: "Missing userAddress" },
        { status: 400 }
      );
    }

    // Try to start the game
    const result = await startUserGame(userAddress, fid);

    if (result.success) {
      return Response.json({
        success: true,
        data: {
          canPlay: true,
          gamesPlayed: result.gamesPlayed,
          gamesRemaining: result.gamesRemaining,
          periodStartTime: result.periodStartTime,
          periodEndTime: result.periodEndTime,
          message: `Game started! ${result.gamesRemaining} games remaining in this 12-hour period.`
        }
      });
    } else {
      // Calculate time until reset
      const currentTime = Date.now();
      const timeUntilReset = result.periodEndTime - currentTime;
      const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
      const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

      return Response.json({
        success: false,
        error: "Game limit reached",
        data: {
          canPlay: false,
          gamesPlayed: result.gamesPlayed,
          gamesRemaining: result.gamesRemaining,
          periodStartTime: result.periodStartTime,
          periodEndTime: result.periodEndTime,
          timeUntilReset,
          hoursUntilReset,
          minutesUntilReset,
          message: `You've played ${result.gamesPlayed}/5 games. Reset in ${hoursUntilReset}h ${minutesUntilReset}m.`
        }
      }, { status: 429 }); // Too Many Requests
    }
  } catch (error) {
    console.error("Error starting game:", error);
    return Response.json(
      { success: false, error: "Failed to start game" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return Response.json(
        { success: false, error: "Missing userAddress parameter" },
        { status: 400 }
      );
    }

    // Get user's game info
    const gameInfo = await canUserStartGame(userAddress);

    return Response.json({
      success: true,
      data: gameInfo
    });
  } catch (error) {
    console.error("Error getting game info:", error);
    return Response.json(
      { success: false, error: "Failed to get game info" },
      { status: 500 }
    );
  }
}


