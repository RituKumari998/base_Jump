'use client'

import { useEffect, useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { ethers } from 'ethers'
import { 
  faHome, faChartBar, faTrophy, faRocket, 
  faCrown, faCoins, faBolt, faFire, faUsers,
  faArrowRight, faChartLine, faGamepad, faPlay,
  faBullseye, faInfoCircle, faRefresh, faBullseye as faTarget,
  faCarrot, faBuilding, faExclamationTriangle, faBalanceScale, faMedal,
  faGift
} from '@fortawesome/free-solid-svg-icons'
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { incrementGamesPlayed } from '@/lib/game-counter';




import UserStats from '../UserStats'
import Leaderboard from '../Leaderboard'
import { useConnect, useAccount, useContractWrite, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
// import VerticalJumperGame from './VerticalJumperGame' 

// Dynamically import VerticalJumperGame to prevent SSR issues
  const VerticalJumperGame = dynamic(() => import('./VerticalJumperGame'), {
    ssr: false,
    loading: () => (
      <div className="relative px-12 w-screen flex items-center justify-center h-screen bg-gradient-to-b from-[#6ECFFF] to-[#87CEEB] overflow-hidden">
        {/* Floating clouds background */}
        <div className="absolute -top-8 left-6 w-40 h-16 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute top-10 right-10 w-56 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute bottom-16 left-10 w-48 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute -bottom-6 right-8 w-32 h-14 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
        
        {/* Floating platforms */}
        <div className="absolute top-1/4 left-1/6 w-16 h-4 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-60 animate-float-medium shadow-lg"></div>
        <div className="absolute top-1/3 right-1/5 w-12 h-3 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-50 animate-float-slow shadow-lg"></div>
        <div className="absolute top-2/3 left-1/4 w-14 h-3 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-40 animate-float-fast shadow-lg"></div>
        
        {/* Main loading content */}
        <div className="relative text-center space-y-6">
          {/* Loading icon */}
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8BC34A] to-[#6FAE3E] rounded-full shadow-lg animate-pulse"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-[#6ECFFF] to-[#87CEEB] rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faGamepad} className="text-4xl animate-bounce" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-30 blur-sm"></div>
          </div>
          
          {/* Loading text */}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'var(--font-fredoka-one)' }}>
              Loading Base Jump
            </h2>
            <p className="text-white/90 text-lg">Preparing your jumping adventure...</p>
          </div>
          
          {/* Loading dots */}
          <div className="flex items-center justify-center space-x-3">
            <div className="w-3 h-3 bg-[#8BC34A] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-[#6FAE3E] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-[#8BC34A] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    )
  })

export function Demo() {
  const [showGame, setShowGame] = useState(false)
  const [showStoneShooter, setShowStoneShooter] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const { actions, context } = useMiniAppContext();
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'leaderboard'>('home')
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  const [tokenTxCount, setTokenTxCount] = useState<number | null>(null)
  const [isLoadingTxCount, setIsLoadingTxCount] = useState(false)
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)

  // Check if user has seen welcome popup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        // Show popup after a short delay for better UX
        setTimeout(() => {
          setShowWelcomePopup(true);
        }, 1000);
      }
    }
  }, []);

  // Close welcome popup and mark as seen
  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcome', 'true');
    }
  };
  
  const { connect, connectors } = useConnect()
  const { isConnected, address } = useAccount()
  const client = usePublicClient()
  
  // Blockchain contract write for starting Base jump game
  const { writeContract: writeStartGame, data: startGameTx, isSuccess: startGameSuccess, isError: startGameContractError, error: startGameErrorObj, reset: resetStartGame } = useContractWrite();
  const { isLoading: isStartGameLoading, isSuccess: isStartGameSuccess } = useWaitForTransactionReceipt({ hash: startGameTx });
  
  // Base jump game start state
  const [isStartingStoneShooter, setIsStartingStoneShooter] = useState(false);
  const [stoneShooterError, setStoneShooterError] = useState<string | null>(null);
  const [stoneShooterSuccess, setStoneShooterSuccess] = useState(false);
  const [hasActiveTransaction, setHasActiveTransaction] = useState(false);

  // Function to fetch parsnips collected (transaction count from contract)
  const fetchParsnipsCollected = async () => {
    if (!client) return;
    
    setIsLoadingTxCount(true);
    try {
      const txCount = await client.getTransactionCount({
        address: "0x696dCAb161e5818FAC129860BB68d1644169Ec63",
      });
      console.log("Parsnips collected (Tx count):", txCount);
      setTokenTxCount(Number(txCount));
    } catch (error) {
      console.error("Error fetching parsnips collected:", error);
      setTokenTxCount(0);
    } finally {
      setIsLoadingTxCount(false);
    }
  };

  // Fetch parsnips collected on component mount
  useEffect(() => {
    fetchParsnipsCollected();
  }, [client]);

  // Digital grid elements for modern blockchain aesthetic
  const gridElements = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => {
      const shapes = ['line-h', 'line-v', 'dot-grid', 'cube'];
      const colors = ['#00FFAA', '#0088FF', '#FFFFFF', '#00DDFF'];
      return {
        shape: shapes[i % shapes.length],
        color: colors[i % colors.length],
        size: Math.random() * 100 + 50,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        rotation: Math.random() * 45,
        duration: Math.random() * 25 + 20,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.15 + 0.05,
      };
    }),
    []
  );
  
  const dataStreamParticles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      size: Math.random() * 2 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
      length: Math.random() * 50 + 20,
      color: ['#00FFAA', '#0088FF', '#FFFFFF', '#00DDFF'][i % 4],
    })),
    []
  );

  // Star data for animated background
  const starData = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => {
      const size = Math.random() * 8 + 4;
      const starColor = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ffff88' : '#88ccff';
      return {
        size,
        color: starColor,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.8 + 0.2,
        textShadow: `0 0 ${size/2}px ${starColor}`,
      };
    }),
    []
  );

  // Shooting star data for animated background
  const shootingStarData = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 50}%`,
      animation: `shoot ${Math.random() * 15 + 10}s linear infinite`,
      animationDelay: `${Math.random() * 10}s`,
    })),
    []
  );

  // Check if user has seen the reward popup before
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenRewardPopup = localStorage.getItem('hasSeenRewardnewPopup')
      if (!hasSeenRewardPopup) {
        // Show popup after a short delay for better UX
        const timer = setTimeout(() => {
          setShowRewardPopup(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleCloseRewardPopup = () => {
    setShowRewardPopup(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenRewardnewPopup', 'true')
    }
  }

  // Handle Base jump game start with blockchain transaction
  const handleStartStoneShooter1 = async() => {
    setShowStoneShooter(true);
  }

  const handleStartStoneShooter = async () => {
    if (!address) {
      console.warn('No wallet address available for Base jump');
      setStoneShooterError('Please connect your wallet first');
      return;
    }

    if (isStartingStoneShooter) {
      console.log('🔄 Base jump transaction already in progress');
      return;
    }

    setIsStartingStoneShooter(true);
    setStoneShooterError(null);
    setStoneShooterSuccess(false);
    setHasActiveTransaction(true);

    try {
      // Reset any previous transaction state
      resetStartGame();
      
      // Call the startGame function on the blockchain
      const { CONTRACT_ADDRESSES, MINI_GAME_ABI } = await import('@/lib/contracts');
      const { getPlayerData } = await import('@/lib/leaderboard');
      
      const playerData = getPlayerData(context);
      
      if (!playerData.fid) {
        setStoneShooterError('Unable to get Farcaster ID. Please try again.');
        setIsStartingStoneShooter(false);
        setHasActiveTransaction(false);
        return;
      }
      
      writeStartGame({
        address: CONTRACT_ADDRESSES.MINI_GAME as `0x${string}`,
        abi: MINI_GAME_ABI,
        functionName: 'startGame',
        args: [BigInt(playerData.fid)]
      });

      console.log('✅ Base jump blockchain transaction initiated with FID:', playerData.fid);
      
      // The transaction is now pending, the useEffect will handle success/failure
      
    } catch (error: any) {
      console.error('Error starting Base jump game:', error);
      setStoneShooterError(error.message || 'Failed to start Base jump game');
      setIsStartingStoneShooter(false);
      setHasActiveTransaction(false);
    }
  };

  useEffect(()=>{
    if(isConnected){
      actions?.addFrame()
    }
  },[isConnected])

  // Fetch token transaction count from blockchain
  const fetchTokenTransactionCount = async () => {
    try {
      setIsLoadingTxCount(true)
      const { CONTRACT_ADDRESSES } = await import('@/lib/contracts')
      
      // Use Base network RPC endpoint
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org")
      
      // Get transaction count for the BaseJump contract
      const txCount = await provider.getTransactionCount(CONTRACT_ADDRESSES.BASE_JUMP)
      
      // Add a multiplier to represent "parsnips collected" - each tx represents multiple items
      const parsnipsCollected = txCount * 25 // Each transaction represents approximately 25 parsnips
      
      setTokenTxCount(parsnipsCollected)
      setIsLoadingTxCount(false)
    } catch (error) {
      console.error("Error fetching token transaction count:", error)
      setIsLoadingTxCount(false)
    }
  }
  
  // Fetch transaction count on component mount
  useEffect(() => {
    fetchTokenTransactionCount()
    
    // Refresh transaction count every 60 seconds
    const intervalId = setInterval(fetchTokenTransactionCount, 60000)
    
    return () => clearInterval(intervalId)
  }, [])

  // Handle successful Base jump blockchain transaction
  useEffect(() => {
    if (isStartGameSuccess && isStartingStoneShooter && startGameTx) {
      console.log('✅ Base jump blockchain transaction confirmed');
      
      // Immediately start the game
      console.log('🚀 Launching Base jump game...');
      incrementGamesPlayed();
      setShowStoneShooter(true);
      console.log('✅ Base jump game state set to true');
      
      // Hide the loader and reset transaction state
      setIsStartingStoneShooter(false);
      setStoneShooterSuccess(false);
      setHasActiveTransaction(false);
    }
  }, [isStartGameSuccess, isStartingStoneShooter, startGameTx]);

  // Handle Base jump blockchain transaction error
  useEffect(() => {
    if (startGameContractError && isStartingStoneShooter) {
      console.error('❌ Base jump blockchain transaction failed:', startGameErrorObj);
      setStoneShooterError(startGameErrorObj?.message || 'Blockchain transaction failed');
      setIsStartingStoneShooter(false);
      setStoneShooterSuccess(false);
      setHasActiveTransaction(false);
    }
  }, [startGameContractError, startGameErrorObj, isStartingStoneShooter]);

  // Reset wagmi state when returning from Base jump game
  useEffect(() => {
    // Only reset when we're on home page (not showing any game) and have a successful transaction
    // and we're not currently in an active transaction
    if (!showStoneShooter && !showGame && !showStats && !showLeaderboard && 
        (startGameSuccess || isStartGameSuccess) && !hasActiveTransaction) {
      console.log('🔄 Resetting Base jump transaction state');
      resetStartGame();
    }
  }, [showStoneShooter, showGame, showStats, showLeaderboard, startGameSuccess, isStartGameSuccess, hasActiveTransaction, resetStartGame]);

  // Debug: Monitor showStoneShooter state
  useEffect(() => {
    console.log('🔍 showStoneShooter state changed:', showStoneShooter);
  }, [showStoneShooter]);

  // Sync activeTab with current view
  useEffect(() => {
    if (showStats) {
      setActiveTab('stats')
    } else if (showLeaderboard) {
      setActiveTab('leaderboard')
    } else {
      setActiveTab('home')
    }
  }, [showStats, showLeaderboard])



  if (showStoneShooter) {
    return (
      <div className="min-h-screen overflow-hidden">
        <VerticalJumperGame onBack={() => {
          setShowStoneShooter(false)
          setActiveTab('home')
        }} />
      </div>
    )
  }

  if (showStats) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #6ECFFF 0%, #87CEEB 100%)' }}>
        {/* Animated Stars Background */}
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
        
        <div className="px-4 pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <UserStats />
          </motion.div>
        </div>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
        
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
    )
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen overflow-hidden" style={{ background: 'linear-gradient(180deg, #6ECFFF 0%, #87CEEB 100%)' }}>
        {/* Animated Stars Background */}
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
        
        <div className=" pb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Leaderboard />
          </motion.div>
        </div>
        <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} onShowGame={setShowGame} onShowStats={setShowStats} onShowLeaderboard={setShowLeaderboard} />
        
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
    )
  }

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ 
      background: 'linear-gradient(180deg, #6ECFFF 0%, #87CEEB 100%)' 
    }}>
      {/* Blockchain Transaction Loader Overlay */}
      {isStartingStoneShooter && (
        <div className="fixed inset-0 bg-[#6ECFFF]/90 backdrop-blur-xl z-50 flex items-center justify-center">
          <motion.div 
            className="relative bg-gradient-to-br from-[#6ECFFF] to-[#87CEEB] border-2 border-[#8BC34A] rounded-3xl p-12 max-w-md mx-4 text-center shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            {/* Floating platform elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#8BC34A] rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#6FAE3E] rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute -bottom-3 left-8 w-10 h-10 bg-[#8BC34A] rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.6s' }}></div>
            <div className="absolute -bottom-1 right-6 w-4 h-4 bg-[#6FAE3E] rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.9s' }}></div>

            {/* Main loading icon */}
            <motion.div 
              className="w-24 h-24 mx-auto mb-8 relative"
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#8BC34A] to-[#6FAE3E] rounded-full shadow-lg"></div>
              <div className="absolute inset-2 bg-gradient-to-br from-[#6ECFFF] to-[#87CEEB] rounded-full flex items-center justify-center">
                <motion.div 
                  className="text-4xl"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <FontAwesomeIcon icon={faRocket} />
                </motion.div>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-30 blur-sm"></div>
            </motion.div>

            <h3 className="text-3xl font-bold text-white mb-4 drop-shadow-lg flex items-center justify-center gap-3" style={{ fontFamily: 'var(--font-fredoka-one)' }}>
              <FontAwesomeIcon icon={faGamepad} /> Launching Base Jump
            </h3>
            <p className="text-white/90 mb-8 text-lg font-medium">
              Processing blockchain transaction...
            </p>

            {/* Enhanced loading indicators */}
            <div className="flex items-center justify-center space-x-4 text-sm text-white">
              <motion.div 
                className="w-3 h-3 bg-[#8BC34A] rounded-full shadow-lg" 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ duration: 1.2, repeat: Infinity }}
              ></motion.div>
              <span className="font-semibold">Waiting for confirmation</span>
              <motion.div 
                className="w-3 h-3 bg-[#6FAE3E] rounded-full shadow-lg" 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              ></motion.div>
            </div>

            {/* Progress bar */}
            <div className="mt-6 w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Clouds Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Cloud 1 */}
        <div className="absolute top-20 left-10 w-32 h-20 opacity-30 animate-float-slow">
          <svg viewBox="0 0 100 60" fill="white">
            <path d="M20,40 Q10,30 20,20 Q30,10 40,20 Q50,10 60,20 Q70,10 80,20 Q90,30 80,40 Q70,50 60,40 Q50,50 40,40 Q30,50 20,40 Z"/>
          </svg>
        </div>
        
        {/* Cloud 2 */}
        <div className="absolute top-40 right-20 w-24 h-16 opacity-25 animate-float-medium">
          <svg viewBox="0 0 100 60" fill="white">
            <path d="M15,35 Q8,28 15,18 Q22,8 30,18 Q37,8 45,18 Q52,8 60,18 Q67,28 60,35 Q52,45 45,35 Q37,45 30,35 Q22,45 15,35 Z"/>
          </svg>
        </div>
        
        {/* Cloud 3 */}
        <div className="absolute top-60 left-1/3 w-28 h-18 opacity-20 animate-float-fast">
          <svg viewBox="0 0 100 60" fill="white">
            <path d="M18,38 Q12,32 18,22 Q24,12 32,22 Q38,12 46,22 Q52,12 60,22 Q66,32 60,38 Q52,48 46,38 Q38,48 32,38 Q24,48 18,38 Z"/>
          </svg>
        </div>
        
        {/* Cloud 4 */}
        <div className="absolute top-80 right-1/4 w-20 h-14 opacity-15 animate-float-slow">
          <svg viewBox="0 0 100 60" fill="white">
            <path d="M12,36 Q8,30 12,20 Q16,10 22,20 Q28,10 34,20 Q40,10 46,20 Q52,30 46,36 Q40,46 34,36 Q28,46 22,36 Q16,46 12,36 Z"/>
          </svg>
        </div>
        
        {/* Floating Platforms */}
        <div className="absolute top-1/4 left-1/6 w-16 h-4 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-60 animate-float-medium shadow-lg"></div>
        <div className="absolute top-1/3 right-1/5 w-12 h-3 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-50 animate-float-slow shadow-lg"></div>
        <div className="absolute top-2/3 left-1/4 w-14 h-3 bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] rounded-full opacity-40 animate-float-fast shadow-lg"></div>
        
        {/* Floating Coins */}
        <div className="absolute top-1/5 right-1/3 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full opacity-70 animate-float-fast shadow-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">$</span>
        </div>
        <div className="absolute top-1/2 left-1/5 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full opacity-60 animate-float-medium shadow-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">$</span>
        </div>
        <div className="absolute top-3/4 right-1/6 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full opacity-50 animate-float-slow shadow-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">$</span>
        </div>
        
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

      {/* Modern Header Section */}
      <div className="relative z-10">
        {/* Header Content */}
        <div className="px-6 pt-12 pb-8">
          <motion.div 
            className="mb-12 flex flex-col items-start"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, type: "spring" }}
          >
            {/* App Logo with Game Icon */}
            <div className="flex items-center mb-8 w-full">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#0088FF] rounded-xl blur-lg opacity-40 animate-pulse"></div>
                <img 
                  src="/images/icon.jpg" 
                    alt="Base jump" 
                    className="relative w-20 h-20 rounded-xl shadow-lg border-2 border-[#00FFAA]/30 object-cover"
                  />
                </div>
                </motion.div>
              <div className="ml-4 flex-grow">
                <div className="h-[1px] w-full bg-gradient-to-r from-[#00FFAA] to-transparent"></div>
              </div>
            </div>
            
            {/* Modern Typography */}
            <motion.div
              className="max-w-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
            >
              <h1 className="text-5xl lg:text-7xl font-bold mb-4 text-white leading-tight" style={{ fontFamily: 'var(--font-fredoka-one)' }}>
                Base <span className="text-[#ccff13]">Jump</span>
              </h1>
              <motion.p 
                className="text-xl text-white/90 font-light max-w-md leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Jump from platform to platform, collect <span className="text-[#ccff13] font-normal">parsnips</span>, and avoid enemy missiles in this vertical adventure!
              </motion.p>
            </motion.div>
          </motion.div>

        
          {/* Game Button - Only show when wallet is connected */}
          {isConnected && (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.8, type: "spring" }}
            >
              <div className="max-w-full">
                {/* Game Button */}
                <motion.button
                  onClick={handleStartStoneShooter}
                  disabled={isStartingStoneShooter}
                  className={`relative group overflow-hidden bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] text-white font-bold py-4 px-8 rounded-2xl shadow-xl w-full hover:animate-bounce ${isStartingStoneShooter ? 'opacity-50 cursor-not-allowed' : ''}`}
                  whileHover={isStartingStoneShooter ? {} : { 
                    scale: 1.05,
                    y: -2,
                    boxShadow: "0 15px 35px -5px rgba(139, 195, 74, 0.4), 0 0 30px rgba(111, 174, 62, 0.3)"
                  }}
                  whileTap={isStartingStoneShooter ? {} : { scale: 0.95 }}

                  
                  style={{ 
                    boxShadow: '0 10px 25px -5px rgba(139, 195, 74, 0.3), 0 0 20px rgba(111, 174, 62, 0.2)'
                  }}
                >
                  {/* Platform-style background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8BC34A] via-[#6FAE3E] to-[#4CAF50] opacity-90" />
                  
                  {/* Platform texture */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-30" />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                    {isStartingStoneShooter ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span className="font-bold">LOADING...</span>
                        <span className="text-sm opacity-80">GAME STARTING</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faGamepad} className="text-3xl" />
                        <span className="font-bold text-2xl">PLAY NOW</span>
                       
                      </>
                    )}
                  </div>
                  
                  {/* Platform shine effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Protocol Error Display */}
          {stoneShooterError && (
            <motion.div 
              className="mb-8 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border border-red-500 bg-transparent px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-1 h-8 bg-red-500 mr-3"></div>
                    <div>
                      <div className="text-red-500 text-xs font-medium uppercase tracking-wider mb-1">ERROR</div>
                      <span className="text-sm font-light text-white">Something Went Wrong</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStoneShooterError(null)}
                    className="text-red-500 hover:text-red-400 ml-4 h-8 w-8 flex items-center justify-center border border-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Wallet Connection */}
          {!isConnected && (
            <motion.div 
              className="mb-12 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <motion.button
                type="button"
                onClick={() => connect({ connector: connectors[0] })}
                className="w-full bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] text-white font-medium py-5 px-8 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group"
                whileHover={{ 
                  scale: 1.02,
                  y: -1,
                  boxShadow: "0 10px 25px -5px rgba(139, 195, 74, 0.4)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <FontAwesomeIcon icon={faBolt} className="text-white text-xs" />
                </div>
                  <span className="font-medium tracking-wider text-white">CONNECT WALLET</span>
                </div>
                <div className="flex items-center">
                  <div className="h-[1px] w-10 bg-white/50 mr-3"></div>
                  <FontAwesomeIcon icon={faArrowRight} className="text-sm text-white" />
                </div>
                
                {/* Platform shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.button>
            </motion.div>
          )}

          {/* Character Sprite Placeholder */}
          <motion.div 
            className="absolute top-32 right-10 w-24 h-24 opacity-80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-[#8E44AD] to-[#9B59B6] rounded-full shadow-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faGamepad} className="text-white text-3xl" />
            </div>
          </motion.div>

          {/* Stats Dashboard */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <StatsCard 
              icon={faUsers} 
              title="Active Jumpers" 
              value="100" 
              trend="+23%" 
              color="from-cyan-400 via-blue-500 to-purple-600"
            />
            <StatsCard 
              icon={faCoins} 
              title="Rewards Pool" 
              value="3200 DEGEN" 
              trend="LIVE" 
              color="from-purple-500 via-cyan-400 to-green-400"
            />
            <StatsCard 
              icon={faFire} 
              title="Games Today" 
              value="356" 
              trend="+12%" 
              color="from-pink-500 via-purple-500 to-cyan-400"
            />
            <motion.div
              className="relative overflow-hidden bg-white/90 backdrop-blur-sm p-6 text-gray-800 rounded-3xl shadow-lg"
              style={{
                clipPath: 'polygon(0% 20%, 20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%)'
              }}
              whileHover={{ 
                scale: 1.05,
                y: -3,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#8BC34A] to-[#6FAE3E] rounded-full flex items-center justify-center shadow-md">
                    <FontAwesomeIcon icon={faGamepad} className="text-white text-sm" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-[1px] w-8 bg-[#8BC34A]/30 mr-2"></div>
                    <span className="text-xs font-medium text-[#8BC34A] uppercase tracking-wider">Live</span>
                    <motion.button
                      onClick={fetchParsnipsCollected}
                      disabled={isLoadingTxCount}
                      className="w-6 h-6 bg-[#8BC34A]/20 rounded-full flex items-center justify-center hover:bg-[#8BC34A]/30 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FontAwesomeIcon 
                        icon={faRefresh} 
                        className={`text-[#8BC34A] text-xs ${isLoadingTxCount ? 'animate-spin' : ''}`} 
                      />
                    </motion.button>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1 text-gray-800">
                  {isLoadingTxCount ? "Loading..." : tokenTxCount ? tokenTxCount.toLocaleString() : "0"}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wider mt-2 font-medium">Parsnips Collected</div>
              </div>
              
              {/* Cloud-like shadow */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-30" />
            </motion.div>
          </motion.div>

          {/* More Info Button */}
          <motion.div 
            className="flex justify-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <motion.button
              onClick={() => setShowRewardPopup(true)}
              className="w-full bg-gradient-to-r from-[#8BC34A] to-[#6FAE3E] text-white font-medium py-5 px-8 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden group"
              whileHover={{ 
                scale: 1.02,
                y: -1,
                boxShadow: "0 10px 25px -5px rgba(139, 195, 74, 0.4)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-white text-xs" />
                </div>
                <span className="font-medium tracking-wider text-white">MORE INFO</span>
              </div>
              <div className="flex items-center">
                <div className="h-[1px] w-10 bg-white/50 mr-3"></div>
                <FontAwesomeIcon icon={faArrowRight} className="text-sm text-white" />
              </div>
              
              {/* Platform shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.button>
          </motion.div>

        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 px-4 pb-24">
        <motion.div 
          className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <FeatureCard
            icon={faGamepad}
            title="Vertical Adventure"
            description="Jump from platform to platform in this addictive vertical jumper. Navigate through normal, destructive, and invisible platforms!"
            gradient="from-green-400 to-emerald-600"
            delay={0}
          />
          <FeatureCard
            icon={faCoins}
            title="Collect Parsnips"
            description="Collect parsnips for 100 points each and trigger super jumps! Avoid enemy missiles and climb to new heights."
            gradient="from-purple-400 to-indigo-600"
            delay={0.2}
          />
          <FeatureCard
            icon={faTrophy}
            title="Compete & Win"
            description="Climb the leaderboards and compete for massive weekly prize pools in our jumping arena"
            gradient="from-yellow-400 to-orange-600"
            delay={0.4}
          />
        </motion.div>
      </div>
      
      {/* Welcome Popup - One Time Only */}
      <AnimatePresence>
        {showWelcomePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(110, 207, 255, 0.4) 0%, rgba(135, 206, 235, 0.35) 50%, rgba(139, 195, 74, 0.3) 100%)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 4000,
              padding: '20px'
            }}
            onClick={closeWelcomePopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.15) 100%)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderTop: '2px solid rgba(255, 255, 255, 0.7)',
                borderLeft: '2px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '30px',
                padding: '40px 30px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                textAlign: 'center',
                boxShadow: '0 8px 40px 0 rgba(31, 38, 135, 0.4), inset 0 1px 0 rgba(255,255,255,0.6)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)'
              }}
            >
              {/* Animated background elements */}
              <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(139, 195, 74, 0.3) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'pulse 3s ease-in-out infinite'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'pulse 3s ease-in-out infinite 1.5s'
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Hero Icon */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    fontSize: '80px',
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 4px 20px rgba(255,215,0,0.5))'
                  }}
                >
                  🎁
                </motion.div>

                {/* Title */}
                <h2 style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.95) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '16px',
                  textShadow: '0 2px 20px rgba(255,255,255,0.5)',
                  fontFamily: 'var(--font-fredoka-one, system-ui)'
                }}>
                  Welcome to Base Jump! 🚀
                </h2>

                <p style={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '16px',
                  marginBottom: '30px',
                  lineHeight: '1.6',
                  textShadow: '0 1px 10px rgba(0,0,0,0.2)'
                }}>
                  Jump, earn, and win REAL crypto tokens!
                </p>

                {/* Earning Methods */}
                <div style={{ 
                  textAlign: 'left', 
                  marginBottom: '30px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  padding: '24px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontFamily: 'var(--font-fredoka-one, system-ui)'
                  }}>
                    💰 How to Earn Daily Rewards
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Gift Boxes */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(168, 85, 247, 0.4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '28px' }}>🎁</div>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            3 Gift Boxes Every 12 Hours
                          </p>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                            Beat your high score to unlock gift boxes with $DEGEN, $NOICE & $PEPE tokens!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Share Bonus */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(74, 222, 128, 0.4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '28px' }}>📢</div>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            Share & Get +2 Bonus Claims
                          </p>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                            Share the game every 6 hours to earn 2 extra gift box claims!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Follow Bonus */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.2) 100%)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(96, 165, 250, 0.4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '28px' }}>👤</div>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
                            Follow for Exclusive Updates
                          </p>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)' }}>
                            Follow @basejump for special events, airdrops & bonus rewards!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '30px'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>⏰</div>
                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold' }}>
                      12hr Periods
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>💎</div>
                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold' }}>
                      3 Tokens
                    </p>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '12px 8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
                    <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold' }}>
                      High Scores
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={closeWelcomePopup}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    background: 'linear-gradient(135deg, rgb(139, 195, 74), rgb(111, 174, 62))',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(139, 195, 74, 0.5)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(139, 195, 74, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 195, 74, 0.5)';
                  }}
                >
                  Let&apos;s Start Earning! 🚀
                </button>

                <p style={{
                  marginTop: '16px',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontStyle: 'italic'
                }}>
                  Pro tip: Higher scores = Better rewards!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Popup for First-Time Users */}
      {showRewardPopup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
          }}
          onClick={handleCloseRewardPopup}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(90vw, 500px)',
                maxHeight: '85vh',
              borderRadius: '20px',
                padding: '25px',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseRewardPopup}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div 
              className="popup-content-scrollable"
              style={{ 
                textAlign: 'center', 
                color: '#fff',
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                flex: 1,
                overflowY: 'auto',
                paddingRight: '10px',
                paddingTop: '10px'
              }}
            >
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                Welcome to Base Jump! <FontAwesomeIcon icon={faRocket} />
              </h2>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px', lineHeight: '1.5' }}>
                Get ready for epic jumping adventures! Play Base Jump daily and compete for $DEGEN tokens.
              </p>
              
              {/* How to Play Section */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#00FFAA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faGamepad} /> How to Play
                </h3>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBullseye} style={{ marginRight: '8px', color: '#00FFAA', width: '16px' }} />
                    <span><strong>Objective:</strong> Jump from platform to platform and climb as high as possible</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faCarrot} style={{ marginRight: '8px', color: '#FF9800', width: '16px' }} />
                    <span><strong>Collect Parsnips:</strong> Each parsnip gives 100 points and triggers a super jump</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBuilding} style={{ marginRight: '8px', color: '#8BC34A', width: '16px' }} />
                    <span><strong>Platforms:</strong> Normal (stable), Destructive (disappear when landed on), Invisible (hard to see)</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faRocket} style={{ marginRight: '8px', color: '#00DDFF', width: '16px' }} />
                    <span><strong>Controls:</strong> Tilt your phone or use on-screen buttons to move left/right</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px', color: '#FFD700', width: '16px' }} />
                    <span><strong>Avoid:</strong> Enemy missiles and falling off platforms</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBolt} style={{ marginRight: '8px', color: '#FFD700', width: '16px' }} />
                    <span><strong>Scoring:</strong> Points based on height climbed and parsnips collected</span>
                  </div>
                </div>
              </div>
              {/* Competition Rules Section */}
              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '15px', 
                padding: '20px',
                marginBottom: '20px',
                width: '100%'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#FFD700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FontAwesomeIcon icon={faTrophy} /> Competition Rules
                </h3>
                <div style={{ textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faMedal} style={{ marginRight: '8px', color: '#FFD700', width: '16px' }} />
                    <span><strong>Top 10 Only:</strong> Only top 10 players get $DEGEN rewards</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: '8px', color: '#00FFAA', width: '16px' }} />
                    <span><strong>Fair Play:</strong> No cheating or exploiting bugs</span>
                  </div>
                  <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px', color: '#0088FF', width: '16px' }} />
                    <span><strong>One Account:</strong> One wallet per player only</span>
                  </div>
                </div>
              </div>

              {/* Reward Info */}
             
              
              {/* Gift Box System Section */}
              
            </div>
            
            {/* Fixed Button at Bottom */}
            <div style={{ 
              paddingTop: '20px', 
              borderTop: '1px solid rgba(255,255,255,0.1)',
              marginTop: '20px'
            }}>
              <motion.button
                onClick={handleCloseRewardPopup}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  Let&apos;s Start Jumping! <FontAwesomeIcon icon={faRocket} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
      
      <BottomNavbar
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onShowGame={setShowGame} 
        onShowStats={setShowStats} 
        onShowLeaderboard={setShowLeaderboard} 
      />
      
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
        
        .popup-content-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .popup-content-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }
        .popup-content-scrollable::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        .popup-content-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-15px) translateX(3px); }
        }
        
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-8px) translateX(-3px); }
          66% { transform: translateY(-12px) translateX(4px); }
        }
        
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-6px) translateX(2px); }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
        
        /* Bounce animation for buttons */
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-8px,0);
          }
          70% {
            transform: translate3d(0,-4px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }
        
        .hover\:animate-bounce:hover {
          animation: bounce 1s ease-in-out;
        }
      `}</style>
    </div>
  )
}

interface BottomNavbarProps {
  activeTab: 'home' | 'stats' | 'leaderboard'
  onTabChange: (tab: 'home' | 'stats' | 'leaderboard') => void
  onShowGame: (show: boolean) => void
  onShowStats: (show: boolean) => void
  onShowLeaderboard: (show: boolean) => void
}

// Stats Card Component
const StatsCard = ({ icon, title, value, trend, color }: {
  icon: any;
  title: string;
  value: string;
  trend: string;
  color: string;
}) => (
  <motion.div
    className="relative overflow-hidden bg-white/90 backdrop-blur-sm p-6 text-gray-800 rounded-3xl shadow-lg"
    style={{
      clipPath: 'polygon(0% 20%, 20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%)'
    }}
    whileHover={{ 
      scale: 1.05,
      y: -3,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
    }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[#8BC34A] to-[#6FAE3E] rounded-full flex items-center justify-center shadow-md">
          <FontAwesomeIcon icon={icon} className="text-white text-sm" />
        </div>
        <div className="flex items-center">
          <div className="h-[1px] w-8 bg-[#8BC34A]/30 mr-2"></div>
          <span className="text-xs font-medium text-[#8BC34A] uppercase tracking-wider">
            {trend}
          </span>
        </div>
      </div>
      <div className="text-2xl font-bold mb-1 text-gray-800">
        {value}
      </div>
      <div className="text-xs text-gray-600 uppercase tracking-wider mt-2 font-medium">{title}</div>
    </div>
    
    {/* Cloud-like shadow */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-30" />
  </motion.div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, gradient, delay }: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.4 + delay, duration: 0.6 }}
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
      <p className="text-gray-700 font-medium leading-relaxed text-sm">{description}</p>
      
      {/* Cloud-like shadow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-30" />
      
      {/* Hover effect */}
      <div className="absolute bottom-0 left-0 h-0 w-full bg-[#8BC34A]/10 group-hover:h-full transition-all duration-500 ease-in-out rounded-b-3xl" />
    </div>
  </motion.div>
);

function BottomNavbar({ activeTab, onTabChange, onShowGame, onShowStats, onShowLeaderboard }: BottomNavbarProps) {
  const handleTabClick = (tab: 'home' | 'stats' | 'leaderboard') => {
    onTabChange(tab)
    
    switch (tab) {
      case 'stats':
        onShowGame(false)
        onShowStats(true)
        onShowLeaderboard(false)
        break
      case 'leaderboard':
        onShowGame(false)
        onShowStats(false)
        onShowLeaderboard(true)
        break
      case 'home':
      default:
        onShowGame(false)
        onShowStats(false)
        onShowLeaderboard(false)
        break
    }
  }

  const tabs = [
    { id: 'home', icon: faHome, label: 'Home', color: 'from-[#8BC34A] to-[#6FAE3E]' },
    { id: 'stats', icon: faChartBar, label: 'Analytics', color: 'from-[#8BC34A] to-[#6FAE3E]' },
    { id: 'leaderboard', icon: faTrophy, label: 'Champions', color: 'from-[#8BC34A] to-[#6FAE3E]' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
              <div 
          className="relative overflow-hidden border-t border-l border-r border-[#8BC34A]/20 backdrop-blur-md mx-auto max-w-md rounded-t-3xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          {/* Cloud-like background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(139, 195, 74, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(111, 174, 62, 0.3) 0%, transparent 50%)',
          }}></div>
        
        <div className="relative z-10 flex justify-around items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as any)}
                className="relative flex flex-col items-center justify-center px-5 py-4 transition-all duration-300 border-b-2"
                style={{
                  borderColor: isActive ? '#8BC34A' : 'transparent'
                }}
                whileHover={{ backgroundColor: "rgba(139, 195, 74, 0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon */}
                <motion.div
                  animate={{
                    color: isActive ? '#8BC34A' : 'rgba(0, 0, 0, 0.6)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <FontAwesomeIcon 
                    icon={tab.icon} 
                    className="text-sm mb-1 relative z-10" 
                  />
                </motion.div>
                
                {/* Label */}
                <motion.div 
                  className="text-[10px] uppercase tracking-wider relative z-10"
                  animate={{
                    color: isActive ? '#8BC34A' : 'rgba(0, 0, 0, 0.6)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {tab.label}
                </motion.div>
                
                {/* Active indicator line */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#8BC34A]"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  )
}
