'use client'

import { useEffect, useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUsers, faUserCheck, faTrophy, faCoins, 
  faRocket, faCrown, faBolt, faGamepad,
  faChartLine, faFire, faBullseye, faArrowLeft
} from '@fortawesome/free-solid-svg-icons'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  displayName: string
  username: string
  pfpUrl?: string
  score: number
  gamesPlayed: number
  totalRewards: number
  rank: number
  isOnline: boolean
  joinDate: string
}

// Mock users data - replace with your actual data source
const mockUsers: User[] = [
  {
    id: '1',
    displayName: 'CryptoGamer',
    username: 'cryptogamer',
    pfpUrl: '/images/avatar1.png',
    score: 15420,
    gamesPlayed: 87,
    totalRewards: 42.5,
    rank: 1,
    isOnline: true,
    joinDate: '2024-01-15'
  },
  {
    id: '2',
    displayName: 'MemeCoin Hunter',
    username: 'memehunter',
    pfpUrl: '/images/avatar2.png',
    score: 13850,
    gamesPlayed: 73,
    totalRewards: 38.2,
    rank: 2,
    isOnline: false,
    joinDate: '2024-01-20'
  },
  {
    id: '3',
    displayName: 'BlockchainMaster',
    username: 'blockmaster',
    pfpUrl: '/images/avatar3.png',
    score: 12990,
    gamesPlayed: 65,
    totalRewards: 35.7,
    rank: 3,
    isOnline: true,
    joinDate: '2024-02-01'
  },
  {
    id: '4',
    displayName: 'NFT Collector',
    username: 'nftcollector',
    pfpUrl: '/images/avatar4.png',
    score: 11200,
    gamesPlayed: 58,
    totalRewards: 29.8,
    rank: 4,
    isOnline: true,
    joinDate: '2024-02-10'
  },
  {
    id: '5',
    displayName: 'WAGMI Warrior',
    username: 'wagmiwarrior',
    pfpUrl: '/images/avatar5.png',
    score: 10500,
    gamesPlayed: 52,
    totalRewards: 27.3,
    rank: 5,
    isOnline: false,
    joinDate: '2024-02-15'
  }
]

interface UsersPageProps {
  onBack?: () => void
}

export function UsersPage({ onBack }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'top'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Star data for animated background (same as home page)
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

  // Filter users based on selected filter and search query
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply filter
    switch (selectedFilter) {
      case 'online':
        filtered = filtered.filter(user => user.isOnline);
        break;
      case 'top':
        filtered = filtered.filter(user => user.rank <= 10);
        break;
      default:
        break;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [users, selectedFilter, searchQuery]);

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
        {/* Header */}
        <motion.div
          className="pt-12 pb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring" }}
        >
          {/* Back button and title */}
          <div className="flex items-center mb-8">
            {onBack && (
              <motion.button
                onClick={onBack}
                className="w-10 h-10 border border-[#00FFAA]/30 flex items-center justify-center mr-4 hover:bg-[#00FFAA]/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-[#00FFAA]" />
              </motion.button>
            )}
            
            <div className="flex items-center w-full">
              <motion.div
                className="relative mr-4"
                whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <div className="w-16 h-16 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00FFAA] to-[#0088FF] rounded-xl blur-lg opacity-40 animate-pulse"></div>
                  <div className="relative w-16 h-16 rounded-xl shadow-lg border-2 border-[#00FFAA]/30 bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUsers} className="text-2xl text-white" />
                  </div>
                </div>
              </motion.div>
              
              <div className="flex-grow">
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Players <span className="text-[#00FFAA]">Hub</span>
                </h1>
                <p className="text-lg text-white/70 font-light mt-2">
                  Meet the <span className="text-[#00FFAA] font-normal">Base Jump</span> community
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <StatsCard icon={faUsers} title="Total Players" value="102" trend="+23%" />
            <StatsCard icon={faUserCheck} title="Online Now" value="347" trend="LIVE" />
            <StatsCard icon={faTrophy} title="Top Score" value="15.4K" trend="NEW" />
            <StatsCard icon={faCoins} title="Total Rewards" value="892 ARB" trend="+15%" />
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            className="flex flex-col md:flex-row gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-[#00FFAA]/30 text-white placeholder-white/50 px-4 py-3 rounded-md focus:border-[#00FFAA] focus:outline-none backdrop-blur-sm"
              />
              <FontAwesomeIcon 
                icon={faBullseye} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#00FFAA]/50" 
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All Players', icon: faUsers },
                { key: 'online', label: 'Online', icon: faBolt },
                { key: 'top', label: 'Top 10', icon: faTrophy }
              ].map((filter) => (
                <motion.button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key as any)}
                  className={`px-4 py-3 border transition-all duration-300 flex items-center gap-2 ${
                    selectedFilter === filter.key
                      ? 'border-[#00FFAA] bg-[#00FFAA]/10 text-[#00FFAA]'
                      : 'border-[#00FFAA]/30 bg-black/20 text-white/70 hover:border-[#00FFAA]/50'
                  } backdrop-blur-sm`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FontAwesomeIcon icon={filter.icon} className="text-sm" />
                  <span className="text-sm font-medium">{filter.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Users Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {filteredUsers.map((user, index) => (
            <UserCard key={user.id} user={user} index={index} />
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 border border-[#00FFAA]/30 flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} className="text-3xl text-[#00FFAA]/50" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No Players Found</h3>
            <p className="text-white/60">Try adjusting your search or filters</p>
          </motion.div>
        )}
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
  )
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

// User Card Component
const UserCard = ({ user, index }: { user: User; index: number }) => (
  <motion.div
    className="relative group"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.8 + (index * 0.1), duration: 0.6 }}
  >
    <div 
      className="relative overflow-hidden border border-[#00FFAA]/40 backdrop-blur-sm p-6 h-full hover:border-[#00FFAA]/60 transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Online Status */}
      {user.isOnline && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-[#00FFAA] rounded-full animate-pulse">
          <div className="absolute inset-0 bg-[#00FFAA] rounded-full animate-ping opacity-75"></div>
        </div>
      )}

      {/* Rank Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-8 h-8 border border-[#00FFAA] flex items-center justify-center text-xs font-bold text-[#00FFAA]">
          #{user.rank}
        </div>
        {user.rank <= 3 && (
          <FontAwesomeIcon 
            icon={faCrown} 
            className={`text-sm ${
              user.rank === 1 ? 'text-yellow-400' : 
              user.rank === 2 ? 'text-gray-300' : 
              'text-orange-400'
            }`} 
          />
        )}
      </div>

      {/* User Avatar */}
      <div className="flex flex-col items-center mb-6 mt-8">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full border-2 border-[#00FFAA]/50 overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600">
            {user.pfpUrl ? (
              <img 
                src={user.pfpUrl} 
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-2xl text-white" />
              </div>
            )}
          </div>
          {user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00FFAA] rounded-full border-2 border-black flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
        </div>

        <h3 className="text-lg font-medium text-white mb-1">{user.displayName}</h3>
        <p className="text-sm text-[#00FFAA]/80">@{user.username}</p>
      </div>

      {/* User Stats */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60 flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} />
            Score
          </span>
          <span className="text-lg font-bold text-[#00FFAA]">{user.score.toLocaleString()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60 flex items-center gap-2">
            <FontAwesomeIcon icon={faGamepad} />
            Games
          </span>
          <span className="text-white">{user.gamesPlayed}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-white/60 flex items-center gap-2">
            <FontAwesomeIcon icon={faCoins} />
            Rewards
          </span>
          <span className="text-white">{user.totalRewards} ARB</span>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute bottom-0 left-0 h-0 w-full bg-[#00FFAA]/5 group-hover:h-full transition-all duration-500 ease-in-out" />
      
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-10 h-[1px] bg-[#00FFAA]/30" />
      <div className="absolute top-0 right-0 h-10 w-[1px] bg-[#00FFAA]/30" />
    </div>
  </motion.div>
);
