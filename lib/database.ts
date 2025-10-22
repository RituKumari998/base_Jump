import clientPromise from './mongodb';

export interface UserMint {
  userAddress: string;
  score: number;
  timestamp: number;
  tokenId?: number;
  trait?: string;
  signature: string;
}

export interface DailyMintCount {
  userAddress: string;
  date: string; // YYYY-MM-DD format
  count: number;
  lastMintTime: number;
}

export interface GameScore {
  fid: number;
  pfpUrl: string;
  username?: string;
  score: number; // All-time high (ATH) - only updated when beaten
  currentSeasonScore?: number; // Current season score - updated every game
  level: number;
  userAddress?: string;
  timestamp: number;
  duration?: number; // Game duration in seconds
  nftMinted?: boolean;
  nftName?: string;
  nftCount?: number; // Added for NFT tracking
  lastNftMint?: number; // Added for NFT tracking
  hasNft?: boolean; // Added for NFT tracking
  faucetClaimed?: boolean; // Added for faucet tracking
  hasMintedToday?: boolean; // Track if user has minted today
  lastMintDate?: string; // YYYY-MM-DD format of last mint date
  totalRewardsClaimed?: number; // Total gift box rewards claimed (all-time)
  lastGiftBoxUpdate?: number; // Last gift box update timestamp
  giftBoxClaimsInPeriod?: number; // Claims in current 12-hour period
  lastShareBonus?: number; // Last time user claimed share bonus (6-hour cooldown)
  hasFollowed?: boolean; // Has user followed the account (one-time)
  followedAt?: Date; // When user followed
  lastBasedNewsBonus?: number; // Last time user claimed basedNews bonus (6-hour cooldown)
}

export interface FaucetClaim {
  userAddress: string;
  amount: string;
  transactionHash: string;
  timestamp: number;
  blockNumber: number;
  walletIndex?: number; // Which wallet was used (1-5)
}

export interface UsedAuthKey {
  fusedKey: string;
  randomString: string;
  timestamp: number;
  ipAddress: string;
  createdAt: Date;
}

export interface GameSession {
  userAddress: string;
  fid?: number;
  periodStartTime: number;
  gamesPlayed: number;
  lastGameTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftBoxClaim {
  userAddress: string;
  fid?: number;
  tokenType: 'degen' | 'noice'  | 'pepe' | 'based'| 'none';
  amount: number;
  timestamp: number;
  signature?: string;
  transactionHash?: string;
  createdAt: Date;
}

export interface DailyGiftBoxCount {
  userAddress: string;
  date: string; // YYYY-MM-DD format
  count: number;
  lastClaimTime: number;
}

// Authentication key management functions
export async function isAuthKeyUsed(fusedKey: string): Promise<boolean> {
  try {
    const client = await clientPromise;
    if (!client) {
      console.warn('MongoDB client not available');
      return false;
    }
    const db = client.db('basejump');
    
    const usedKey = await db.collection('usedAuthKeys').findOne({ fusedKey });
    return !!usedKey;
  } catch (error) {
    console.warn('Error checking auth key:', error);
    return false;
  }
}

export async function storeUsedAuthKey(authKeyData: Omit<UsedAuthKey, 'createdAt'>): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  await db.collection('usedAuthKeys').insertOne({
    ...authKeyData,
    createdAt: new Date()
  });
}

export async function cleanupOldAuthKeys(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  // Remove keys older than 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  await db.collection('usedAuthKeys').deleteMany({
    createdAt: { $lt: twentyFourHoursAgo }
  });
}

// Optional database validation for critical operations
export async function validateAuthKeyInDatabase(fusedKey: string, randomString: string): Promise<boolean> {
  try {
    const isUsed = await isAuthKeyUsed(fusedKey);
    if (isUsed) {
      return false;
    }
    
    // Store the key for future validation
    await storeUsedAuthKey({
      fusedKey,
      randomString,
      timestamp: Date.now(),
      ipAddress: 'unknown' // Will be set by the calling API route
    });
    
    return true;
  } catch (error) {
    console.error('Database validation error:', error);
    return false;
  }
}

export async function getUserDailyMintCount(userAddress: string): Promise<number> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const dailyCount = await db.collection('dailyMints').findOne({
    userAddress: userAddress.toLowerCase(),
    date: today
  });
  
  return dailyCount?.count || 0;
}

export async function incrementDailyMintCount(userAddress: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const today = new Date().toISOString().split('T')[0];
  const now = Date.now();
  
  await db.collection('dailyMints').updateOne(
    {
      userAddress: userAddress.toLowerCase(),
      date: today
    },
    {
      $inc: { count: 1 },
      $set: { lastMintTime: now },
      $setOnInsert: { userAddress: userAddress.toLowerCase(), date: today }
    },
    { upsert: true }
  );
}

export async function canUserMint(userAddress: string, dailyLimit: number = 5): Promise<boolean> {
  const currentCount = await getUserDailyMintCount(userAddress);
  return currentCount < dailyLimit;
}

export async function saveUserMint(mintData: UserMint): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  await db.collection('userMints').insertOne({
    ...mintData,
    userAddress: mintData.userAddress.toLowerCase(),
    createdAt: new Date()
  });
}

export async function getUserMintHistory(userAddress: string, limit: number = 50): Promise<UserMint[]> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const mints = await db.collection('userMints')
    .find({ userAddress: userAddress.toLowerCase() })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return mints as unknown as UserMint[];
}

export async function getTotalMints(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  return await db.collection('userMints').countDocuments();
}

export async function getTodayMints(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return await db.collection('userMints').countDocuments({
    timestamp: { $gte: today.getTime() }
  });
}

export async function getTopScores(limit: number = 10): Promise<Array<{ userAddress: string; score: number; timestamp: number }>> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const topScores = await db.collection('userMints')
    .find({})
    .sort({ score: -1 })
    .limit(limit)
    .project({ userAddress: 1, score: 1, timestamp: 1 })
    .toArray();
  
  return topScores as Array<{ userAddress: string; score: number; timestamp: number }>;
}

export async function saveGameScore(gameScore: GameScore): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  // Check if player already exists
  const existingPlayer = await db.collection('gameScores').findOne({ fid: gameScore.fid });
  
  if (existingPlayer) {
    const newScore = gameScore.score;
    
    // Check if this is a new all-time high (score field)
    const currentAth = existingPlayer.score || 0;
    const newAth = Math.max(currentAth, newScore);
    
    // Check if this is a new current season high
    const currentSeasonScore = existingPlayer.currentSeasonScore || 0;
    const newCurrentSeasonScore = Math.max(currentSeasonScore, newScore);
    
    // Prepare update fields
    const updateFields: any = {
      pfpUrl: gameScore.pfpUrl,
      username: gameScore.username,
      timestamp: gameScore.timestamp,
      updatedAt: new Date()
    };
    
    // Only update currentSeasonScore if it's a new season high
    if (newScore > currentSeasonScore) {
      updateFields.currentSeasonScore = newScore;
      // Only update duration when current season score improves
      if (gameScore.duration !== undefined) {
        updateFields.duration = gameScore.duration;
      }
    }
    
    // Only update score (ATH) if it's a new all-time high
    if (newScore > currentAth) {
      updateFields.score = newScore;
    }
    
    // Update level if it's higher than existing
    if (gameScore.level > (existingPlayer.level || 0)) {
      updateFields.level = gameScore.level;
    }
    
    // Always update userAddress if provided
    if (gameScore.userAddress) {
      updateFields.userAddress = gameScore.userAddress;
    }
    
    await db.collection('gameScores').updateOne(
      { fid: gameScore.fid },
      { $set: updateFields }
    );
    
    if (newScore > currentAth) {
      console.log(`Updated player ${gameScore.fid} with new ATH: ${newScore}, level: ${gameScore.level}`);
    } else if (newScore > currentSeasonScore) {
      console.log(`Updated player ${gameScore.fid} with new current season score: ${newScore}, level: ${gameScore.level}`);
    } else {
      console.log(`Updated player ${gameScore.fid} profile info - level: ${gameScore.level}`);
    }
  } else {
    // Create new player record with both scores initialized
    const newPlayerData = {
      ...gameScore,
      currentSeasonScore: gameScore.score,
      createdAt: new Date()
    };
    
    await db.collection('gameScores').insertOne(newPlayerData);
    console.log(`Created new player ${gameScore.fid} with score: ${gameScore.score}`);
  }
}

export async function getLeaderboard(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const leaderboard = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true }
    })
    .sort({ currentSeasonScore: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

export async function getUserBestScore(fid: number): Promise<GameScore | null> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const bestScore = await db.collection('gameScores')
    .findOne(
      { fid, currentSeasonScore: { $exists: true } },
      { sort: { currentSeasonScore: -1 } }
    );
  
  return bestScore as GameScore | null;
} 

// NFT minting tracking functions
export async function incrementUserNftCount(fid: number): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  await db.collection('gameScores').updateOne(
    { fid },
    { 
      $inc: { nftCount: 1 },
      $set: { lastNftMint: Date.now() }
    },
    { upsert: true }
  );
}

export async function getUserNftCount(fid: number): Promise<number> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const userData = await db.collection('gameScores').findOne({ fid });
  return userData?.nftCount || 0;
}

export async function updateUserNftInfo(fid: number, nftName: string): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  await db.collection('gameScores').updateOne(
    { fid },
    { 
      $set: { 
        nftName,
        hasNft: true,
        lastNftMint: Date.now()
      }
    },
    { upsert: true }
  );
}

export async function getLeaderboardWithNfts(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  // Get all game scores with NFT data, filter out users without NFTs
  const leaderboard = await db.collection('gameScores')
    .find({ hasNft: true }) // Only get users who have minted NFTs
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

export async function getMixedLeaderboard(limit: number = 50, offset: number = 0): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  // Get all players with currentSeasonScore, sorted by currentSeasonScore
  const allPlayers = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true }
    })
    .sort({ currentSeasonScore: -1 })
    .toArray();
  
  // Remove duplicates by fid (keep highest currentSeasonScore for each user)
  const uniquePlayers = new Map();
  allPlayers.forEach(player => {
    const existing = uniquePlayers.get(player.fid);
    if (!existing || (player.currentSeasonScore || 0) > (existing.currentSeasonScore || 0)) {
      uniquePlayers.set(player.fid, player);
    }
  });
  
  const uniquePlayersList = Array.from(uniquePlayers.values()).sort((a, b) => (b.currentSeasonScore || 0) - (a.currentSeasonScore || 0));
  
  // Separate NFT holders and non-NFT holders
  const nftHolders = uniquePlayersList.filter(player => player.hasNft === true && player.nftCount > 0);
  const nonNftHolders = uniquePlayersList.filter(player => !player.hasNft || !player.nftCount || player.nftCount === 0);
  
  // Ensure top 10 are NFT holders, then add others
  const top10NftHolders = nftHolders.slice(0, 10);
  const remainingNftHolders = nftHolders.slice(10);
  
  // Combine remaining players and sort by currentSeasonScore
  const othersPool = [...remainingNftHolders, ...nonNftHolders].sort((a, b) => (b.currentSeasonScore || 0) - (a.currentSeasonScore || 0));
  
  // Final leaderboard: top 10 NFT holders + others
  const finalLeaderboard = [
    ...top10NftHolders,
    ...othersPool
  ];
  
  // Apply pagination (offset and limit)
  const paginatedResult = finalLeaderboard.slice(offset, offset + limit);
  
  // Additional deduplication check to ensure no duplicates in the result
  const seenFids = new Set();
  const deduplicatedResult = paginatedResult.filter(player => {
    if (seenFids.has(player.fid)) {
      console.log(`Duplicate FID found and removed: ${player.fid} (${player.username || 'Unknown'})`);
      return false;
    }
    seenFids.add(player.fid);
    return true;
  });
  
  // Log pagination info for debugging
  console.log(`getMixedLeaderboard: offset=${offset}, limit=${limit}, total=${finalLeaderboard.length}, returned=${deduplicatedResult.length}`);
  
  return deduplicatedResult as unknown as GameScore[];
}

export async function getTotalPlayersCount(): Promise<number> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  // Get unique player count by counting distinct fids who have currentSeasonScore
  const totalPlayers = await db.collection('gameScores').distinct('fid', { 
    currentSeasonScore: { $exists: true }
  });
  return totalPlayers.length;
}

// Faucet functions
export async function saveFaucetClaim(faucetData: FaucetClaim): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  // Save to faucet claims collection
  await db.collection('faucetClaims').insertOne({
    ...faucetData,
    createdAt: new Date()
  });
  
  // Also mark in gameScores that this user has claimed faucet
  await db.collection('gameScores').updateMany(
    { userAddress: faucetData.userAddress },
    { $set: { faucetClaimed: true } }
  );
}

export async function hasUserClaimedFaucet(userAddress: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  // Check in faucet claims collection
  const faucetClaim = await db.collection('faucetClaims').findOne({ userAddress });
  if (faucetClaim) {
    return true;
  }
  
  // Also check in gameScores collection
  const gameScore = await db.collection('gameScores').findOne({ 
    userAddress, 
    faucetClaimed: true 
  });
  
  return !!gameScore;
}

export async function getUserFaucetClaim(userAddress: string): Promise<FaucetClaim | null> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const faucetClaim = await db.collection('faucetClaims').findOne({ userAddress });
  return faucetClaim as FaucetClaim | null;
}

export async function getWalletUsageStats(): Promise<Array<{ walletIndex: number; usageCount: number; totalAmount: string }>> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const stats = await db.collection('faucetClaims').aggregate([
    {
      $group: {
        _id: '$walletIndex',
        usageCount: { $sum: 1 },
        totalAmount: { $sum: { $toDouble: '$amount' } }
      }
    },
    {
      $project: {
        walletIndex: '$_id',
        usageCount: 1,
        totalAmount: { $toString: '$totalAmount' }
      }
    },
    { $sort: { walletIndex: 1 } }
  ]).toArray();
  
  return stats as Array<{ walletIndex: number; usageCount: number; totalAmount: string }>;
}

// Migration function to update existing data with new scoring fields
export async function migrateToNewScoringSystem(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  console.log('Starting migration to new scoring system...');
  
  // Find all documents that don't have currentSeasonScore field
  const documentsToUpdate = await db.collection('gameScores').find({
    currentSeasonScore: { $exists: false }
  }).toArray();
  
  console.log(`Found ${documentsToUpdate.length} documents to migrate`);
  
  for (const doc of documentsToUpdate) {
    const legacyScore = doc.score || 0;
    
    await db.collection('gameScores').updateOne(
      { _id: doc._id },
      {
        $set: {
          currentSeasonScore: legacyScore
        }
      }
    );
  }
  
  console.log('Migration completed successfully');
}

// Get all-time high leaderboard
export async function getAllTimeHighLeaderboard(limit: number = 50): Promise<GameScore[]> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const leaderboard = await db.collection('gameScores')
    .find({ 
      currentSeasonScore: { $exists: true }
    })
    .sort({ score: -1 })
    .limit(limit)
    .toArray();
  
  return leaderboard as unknown as GameScore[];
}

// Get user's game data by address
export async function getUserGameDataByAddress(userAddress: string): Promise<GameScore | null> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const userData = await db.collection('gameScores')
    .findOne(
      { userAddress: userAddress }
    );
  
  return userData as GameScore | null;
}

// Check if user has minted today
export async function hasUserMintedToday(userAddress: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  const userData = await db.collection('gameScores')
    .findOne(
      { 
        userAddress: userAddress,
        hasMintedToday: true,
        lastMintDate: today
      }
    );
  
  return !!userData;
}

// Update user's daily mint status
export async function updateUserDailyMintStatus(userAddress: string, hasMinted: boolean = true): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  await db.collection('gameScores').updateMany(
    { userAddress: userAddress },
    {
      $set: {
        hasMintedToday: hasMinted,
        lastMintDate: today,
        updatedAt: new Date()
      }
    }
  );
}

// Reset daily mint status for all users (run daily)
export async function resetDailyMintStatus(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  await db.collection('gameScores').updateMany(
    { hasMintedToday: true },
    {
      $set: {
        hasMintedToday: false,
        updatedAt: new Date()
      }
    }
  );
}

// Game session management functions
const GAMES_PER_PERIOD = 5;
const PERIOD_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export async function canUserStartGame(userAddress: string, fid?: number): Promise<{
  canPlay: boolean;
  gamesPlayed: number;
  gamesRemaining: number;
  periodStartTime: number;
  periodEndTime: number;
  timeUntilReset: number;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const currentTime = Date.now();
  
  // Find user's current game session
  const gameSession = await db.collection('gameSessions').findOne({
    userAddress: userAddress.toLowerCase()
  });
  
  if (!gameSession) {
    // User has never played - can start a new period
    return {
      canPlay: true,
      gamesPlayed: 0,
      gamesRemaining: GAMES_PER_PERIOD,
      periodStartTime: 0,
      periodEndTime: 0,
      timeUntilReset: 0
    };
  }
  
  const periodStartTime = gameSession.periodStartTime;
  const periodEndTime = periodStartTime + PERIOD_DURATION;
  
  // Check if current period has expired
  if (currentTime >= periodEndTime) {
    // Period expired - user can start a new period
    return {
      canPlay: true,
      gamesPlayed: 0,
      gamesRemaining: GAMES_PER_PERIOD,
      periodStartTime: 0,
      periodEndTime: 0,
      timeUntilReset: 0
    };
  }
  
  // Check if user has games remaining in current period
  const gamesPlayed = gameSession.gamesPlayed;
  const gamesRemaining = GAMES_PER_PERIOD - gamesPlayed;
  const timeUntilReset = periodEndTime - currentTime;
  
  return {
    canPlay: gamesRemaining > 0,
    gamesPlayed,
    gamesRemaining,
    periodStartTime,
    periodEndTime,
    timeUntilReset
  };
}

export async function startUserGame(userAddress: string, fid?: number): Promise<{
  success: boolean;
  gamesPlayed: number;
  gamesRemaining: number;
  periodStartTime: number;
  periodEndTime: number;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const currentTime = Date.now();
  const userAddressLower = userAddress.toLowerCase();
  
  // Check if user can start a game
  const canPlay = await canUserStartGame(userAddress, fid);
  
  if (!canPlay.canPlay) {
    return {
      success: false,
      gamesPlayed: canPlay.gamesPlayed,
      gamesRemaining: canPlay.gamesRemaining,
      periodStartTime: canPlay.periodStartTime,
      periodEndTime: canPlay.periodEndTime
    };
  }
  
  // Find existing game session
  const existingSession = await db.collection('gameSessions').findOne({
    userAddress: userAddressLower
  });
  
  if (!existingSession || currentTime >= existingSession.periodStartTime + PERIOD_DURATION) {
    // Start new period
    const newSession: GameSession = {
      userAddress: userAddressLower,
      fid,
      periodStartTime: currentTime,
      gamesPlayed: 1,
      lastGameTime: currentTime,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('gameSessions').updateOne(
      { userAddress: userAddressLower },
      { $set: newSession },
      { upsert: true }
    );
    
    return {
      success: true,
      gamesPlayed: 1,
      gamesRemaining: GAMES_PER_PERIOD - 1,
      periodStartTime: currentTime,
      periodEndTime: currentTime + PERIOD_DURATION
    };
  }
  
  // Increment games played in current period
  const newGamesPlayed = existingSession.gamesPlayed + 1;
  
  await db.collection('gameSessions').updateOne(
    { userAddress: userAddressLower },
    {
      $set: {
        gamesPlayed: newGamesPlayed,
        lastGameTime: currentTime,
        updatedAt: new Date()
      }
    }
  );
  
  return {
    success: true,
    gamesPlayed: newGamesPlayed,
    gamesRemaining: GAMES_PER_PERIOD - newGamesPlayed,
    periodStartTime: existingSession.periodStartTime,
    periodEndTime: existingSession.periodStartTime + PERIOD_DURATION
  };
}

export async function getUserGameInfo(userAddress: string): Promise<{
  gamesPlayed: number;
  gamesRemaining: number;
  periodStartTime: number;
  periodEndTime: number;
  timeUntilReset: number;
  canPlay: boolean;
}> {
  const canPlay = await canUserStartGame(userAddress);
  
  return {
    gamesPlayed: canPlay.gamesPlayed,
    gamesRemaining: canPlay.gamesRemaining,
    periodStartTime: canPlay.periodStartTime,
    periodEndTime: canPlay.periodEndTime,
    timeUntilReset: canPlay.timeUntilReset,
    canPlay: canPlay.canPlay
  };
}

export async function resetExpiredGameSessions(): Promise<void> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const currentTime = Date.now();
  const expiredTime = currentTime - PERIOD_DURATION;
  
  // Find and update expired sessions
  await db.collection('gameSessions').updateMany(
    { periodStartTime: { $lt: expiredTime } },
    {
      $set: {
        gamesPlayed: 0,
        periodStartTime: 0,
        updatedAt: new Date()
      }
    }
  );
}

// Gift Box System Functions
const GIFT_BOXES_PER_DAY = 3;

export async function claimGiftBox(userAddress: string, fid?: number): Promise<{
  success: boolean;
  tokenType: 'degen' | 'noice' | 'pepe' | 'based' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  claimsToday: number;
  remainingClaims: number;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const userAddressLower = userAddress;
  
  // Check if user can claim
  const canClaim = await canUserClaimGiftBox(userAddress, fid);
  if (!canClaim.canClaim) {
    return {
      success: false,
      tokenType: 'none',
      amount: 0,
      claimsToday: canClaim.claimsToday,
      remainingClaims: canClaim.remainingClaims
    };
  }
  
  // Get user's best score for reward calculation
  let userBestScore = 0;
  if (fid) {
    try {
      const userGameData = await db.collection('gameScores').findOne(
        { fid: fid },
        { sort: { score: -1 } }
      );
      userBestScore = userGameData?.currentSeasonScore || 0;
      console.log(`🎯 User best score for gift box calculation: ${userBestScore.toLocaleString()}`);
    } catch (error) {
      console.log('⚠️ Error getting user score for gift box, using 0:', error);
      userBestScore = 0;
    }
  }
  
  // Generate reward based on user's score
  const reward = await generateGiftBoxReward(userBestScore);
  
  // Update gift box claims in gameScores collection
  const currentTime = Date.now();
  const lastGiftBoxUpdate = canClaim.lastClaimTime || 0;
  const claimsInPeriod = canClaim.claimsToday;
  
  console.log('🔍 Claiming gift box - Debug info:', {
    userAddress: userAddressLower,
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate,
    twelveHours: 12 * 60 * 60 * 1000
  });
  
  // Check if we need to reset the counter (12 hours passed)
  let newClaimsInPeriod = 1;
  let newLastGiftBoxUpdate = currentTime;
  
  if (lastGiftBoxUpdate === 0) {
    // First time claiming - start with 1
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🎯 First time claiming - starting with 1');
  } else if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, start new period
    newClaimsInPeriod = 1;
    newLastGiftBoxUpdate = currentTime;
    console.log('🔄 12 hours passed - resetting counter to 1');
  } else {
    // Continue in current period
    newClaimsInPeriod = claimsInPeriod + 1;
    newLastGiftBoxUpdate = currentTime; // Always update to current time when claiming
    console.log(`📈 Continuing period - incrementing from ${claimsInPeriod} to ${newClaimsInPeriod}`);
  }
  
  console.log('💾 Updating database with:', {
    userAddress: userAddressLower,
    newClaimsInPeriod,
    newLastGiftBoxUpdate
  });
  
  const updateResult = await db.collection('gameScores').updateOne(
    { fid: fid },
    {
      $set: {
        giftBoxClaimsInPeriod: newClaimsInPeriod,
        lastGiftBoxUpdate: newLastGiftBoxUpdate,
        updatedAt: new Date()
      },
      $inc: {
        totalRewardsClaimed: 1
      }
    },
    { upsert: true }
  );
  
  console.log('✅ Database update result:', {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    upsertedCount: updateResult.upsertedCount
  });
  
  // Store the claim
  const giftBoxClaim: GiftBoxClaim = {
    userAddress: userAddressLower,
    fid,
    tokenType: reward.tokenType,
    amount: reward.amount,
    timestamp: Date.now(),
    createdAt: new Date()
  };
  
  await db.collection('giftBoxClaims').insertOne(giftBoxClaim);
  
  // Generate signature for token reward (only if not "none")
  let signature: string | undefined;
  if (reward.tokenType !== 'none') {
    const { ethers } = await import('ethers');
    const serverPrivateKey = process.env.SERVER_PRIVATE_KEY;
    
    // Convert amount to wei (18 decimals)
    const amountInWei = convertToWei(reward.amount);
    
    console.log('Signature data:', {
      userAddress: userAddressLower,
      tokenAddress: getTokenAddress(reward.tokenType),
      amount: reward.amount,
      amountInWei: amountInWei
    });
    
    if (serverPrivateKey) {
      const wallet = new ethers.Wallet(serverPrivateKey);

      const packedData = ethers.solidityPacked(
        ["address", "address", "uint256"],
        [userAddressLower, getTokenAddress(reward.tokenType), amountInWei]
      );
      const messageHash = ethers.keccak256(packedData);
      
      signature = await wallet.signMessage(ethers.getBytes(messageHash));
    }
  }
  
  return {
    success: true,
    tokenType: reward.tokenType,
    amount: reward.amount,
    amountInWei: reward.tokenType !== 'none' ? convertToWei(reward.amount).toString() : '0',
    signature,
    claimsToday: newClaimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - newClaimsInPeriod)
  };
}

export async function canUserClaimGiftBox(userAddress: string, fid?: number): Promise<{
  canClaim: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const currentTime = Date.now();
  
  console.log('🔍 canUserClaimGiftBox - searching for user by FID:', fid);
  
  // Find user's game score record by FID (more reliable)
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  console.log('🔍 canUserClaimGiftBox - found userData:', {
    exists: !!userData,
    userAddress: userData?.userAddress,
    lastGiftBoxUpdate: userData?.lastGiftBoxUpdate,
    giftBoxClaimsInPeriod: userData?.giftBoxClaimsInPeriod
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can claim
    console.log('🔍 canUserClaimGiftBox - user not found, can claim');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  console.log('🔍 canUserClaimGiftBox - current values:', {
    lastGiftBoxUpdate,
    claimsInPeriod,
    currentTime,
    timeDiff: currentTime - lastGiftBoxUpdate
  });
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    console.log('🔍 canUserClaimGiftBox - 12 hours passed, resetting');
    return {
      canClaim: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canClaim = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  console.log('🔍 canUserClaimGiftBox - result:', {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod)
  });
  
  return {
    canClaim,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

// Function to check if user can see gift box (without incrementing count)
export async function canUserSeeGiftBox(userAddress: string, fid?: number): Promise<{
  canSee: boolean;
  claimsToday: number;
  remainingClaims: number;
  lastClaimTime?: number;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const currentTime = Date.now();
  
  // Find user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  if (!userData) {
    // User doesn't exist in gameScores, can see gift box
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: undefined
    };
  }
  
  // Check if last gift box claim was more than 12 hours ago
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    // 12 hours have passed, reset counter
    return {
      canSee: true,
      claimsToday: 0,
      remainingClaims: GIFT_BOXES_PER_DAY,
      lastClaimTime: lastGiftBoxUpdate
    };
  }
  
  // Check if user has claims remaining in current 12-hour period
  const canSee = claimsInPeriod < GIFT_BOXES_PER_DAY;
  
  return {
    canSee,
    claimsToday: claimsInPeriod,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod),
    lastClaimTime: lastGiftBoxUpdate
  };
}

export async function generateGiftBoxReward(score: number = 0): Promise<{
  tokenType: 'degen' | 'noice'  | 'pepe' | 'based' | 'none';
  amount: number;
}> {
  // Calculate "better luck next time" probability based on score
  let betterLuckProbability = 0.4; // Default 50
  
  const random = Math.random();
  
  if (random < betterLuckProbability) {
    console.log(`Gift Box: Better luck next time! (${(betterLuckProbability * 100).toFixed(1)}% chance) - Score: ${score.toLocaleString()}`);
    return { tokenType: 'none', amount: 0 };
  }
  
  // Remaining chance of getting a token (distributed equally among 4 tokens)
  const tokenRandom = Math.random();
  const tokenChance = (1 - betterLuckProbability) / 4; // Equal distribution among 4 tokens
  
  if (tokenRandom < tokenChance) {
    // DEGEN: 15% chance (0% to 15%)
    const degenAmount = 15 + Math.floor(Math.random() * 20);
    console.log(`Gift Box: DEGEN reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${degenAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'degen', amount: degenAmount };
  } else if (tokenRandom < tokenChance * 2) {
    // NOICE: 15% chance (15% to 30%)
    const noiceAmount = 80 + Math.floor(Math.random() * 100);
    console.log(`Gift Box: NOICE reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${noiceAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'noice', amount: noiceAmount };
  } else if (tokenRandom < tokenChance * 3) {
    // BASED: 15% chance (30% to 45%) - Range: 111,901 to 151,901
    const basedAmount = 111901 + Math.floor(Math.random() * 40001);
    console.log(`Gift Box: BASED reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${basedAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'based', amount: basedAmount };
  } else if (tokenRandom < tokenChance * 4) {
    // PEPE: 15% chance (45% to 60%)
    const pepeAmount = 1278702 + Math.floor(Math.random() * 2278702);
    console.log(`Gift Box: PEPE reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${pepeAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'pepe', amount: pepeAmount };
  } else {
    // Fallback (should never reach here, but just in case)
    console.log(`Gift Box: Fallback to BASED - tokenRandom: ${tokenRandom}, tokenChance: ${tokenChance}`);
    const pepeAmount = 1108002 + Math.floor(Math.random() * 1270702);
    console.log(`Gift Box: BASED reward! (${(tokenChance * 100).toFixed(1)}% chance) - Amount: ${pepeAmount.toLocaleString()} - Score: ${score.toLocaleString()}`);
    return { tokenType: 'pepe', amount: pepeAmount }; 
  }
}



function getTokenAddress(tokenType: 'degen' | 'noice'  | 'pepe' | 'based' | 'none'): string {
  // Token contract addresses - to be updated with actual addresses
  switch (tokenType) {
    case 'degen':
      return process.env.NEXT_PUBLIC_DEGEN_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
    case 'noice':
      return process.env.NEXT_PUBLIC_NOICE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
    case 'pepe':
      return process.env.NEXT_PUBLIC_PEPE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
    case 'based':
      return process.env.NEXT_PUBLIC_BASED_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
    case 'none':
      throw new Error('Cannot get token address for "none" type');
    default:
      throw new Error('Invalid token type');
  }
}

function convertToWei(amount: number): bigint {
  // Convert amount to 18 decimals (wei)
  return BigInt(Math.floor(amount * Math.pow(10, 18)));
}

// Add share bonus (+2 claims)
export async function addShareBonus(userAddress: string, fid?: number): Promise<{
  success: boolean;
  message: string;
  newRemainingClaims?: number;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const userAddressLower = userAddress.toLowerCase();
  const currentTime = Date.now();
  
  // Find user data
  let userData = await db.collection('gameScores').findOne({ 
    userAddress: userAddressLower 
  });

  if (!userData && fid) {
    userData = await db.collection('gameScores').findOne({ fid });
  }

  if (!userData) {
    return {
      success: false,
      message: 'User not found'
    };
  }

  // Check if user has already claimed share bonus in last 6 hours
  const lastShareBonus = userData.lastShareBonus || 0;
  const sixHours = 6 * 60 * 60 * 1000;
  
  if (currentTime - lastShareBonus < sixHours) {
    const timeRemaining = sixHours - (currentTime - lastShareBonus);
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
    return {
      success: false,
      message: `Share bonus already claimed. Try again in ${hoursRemaining} hours.`
    };
  }

  // Check current claims status
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  let claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  // Reset if 12 hours passed
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    claimsInPeriod = 0;
  }

  // Calculate new remaining claims (can't exceed 3)
  const currentRemaining = Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod);
  const newRemaining = Math.min(GIFT_BOXES_PER_DAY, currentRemaining + 2);
  const newClaimsInPeriod = GIFT_BOXES_PER_DAY - newRemaining;

  // Update user data
  await db.collection('gameScores').updateOne(
    { _id: userData._id },
    {
      $set: {
        giftBoxClaimsInPeriod: newClaimsInPeriod,
        lastShareBonus: currentTime,
        updatedAt: new Date()
      }
    }
  );

  console.log(`✅ Share bonus added for ${userAddressLower}: +2 claims, new remaining: ${newRemaining}`);

  return {
    success: true,
    message: 'Share bonus added! +2 gift box claims',
    newRemainingClaims: newRemaining
  };
}

// Add follow bonus (one-time)
export async function addFollowBonus(userAddress: string, fid?: number): Promise<{
  success: boolean;
  message: string;
  alreadyFollowed?: boolean;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const userAddressLower = userAddress.toLowerCase();
  
  // Find user data
  let userData = await db.collection('gameScores').findOne({ 
    userAddress: userAddressLower 
  });

  if (!userData && fid) {
    userData = await db.collection('gameScores').findOne({ fid });
  }

  if (!userData) {
    return {
      success: false,
      message: 'User not found'
    };
  }

  // Check if user has already claimed follow bonus
  if (userData.hasFollowed === true) {
    return {
      success: false,
      message: 'Follow bonus already claimed',
      alreadyFollowed: true
    };
  }

  // Mark user as followed
  await db.collection('gameScores').updateOne(
    { _id: userData._id },
    {
      $set: {
        hasFollowed: true,
        followedAt: new Date(),
        updatedAt: new Date()
      }
    }
  );

  console.log(`✅ Follow bonus recorded for ${userAddressLower}`);

  return {
    success: true,
    message: 'Thank you for following!'
  };
}

// Add basedNews collab bonus (6 hour cooldown)
export async function addBasedNewsBonus(userAddress: string, fid?: number): Promise<{
  success: boolean;
  message: string;
  newRemainingClaims?: number;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const userAddressLower = userAddress.toLowerCase();
  const currentTime = Date.now();
  
  // Find user data
  let userData = await db.collection('gameScores').findOne({ 
    userAddress: userAddressLower 
  });

  if (!userData && fid) {
    userData = await db.collection('gameScores').findOne({ fid });
  }

  if (!userData) {
    return {
      success: false,
      message: 'User not found'
    };
  }

  // Check if user has already claimed basedNews bonus in last 6 hours
  const lastBasedNewsBonus = userData.lastBasedNewsBonus || 0;
  const sixHours = 6 * 60 * 60 * 1000;
  
  if (currentTime - lastBasedNewsBonus < sixHours) {
    const timeRemaining = sixHours - (currentTime - lastBasedNewsBonus);
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
    return {
      success: false,
      message: `BasedNews bonus already claimed. Try again in ${hoursRemaining} hours.`
    };
  }

  // Check current claims status
  const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
  let claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
  
  // Reset if 12 hours passed
  if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
    claimsInPeriod = 0;
  }

  // Calculate new remaining claims (can't exceed 3)
  const currentRemaining = Math.max(0, GIFT_BOXES_PER_DAY - claimsInPeriod);
  const newRemaining = Math.min(GIFT_BOXES_PER_DAY, currentRemaining + 1);
  const newClaimsInPeriod = GIFT_BOXES_PER_DAY - newRemaining;

  // Update user data
  await db.collection('gameScores').updateOne(
    { _id: userData._id },
    {
      $set: {
        giftBoxClaimsInPeriod: newClaimsInPeriod,
        lastBasedNewsBonus: currentTime,
        updatedAt: new Date()
      }
    }
  );

  console.log(`✅ BasedNews collab bonus added for ${userAddressLower}: +1 claim, new remaining: ${newRemaining}`);

  return {
    success: true,
    message: 'BasedNews bonus added! +1 gift box claim',
    newRemainingClaims: newRemaining
  };
}

export async function getUserGiftBoxStats(userAddress: string, fid?: number): Promise<{
  totalClaims: number;
  totalDegen: number;
  totalNoice: number;
  totalPepe: number;
  claimsToday: number;
  remainingClaims: number;
  totalRewardsClaimed: number;
  lastGiftBoxUpdate: number | null;
}> {
  const client = await clientPromise;
  const db = client.db('basejump');
  
  const userAddressLower = userAddress.toLowerCase();
  const currentTime = Date.now();
  
  // Get user's game score record by FID
  const userData = await db.collection('gameScores').findOne({
    fid: fid
  });
  
  // Get current period claims
  let claimsToday = 0;
  if (userData) {
    const lastGiftBoxUpdate = userData.lastGiftBoxUpdate || 0;
    const claimsInPeriod = userData.giftBoxClaimsInPeriod || 0;
    
    // Check if 12 hours have passed since last update
    if (currentTime >= lastGiftBoxUpdate + (12 * 60 * 60 * 1000)) {
      claimsToday = 0; // Reset if 12 hours passed
    } else {
      claimsToday = claimsInPeriod;
    }
  }
  
  // Get all-time stats from giftBoxClaims collection
  const allClaims = await db.collection('giftBoxClaims').find({
    userAddress: userAddressLower
  }).toArray();
  
  let totalDegen = 0;
  let totalNoice = 0;
  let totalPepe = 0;
  
  allClaims.forEach(claim => {
    if (claim.tokenType === 'degen') totalDegen += claim.amount;
    else if (claim.tokenType === 'noice') totalNoice += claim.amount;
    else if (claim.tokenType === 'pepe') totalPepe += claim.amount;
  });
  
  return {
    totalClaims: allClaims.length,
    totalDegen,
    totalNoice,
    totalPepe,
    claimsToday,
    remainingClaims: Math.max(0, GIFT_BOXES_PER_DAY - claimsToday),
    totalRewardsClaimed: userData?.totalRewardsClaimed || 0,
    lastGiftBoxUpdate: userData?.lastGiftBoxUpdate || null
  };
} 