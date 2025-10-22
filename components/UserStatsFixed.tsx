'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWallet, 
  faCopy, 
  faUser, 
  faBullseye, 
  faCoins, 
  faCalendarDay,
  faTrophy,
  faHistory,
  faChartLine,
  faCheckCircle,
  faExternalLinkAlt,
  faRefresh,
  faShare,
  faRocket
} from '@fortawesome/free-solid-svg-icons';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { getAverageScore, getBestScore, getTotalGamesFromScores } from '@/lib/game-counter';
import { APP_URL } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';


interface UserStats {
  userAddress: string;
  dailyMintCount: number;
  mintHistory: Array<{
    score: number;
    timestamp: number;
    trait?: string;
    tokenId?: number;
  }>;
  topScores: Array<{
    userAddress: string;
    score: number;
    timestamp: number;
  }>;
  dailyMintsRemaining: number;
  totalGamesPlayed?: number;
  averageScore?: number;
  bestScore?: number;
  totalNFTsMinted?: number;
  currentSeasonScore?: number | null;
  ath?: number | null;
  level?: number | null;
  hasMintedToday?: boolean;
  nftsByTrait?: {
    common: number;
    epic: number;
    rare: number;
    legendary: number;
  };
  giftBoxStats?: {
    totalClaims: number;
    totalArb: number;
    totalPepe: number;
    totalBoop: number;
    claimsToday: number;
    remainingClaims: number;
    totalRewardsClaimed: number;
  };
}

export default function UserStats() {
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ethBalance, setEthBalance] = useState<string>('0.00');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [localBestScore, setLocalBestScore] = useState<number | null>(null);
  const [localGamesPlayed, setLocalGamesPlayed] = useState<number>(0);
  const [localAverageScore, setLocalAverageScore] = useState<number>(0);
  const [localBestFromScores, setLocalBestFromScores] = useState<number>(0);
  const [totalGamesFromScores, setTotalGamesFromScores] = useState<number>(0);
  const [sharing, setSharing] = useState(false);

  // Memoized star and shooting star data for stable animation
  const starData = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const size = Math.random() * 6 + 3;
      const starColor = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffff88' : '#88ccff';
      return {
        size,
        color: starColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.6 + 0.2,
        textShadow: `0 0 ${size/2}px ${starColor}`,
      };
    }),
    []
  );
  const shootingStarData = useMemo(() =>
    Array.from({ length: 2 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      animation: `shoot ${Math.random() * 20 + 15}s linear infinite`,
      animationDelay: `${Math.random() * 15}s`,
    })),
    []
  );

  // Get best score from localStorage
  const getBestScoreFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedScore = localStorage.getItem('candyBestScore');
      if (storedScore) {
        const score = parseInt(storedScore, 10);
        if (!isNaN(score) && score > 0) {
          setLocalBestScore(score);
          return;
        }
      }
    }
    setLocalBestScore(null);
  };

  // Get games played count from localStorage
  const getGamesPlayedFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedCount = localStorage.getItem('candyGamesPlayed');
      if (storedCount) {
        const count = parseInt(storedCount, 10);
        if (!isNaN(count) && count >= 0) {
          setLocalGamesPlayed(count);
          return;
        }
      }
    }
    setLocalGamesPlayed(0);
  };

  // Get calculated stats from scores
  const getCalculatedStats = () => {
    setLocalAverageScore(getAverageScore());
    setLocalBestFromScores(getBestScore());
    setTotalGamesFromScores(getTotalGamesFromScores());
  };

  // Share stats function using Farcaster ComposerCast
  const shareStats = async () => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    setSharing(true);
    try {
      // Build the stats message
      const shareStats = [];
      
      // Add Rewards Claimed count
      const totalRewards = stats?.giftBoxStats?.totalRewardsClaimed || 0;
      if (totalRewards > 0) {
        shareStats.push(`🎁 ${totalRewards} Rewards Claimed`);
      }
      
      // Add games played
      if (localGamesPlayed > 0) {
        shareStats.push(`🎮 ${localGamesPlayed} Games`);
      }
      
      // Add best score
      const bestScore = Math.max(localBestScore || 0, localBestFromScores);
      if (bestScore > 0) {
        shareStats.push(`🏆 ${bestScore.toLocaleString()} Best Score`);
      }
      
      // Add average score
      if (localAverageScore > 0) {
        shareStats.push(`📊 ${localAverageScore.toLocaleString()} Avg Score`);
      }
      
   
       

      // Create the share message
      const statsText = shareStats.length > 0 ? shareStats.join(' • ') : 'Just started playing!';
      const username = context?.user?.username || 'Base Jump Player';
      
      const shareMessage =  `just CRUSHED it on Base Jump! 💪\n\n${statsText}\n\n🔥 Y'all think you can beat these stats? I'm waiting... 👀\n Drop your best score below and let's see who's really built different!\n\n#BaseJump`;
      
      await actions.composeCast({
        text: shareMessage,
        embeds: [APP_URL || "https://chain-crush-black.vercel.app/"]
      });
      
    } catch (error) {
      console.error('Failed to share stats:', error);
    } finally {
      setSharing(false);
    }
  };



  // Helper function to copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Fetch ETH balance using ethers.js
  const fetchEthBalance = async () => {
    if (!address) return;
    setBalanceLoading(true);
    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      // Format to 4 decimal places
      const roundedBalance = parseFloat(formattedBalance).toFixed(4);
      setEthBalance(roundedBalance);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      setEthBalance('Error');
    } finally {
      setBalanceLoading(false);
    }
  };


  // Fetch user stats function
  const fetchStats = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const fid = context?.user?.fid;
      const [statsResponse, giftBoxResponse, giftBoxCheckResponse] = await Promise.all([
        fetch(`/api/user-stats?userAddress=${address}`),
        fetch(`/api/claim-gift-box?userAddress=${address}&fid=${fid}&stats=true`),
        fetch(`/api/claim-gift-box?userAddress=${address}&fid=${fid}`)
      ]);
      
      const statsResult = await statsResponse.json();
      const giftBoxResult = await giftBoxResponse.json();
      const giftBoxCheck = await giftBoxCheckResponse.json();
      
      console.log('Gift box check result:', giftBoxCheck);
      
      if (statsResult.success) {
        const data = statsResult.data;
        const correctedRemaining = Math.max(0, 5 - (data.dailyMintCount || 0));
        
        // Get gift box stats from the response
        const giftBoxStats = giftBoxResult.success ? giftBoxResult.stats : null;
        
        // Update gift box stats with current remaining claims
        if (giftBoxStats && giftBoxCheck.success) {
          giftBoxStats.claimsToday = giftBoxCheck.claimsToday || 0;
          giftBoxStats.remainingClaims = giftBoxCheck.remainingClaims || 5;
        }
        
        setStats({
          ...data,
          dailyMintsRemaining: correctedRemaining,
          giftBoxStats
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchEthBalance()
    ]);
    getBestScoreFromStorage(); // This is synchronous, so no need to await
    getGamesPlayedFromStorage(); // This is synchronous, so no need to await
    getCalculatedStats(); // This is synchronous, so no need to await
    setRefreshing(false);
  };

  useEffect(() => {
    if (address) {
      fetchStats();
      fetchEthBalance();
    }
    // Always get best score and games played from localStorage regardless of wallet connection
    getBestScoreFromStorage();
    getGamesPlayedFromStorage();
    getCalculatedStats();
  }, [address]);

  // Listen for localStorage changes to update best score and games played in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'candyBestScore') {
        getBestScoreFromStorage();
      } else if (e.key === 'candyGamesPlayed') {
        getGamesPlayedFromStorage();
      } else if (e.key === 'candyGameScores') {
        getCalculatedStats();
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case the values are updated in the same tab
    const interval = setInterval(() => {
      getBestScoreFromStorage();
      getGamesPlayedFromStorage();
      getCalculatedStats();
    }, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-gray-800">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view your stats</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          {starData.map((star, i) => (
            <div
              key={i}
              className="star absolute"
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                color: star.color,
                fontSize: `${star.size}px`,
                lineHeight: '1',
                animation: star.animation,
                animationDelay: star.animationDelay,
                opacity: star.opacity,
                textShadow: star.textShadow,
                pointerEvents: 'none'
              }}
            >
              ★
            </div>
          ))}
        </div>
        <div className="relative z-10 px-6 pb-24 pt-12">
          <div className="text-center">
            <div className="text-6xl mb-4 text-white">⏳</div>
            <h2 className="text-2xl font-bold text-white">Loading Your Stats...</h2>
            <p className="text-white/70">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800">No Stats Available</h2>
          <p className="text-gray-600">Start playing to generate your statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #001122 0%, #f9f7f4 100%)' }}>
      {/* Animated Stars Background - Same as home page */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Stars */}
        {starData.map((star, i) => (
          <div
            key={i}
            className="star absolute"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              color: star.color,
              fontSize: `${star.size}px`,
              lineHeight: '1',
              animation: star.animation,
              animationDelay: star.animationDelay,
              opacity: star.opacity,
              textShadow: star.textShadow,
              pointerEvents: 'none'
            }}
          >
            ★
          </div>
        ))}
        
        {/* Shooting Stars */}
        {shootingStarData.map((shoot, i) => (
          <div
            key={`shooting-${i}`}
            className="shooting-star absolute"
            style={{
              left: shoot.left,
              top: shoot.top,
              width: '12px',
              height: '12px',
              color: '#ffffff',
              fontSize: '12px',
              lineHeight: '1',
              animation: shoot.animation,
              animationDelay: shoot.animationDelay,
              opacity: 0.9,
              textShadow: '0 0 8px #ffffff',
              pointerEvents: 'none'
            }}
          >
            ★
          </div>
        ))}
      </div>
      
      <div className="relative z-10 px-6 pb-24">
        {/* Header with User Profile */}
        <motion.div 
          className="pt-12 pb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring" }}
        >
          <div className="flex items-center mb-8">
            <motion.div
              className="relative mr-4"
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <div className="w-20 h-20 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#0088FF] rounded-xl blur-lg opacity-40 animate-pulse"></div>
                {context?.user?.pfpUrl ? (
                  <img 
                    src={context.user.pfpUrl} 
                    alt="Profile" 
                    className="relative w-20 h-20 rounded-xl shadow-lg border-2 border-[#00FFAA]/30 object-cover"
                  />
                ) : (
                  <div className="relative w-20 h-20 rounded-xl shadow-lg border-2 border-[#00FFAA]/30 bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-2xl text-white" />
                  </div>
                )}
              </div>
            </motion.div>
            
            <div className="flex-grow">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-2">
                Player <span className="text-[#00FFAA]">Analytics</span>
              </h1>
              <p className="text-lg text-white/70 font-light mb-4">
                Welcome back, <span className="text-[#00FFAA] font-normal">{context?.user?.username || 'Player'}</span>
              </p>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={refreshData}
                  disabled={refreshing}
                  className="bg-transparent text-[#00FFAA] font-medium py-2 px-4 border border-[#00FFAA]/30 flex items-center space-x-2 hover:bg-[#00FFAA]/10 transition-all duration-300"
                  whileHover={{ backgroundColor: "rgba(0, 255, 170, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FontAwesomeIcon icon={faRefresh} className={`${refreshing ? 'animate-spin' : ''} text-sm`} />
                  <span className="text-sm">{refreshing ? 'REFRESHING...' : 'REFRESH'}</span>
                </motion.button>
                
                <motion.button
                  onClick={shareStats}
                  disabled={sharing}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium py-2 px-4 flex items-center space-x-2 hover:from-purple-700 hover:to-pink-600 transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none">
                    <rect width="256" height="256" rx="56" fill="#7C65C1"></rect>
                    <path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path>
                  </svg>
                  <span className="text-sm">{sharing ? 'SHARING...' : 'SHARE'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <StatsCard 
            icon={faCoins} 
            title="Rewards Claimed" 
            value={stats.giftBoxStats?.totalRewardsClaimed?.toString() || '0'} 
            trend="TOTAL" 
          />
          <StatsCard 
            icon={faTrophy} 
            title="Best Score" 
            value={Math.max(localBestScore || 0, localBestFromScores).toLocaleString() || '0'} 
            trend="HIGH" 
          />
          <StatsCard 
            icon={faChartLine} 
            title="Games Played" 
            value={localGamesPlayed.toString()} 
            trend="COUNT" 
          />
          <StatsCard 
            icon={faRocket} 
            title="Average Score" 
            value={localAverageScore.toLocaleString() || '0'} 
            trend="AVG" 
          />
        </motion.div>

        {/* Gift Box Stats */}
        {stats.giftBoxStats && (
          <motion.div 
            className="border border-[#00FFAA]/40 backdrop-blur-sm p-6 text-white mb-8"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 border border-[#00FFAA] flex items-center justify-center mr-4">
                <span className="text-[#00FFAA] text-xl">🎁</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-[#00FFAA] uppercase tracking-wider">Daily Gift Box Status</h3>
                <div className="h-[1px] w-full bg-gradient-to-r from-[#00FFAA]/50 to-transparent mt-1"></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 border border-[#00FFAA]/20 bg-black/10">
                <div className="w-8 h-8 mx-auto mb-1">
                  <img src="/candy/1.png" alt="ARB" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-[#00FFAA]">ARB</p>
                <p className="text-lg font-bold text-white">{stats.giftBoxStats.totalArb.toFixed(2)}</p>
              </div>
              <div className="text-center p-3 border border-[#00FFAA]/20 bg-black/10">
                <div className="w-8 h-8 mx-auto mb-1">
                  <img src="/candy/2.png" alt="PEPE" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-[#00FFAA]">PEPE</p>
                <p className="text-lg font-bold text-white">{stats.giftBoxStats.totalPepe.toLocaleString()}</p>
              </div>
              <div className="text-center p-3 border border-[#00FFAA]/20 bg-black/10">
                <div className="w-8 h-8 mx-auto mb-1">
                  <img src="/candy/player.png" alt="BOOP" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-[#00FFAA]">BOOP</p>
                <p className="text-lg font-bold text-white">{stats.giftBoxStats.totalBoop.toLocaleString()}</p>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-10 h-[1px] bg-[#00FFAA]/30" />
            <div className="absolute top-0 right-0 h-10 w-[1px] bg-[#00FFAA]/30" />
          </motion.div>
        )}

      {/* Same animations as home page */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.2;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes shoot {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100vw) translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
      </div>
    </div>
  );
}

// Stats Card Component (same as home page)
const StatsCard = ({ icon, title, value, trend }: {
  icon: any;
  title: string;
  value: string;
  trend: string;
}) => (
  <motion.div
    className="relative overflow-hidden border border-[#00FFAA]/30 bg-black/20 p-4 text-white backdrop-blur-sm"
    whileHover={{ borderColor: "rgba(0, 255, 170, 0.5)", backgroundColor: "rgba(0, 255, 170, 0.05)" }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 border border-[#00FFAA] flex items-center justify-center">
          <FontAwesomeIcon icon={icon} className="text-[#00FFAA] text-sm" />
        </div>
        <span className="text-xs font-medium text-[#00FFAA] uppercase tracking-wider">
          {trend}
        </span>
      </div>
      <div className="text-2xl font-light mb-1 text-white">{value}</div>
      <div className="text-xs text-white/60 uppercase tracking-wider">{title}</div>
    </div>
    <div className="absolute -bottom-1 -right-1 w-12 h-[1px] bg-[#00FFAA]/30" />
    <div className="absolute -bottom-1 -right-1 h-12 w-[1px] bg-[#00FFAA]/30" />
  </motion.div>
);
