'use client'

import { useDeferredValue, useState } from 'react'
import { useReadContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'
import { formatEther, parseEther } from 'viem'
import { simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/config/wagmi';

interface MarketCardProps {
  marketId: number
}

export function MarketCard({ marketId }: MarketCardProps) {
  const { address } = useAccount()
  const [betAmount, setBetAmount] = useState('0.1')
  const [isPending, setIsPending] = useState(false);

  const { data: marketData, isError, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMarketInfo',
    args: [BigInt(marketId)],
    onError: (error) => {
      console.error('Error fetching market:', error)
    }
  })


  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p>Loading market data...</p>
      </div>
    )
  }

  if (isError || !marketData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-red-500">
        <p>Error loading market data</p>
      </div>
    )
  }

  const [
    description = '',
    poolA = 0n,
    poolB = 0n,
    outcome = 0n,
    status = 0,
    endTime = 0n
  ] = Array.isArray(marketData) && marketData.length >= 6 
      ? marketData as unknown as [string, bigint, bigint, number, number, bigint]
      : ['', 0n, 0n, 0, 0, 0n];

  // Market status mapping
  const MarketStatus = {
    OPEN: 0,
    CLOSED: 1,
    RESOLVED: 2
  }
  
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const endTimeSeconds = Number(endTime)
  const timeRemaining = endTimeSeconds - currentTimestamp
  
  const isOpen = status === MarketStatus.OPEN
  const hasEnded = timeRemaining <= 0
  const isResolved = status === MarketStatus.RESOLVED

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Ended'
    const days = Math.floor(seconds / (24 * 3600))
    const hours = Math.floor((seconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  const safeFormatEther = (value: bigint | undefined) => {
    try {
      return value ? formatEther(value) : '0'
    } catch (error) {
      console.error('Error formatting ether:', error)
      return '0'
    }
  }

  const handlePlaceBet = async (outcome: 1n | 2n) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected')
      }
      setIsPending(true)
      const { request } = await simulateContract(config, {
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'placeBet',
        args: [BigInt(marketId), outcome],
        value: parseEther(betAmount),
        account: address as `0x${string}`,
      });

      if (!request) {
        // TODO: Tell the user what happend! eg: not enough balance!
        setIsPending(false)
        throw new Error('Failed to simulate contract call');

      }
      const hash = await writeContract(config, request);
      console.log('Transaction Hash:', hash);
      setIsPending(false)

    } catch (error) {
      console.error('Error placing bet:', error)
      setIsPending(false)

    }
  }

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!isNaN(Number(value)) && Number(value) >= 0) {
      setBetAmount(value)
    }
  }

  const getMarketStatusDisplay = () => {
    if (isResolved) return (
      <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
        Resolved
      </div>
    )
    if (!isOpen) return (
      <div className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">
        Closed
      </div>
    )
    if (hasEnded) return (
      <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
        Awaiting Resolution
      </div>
    )
    return (
      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
        {formatTimeRemaining(timeRemaining)}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold">{description}</h3>
        {getMarketStatusDisplay()}
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Pool A:</span>
          <span>{safeFormatEther(poolA)} ETH</span>
        </div>
        <div className="flex justify-between">
          <span>Pool B:</span>
          <span>{safeFormatEther(poolB)} ETH</span>
        </div>
      {/* Dual-colored progress bar */}
        <div className="relative h-4 rounded-full overflow-hidden bg-gray-200">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500"
            style={{ width: `${(Number(poolA) / (Number(poolA) + Number(poolB))) * 100}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-red-500"
            style={{ width: `${(Number(poolB) / (Number(poolA) + Number(poolB))) * 100}%` }}
          />
        </div>
        {isOpen && !hasEnded && (
          <div className="space-y-2">
            <input
              type="number"
              value={betAmount}
              onChange={handleBetAmountChange}
              className="w-full px-3 py-2 border rounded"
              step="0.1"
              min="0"
              disabled={isPending}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePlaceBet(1n)}
                disabled={isPending || !address}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Placing Bet...' : 'Bet A'}
              </button>
              <button
                onClick={() => handlePlaceBet(2n)}
                disabled={isPending || !address}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Placing Bet...' : 'Bet B'}
              </button>
            </div>
          </div>
        )}

        {!address && (
          <p className="text-sm text-gray-500 text-center mt-2">
            Please connect your wallet to place bets
          </p>
        )}

        {isResolved && (
          <p className="text-sm font-medium text-center mt-2">
            Winner: {outcome === 1n ? 'A' : 'B'}
          </p>
        )}
      </div>
    </div>
  )
}