'use client'

import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import { WagmiProvider, useAccount, useDisconnect, useSwitchChain } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { base } from 'wagmi/chains'
import { config } from '@/components/wallet-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { authenticatedFetch } from '@/lib/auth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBolt, faGift, faBell, faCheckCircle } from '@fortawesome/free-solid-svg-icons'

// Wallet connection component
function WalletConnectSection() {
  const { address, isConnected, chain } = useAccount()
  const { open } = useAppKit()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Check if user is on the correct chain
  const isOnBaseChain = chain?.id === base.id

  const handleWaitlistSubmit = async () => {
    if (!name.trim() || !address) return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response =  await authenticatedFetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          name: name.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setName('')
      } else {
        setSubmitStatus('error')
        setErrorMessage(data.error || 'Failed to join waitlist')
      }
    } catch (error) {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header Message with Enhanced Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-2xl">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-3 rounded-2xl shadow-lg animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2 text-center bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Web Version Coming Soon!
          </h2>
          <p className="text-sm text-white/90 text-center leading-relaxed">
            Join our exclusive waitlist and be among the first to experience the web version
          </p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <button
            onClick={() => open()}
            className="group relative w-full bg-gradient-to-r from-[#3b99fc] via-[#4f7eea] to-[#667eea] hover:from-[#2c7ac4] hover:via-[#3d5fb8] hover:to-[#5a67d8] text-white font-bold py-5 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden"
          >
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="relative flex items-center justify-center space-x-3">
              <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-lg">Connect Wallet to Join</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
          
          {/* Benefits Section */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl mb-1">
                <FontAwesomeIcon icon={faBolt} className="text-yellow-300" />
              </div>
              <p className="text-xs text-white/80 font-medium">Early Access</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl mb-1">
                <FontAwesomeIcon icon={faGift} className="text-pink-300" />
              </div>
              <p className="text-xs text-white/80 font-medium">Exclusive Perks</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
              <div className="text-2xl mb-1">
                <FontAwesomeIcon icon={faBell} className="text-blue-300" />
              </div>
              <p className="text-xs text-white/80 font-medium">First to Know</p>
            </div>
          </div>
        </div>
      ) : submitStatus === 'success' ? (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-teal-500/30 backdrop-blur-md rounded-2xl p-8 text-white border-2 border-green-400/60 shadow-2xl">
            {/* Confetti-like decorations */}
            <div className="absolute top-2 left-4 w-3 h-3 bg-yellow-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
            <div className="absolute top-8 right-8 w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{animationDelay: '200ms'}} />
            <div className="absolute bottom-4 left-8 w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '400ms'}} />
            <div className="absolute bottom-8 right-4 w-3 h-3 bg-purple-300 rounded-full animate-bounce" style={{animationDelay: '600ms'}} />
            
            <div className="relative flex flex-col items-center justify-center">
              <div className="bg-green-400/30 p-4 rounded-full mb-4 animate-pulse">
                <svg className="w-20 h-20 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-center mb-3 text-white flex items-center justify-center gap-2">
                You&apos;re In! <FontAwesomeIcon icon={faCheckCircle} className="text-green-300" />
              </h3>
              <p className="text-base text-center text-green-50 leading-relaxed mb-2">
                Welcome to the Base Jump waitlist!
              </p>
              <p className="text-sm text-center text-green-100/80">
                We&apos;ll notify you when the web version launches
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              disconnect()
              setSubmitStatus('idle')
            }}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 border border-white/30"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
          {/* Connected Wallet Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-md rounded-2xl p-5 text-white border border-white/40 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                <p className="text-sm font-semibold opacity-90">Connected Wallet</p>
              </div>
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-mono text-base break-all bg-black/20 px-3 py-2 rounded-lg border border-white/20">
              {address?.slice(0, 8)}...{address?.slice(-6)}
            </p>
          </div>

          {/* Chain Switch Warning */}
          {!isOnBaseChain && (
            <div className="bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/60 animate-in fade-in duration-300">
              <div className="flex items-start space-x-3 mb-3">
                <svg className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-white font-bold mb-1">Wrong Network</p>
                  <p className="text-white/90 text-sm mb-3">Please switch to Base network to continue</p>
                  <button
                    onClick={() => switchChain({ chainId: base.id })}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Switch to Base</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Name Input with Enhanced Styling */}
          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center space-x-2 text-sm font-semibold text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Your Name</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-5 py-4 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-white/30 focus:border-white/60 transition-all duration-300 font-medium"
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message with Better Design */}
          {submitStatus === 'error' && (
            <div className="bg-gradient-to-r from-red-500/30 to-pink-500/30 backdrop-blur-sm rounded-2xl p-4 text-white border-2 border-red-400/60 shadow-lg animate-in fade-in shake duration-300">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Button with Enhanced Design */}
          <button
            onClick={handleWaitlistSubmit}
            disabled={!name.trim() || isSubmitting || !isOnBaseChain}
            className="group relative w-full bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] hover:from-[#0d9668] hover:via-[#047857] hover:to-[#065f46] disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none transition-all duration-300 overflow-hidden"
          >
            {/* Animated shine effect */}
            {!isSubmitting && name.trim() && isOnBaseChain && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
            
            <div className="relative flex items-center justify-center space-x-3">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-lg">Joining Waitlist...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span className="text-lg">Join Waitlist</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </div>
          </button>

          <button
            onClick={() => disconnect()}
            className="w-full bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-600 hover:to-red-700 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-red-400/30"
            disabled={isSubmitting}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Disconnect Wallet</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const queryClient = useMemo(() => new QueryClient(), [])

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 space-y-8 bg-gradient-to-b from-[#6ECFFF] to-[#87CEEB] overflow-hidden">
          {/* Floating clouds background */}
          <div className="absolute -top-8 left-6 w-40 h-16 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
          <div className="absolute top-10 right-10 w-56 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
          <div className="absolute bottom-16 left-10 w-48 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
          <div className="absolute -bottom-6 right-8 w-32 h-14 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />

          <div className="relative">
            {/* Centered icon with scaling animation */}
            <div className="w-32 h-32 flex items-center justify-center">
              <Image 
                src="/images/icon.jpg" 
                alt="Base Jump" 
                width={96}
                height={96}
                className="w-24 h-24 rounded-[20px] animate-[iconScale_2s_ease-in-out_infinite]"
              />
            </div>
          </div>
        
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded) {
    return (
          <SafeAreaContainer insets={context?.client.safeAreaInsets}>
            <div className="relative flex w-full min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-[#6ECFFF] to-[#87CEEB] overflow-hidden">
              {/* Floating clouds background */}
              <div className="absolute -top-8 left-6 w-40 h-16 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
              <div className="absolute top-10 right-10 w-56 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
              <div className="absolute bottom-16 left-10 w-48 h-20 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />
              <div className="absolute -bottom-6 right-8 w-32 h-14 bg-white/90 rounded-full blur-[1px] opacity-80 animate-pulse" />

              <div className="relative max-w-md w-full text-center space-y-8">
                {/* Main Message */}
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-white-100">
                    Base Jump Mini App
                  </h1>
                </div>

                {/* Wallet Connect Section */}
                <WalletConnectSection />

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/30"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-white/70">or</span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open('https://farcaster.xyz/~/mini-apps/launch?domain=base-jump-five.vercel.app', '_blank')
                      }
                    }}
                    className="w-full bg-gradient-to-r from-[#19adff] to-[#667eea] hover:from-[#1590d4] hover:to-[#5a67d8] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256" fill="none" style={{display: 'inline-block', verticalAlign: 'middle'}}><rect width="256" height="256" rx="56" fill="#7C65C1"></rect><path d="M183.296 71.68H211.968L207.872 94.208H200.704V180.224L201.02 180.232C204.266 180.396 206.848 183.081 206.848 186.368V191.488L207.164 191.496C210.41 191.66 212.992 194.345 212.992 197.632V202.752H155.648V197.632C155.648 194.345 158.229 191.66 161.476 191.496L161.792 191.488V186.368C161.792 183.081 164.373 180.396 167.62 180.232L167.936 180.224V138.24C167.936 116.184 150.056 98.304 128 98.304C105.944 98.304 88.0638 116.184 88.0638 138.24V180.224L88.3798 180.232C91.6262 180.396 94.2078 183.081 94.2078 186.368V191.488L94.5238 191.496C97.7702 191.66 100.352 194.345 100.352 197.632V202.752H43.0078V197.632C43.0078 194.345 45.5894 191.66 48.8358 191.496L49.1518 191.488V186.368C49.1518 183.081 51.7334 180.396 54.9798 180.232L55.2958 180.224V94.208H48.1278L44.0318 71.68H72.7038V54.272H183.296V71.68Z" fill="white"></path></svg>

                    <span>Open in Farcaster</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  
                  {/* Alternative text */}
                  <p className="text-white-500 text-xs">
                    Don&apos;t have Farcaster? 
                    <a 
                      href="https://www.farcaster.xyz/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:underline ml-1 font-medium"
                    >
                      Get it here
                    </a>
                  </p>
                </div>

                {/* Features Preview */}
              
              </div>
            </div>
          </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <Demo />
        </QueryClientProvider>
      </WagmiProvider>
    </SafeAreaContainer>
  )
}
