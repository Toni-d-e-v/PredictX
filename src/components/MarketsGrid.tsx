'use client'

import { useReadContract  } from 'wagmi'

import { MarketCard } from './MarketCard'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'

export function MarketsGrid() {
  const { data: marketCount } = useReadContract ({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'marketCounter',
  })

  const markets = Array.from({ length: Number(marketCount) || 0 }, (_, i) => i)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((marketId) => (
        <MarketCard key={marketId} marketId={marketId} />
      ))}
    </div>
  )
}