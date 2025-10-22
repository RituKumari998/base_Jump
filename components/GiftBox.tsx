'use client'

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faCoins, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAccount } from 'wagmi';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import { authenticatedFetch } from '@/lib/auth';
import { useContractWrite, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES,BASE_JUMP_ABI } from '@/lib/contracts';
import { APP_URL } from '@/lib/constants';

interface GiftBoxProps {
  onClose: () => void;
  onClaimComplete: () => void;
}

interface GiftBoxReward {
  tokenType: 'degen' | 'noice' | 'pepe' | 'based' | 'none';
  amount: number;
  amountInWei?: string;
  signature?: string;
  claimsToday: number;
  remainingClaims: number;
}

export default function GiftBox({ onClose, onClaimComplete }: GiftBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<GiftBoxReward | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReward, setShowReward] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { address } = useAccount();
  const { context, actions } = useMiniAppContext();
  
  // Blockchain transaction for claiming tokens
  const { writeContract: writeClaimToken, data: claimTx, isSuccess: claimSuccess, isError: claimError, error: claimErrorObj } = useContractWrite();
  const { isLoading: isClaimLoading, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({ hash: claimTx });

  // Share winning reward on Farcaster
  const shareWinning = async (reward: GiftBoxReward) => {
    if (!actions) {
      console.error('Farcaster actions not available');
      return;
    }

    try {
      const username = context?.user?.username || 'Anonymous Player';
      const tokenInfo = getTokenInfo(reward.tokenType);
      
      let shareMessage = '';
      
      if (reward.tokenType === 'none') {
        shareMessage = `Just opened a Base Jump gift box!\n\nBetter luck next time... but I'm not giving up!\n\nCome play and test your luck!`;
      } else {
        shareMessage = `Just WON ${reward.amount.toLocaleString()} ${tokenInfo.name} tokens from a Base Jump gift box!\n\nThis game is FIRE! Who else is ready to claim some rewards?\n\nCome play and get your bag!`;
      }


      await actions.composeCast({
        text: shareMessage,
        embeds: [APP_URL || "https://chain-crush-black.vercel.app/"]
      });
      
      console.log('Successfully shared winning on Farcaster!');
    } catch (error) {
      console.error('Failed to share winning:', error);
    }
  };

  const openGiftBox = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsOpening(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/claim-gift-box', {
        method: 'POST',
        body: JSON.stringify({
          userAddress: address,
          fid: context?.user?.fid
        })
      });

      const result = await response.json();

      if (result.success) {
        setReward(result);
        setShowReward(true);
      } else {
        setError(result.error || 'Failed to claim gift box');
      }
    } catch (error) {
      console.error('Error claiming gift box:', error);
      setError('Failed to claim gift box');
    } finally {
      setIsOpening(false);
    }
  };

  const claimToken = async () => {
    if (!reward || reward.tokenType === 'none' || !reward.signature) {
      // For "Better Luck Next Time" rewards, share on Farcaster before completing
      if (reward && reward.tokenType === 'none') {
        await shareWinning(reward);
      }
      onClaimComplete();
      return;
    }

    setIsClaiming(true);
    setError(null);

    try {
      const tokenAddress = getTokenAddress(reward.tokenType);
      const amountInWei = BigInt(reward.amountInWei || '0');
      console.log(tokenAddress, amountInWei, reward.signature)
      console.log('Claiming token with:', {
        tokenAddress,
        amountInWei,
        signature: reward.signature
      });
      
      writeClaimToken({
        address: CONTRACT_ADDRESSES.BASE_JUMP as `0x${string}`,
        abi: BASE_JUMP_ABI,
        functionName: 'claimTokenReward',
        args: [tokenAddress, amountInWei, reward.signature]
      });
    } catch (error) {
      console.error('Error claiming token:', error);
      setError('Failed to claim token');
      setIsClaiming(false);
    }
  };

  // Handle successful token claim
  useEffect(() => {
    if (isClaimConfirmed && isClaiming && reward) {
      setIsClaiming(false);
      setShowSuccess(true);
      
      // Share the winning on Farcaster
      shareWinning(reward);
      
      // Auto close success popup after 3 seconds
      setTimeout(() => {
        onClaimComplete();
      }, 5000);
    }
  }, [isClaimConfirmed, isClaiming, onClaimComplete, reward]);

  // Handle token claim error
  useEffect(() => {
    if (claimError && isClaiming) {
      setError(claimErrorObj?.message || 'Token claim failed');
      setIsClaiming(false);
    }
  }, [claimError, claimErrorObj, isClaiming]);

  const getTokenAddress = (tokenType: 'degen' | 'noice' | 'pepe' | 'based' | 'none'): string => {
    switch (tokenType) {
      case 'degen':
        return process.env.NEXT_PUBLIC_DEGEN_TOKEN_ADDRESS || '0x4ed4e862860bed51a9570b96d89af5e1b0efefed';
      case 'noice':
        return process.env.NEXT_PUBLIC_NOICE_TOKEN_ADDRESS || '0x9cb41fd9dc6891bae8187029461bfaadf6cc0c69';
      case 'pepe':
        return process.env.NEXT_PUBLIC_PEPE_TOKEN_ADDRESS || '0x52b492a33e447cdb854c7fc19f1e57e8bfa1777d';
      case 'based':
        return process.env.NEXT_PUBLIC_BASED_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
      case 'none':
        throw new Error('Cannot get token address for "none" type');
      default:
        throw new Error('Invalid token type');
    }
  };

  const getTokenInfo = (tokenType: 'degen' | 'noice'  | 'pepe' | 'based' | 'none') => {
    switch (tokenType) {
      case 'degen':
        return { name: '$DEGEN', color: 'text-purple-400', icon: '/candy/degen.jpg' };
      case 'noice':
        return { name: '$NOICE', color: 'text-blue-400', icon: '/candy/noice.png' };
      case 'pepe':
        return { name: '$PEPE', color: 'text-green-400', icon: '/candy/pepe.jpg' };
      case 'based':
        return { name: '$BASED', color: 'text-orange-400', icon: '/candy/based.jpg' };
      case 'none':
        return { name: 'Better Luck Next Time!', color: 'text-gray-400', icon: '😔' };
      default:
        return { name: 'Unknown', color: 'text-gray-400', icon: '❓' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, rgba(110, 207, 255, 0.35) 0%, rgba(135, 206, 235, 0.3) 50%, rgba(139, 195, 74, 0.25) 100%)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.3s ease-in'
    }}>
      {/* Floating decorative elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float-slow 8s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '80px',
        height: '80px',
        background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float-medium 6s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.2) 100%)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        borderTop: '2px solid rgba(255, 255, 255, 0.7)',
        borderLeft: '2px solid rgba(255, 255, 255, 0.6)',
        borderRadius: '30px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 40px 0 rgba(31, 38, 135, 0.35), inset 0 1px 0 rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        overflow: 'hidden'
      }}>
        {/* Shimmer effect */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
          animation: 'shimmer 3s ease-in-out infinite',
          transform: 'rotate(45deg)',
          pointerEvents: 'none'
        }} />
        
        {/* Bottom gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '40%',
          background: 'linear-gradient(0deg, rgba(139, 195, 74, 0.15) 0%, transparent 100%)',
          borderRadius: '0 0 30px 30px',
          pointerEvents: 'none'
        }} />
        
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'white',
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {showSuccess ? (
          // Success State
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 30px',
              background: 'radial-gradient(circle, rgba(74, 222, 128, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <div style={{ fontSize: '60px', color: 'rgb(74, 222, 128)' }}>
                <FontAwesomeIcon icon={faCheck} />
              </div>
            </div>
            
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '16px',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontFamily: 'var(--font-fredoka-one, system-ui)'
            }}>
              Successfully Claimed!
            </h2>
            
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              marginBottom: '20px',
              fontSize: '16px',
              textShadow: '0 1px 5px rgba(0,0,0,0.1)'
            }}>
              Your {reward!.amount.toLocaleString()} {getTokenInfo(reward!.tokenType).name} tokens have been claimed!
            </p>
            
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)',
              border: '1.5px solid rgba(74, 222, 128, 0.4)',
              backdropFilter: 'blur(10px)',
              color: 'rgb(134, 239, 172)',
              padding: '14px 18px',
              borderRadius: '16px',
              marginBottom: '28px',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)'
            }}>
              <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
              Transaction confirmed on blockchain
            </div>

            <button
              onClick={onClaimComplete}
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '18px',
                background: 'linear-gradient(135deg, rgb(139, 195, 74), rgb(111, 174, 62))',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                boxShadow: '0 6px 25px rgba(139, 195, 74, 0.4)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(139, 195, 74, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 195, 74, 0.4)';
              }}
            >
              <FontAwesomeIcon icon={faCheck} style={{ marginRight: '8px' }} />
              Continue
            </button>
          </div>
        ) : !showReward ? (
          // Gift Box Closed State
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 30px',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isOpening ? 'spin 2s linear infinite' : 'pulse 2s ease-in-out infinite'
            }}>
              <div style={{ fontSize: '70px', color: 'white', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                <FontAwesomeIcon icon={faGift} />
              </div>
            </div>
            
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '16px',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontFamily: 'var(--font-fredoka-one, system-ui)'
            }}>
              {isOpening ? 'Opening Gift Box...' : 'Congratulations!'}
            </h2>
            
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              marginBottom: '24px',
              fontSize: '16px',
              textShadow: '0 1px 5px rgba(0,0,0,0.1)'
            }}>
              {isOpening 
                ? 'Your reward is being generated...' 
                : 'You\'ve earned a gift box! Click to open and claim your reward.'
              }
            </p>

            {error && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.2) 100%)',
                border: '1.5px solid rgba(248, 113, 113, 0.4)',
                backdropFilter: 'blur(10px)',
                color: 'rgb(252, 165, 165)',
                padding: '14px 18px',
                borderRadius: '16px',
                marginBottom: '24px',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
              }}>
                Something went wrong
              </div>
            )}

            <button
              onClick={openGiftBox}
              disabled={isOpening}
              style={{
                width: '100%',
                padding: '18px 24px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '18px',
                transition: 'all 0.3s',
                cursor: isOpening ? 'not-allowed' : 'pointer',
                background: isOpening 
                  ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.6), rgba(75, 85, 99, 0.6))' 
                  : 'linear-gradient(135deg, rgb(147, 51, 234), rgb(168, 85, 247))',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: isOpening ? 'none' : '0 6px 25px rgba(147, 51, 234, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isOpening) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(147, 51, 234, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isOpening) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(147, 51, 234, 0.4)';
                }
              }}
            >
              {isOpening ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '12px'
                  }}></div>
                  Opening...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <FontAwesomeIcon icon={faGift} />
                  Open Gift Box
                </div>
              )}
            </button>
          </div>
        ) : (
          // Gift Box Opened State
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              marginBottom: '30px',
              width: '120px',
              height: '120px',
              margin: '0 auto 30px',
              background: reward!.tokenType !== 'none' 
                ? `radial-gradient(circle, ${
                    reward!.tokenType === 'degen' ? 'rgba(196, 181, 253, 0.3)' :
                    reward!.tokenType === 'noice' ? 'rgba(96, 165, 250, 0.3)' :
                    reward!.tokenType === 'based' ? 'rgba(255, 159, 67, 0.3)' :
                    'rgba(74, 222, 128, 0.3)'
                  } 0%, transparent 70%)`
                : 'radial-gradient(circle, rgba(156, 163, 175, 0.2) 0%, transparent 70%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              {reward!.tokenType !== 'none' ? (
                <img 
                  src={getTokenInfo(reward!.tokenType).icon} 
                  alt={getTokenInfo(reward!.tokenType).name}
                  style={{ 
                    width: '90px', 
                    height: '90px', 
                    objectFit: 'cover', 
                    borderRadius: '50%',
                    border: '3px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                  }}
                />
              ) : (
                <div style={{ fontSize: '70px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  <FontAwesomeIcon icon={faTimes} />
                </div>
              )}
            </div>

            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontFamily: 'var(--font-fredoka-one, system-ui)',
              color: reward!.tokenType === 'degen' ? 'rgb(196, 181, 253)' :
                     reward!.tokenType === 'noice' ? 'rgb(96, 165, 250)' :
                     reward!.tokenType === 'pepe' ? 'rgb(74, 222, 128)' :
                     reward!.tokenType === 'based' ? 'rgb(255, 159, 67)' :
                     'white'
            }}>
              {getTokenInfo(reward!.tokenType).name}
            </h2>

            {reward!.tokenType !== 'none' && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ 
                  fontSize: '42px', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  marginBottom: '8px',
                  textShadow: '0 3px 15px rgba(0,0,0,0.3)',
                  fontFamily: 'var(--font-fredoka-one, system-ui)'
                }}>
                  {reward!.amount.toLocaleString()}
                </div>
                <div style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '16px',
                  textShadow: '0 1px 5px rgba(0,0,0,0.1)'
                }}>
                  {getTokenInfo(reward!.tokenType).name} Tokens
                </div>
              </div>
            )}

            <div style={{ 
              marginBottom: '28px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '12px 20px',
                flex: 1
              }}>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  Claimed Today
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                  {reward!.claimsToday}/3
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '12px 20px',
                flex: 1
              }}>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
                  Remaining
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                  {reward!.remainingClaims}
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.2) 100%)',
                border: '1.5px solid rgba(248, 113, 113, 0.4)',
                backdropFilter: 'blur(10px)',
                color: 'rgb(252, 165, 165)',
                padding: '14px 18px',
                borderRadius: '16px',
                marginBottom: '24px',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)'
              }}>
                Something went wrong
              </div>
            )}

            <button
               onClick={claimToken}
               disabled={isClaiming || isClaimLoading}
               style={{
                 width: '100%',
                 padding: '18px 24px',
                 borderRadius: '20px',
                 fontWeight: 'bold',
                 fontSize: '18px',
                 transition: 'all 0.3s',
                 cursor: (isClaiming || isClaimLoading) ? 'not-allowed' : 'pointer',
                 background: (isClaiming || isClaimLoading)
                   ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.6), rgba(75, 85, 99, 0.6))' 
                   : reward!.tokenType === 'none'
                   ? 'linear-gradient(135deg, rgb(139, 195, 74), rgb(111, 174, 62))'
                   : 'linear-gradient(135deg, rgb(34, 197, 94), rgb(16, 185, 129))',
                 color: 'white',
                 border: '2px solid rgba(255, 255, 255, 0.3)',
                 boxShadow: (isClaiming || isClaimLoading) ? 'none' : '0 6px 25px rgba(34, 197, 94, 0.4)',
                 position: 'relative',
                 overflow: 'hidden'
               }}
               onMouseEnter={(e) => {
                 if (!isClaiming && !isClaimLoading) {
                   e.currentTarget.style.transform = 'translateY(-2px)';
                   e.currentTarget.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.6)';
                 }
               }}
               onMouseLeave={(e) => {
                 if (!isClaiming && !isClaimLoading) {
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '0 6px 25px rgba(34, 197, 94, 0.4)';
                 }
               }}
             >
               {isClaiming || isClaimLoading ? (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{
                     width: '20px',
                     height: '20px',
                     border: '3px solid rgba(255,255,255,0.3)',
                     borderTop: '3px solid white',
                     borderRadius: '50%',
                     animation: 'spin 1s linear infinite',
                     marginRight: '12px'
                   }}></div>
                   Claiming...
                 </div>
               ) : reward!.tokenType === 'none' ? (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   <FontAwesomeIcon icon={faCheck} />
                   Continue
                 </div>
               ) : (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   <FontAwesomeIcon icon={faCoins} />
                   Claim Tokens
                 </div>
               )}
             </button>
          </div>
        )}
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(100%) rotate(45deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(15px) translateX(-10px); }
        }
      `}</style>
    </div>
  );
}
