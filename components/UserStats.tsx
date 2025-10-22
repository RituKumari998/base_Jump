'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import Image from 'next/image';
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
  faGamepad,
  faChartBar,
  faCheckCircle,
  faExternalLinkAlt,
  faRefresh,
  faShare,
  faRocket,
  faGift,
  faClock,
  faNewspaper,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { getAverageScore, getBestScore, getTotalGamesFromScores } from '@/lib/game-counter';
import { APP_URL } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { authenticatedFetch } from '@/lib/auth';


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
    totalDegen: number;
    totalNoice: number;
    totalPepe: number;
    claimsToday: number;
    remainingClaims: number;
    totalRewardsClaimed: number;
    lastGiftBoxUpdate?: string | number | null;
  };
  hasFollowed?: boolean;
  lastShareBonus?: number | null;
  lastBasedNewsBonus?: number | null;
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
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);
  const [hasFollowed, setHasFollowed] = useState(false);
  const [shareBoostUsed, setShareBoostUsed] = useState(false);
  const [shareBoostCooldown, setShareBoostCooldown] = useState<string>('');
  const [basedNewsBoostUsed, setBasedNewsBoostUsed] = useState(false);
  const [basedNewsCooldown, setBasedNewsCooldown] = useState<string>('');
  const [isOpeningMiniApp, setIsOpeningMiniApp] = useState(false);

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
      console.log('Stored best score:', storedScore);
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
      console.log('Stored games played:', storedCount);
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
    const avgScore = getAverageScore();
    const bestScore = getBestScore();
    const totalGames = getTotalGamesFromScores();
    
    console.log('Calculated stats:', { avgScore, bestScore, totalGames });
    
    setLocalAverageScore(avgScore);
    setLocalBestFromScores(bestScore);
    setTotalGamesFromScores(totalGames);
    
    // Set debug info
    setDebugInfo(`Avg: ${avgScore}, Best: ${bestScore}, Games: ${totalGames}`);
  };

  // Handle share for +2 claims boost
  const handleShareBoost = async () => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    setIsSharing(true);
    try {
      const username = context?.user?.username || 'Base Jump Player';
      const shareMessage = `🎁 Just discovered an amazing way to earn crypto while gaming!\n\nBase Jump lets you claim $DEGEN, $NOICE & $PEPE tokens just by playing! 🚀\n\nJoin me and start earning! 💰`;
      
      await actions.composeCast({
        text: shareMessage,
        embeds: [APP_URL || "https://base-jump-five.vercel.app/"]
      });

      // Call API to add +2 claims to user's account
      const fid = context?.user?.fid;
      const response = await authenticatedFetch('/api/add-share-bonus', { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, fid }) 
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Share bonus added:', data.message);
        
        // Mark share boost as used in localStorage
        if (typeof window !== 'undefined' && address) {
          const shareBoostKey = `shareBoost_${address}`;
          localStorage.setItem(shareBoostKey, Date.now().toString());
          setShareBoostUsed(true);
        }

        // Refresh stats to show new remaining claims
        await fetchStats();
      } else {
        console.error('Failed to add share bonus:', data.error);
        alert(data.error || 'Failed to add share bonus. Please try again.');
      }
      
    } catch (error) {
      console.error('Failed to share:', error);
      alert('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  // Follow button handler
  const handleFollow = async () => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    try {
      // Open Farcaster profile
      await actions.viewProfile({fid: 268009});
      
      // Call API to record follow in database
      const fid = context?.user?.fid;
      const response = await authenticatedFetch('/api/add-follow-bonus', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, fid }) 
      });

      const data = await response.json();

      if (data.success || data.alreadyFollowed) {
        console.log('✅ Follow recorded:', data.message);
        
        // Mark as followed in localStorage
        if (typeof window !== 'undefined' && address) {
          const followedKey = `followed_${address}`;
          localStorage.setItem(followedKey, 'true');
          setHasFollowed(true);
        }
      } else {
        console.error('Failed to record follow:', data.error);
      }
    } catch (error) {
      console.error('Failed to open profile or record follow:', error);
    }
  };

  // BasedNews collab button handler
  const handleBasedNewsBoost = async () => {
    if (!actions || !address) {
      console.error('Farcaster actions or address not available');
      return;
    }

    setIsOpeningMiniApp(true);

    try {
      // Call API to add +1 claim FIRST
      const fid = context?.user?.fid;
      console.log('Calling basedNews API with:', { userAddress: address, fid });
      
      const response = await authenticatedFetch('/api/add-basednews-bonus', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress: address, fid }) 
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        console.log('✅ BasedNews bonus added:', data.message);
        
        // Store in localStorage for frontend tracking
        if (typeof window !== 'undefined') {
          const basedNewsKey = `basednews_boost_${address}`;
          localStorage.setItem(basedNewsKey, Date.now().toString());
          setBasedNewsBoostUsed(true);
        }

        // Refresh stats to show new remaining claims
        // await fetchStats();

      const  { sdk } = await  import("@farcaster/miniapp-sdk");
        // THEN open basedNews mini app as a reward
        try {
          await sdk.actions?.openMiniApp({
                  url: "https://farcaster.xyz/miniapps/djk3nS-wYTQu/chain-crush"
                });
        } catch (miniAppError) {
          console.error('Failed to open mini app (but bonus was added):', miniAppError);
          // Don't show error to user since the bonus was successfully added
        }
      } else {
        console.error('Failed to add basedNews bonus:', data.error);
        alert(data.error || 'Failed to add basedNews bonus. Please try again.');
      }
      
    } catch (error) {
      console.error('Failed to add basedNews bonus:', error);
      alert('Failed to add basedNews bonus. Please try again.');
    } finally {
      setIsOpeningMiniApp(false);
    }
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
     
      
      // Add games played
      if (localGamesPlayed > 0) {
        shareStats.push(`${localGamesPlayed} Games Played`);
      }
      
      // Add best score
      const bestScore = Math.max(localBestScore || 0, localBestFromScores);
      if (bestScore > 0) {
        shareStats.push(`${bestScore.toLocaleString()} Best Score`);
      }
      
      // Add average score
      if (localAverageScore > 0) {
        shareStats.push(`${localAverageScore.toLocaleString()} Avg Score`);
      }
      
   
       

      // Create the share message
      const statsText = shareStats.length > 0 ? shareStats.join(' • ') : 'Just started playing!';
      const username = context?.user?.username || 'Base Jump Player';
      
      const shareMessage =  `Just soared to new heights in Base Jump! 🌤️🪜\n\n${statsText}\n\nThink you can top my climb? Come play and prove it! 👀\n\n#BaseJump`;
      
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
      const fidParam = fid ? `&fid=${fid}` : '';
      const [statsResponse] = await Promise.all([
        fetch(`/api/user-stats?userAddress=${address}${fidParam}`),
      ]);
      
      const statsResult = await statsResponse.json();
 
      
      console.log('Stats result:', statsResult);
      
      if (statsResult.success) {
        const data = statsResult.data;
        console.log('Stats data:', data);
        console.log('Stats data giftBoxClaimsInPeriod:', data.giftBoxClaimsInPeriod);
        console.log('Stats data lastGiftBoxUpdate:', data.lastGiftBoxUpdate);
        // Update gift box stats with calculated values
        setStats({
          ...data,
          dailyMintsRemaining: Math.max(0, 5 - (data.dailyMintCount || 0))
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

  // Calculate time until gift box reset (12 hours from lastGiftBoxUpdate)
  useEffect(() => {
    const calculateTimeUntilReset = () => {
      if (!stats?.giftBoxStats?.lastGiftBoxUpdate) {
        setTimeUntilReset('');
        return;
      }

      const lastUpdate = typeof stats.giftBoxStats.lastGiftBoxUpdate === 'string' 
        ? new Date(stats.giftBoxStats.lastGiftBoxUpdate).getTime()
        : stats.giftBoxStats.lastGiftBoxUpdate;
      
      const resetTime = lastUpdate + (12 * 60 * 60 * 1000); // 12 hours in milliseconds
      const now = Date.now();
      const timeDiff = resetTime - now;

      if (timeDiff <= 0 || stats.giftBoxStats.remainingClaims === 3) {
        setTimeUntilReset('Ready to claim!');
        return;
      }

      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeUntilReset();
    const interval = setInterval(calculateTimeUntilReset, 1000);

    return () => clearInterval(interval);
  }, [stats?.giftBoxStats?.lastGiftBoxUpdate, stats?.giftBoxStats?.remainingClaims]);

  // Debug function to add test data (remove in production)
  const addTestData = () => {
    if (typeof window !== 'undefined') {
      // Add some test scores
      const testScores = [1500, 2300, 1800, 3200, 2100, 2800, 1900, 2500];
      localStorage.setItem('candyGameScores', JSON.stringify(testScores));
      
      // Set games played
      localStorage.setItem('candyGamesPlayed', '8');
      
      // Set best score
      localStorage.setItem('candyBestScore', '3200');
      
      // Refresh the stats
      getBestScoreFromStorage();
      getGamesPlayedFromStorage();
      getCalculatedStats();
    }
  };

  // Check database and localStorage for follow and share boost status
  useEffect(() => {
    if (typeof window !== 'undefined' && address && stats) {
      const followedKey = `followed_${address}`;
      const shareBoostKey = `shareBoost_${address}`;
      
      // Check database for follow status (more reliable)
      const dbFollowed = stats.hasFollowed === true;
      const localFollowed = localStorage.getItem(followedKey) === 'true';
      const isFollowed = dbFollowed || localFollowed;
      
      setHasFollowed(isFollowed);
      
      // Sync localStorage with database
      if (dbFollowed && !localFollowed) {
        localStorage.setItem(followedKey, 'true');
      }
      
      // Check database for last share bonus
      const dbLastShare = stats.lastShareBonus || 0;
      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;
      
      // Check if database shows recent share
      if (dbLastShare > 0 && (now - dbLastShare) < sixHours) {
        setShareBoostUsed(true);
        // Sync localStorage
        localStorage.setItem(shareBoostKey, dbLastShare.toString());
      } else {
        // Also check localStorage as fallback
        const shareBoostData = localStorage.getItem(shareBoostKey);
        if (shareBoostData) {
          const lastShareTime = parseInt(shareBoostData);
          const timeSinceShare = now - lastShareTime;
          
          if (timeSinceShare < sixHours) {
            setShareBoostUsed(true);
          } else {
            setShareBoostUsed(false);
            localStorage.removeItem(shareBoostKey);
          }
        } else {
          setShareBoostUsed(false);
        }
      }
    }
  }, [address, stats]);

  // Calculate share boost cooldown timer
  useEffect(() => {
    if (!shareBoostUsed || typeof window === 'undefined' || !address) {
      setShareBoostCooldown('');
      return;
    }

    const calculateCooldown = () => {
      // Try database first, then localStorage
      const dbLastShare = stats?.lastShareBonus || 0;
      const shareBoostKey = `shareBoost_${address}`;
      const shareBoostData = localStorage.getItem(shareBoostKey);
      
      const lastShareTime = dbLastShare > 0 ? dbLastShare : (shareBoostData ? parseInt(shareBoostData) : 0);
      
      if (!lastShareTime) {
        setShareBoostCooldown('');
        setShareBoostUsed(false);
        return;
      }

      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;
      const timeSinceShare = now - lastShareTime;
      const timeRemaining = sixHours - timeSinceShare;

      if (timeRemaining <= 0) {
        setShareBoostCooldown('');
        setShareBoostUsed(false);
        if (shareBoostData) {
          localStorage.removeItem(shareBoostKey);
        }
        return;
      }

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      setShareBoostCooldown(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateCooldown();
    const interval = setInterval(calculateCooldown, 1000);

    return () => clearInterval(interval);
  }, [shareBoostUsed, address, stats?.lastShareBonus]);

  // Check basedNews boost status from database and localStorage
  useEffect(() => {
    if (address && stats) {
      const basedNewsKey = `basednews_boost_${address}`;
      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;
      
      // Prioritize database value
      const dbLastBasedNews = stats.lastBasedNewsBonus || 0;
      
      if (dbLastBasedNews > 0 && (now - dbLastBasedNews) < sixHours) {
        setBasedNewsBoostUsed(true);
        // Sync localStorage
        localStorage.setItem(basedNewsKey, dbLastBasedNews.toString());
      } else {
        // Also check localStorage as fallback
        const basedNewsData = localStorage.getItem(basedNewsKey);
        if (basedNewsData) {
          const lastBasedNewsTime = parseInt(basedNewsData);
          const timeSinceBasedNews = now - lastBasedNewsTime;
          
          if (timeSinceBasedNews < sixHours) {
            setBasedNewsBoostUsed(true);
          } else {
            setBasedNewsBoostUsed(false);
            localStorage.removeItem(basedNewsKey);
          }
        } else {
          setBasedNewsBoostUsed(false);
        }
      }
    }
  }, [address, stats]);

  // Calculate basedNews boost cooldown timer
  useEffect(() => {
    if (!basedNewsBoostUsed || typeof window === 'undefined' || !address) {
      setBasedNewsCooldown('');
      return;
    }

    const calculateCooldown = () => {
      // Try database first, then localStorage
      const dbLastBasedNews = stats?.lastBasedNewsBonus || 0;
      const basedNewsKey = `basednews_boost_${address}`;
      const basedNewsData = localStorage.getItem(basedNewsKey);
      
      const lastBasedNewsTime = dbLastBasedNews > 0 ? dbLastBasedNews : (basedNewsData ? parseInt(basedNewsData) : 0);
      
      if (!lastBasedNewsTime) {
        setBasedNewsCooldown('');
        setBasedNewsBoostUsed(false);
        return;
      }

      const now = Date.now();
      const sixHours = 6 * 60 * 60 * 1000;
      const timeSinceBasedNews = now - lastBasedNewsTime;
      const timeRemaining = sixHours - timeSinceBasedNews;

      if (timeRemaining <= 0) {
        setBasedNewsCooldown('');
        setBasedNewsBoostUsed(false);
        if (basedNewsData) {
          localStorage.removeItem(basedNewsKey);
        }
        return;
      }

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      setBasedNewsCooldown(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateCooldown();
    const interval = setInterval(calculateCooldown, 1000);

    return () => clearInterval(interval);
  }, [basedNewsBoostUsed, address, stats?.lastBasedNewsBonus]);

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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #6ECFFF 0%, #87CEEB 100%)' }}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4 text-white">🔗</div>
          <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
          <p className="text-white/70">Please connect your wallet to view your stats</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #6ECFFF 0%, #87CEEB 100%)' }}>
        {/* Animated Stars Background */}
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
          {/* Floating clouds background - Same as home page */}
          <div className="absolute -top-8 left-6 w-40 h-16 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
          <div className="absolute top-40 right-10 w-56 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
          <div className="absolute bottom-16 left-10 w-48 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
          <div className="absolute -bottom-6 right-8 w-32 h-14 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
          
          {/* Stats Section Title Skeleton */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="h-10 bg-white/30 rounded-lg w-64 mx-auto mb-3 animate-pulse"></div>
            <div className="h-6 bg-white/20 rounded-lg w-80 mx-auto animate-pulse"></div>
          </motion.div>

          {/* Header Skeleton */}
          <motion.div 
            className="pt-5 pb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center mb-8">
              {/* Profile Picture Skeleton */}
              <div className="relative mr-4">
                <div className="w-20 h-20 rounded-xl bg-white/70 animate-pulse shadow-lg"></div>
              </div>
              
              <div className="flex-grow">
                {/* Welcome Text Skeleton */}
                <div className="h-6 bg-white/30 rounded mb-4 w-64 animate-pulse"></div>
                
                {/* Wallet Info Skeleton */}
                <div className="mb-4 p-3 border border-white/20 bg-white/10 rounded-lg">
                  <div className="h-4 bg-white/20 rounded mb-2 w-32 animate-pulse"></div>
                  <div className="h-4 bg-white/20 rounded w-48 animate-pulse"></div>
                </div>
                
                {/* Buttons Skeleton */}
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-24 bg-gradient-to-r from-[#8BC34A]/30 to-[#6FAE3E]/30 rounded-2xl animate-pulse"></div>
                  <div className="h-10 w-20 bg-gradient-to-r from-[#8BC34A]/30 to-[#6FAE3E]/30 rounded-2xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards Skeleton */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-white/70 backdrop-blur-sm p-6 h-full rounded-3xl shadow-lg animate-pulse"
                style={{
                  clipPath: 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)'
                }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#8BC34A]/30 to-[#6FAE3E]/30 rounded-full animate-pulse"></div>
                  <div className="ml-4 flex-grow">
                    <div className="h-[1px] w-full bg-gradient-to-r from-[#8BC34A]/30 to-transparent"></div>
                  </div>
                </div>
                
                <div className="h-6 bg-[#8BC34A]/20 rounded mb-3 animate-pulse"></div>
                <div className="h-8 bg-[#8BC34A]/20 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-[#8BC34A]/10 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </motion.div>

          {/* Additional Stats Cards Skeleton */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-white/70 backdrop-blur-sm p-6 h-full rounded-3xl shadow-lg animate-pulse"
                style={{
                  clipPath: 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)'
                }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#8BC34A]/30 to-[#6FAE3E]/30 rounded-full animate-pulse"></div>
                  <div className="ml-4 flex-grow">
                    <div className="h-[1px] w-full bg-gradient-to-r from-[#8BC34A]/30 to-transparent"></div>
                  </div>
                </div>
                
                <div className="h-6 bg-[#8BC34A]/20 rounded mb-3 animate-pulse"></div>
                <div className="h-8 bg-[#8BC34A]/20 rounded mb-2 animate-pulse"></div>
                <div className="h-4 bg-[#8BC34A]/10 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </motion.div>
        </div>

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
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, #6ECFFF 0%, #87CEEB 100%)' }}>
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4 text-white">📊</div>
          <h2 className="text-2xl font-bold text-white">No Stats Available</h2>
          <p className="text-white/70">Start playing to generate your statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #6ECFFF 0%, #87CEEB 100%)' }}>
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
        {/* Floating clouds background - Same as home page */}
        <div className="absolute -top-10 left-6 w-40 h-16 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute top-40 right-10 w-56 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute bottom-16 left-10 w-48 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute -bottom-6 right-8 w-32 h-14 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        
        {/* Header with User Profile */}
        <motion.div 
          className="pt-5 pb-8"
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
           
              <p className="text-2xl font-bold text-white  mb-2">
                Welcome back, <span className="text-[#cffa6b] font-normal">{context?.user?.username || 'Player'}</span>
              </p>
              
              {/* Wallet Address and Balance */}
              <div className="mb-4 p-3 border border-[#00FFAA]/20 bg-black/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faWallet} className="text-[#00FFAA] text-sm" />
                    <span className="text-xs text-[#00FFAA] uppercase tracking-wider">Wallet Address</span>
                  </div>
                  <motion.button
                    onClick={copyAddress}
                    className="text-[#00FFAA] hover:text-[#00FFAA]/80 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FontAwesomeIcon icon={faCopy} className="text-xs" />
                  </motion.button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/80 font-mono">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faCoins} className="text-[#00FFAA] text-xs" />
                    <span className="text-sm text-white/80">
                      {balanceLoading ? (
                        <span className="text-[#00FFAA]">Loading...</span>
                      ) : (
                        `${ethBalance} ETH`
                      )}
                    </span>
                  </div>
                </div>
                {copiedAddress && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-2 right-2 bg-[#00FFAA] text-black text-xs px-2 py-1 rounded"
                  >
                    Copied!
                  </motion.div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={refreshData}
                  disabled={refreshing}
                  className={`relative overflow-hidden group bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] text-white font-semibold py-2 px-4 rounded-2xl shadow-md flex items-center space-x-2 ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  whileHover={refreshing ? {} : { y: -1, scale: 1.02 }}
                  whileTap={refreshing ? {} : { scale: 0.98 }}
                >
                  <FontAwesomeIcon icon={faRefresh} className={`${refreshing ? 'animate-spin' : ''} text-sm`} />
                  <span className="text-sm" style={{ fontFamily: 'var(--font-fredoka-one)' }}>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
                  <span className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.button>
                
                                 <motion.button
                   onClick={shareStats}
                   disabled={sharing}
                  className={`relative overflow-hidden group bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] text-white font-semibold py-2 px-4 rounded-2xl shadow-md flex items-center space-x-2 ${sharing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  whileHover={sharing ? {} : { y: -1, scale: 1.02 }}
                  whileTap={sharing ? {} : { scale: 0.98 }}
                >
                  <FontAwesomeIcon icon={faShare} className="text-xs" />
                  <span className="text-sm" style={{ fontFamily: 'var(--font-fredoka-one)' }}>{sharing ? 'Sharing…' : 'Share'}</span>
                  <span className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 </motion.button>
              </div>
          </div>
        </div>
              </motion.div>


     {/* 🔥 EPIC COLLAB BANNER - Base Jump X basedNews 🔥 */}
     <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
              className="mb-6 relative overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl animate-gradient-x" />
              
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-3xl animate-shimmer" />
              
              {/* Glowing orbs */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
              
              {/* Content */}
              <div className="relative rounded-3xl p-6 border-2 border-white/40 backdrop-blur-sm bg-black/20">
                {/* Header with badges */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-white">🔥 COLLAB</span>
                    </div>
                    <div className="bg-white/20 px-2 py-1 rounded-full">
                      <span className="text-xs text-white/90 font-semibold">+1 Claims</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold text-white mb-2 flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-fredoka-one)' }}>
                    {/* <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg"> */}
                    <div className="flex items-center justify-center flex-col">
                      <Image 
                        src="/images/icon.jpg" 
                        alt="Base Jump" 
                        width={40}
                        height={40}
                        className="object-cover w-full h-full rounded-full"
                      />
                    {/* </div> */}
                   <p>
                    Base Jump
                    </p>
                    </div>
                    <span className="text-white/100">✖️</span>
                    {/* <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shadow-lg"> */}
                    <div className="flex items-center justify-center flex-col">

                     
                    {/* </div> */}
<p>ChainCrush</p>
                    
                    </div>
                  </h2>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Exclusive partnership! Visit ChainCrush and get <span className="font-bold text-yellow-300">+1 bonus claim</span> 🎁
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleBasedNewsBoost}
                  disabled={basedNewsBoostUsed || isOpeningMiniApp}
                  className={`group relative w-full py-3 px-4 rounded-xl font-bold text-base transition-all overflow-hidden ${
                    basedNewsBoostUsed 
                      ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 text-white shadow-lg hover:shadow-2xl transform hover:scale-105'
                  }`}
                >
                  {/* Button shimmer effect */}
                  {!basedNewsBoostUsed && !isOpeningMiniApp && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  )}
                  
                  <div className="relative flex items-center justify-center gap-2">
                    {isOpeningMiniApp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : basedNewsBoostUsed ? (
                      <>
                        <FontAwesomeIcon icon={faClock} className="text-sm" />
                        <span>Cooldown: {basedNewsCooldown}</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faBolt} className="text-lg animate-bounce" />
                        <span>Visit ChainCrush & Get +1!</span>
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                      </>
                    )}
                  </div>
                </button>

                {/* Info footer */}
                {!basedNewsBoostUsed && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/70">
                    <FontAwesomeIcon icon={faClock} className="text-blue-300" />
                    <span>6-hour cooldown • Stay updated!</span>
                  </div>
                )}
              </div>
            </motion.div>

              <div className="grid grid-rows-2 gap-4 mb-6">
              {/* Share Boost */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-900 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30">
                <div className="flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faShare} className="text-blue-300" />
                  <span className="text-sm font-semibold text-white">Share Boost</span>
                </div>
                <p className="text-xs text-white/70 mb-3">Share to get +2 extra claims!</p>
                <button
                  onClick={handleShareBoost}
                  disabled={shareBoostUsed || isSharing}
                  className={`w-full py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                    shareBoostUsed 
                      ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                  }`}
                >
                  {isSharing ? 'Sharing...' : shareBoostUsed ? `Cooldown: ${shareBoostCooldown}` : 'Share & Get +2'}
                </button>
              </div>

              {/* Follow Boost */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-900 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30">
                <div className="flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faUser} className="text-purple-300" />
                  <span className="text-sm font-semibold text-white">Follow Us</span>
                </div>
                <p className="text-xs text-white/70 mb-3">Follow for exclusive updates!</p>
                <button
                  onClick={handleFollow}
                  disabled={hasFollowed}
                  className={`w-full py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                    hasFollowed 
                      ? 'bg-green-500/50 text-green-100 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  }`}
                >
                  {hasFollowed ? '✓ Following' : 'Follow @1k'}
                </button>
              </div>
            </div>

       

      
            {stats.giftBoxStats && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-8"
        >
          <div className="bg-black/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-fredoka-one)' }}>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                  <FontAwesomeIcon icon={faGift} className="text-white" />
                </div>
                Gift Box Rewards
              </h3>
            </div>

            {/* Boost Actions Section */}
           

            {/* Reset Timer - Only show if claims are used */}
            {stats.giftBoxStats.remainingClaims < 3 && (
              <div className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/30 p-2 rounded-lg">
                      <FontAwesomeIcon icon={faClock} className="text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm text-white/70 mb-1">Next Reset In</p>
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka-one)' }}>
                        {timeUntilReset || 'Calculating...'}
                      </p>
                    </div>
                  </div>
                  {timeUntilReset === 'Ready to claim!' && (
                    <div className="bg-green-500/30 px-4 py-2 rounded-xl border border-green-400/50">
                      <p className="text-green-300 font-bold text-sm">3 Boxes Available!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Claims Status */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-400" />
                  <span className="text-sm text-white/70">Claimed Today</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stats.giftBoxStats.claimsToday}/3
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faCoins} className="text-yellow-400" />
                  <span className="text-sm text-white/70">Remaining</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {stats.giftBoxStats.remainingClaims}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Claims Progress</span>
                <span>{Math.round((stats.giftBoxStats.claimsToday / 3) * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.giftBoxStats.claimsToday / 3) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Token Rewards Earned */}
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartBar} className="text-green-400" />
                Total Tokens Earned
              </h4>
              
              {stats.giftBoxStats.totalDegen > 0 && (
                <div className="flex items-center justify-between bg-purple-500/20 backdrop-blur-sm rounded-xl p-3 border border-purple-400/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400">
                      <img src="/candy/degen.jpg" alt="DEGEN" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white font-medium">$DEGEN</span>
                  </div>
                  <span className="text-xl font-bold text-purple-200">
                    {stats.giftBoxStats.totalDegen.toLocaleString()}
                  </span>
                </div>
              )}

              {stats.giftBoxStats.totalNoice > 0 && (
                <div className="flex items-center justify-between bg-blue-500/20 backdrop-blur-sm rounded-xl p-3 border border-blue-400/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400">
                      <img src="/candy/noice.png" alt="NOICE" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white font-medium">$NOICE</span>
                  </div>
                  <span className="text-xl font-bold text-blue-200">
                    {stats.giftBoxStats.totalNoice.toLocaleString()}
                  </span>
                </div>
              )}

              {stats.giftBoxStats.totalPepe > 0 && (
                <div className="flex items-center justify-between bg-green-500/20 backdrop-blur-sm rounded-xl p-3 border border-green-400/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-400">
                      <img src="/candy/pepe.jpg" alt="PEPE" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white font-medium">$PEPE</span>
                  </div>
                  <span className="text-xl font-bold text-green-200">
                    {stats.giftBoxStats.totalPepe.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Total Claims Summary */}
             
            </div>
          </div>
        </motion.div>
      )}
      {/* Stats Overview Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
       
          {(Math.max(localBestScore || 0, localBestFromScores, stats.bestScore || 0) || 0) > 0 && (
            <StatsCard 
              icon={faTrophy} 
              title="Best Score" 
              value={Math.max(localBestScore || 0, localBestFromScores, stats.bestScore || 0).toLocaleString()} 
              trend="HIGH" 
            />
          )}
          {(Math.max(localGamesPlayed, totalGamesFromScores) || 0) > 0 && (
            <StatsCard 
              icon={faChartLine} 
              title="Games Played" 
              value={Math.max(localGamesPlayed, totalGamesFromScores).toString()} 
              trend="COUNT" 
            />
          )}
         
        </motion.div>

        {/* Additional Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {stats.currentSeasonScore && stats.currentSeasonScore > 0 && (
            <StatsCard 
              icon={faCalendarDay} 
              title="Current Season Score" 
              value={stats.currentSeasonScore.toLocaleString()} 
              trend="SEASON" 
            />
          )}
          {stats.ath && stats.ath > 0 && (
            <StatsCard 
              icon={faHistory} 
              title="All Time High" 
              value={stats.ath.toLocaleString()} 
              trend="ATH" 
            />
          )}
          {stats.level && stats.level > 1 && (
            <StatsCard 
              icon={faUser} 
              title="Player Level" 
              value={stats.level.toString()} 
              trend="LEVEL" 
            />
          )}
          {(localAverageScore || 0) > 0 && (
            <StatsCard 
              icon={faRocket} 
              title="Average Score" 
              value={localAverageScore.toLocaleString()} 
              trend="AVG" 
            />
          )}
        </motion.div>

                 {/* Debug Info (remove in production) */}
       

      {/* Gift Box Stats Section */}
      

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

// Stats Card Component with beautiful cloud-shaped styling
const StatsCard = ({ 
  icon, 
  title, 
  value, 
  trend, 
  showProgressBar = false, 
  progressValue = 0, 
  maxProgress = 4 
}: {
  icon: any;
  title: string;
  value: string;
  trend: string;
  showProgressBar?: boolean;
  progressValue?: number;
  maxProgress?: number;
}) => (
  <motion.div
    className="relative group"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm p-6 h-full rounded-3xl shadow-lg" 
      style={{
        clipPath: 'polygon(0% 15%, 15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%)'
      }}
    >
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-[#8BC34A] to-[#6FAE3E] rounded-full flex items-center justify-center shadow-md">
          <FontAwesomeIcon icon={icon} className="text-white text-lg" />
        </div>
        <div className="ml-4 flex-grow">
          <div className="h-[1px] w-full bg-gradient-to-r from-[#8BC34A]/50 to-transparent"></div>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-[#8BC34A] mb-3 uppercase tracking-wider" style={{ fontFamily: 'var(--font-fredoka-one)' }}>{title}</h3>
      <div className="text-3xl font-bold text-gray-800 mb-2">{value}</div>
      <div className="text-xs text-gray-600 uppercase tracking-wider font-medium">{trend}</div>
      
      {/* Progress Bar for Gift Box Remaining */}
      {showProgressBar && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>0</span>
            <span>{maxProgress}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(progressValue / maxProgress) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
      
      {/* Cloud-like shadow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-30" />
      
      {/* Hover effect */}
      <div className="absolute bottom-0 left-0 h-0 w-full bg-[#8BC34A]/10 group-hover:h-full transition-all duration-500 ease-in-out rounded-b-3xl" />
    </div>
  </motion.div>
);
