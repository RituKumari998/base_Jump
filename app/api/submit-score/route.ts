import { NextRequest } from "next/server";
import { saveGameScore } from "@/lib/database";
import { successResponse, validationErrorResponse, serverErrorResponse, validateRequiredFields } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, pfpUrl, username, score, level, duration, userAddress, faucetClaimed } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, ['fid', 'pfpUrl', 'score', 'level']);
    if (!validation.isValid) {
      return validationErrorResponse(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        { missingFields: validation.missingFields }
      );
    }

    // Validate score and level values
    if (typeof score !== 'number' || score < 0) {
      return validationErrorResponse('Score must be a non-negative number');
    }

    if (typeof level !== 'number' || level < 0) {
      return validationErrorResponse('Level must be a non-negative number');
    }

    console.log(
      "fid", fid, "pfpUrl", pfpUrl, "username", username, "score", score, "level", level, "duration", duration, "userAddress", userAddress, "faucetClaimed", faucetClaimed
    );

    // Save the game score
    await saveGameScore({
      fid,
      pfpUrl,
      username,
      score, // This will be used as the new currentSeasonScore
      level,
      userAddress,
      duration: duration || 0,
      timestamp: Date.now(),
      faucetClaimed: faucetClaimed || false
    });

    return successResponse({ score, level, timestamp: Date.now() });
  } catch (error) {
    console.error("Error submitting score:", error);
    return serverErrorResponse(
      "Failed to submit score",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}

