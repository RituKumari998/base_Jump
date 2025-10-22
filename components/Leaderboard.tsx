'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy, faMedal, faAward, faInfoCircle, faCoins, faShare, 
  faUser, faPalette, faGift, faDollarSign, faClock, faFlag, faGamepad 
} from '@fortawesome/free-solid-svg-icons';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { APP_URL } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';


interface LeaderboardEntry {
  fid: number;
  pfpUrl: string;
  username?: string;
  score: number; // All-time high (ATH) - only updated when beaten
  currentSeasonScore?: number; // Current season score - updated every game
  level: number;
  timestamp: number;
  duration?: number; // Game duration in seconds
  nftMinted?: boolean;
  nftName?: string;
  nftCount?: number;
  totalRewardsClaimed?: number; // Total gift box rewards claimed
}

export default function Leaderboard() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const { context, actions } = useMiniAppContext();
  const [userInfo, setUserInfo] = useState<LeaderboardEntry | null>(null);
  const [showRewardInfo, setShowRewardInfo] = useState(false);
  // New timer states
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number }>({ days: 0, hours: 0 });
  const [timerLoading, setTimerLoading] = useState<boolean>(false);
  const [timer, setTimer] = useState<number | null>(null); // Unix seconds

  // Reward pool (ARB)
  const POOL_ARB = 100; // 100 ARB total pool
  const poolDisplay = `${POOL_ARB} $ARB Pool`;
  // Top 10 distribution: 1st, 2nd, 3rd distinct; 4–6 equal; 7–8 equal; 9–10 equal (sums to 100)
  const DISTRIBUTION = [20, 18, 15, 9, 9, 9, 6, 6, 4, 4];
  const distributionAmounts = DISTRIBUTION.map((pct) => (POOL_ARB * pct) / 100);
  const firstAmt = distributionAmounts[0];
  const secondAmt = distributionAmounts[1];
  const thirdAmt = distributionAmounts[2];
  const per4to6 = distributionAmounts[3];
  const per7to8 = distributionAmounts[6];
  const per9to10 = distributionAmounts[8];

  // Memoized star and shooting star data for stable animation
  const starData = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => {
      const size = Math.random() * 4 + 2;
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
    Array.from({ length: 3 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      animation: `shoot ${Math.random() * 20 + 15}s linear infinite`,
      animationDelay: `${Math.random() * 15}s`,
    })),
    []
  );

  // Initial fetch and load more function
  const fetchLeaderboard = async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setOffset(0);
      setLeaderboard([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = isInitial ? 0 : offset;
      const response = await fetch(`/api/game-leaderboard?limit=50&offset=${currentOffset}`);
      const result = await response.json();
      
      if (result.success) {
        const newData = result.data.leaderboard;
        
        if (isInitial) {
          setLeaderboard(newData);
        } else {
          // Deduplicate by fid when adding new data to prevent duplicates
          setLeaderboard(prev => {
            const existingFids = new Set(prev.map(entry => entry.fid));
            const uniqueNewData = newData.filter((entry: LeaderboardEntry) => !existingFids.has(entry.fid));
            
            // Debug logging
            if (newData.length !== uniqueNewData.length) {
              console.log(`Frontend deduplication: removed ${newData.length - uniqueNewData.length} duplicates`);
            }
            
            return [...prev, ...uniqueNewData];
          });
        }
        
        setHasMore(result.data.hasMore);
        setOffset(currentOffset + 50);
        setTotalPlayers(result.data.total);
      } else {
        console.error('Failed to fetch leaderboard:', result.error);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Fetch user's specific info and rank
  const fetchUserInfo = async () => {
    if (!context?.user?.fid) return;
    
    try {
      // Get all leaderboard data to find user's position
      const response = await fetch('/api/game-leaderboard?limit=1000');
      const result = await response.json();
      
      if (result.success) {
        const allPlayers = result.data.leaderboard;
        const userIndex = allPlayers.findIndex((player: LeaderboardEntry) => player.fid === context.user.fid);
        
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
          setUserInfo(allPlayers[userIndex]);
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard(true);
    fetchUserInfo();
  }, [context?.user?.fid]);

  // Fallback shows 0d 0h when no timer is available
 

  // Set timer to the provided timestamp
  useEffect(() => {
    setTimerLoading(true);
    // Use the provided timestamp: 1757497572
    setTimer(1757497572);
    setTimerLoading(false);
  }, []);

  // Drive timeLeft from API timer when present
  useEffect(() => {
    if (!timer) return;
    const target = Number(timer) * 1000; // convert to ms
    const update = () => {
      const now = Date.now();
      let diff = target - now;
      if (diff < 0) diff = 0;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft({ days, hours });
    };
    update();
    const interval = setInterval(update, 60 * 1000); // update every minute
    return () => clearInterval(interval);
  }, [timer]);

  // Infinite scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Trigger load more when user is 200px from bottom
      if (scrollTop + windowHeight >= documentHeight - 200) {
        fetchLeaderboard(false);
      }
    };

    const throttledScroll = throttle(handleScroll, 200);
    window.addEventListener('scroll', throttledScroll);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [loadingMore, hasMore, offset]);

  // Simple throttle function
  const throttle = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    return function (...args: any[]) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  };

  const displayTime = timerLoading ? '...' : `${timeLeft.days}D ${timeLeft.hours}H`;

  // Get reward amount for each rank
  const getRewardAmount = (rank: number) => {
    if (rank >= 10) return 0;
    return distributionAmounts[rank];
  };

  // Format reward amount for display
  const formatReward = (amount: number) => {
    if (!amount || isNaN(amount)) return '0';
    // For ARB amounts, show decimal places
    return amount.toFixed(1);
  };

  // Format duration for display
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Share user's leaderboard position
  const handleShareUserInfo = async () => {
    if (!userInfo || !userRank) return;
    
    try {
          const isRewardEligible = userRank <= 10 && userInfo.nftCount && userInfo.nftCount > 0;
    const rewardText = isRewardEligible
    ? `\n💰 Loot Secured: ${formatReward(getRewardAmount(userRank - 1))} $ARB`
    : '';
    
    const giftBoxText = userInfo.totalRewardsClaimed && userInfo.totalRewardsClaimed > 0 
      ? `\n🎁 Gift Boxes Won: ${userInfo.totalRewardsClaimed}`
      : '';

    await actions?.composeCast({
      text: `Just locked in Rank #${userRank} on Base Jump!\n\nCurrent Season: ${(userInfo.currentSeasonScore || userInfo.score || 0).toLocaleString()}\nAll-Time High: ${(userInfo.score || 0).toLocaleString()}\nTime: ${formatDuration(userInfo.duration)}${giftBoxText}${rewardText}\n\nThink you can beat me? Pull up and prove it!`,
      embeds: [APP_URL || ""]
    });
    
    } catch (error) {
      console.error('Failed to share user info:', error);
    }
  };

  // Dynamic colors for top 10 ranks
  const getRankColors = (rank: number) => {
    const colors = [
      // 1st - Gold
      { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600', border: 'border-yellow-500', text: 'text-yellow-900' },
      // 2nd - Silver  
      { bg: 'bg-gradient-to-r from-gray-300 to-gray-500', border: 'border-gray-400', text: 'text-gray-900' },
      // 3rd - Bronze
      { bg: 'bg-gradient-to-r from-orange-400 to-orange-600', border: 'border-orange-500', text: 'text-orange-900' },
      // 4th - Purple
      { bg: 'bg-gradient-to-r from-purple-400 to-purple-600', border: 'border-purple-500', text: 'text-white' },
      // 5th - Pink
      { bg: 'bg-gradient-to-r from-pink-400 to-pink-600', border: 'border-pink-500', text: 'text-white' },
      // 6th - Indigo
      { bg: 'bg-gradient-to-r from-indigo-400 to-indigo-600', border: 'border-indigo-500', text: 'text-white' },
      // 7th - Green
      { bg: 'bg-gradient-to-r from-green-400 to-green-600', border: 'border-green-500', text: 'text-white' },
      // 8th - Teal
      { bg: 'bg-gradient-to-r from-teal-400 to-teal-600', border: 'border-teal-500', text: 'text-white' },
      // 9th - Cyan
      { bg: 'bg-gradient-to-r from-cyan-400 to-cyan-600', border: 'border-cyan-500', text: 'text-white' },
      // 10th - Rose
      { bg: 'bg-gradient-to-r from-rose-400 to-rose-600', border: 'border-rose-500', text: 'text-white' }
    ];
    
    return colors[rank] || { bg: 'bg-gradient-to-r from-[#19adff] to-[#28374d]', border: 'border-[#19adff]', text: 'text-white' };
  };

  if (loading) {
    return (
      <div className="px-10" style={{scale:"1.1",marginTop:"80px"}}>
        {/* Reward Countdown Skeleton */}
        <div className="mb-6" style={{width:"100%"}}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '12px 20px',
              // width: '110%',
              // marginLeft: "-5%",
              marginTop: "15px",
              border: '2px solid rgba(59, 130, 246, 0.3)'
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center" style={{ gap: '12px' }}>
              <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
              <div>
                <div className="w-24 h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
                <div className="w-32 h-3 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
            {/* <div className="text-right">
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div> */}
          </div>
        </div>

        {/* User Info Section Skeleton */}
        <div className="mb-4 rounded-xl border border-[#8BC34A] bg-white/95 backdrop-blur-sm shadow-md overflow-hidden">
          <div className="flex items-center w-full justify-between px-3 py-2 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] border-b border-[#8BC34A]/20">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-white/20 rounded animate-pulse"></div>
              <div className="w-8 h-4 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="w-16 h-6 bg-white/20 rounded animate-pulse"></div>
          </div>
          
          <div className="flex items-center p-3 space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-24 h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="w-16 h-5 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Skeleton */}
        <div className="rounded-2xl p-2 shadow-lg w-full">
          <div className="space-y-3">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="flex items-center px-4 py-2 rounded-xl border bg-gradient-to-r from-gray-100 to-gray-200">
                {/* Profile Picture with Rank Badge */}
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gray-300 animate-pulse"></div>
                  </div>
                  
                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="w-24 h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="w-20 h-3 bg-gray-200 rounded mb-1 animate-pulse"></div>
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="w-16 h-6 bg-gray-200 rounded mb-1 animate-pulse"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 relative overflow-hidden" >
      {/* Background is now handled by the parent component */}

      <div className="relative z-10 max-w-4xl mx-auto">
      
      {/* Top 5 Players Banner */}
      <div className="mb-6">
        <div
          style={{
            background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginTop: '15px',
            border: '2px solid rgba(59, 130, 246, 0.3)'
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            {/* Degen Icon */}
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-lg font-bold">$</span>
            </div>
            <div>
              <div className="text-white text-lg font-bold" style={{ fontFamily: 'var(--font-fredoka-one)' }}>
                Win Up To 3200 DEGEN
              </div>
              <div className="text-white text-sm opacity-90">
                Top 5 players from leaderboard gets share of 3200 DEGEN!
              </div>
            </div>
          </div>
          {/* Timer */}
         
        </div>
      </div>
     
      {/* User Info Section */}
      {userInfo && userRank && (
        <div className="mb-4 rounded-xl border border-[#19adff] bg-white/95 backdrop-blur-sm shadow-md overflow-hidden">
          {/* Compact Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] border-b border-[#8BC34A]/20">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faUser} className="text-white" />
              <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-fredoka-one)' }}>Your Rank</span>
              <div className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-bold">
                #{userRank}
              </div>
            </div>
            <button
              onClick={handleShareUserInfo}
              className="relative overflow-hidden group flex items-center space-x-1 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] text-white px-3 py-1 rounded-2xl shadow-md transition-all duration-200 hover:translate-y-[-2px]"
            >
              <FontAwesomeIcon icon={faShare} className="text-xs" />
              <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-fredoka-one)' }}>Share</span>
              <span className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
          </div>
          
          {/* Compact User Info */}
          <div className="flex items-center p-3 space-x-3">
            {/* Avatar with Rank Badge */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#19adff]/30">
                <img 
                  src={userInfo.pfpUrl} 
                  alt={`User ${userInfo.fid}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
           
           {/* User Details */}
           <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-bold text-[#19adff] text-lg mb-3 truncate">
                   {userInfo.username || context?.user?.username || `User ${userInfo.fid}`}
                 </p>
                 <div className="flex items-center space-x-2 text-xs text-gray-600">
                
                  
                 
                 </div>
               </div>
               
               {/* Score & Level */}
               <div className="text-right">
                 <p className="text-lg font-bold text-[#19adff]">{(userInfo.currentSeasonScore || userInfo.score || 0).toLocaleString()}</p>
                 
             
              {userInfo.duration && userInfo.duration != 0 &&   <p className="text-xs text-gray-500 flex items-center gap-1"><FontAwesomeIcon icon={faClock} /> {formatDuration(userInfo.duration)}</p>}
               </div>
             </div>
             
             {/* Reward Info */}
            
           </div>
         </div>
       </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-2xl p-4 md:p-6 w-full">
       

              {/* Stats */}
       {/* <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
         <div className="flex items-center space-x-3 mb-4">
           <div className="text-2xl">📊</div>
           <h3 className="text-xl font-bold text-[#19adff]">Leaderboard Stats</h3>
         </div>
         <div className="grid grid-cols-2 gap-4">
           <div className="text-center">
             <p className="text-2xl font-bold text-[#19adff]">{totalPlayers}</p>
             <p className="text-sm text-[#28374d]">Total Players</p>
           </div>
           <div className="text-center">
             <p className="text-2xl font-bold text-[#19adff]">
                               {leaderboard.length > 0 ? (leaderboard[0].score || 0).toLocaleString() : '0'}
             </p>
             <p className="text-sm text-[#28374d]">Highest Score</p>
           </div>
         </div>
       </div> */}
        
        {leaderboard.length === 0 && !loading ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faGamepad} className="text-4xl mb-3 text-gray-400" />
            <p className="text-gray-500 font-medium">No scores yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rankColors = index < 10 && entry.nftCount && entry.nftCount > 0 
                ? getRankColors(index) 
                : getRankColors(99); // Default colors for non-top-10
              
              return (
              <div key={entry.fid} className={`flex items-center px-4 py-2 rounded-xl border ${rankColors.bg} ${rankColors.border}`}>
                {/* Rank */}
              

                                 {/* Profile Picture with Rank Badge */}
                 <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={async()=>{
                    await actions?.viewProfile({fid:entry.fid});
                   }}>
                   <div className="relative" >
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#19adff]">
                       <img 
                         src={entry.pfpUrl} 
                         alt={`FID ${entry.fid}`}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRkYwQjMiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkY2OUI0Ij4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPgo8cGF0aCBkPSJNMTIgNmMtMy4zMSAwLTYgMi42OS02IDZzMi42OSA2IDYgNiA2LTIuNjkgNi02LTIuNjktNi02LTZ6bTAgMTBjLTIuMjEgMC00LTEuNzktNC00czEuNzktNCA0LTQgNCAxLjc5IDQgNC0xLjc5IDQtNCA0eiIvPgo8L3N2Zz4KPC9zdmc+';
                         }}
                       />
                     </div>
                     
                     {/* Rank Badge */}
                     <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                       {index === 0 && (
                         <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white">
                           <FontAwesomeIcon icon={faTrophy} className="text-xs" />
                         </div>
                       )}
                       {index === 1 && (
                         <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white">
                           <FontAwesomeIcon icon={faMedal} className="text-xs" />
                         </div>
                       )}
                       {index === 2 && (
                         <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-yellow-600 rounded-full flex items-center justify-center text-white">
                           <FontAwesomeIcon icon={faAward} className="text-xs" />
                         </div>
                       )}
                       {index > 2 && (
                         <div className="w-8 h-8 p-1 bg-white text-[#19adff] rounded-full flex items-center justify-center font-bold">
                           #{index + 1}
                         </div>
                       )}
                     </div>
                   </div>
                  
                  {/* Player Info */}
                  <div className="flex-1">
                    <p className={`font-bold mb-3 text-lg ${rankColors.text}`}>
                      {entry.username || `${entry.fid}`}
                    </p>
                   
                    {entry.nftCount && entry.nftCount > 0 ? (
                      <p className={`text-xs ${index < 10 && entry.nftCount > 0 ? 'text-yellow-300' : rankColors.text} font-medium flex items-center gap-1`}>
                        <FontAwesomeIcon icon={faPalette} /> {entry.nftCount} NFT{entry.nftCount > 1 ? 's' : ''}
                      </p>
                    ) : (
                      ""
                    )}
                    {/* Total Rewards Claimed */}
                    {entry.totalRewardsClaimed && entry.totalRewardsClaimed > 0 ? (
                      <p className={`text-xs ${rankColors.text} font-medium opacity-80 flex items-center gap-1`}>
                        <FontAwesomeIcon icon={faGift} /> {entry.totalRewardsClaimed} Gift Box{entry.totalRewardsClaimed > 1 ? 'es' : ''} Won
                      </p>
                    ) : (
                      ""
                    )}
                    {/* Reward Amount for Top 10 NFT Holders */}
                    {index < 10 && entry.nftCount && entry.nftCount > 0 && (
                      <p className={`text-xs ${index < 3 ? 'text-green-800' : 'text-green-300'} font-bold flex items-center gap-1`}>
                        <FontAwesomeIcon icon={faDollarSign} /> {formatReward(getRewardAmount(index))} $ARB
                      </p>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className={`text-2xl font-bold ${rankColors.text}`}>{(entry.currentSeasonScore || entry.score || 0).toLocaleString()}</p>
                  

                  {entry.duration&& entry.duration!=0? <p className={`text-xs ${rankColors.text} opacity-90 flex items-center gap-1`}>
                        <FontAwesomeIcon icon={faClock} /> {formatDuration(entry?.duration)}
                      </p>:""}
                </div>
              </div>
              );
            })}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8BC34A]"></div>
                  <span className="text-[#6FAE3E] font-medium">Loading more players...</span>
                </div>
              </div>
            )}
            
            {/* End of list indicator */}
            {!hasMore && leaderboard.length > 0 && (
              <div className="text-center py-6">
                <FontAwesomeIcon icon={faFlag} className="text-2xl mb-2 text-gray-400" />
                <p className="text-gray-500 font-medium">You&apos;ve reached the end!</p>
                <p className="text-sm text-gray-400">Total players: {totalPlayers}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reward Info Popup Modal */}
      {showRewardInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowRewardInfo(false)}>
          <div className="rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100" style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(59, 130, 246, 0.3)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
            <img src="/candy/1.png" alt="rewards"  style={{width:"50px",height:"50px"}} />
              <h3 className="text-xl font-bold flex items-center space-x-2" style={{ color: '#e5e7eb' }}>
                {/* <FontAwesomeIcon icon={faCoins} className="text-yellow-400" /> */}
                <span>Weekly Rewards</span>
              </h3>
              <button
                onClick={() => setShowRewardInfo(false)}
                className="p-2 rounded-full transition-colors duration-200"
                style={{ color: '#9ca3af' }}
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="text-lg" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <h4 className="font-bold mb-3 text-center" style={{ color: '#e5e7eb' }}>Top 10 Players Get Rewards</h4>
                <div className="space-y-2 text-sm">
                  {/* Top 3 distinct */}
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold flex items-center gap-2" style={{ color: '#fde68a' }}>
                      <FontAwesomeIcon icon={faTrophy} /> 1st Place (20%)
                    </span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{formatReward(firstAmt)} $ARB</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold flex items-center gap-2" style={{ color: '#e5e7eb' }}>
                      <FontAwesomeIcon icon={faMedal} /> 2nd Place (18%)
                    </span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{formatReward(secondAmt)} $ARB</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold flex items-center gap-2" style={{ color: '#fdba74' }}>
                      <FontAwesomeIcon icon={faAward} /> 3rd Place (15%)
                    </span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{formatReward(thirdAmt)} $ARB</span>
                  </div>
                  {/* Batches */}
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#cbd5e1' }}>4th–6th Place (9% each)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{formatReward(per4to6)} $ARB each</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#cbd5e1' }}>7th–8th Place (6% each)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{formatReward(per7to8)} $ARB each</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                    <span className="font-bold" style={{ color: '#cbd5e1' }}>9th–10th Place (4% each)</span>
                    <span className="font-bold" style={{ color: '#93c5fd' }}>{formatReward(per9to10)} $ARB each</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-xs mb-2 flex items-center justify-center gap-1" style={{ color: '#94a3b8' }}>
                  <FontAwesomeIcon icon={faClock} /> Rewards distributed Weekly at midnight UTC
                </p>
                <p className="text-xs" style={{ color: '#64748b' }}>Pool: {POOL_ARB} $ARB</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowRewardInfo(false)}
                className="relative overflow-hidden group px-6 py-2 font-bold rounded-2xl transition-all duration-200 text-white bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] shadow-md hover:translate-y-[-2px]"
                style={{ fontFamily: 'var(--font-fredoka-one)' }}
              >
                Got it!
                <span className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
